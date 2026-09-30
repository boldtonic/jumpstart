# Jumpstart decision: local interview research app (demo case)

Date: 2026-09-30 · Depth: menu only, no integration · Host: Claude Code with `gh`

## Brief

A local-first app for long audio interviews: import a recording, get a searchable transcript with speaker labels, click a sentence to jump to that moment, and save short clips with notes. Audio and derived data stay on the computer. No stack chosen and no existing code. Assumption: a local web app served from the user's machine is acceptable; a native desktop shell can come later.

Hard parts, in order: speaker labels, word-level timing, long recordings on ordinary hardware, packaging models for offline use.

## Discovery

Two rounds through `scripts/github_research.py`, 10 queries, 103 unique repositories, no failed queries and no web fallback ([round 1](search.json), [round 2](search-2.json)). Round 1 surfaced mostly single-purpose scripts; round 2 used topics, synonyms and the noScribe lead from an earlier run, and surfaced mature applications. Package registries were not searched: the decisive candidates are applications, not libraries.

## Recommendation: extend Scriberr

[Scriberr](https://github.com/rishikanthc/Scriberr) (MIT) is an offline, self-hosted transcription app: Go API, React frontend, SQLite, and model adapters for WhisperX, Parakeet, Canary, pyannote and Sortformer. It already covers most of the product:

- Import, transcription and speaker diarization through its [adapters](https://github.com/rishikanthc/Scriberr/tree/a353078fd96b8aca4002681813524b7397c90df1/internal/transcription/adapters).
- A transcript reader with playback follow-along and seek-from-text (README).
- Notes that are already time-anchored clips: the [Note model](https://github.com/rishikanthc/Scriberr/blob/a353078fd96b8aca4002681813524b7397c90df1/internal/models/note.go) stores start/end word indexes, start/end time in seconds, the quoted text and the note. The [selection hook](https://github.com/rishikanthc/Scriberr/blob/a353078fd96b8aca4002681813524b7397c90df1/web/frontend/src/features/transcription/hooks/useTranscriptSelection.ts) maps a text selection to those times, and disables itself without word timestamps.

What we would write:

1. **Search inside transcripts across recordings.** The list search covers only "title and audio filename" ([handler](https://github.com/rishikanthc/Scriberr/blob/a353078fd96b8aca4002681813524b7397c90df1/internal/api/handlers.go#L907)). Add a SQLite FTS5 index over transcript text.
2. **Clip export.** No audio trimming or export exists in the tree; render a note's time range to a file with FFmpeg.
3. **Keep clips valid after reprocessing.** Notes store word indexes and times; re-transcribing can shift word indexes, so clips should resolve by time.

New responsibilities: a 436-file Go, React and Python codebase with its own model environment and Docker setup. MIT allows closed or commercial use with the notice preserved.

## Alternatives

- **Extend noScribe** ([app](https://github.com/kaixxx/noScribe), [editor](https://github.com/kaixxx/noScribeEditor)), GPL-3.0. Built for qualitative interview transcription, local, with speaker detection and a correction editor. The library, cross-recording search and clips with notes would still be ours, across two repositories, and a distributed derivative must stay GPL-3.0.
- **Compose components**: [WhisperX](https://github.com/m-bain/whisperX) (BSD-2-Clause) with pyannote for diarization, plus our own UI and SQLite FTS5. Full control, but the whole application is ours to build. This was the earlier Codex run's recommendation, made without Scriberr in view.

## Evidence and unresolved checks

- **Inspected** at Scriberr `a353078fd96b8aca4002681813524b7397c90df1` (2026-09-20): LICENSE (MIT), README, full tree, Note model, notes API, selection hook, router and list handler.
- **Documented**: noScribe `ba3173e67fe472859d8f60e8f32eae09f829e1af` and noScribeEditor `0e09d59a24c9c7f17fc79de2fdb6f0f4532d6bd2` (README and GPL-3.0 license files); WhisperX from search metadata.
- **Not tested**: nothing was installed or run. No accuracy, speed or memory claim.
- **Riskiest assumption**: that Scriberr's diarization and word timing hold up on real interviews. Acceptance test: three recordings (clean two-person, long, noisy with interruptions); click twenty sentences and check the jump by ear; fix speaker errors; save, reopen and export a clip; re-transcribe one recording and confirm its clips still point to the right moment.
- **Open decisions**: whether "local" can be a local web app or must be a native desktop app; target hardware; interview languages.
