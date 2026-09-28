#!/usr/bin/env python3
"""Validate provenance records and render credits, without certifying licensing."""

import argparse
import json
from pathlib import Path, PurePosixPath
import re
import sys
from urllib.parse import quote, urlparse


def relative_path(value):
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Expected a nonempty relative path")
    path = PurePosixPath(value)
    if path.is_absolute() or ".." in path.parts or "\\" in value or value == ".":
        raise ValueError("Path must remain inside the project")
    return path


def local_path(root, value):
    relative_path(value)
    resolved = (root / value).resolve()
    try:
        resolved.relative_to(root.resolve())
    except ValueError:
        raise ValueError("Path resolves outside the project")
    return resolved


def validate(data, root, strict=False):
    errors, warnings = [], []
    if not isinstance(data, dict):
        return ["Manifest must be an object"], []
    if data.get("schema_version") != 1:
        errors.append("schema_version must be 1")
    if not isinstance(data.get("project"), str) or not data["project"].strip():
        errors.append("project must be a nonempty string")
    components = data.get("components")
    if not isinstance(components, list):
        return errors + ["components must be an array"], warnings
    names = set()
    for i, c in enumerate(components):
        prefix = "components[{}]".format(i)
        if not isinstance(c, dict):
            errors.append(prefix + " must be an object")
            continue
        for key in ("name", "repository", "revision", "role", "update_strategy"):
            if not isinstance(c.get(key), str) or not c[key].strip():
                errors.append(prefix + "." + key + " must be a nonempty string")
        if isinstance(c.get("name"), str):
            if c["name"] in names:
                errors.append(prefix + ": duplicate name")
            names.add(c["name"])
        repo = c.get("repository", "")
        if not isinstance(repo, str) or not re.fullmatch(r"https://github\.com/[A-Za-z0-9][A-Za-z0-9_.-]*/[A-Za-z0-9_.-]+", repo):
            errors.append(prefix + ": repository must be a canonical public GitHub URL")
        if not isinstance(c.get("revision"), str) or not re.fullmatch(r"[0-9a-fA-F]{40}", c["revision"]):
            errors.append(prefix + ": revision must be a full commit SHA")
        mode = c.get("mode")
        if mode not in ("dependency", "copied", "adapted", "reference"):
            errors.append(prefix + ": invalid mode")
        for key in ("source_paths", "target_paths", "modifications"):
            values = c.get(key)
            if not isinstance(values, list) or any(not isinstance(v, str) or not v.strip() for v in values):
                errors.append(prefix + "." + key + " must be an array of nonempty strings")
                continue
            if key == "source_paths" and not values:
                errors.append(prefix + ": record exact source paths")
            if key == "target_paths" and mode != "reference" and not values:
                errors.append(prefix + ": integrated components need local targets")
            if key != "modifications":
                for value in values:
                    try:
                        if key == "source_paths":
                            relative_path(value)
                        elif not local_path(root, value).exists():
                            errors.append(prefix + ": missing local target " + value)
                    except ValueError as exc:
                        errors.append(prefix + ": " + str(exc))
        if mode == "dependency":
            for key in ("package", "version"):
                if not isinstance(c.get(key), str) or not c[key].strip():
                    errors.append(prefix + ": dependencies require " + key)
        license_info = c.get("license")
        if not isinstance(license_info, dict):
            errors.append(prefix + ": license must be an object")
            continue
        status = license_info.get("status")
        if status not in ("verified", "unresolved"):
            errors.append(prefix + ": invalid license status")
        if status == "unresolved":
            (errors if strict else warnings).append(prefix + ": license unresolved")
        expression = license_info.get("expression")
        if not isinstance(expression, str) or not expression.strip():
            errors.append(prefix + ": license expression required (or unknown)")
        if status == "verified" and (not isinstance(expression, str) or not expression.strip() or expression.strip().lower() == "unknown"):
            errors.append(prefix + ": verified license needs an observed expression")
        if not isinstance(license_info.get("notes"), str):
            errors.append(prefix + ": license notes must be a string")
        urls = license_info.get("evidence_urls")
        if not isinstance(urls, list) or any(not isinstance(url, str) or urlparse(url).scheme != "https" or not urlparse(url).netloc for url in urls):
            errors.append(prefix + ": license evidence_urls must be HTTPS URLs")
        elif status == "verified" and not urls:
            errors.append(prefix + ": verified license needs evidence")
        preserved = license_info.get("preserved_files")
        if not isinstance(preserved, list):
            errors.append(prefix + ": preserved_files must be an array")
        else:
            if mode in ("copied", "adapted") and not preserved:
                (errors if strict else warnings).append(prefix + ": no preserved license/notice files")
            for value in preserved:
                try:
                    target = local_path(root, value)
                    if not target.is_file() or target.stat().st_size == 0:
                        errors.append(prefix + ": missing or empty preserved file " + str(value))
                except ValueError as exc:
                    errors.append(prefix + ": " + str(exc))
    return errors, warnings


def escape(value):
    return str(value).replace("\\", "\\\\").replace("[", "\\[").replace("]", "\\]").replace("<", "&lt;").replace(">", "&gt;").replace("\n", " ").replace("\r", " ")


def render(data):
    lines = ["# Open-source credits", "", "Project: " + escape(data["project"]), "",
             "This provenance report supplements the original license and notice files. It does not certify license compatibility.", ""]
    for c in data["components"]:
        lines += ["## " + escape(c["name"]), "", "- Source: [{}]({})".format(escape(c["repository"]), c["repository"]),
                  "- Revision: [{}]({}/tree/{})".format(c["revision"], c["repository"], c["revision"]),
                  "- Use: " + escape(c["mode"]), "- Role: " + escape(c["role"])]
        if c["mode"] == "dependency":
            lines.append("- Package: {} ({})".format(escape(c["package"]), escape(c["version"])))
        lines.append("- Upstream paths:")
        for path in c["source_paths"]:
            lines.append("  - [{}]({}/blob/{}/{})".format(escape(path), c["repository"], c["revision"], quote(path, safe="/")))
        lines.append("- Local targets: " + (", ".join(escape(p) for p in c["target_paths"]) or "None (reference only)"))
        lines.append("- Modifications: " + ("; ".join(escape(m) for m in c["modifications"]) or "None recorded"))
        lines.append("- Updates: " + escape(c["update_strategy"]))
        lic = c["license"]
        lines += ["- License: {} ({})".format(escape(lic["expression"]), escape(lic["status"])),
                  "- Preserved notices: " + (", ".join(escape(p) for p in lic["preserved_files"]) or "None recorded"),
                  "- License evidence: " + ", ".join("[source]({})".format(quote(url, safe=":/?=&%#@+")) for url in lic["evidence_urls"]),
                  "- License notes: " + escape(lic["notes"]), ""]
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("validate", "render"))
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--strict", action="store_true")
    parser.add_argument("--out", type=Path)
    args = parser.parse_args()
    if not args.root.is_dir():
        parser.error("--root must be an existing project directory")
    if args.command == "render" and args.out is None:
        parser.error("render requires --out")
    try:
        data = json.loads(args.manifest.read_text(encoding="utf-8"))
        errors, warnings = validate(data, args.root, args.strict)
        if errors:
            print(json.dumps({"valid": False, "errors": errors, "warnings": warnings}, ensure_ascii=False))
            return 1
        if args.command == "render":
            args.out.parent.mkdir(parents=True, exist_ok=True)
            with args.out.open("x", encoding="utf-8") as output:
                output.write(render(data))
        print(json.dumps({"valid": True, "warnings": warnings}, ensure_ascii=False))
        return 0
    except (OSError, ValueError) as exc:
        print("Provenance failed: {}".format(exc), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
