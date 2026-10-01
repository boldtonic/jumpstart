// A short launch video: an authored chat built from the recorded interview-app research.
// Research lines are abridged from demo/interview-research/decision.md; typing, layout and timing are edited.
const fs = require('node:fs');
const path = require('node:path');
const {spawn, spawnSync} = require('node:child_process');
const {once} = require('node:events');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..');
const out = path.join(ROOT, 'assets');
const S = JSON.parse(fs.readFileSync(path.join(__dirname, 'launch.json')));
const W=1920, H=1080, FPS=24;
const SANS="'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO="Menlo, 'DejaVu Sans Mono', monospace";
// Monochrome, like a real chat client: hierarchy comes from weight and grey levels only.
const C={bg:'#121315',bubble:'#25282c',composer:'#1c1e21',card:'#1b1d20',pick:'#202225',line:'#33363b',strong:'#55595f',ink:'#eeece6',muted:'#a3a7ad',dim:'#6f767e'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const rect=(x,y,w,h,fill,r=0,stroke='none',opacity=1)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" opacity="${opacity}"/>`;
const text=(x,y,s,{size=24,fill=C.ink,weight=400,font=SANS,anchor='start',opacity=1}={})=>
 `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" opacity="${opacity}" xml:space="preserve">${esc(s)}</text>`;
const cube=(x,y,s,color)=>{
 const p=[[0,-s],[.866*s,-.5*s],[.866*s,.5*s],[0,s],[-.866*s,.5*s],[-.866*s,-.5*s]].map(([a,b])=>`${x+a},${y+b}`).join(' ');
 return `<polygon points="${p}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/><path d="M${x} ${y}V${y+s}M${x} ${y}L${x-.866*s} ${y-.5*s}M${x} ${y}L${x+.866*s} ${y-.5*s}" stroke="${color}" stroke-width="2"/>`;
};

// Text widths come from the renderer itself, so cursors and pills sit exactly after the text.
const widths=new Map();
const key=(s,size,weight,font)=>[s,size,weight,font].join('|');
async function measure(s,size,weight=400,font=SANS){
 const k=key(s,size,weight,font);
 if(widths.has(k))return;
 const trailing=(s.length-s.trimEnd().length)*size*.28;
 if(!s.trim()){widths.set(k,trailing);return;}
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(s.length*size+40)}" height="${size*2}">${text(0,size*1.4,s,{size,weight,font,fill:'#fff'})}</svg>`;
 const {info}=await sharp(Buffer.from(svg)).trim().toBuffer({resolveWithObject:true});
 widths.set(k,info.width-(info.trimOffsetLeft||0)+trailing);
}
const width=(s,size,weight=400,font=SANS)=>widths.get(key(s,size,weight,font));

const COMPOSER_BOTTOM=990, LEFT=440, RIGHT=1480, TEXT_X=470, SIZE=26;
const rows=S.rows.map(row=>({...row,h:{user:row.lines?.length*36+58,text:46,check:40,headline:70,card:146,route:96}[row.kind]}));
let cumulative=0;
for(const row of rows){row.cum=cumulative;cumulative+=row.h;}

// The command is typed first, the chip appears, then the request follows in the same message.
function typedLines(t){
 const m=S.message;
 if(t<m.start||t>=m.send)return [''];
 const total=m.lines.join('').length, cmd=m.command.length;
 const count=Math.floor(t<m.ideaStart?cmd*clamp((t-m.start)/(m.commandEnd-m.start)):cmd+(total-cmd)*clamp((t-m.ideaStart)/(m.end-m.ideaStart)));
 let left=count;
 return m.lines.map(line=>{const part=line.slice(0,Math.max(0,left));left-=line.length;return part;}).filter((line,i)=>i===0||line);
}

function composer(t){
 const m=S.message, lines=typedLines(t);
 const h=82+(lines.length-1)*38, top=COMPOSER_BOTTOM-h;
 let svg='';
 const chip=ease((t-m.start-.15)/.3)*(1-ease((t-m.ideaStart)/.3));
 if(chip>0&&t<m.send){
  const y=top-78+(1-chip)*16;
  svg+=rect(LEFT,y,RIGHT-LEFT,64,C.card,16,C.line,chip);
  svg+=`<g opacity="${chip}">${cube(476,y+32,12,C.ink)}`;
  svg+=text(504,y+40,S.skill.name,{size:24,weight:600});
  svg+=text(504+width(S.skill.name,24,600)+18,y+40,S.skill.description,{size:22,fill:C.muted});
  svg+=text(RIGHT-24,y+40,S.skill.tag,{size:20,fill:C.dim,anchor:'end'})+'</g>';
 }
 svg+=rect(LEFT,top,RIGHT-LEFT,h,C.composer,22,C.line);
 const empty=!lines[0];
 if(empty)svg+=text(TEXT_X,top+50,"Describe what you're building",{size:SIZE,fill:C.dim});
 lines.forEach((line,i)=>{svg+=text(TEXT_X,top+50+i*38,line,{size:SIZE});});
 if(Math.floor(t*2)%2===0&&!(t>=m.send&&empty)){
  const last=lines[lines.length-1];
  svg+=rect(TEXT_X+(empty?0:width(last,SIZE))+3,top+50+(lines.length-1)*38-24,2.5,30,C.ink);
 }
 svg+=`<circle cx="${RIGHT-44}" cy="${top+h/2}" r="20" fill="${empty?'#3a3d42':C.ink}"/><path d="M${RIGHT-44} ${top+h/2+8}V${top+h/2-8}M${RIGHT-51} ${top+h/2-1}L${RIGHT-44} ${top+h/2-8}L${RIGHT-37} ${top+h/2-1}" stroke="${C.bg}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
 return svg;
}

function pill(x,baseline,label,color){
 const w=width(label,18)+22;
 return rect(x,baseline-21,w,30,'none',15,C.line)+text(x+11,baseline-1,label,{size:18,fill:color});
}

function row(r,y,t){
 const p=ease((t-r.at)/.35), fade=`opacity="${p}" transform="translate(0 ${(1-p)*10})"`;
 const typed=s=>s.slice(0,Math.ceil(s.length*clamp((t-r.at)/(r.type||.001))));
 if(r.kind==='user'){
  const bw=Math.max(...r.lines.map(l=>width(l,24)))+48, bh=r.lines.length*36+30;
  let svg=rect(RIGHT-bw,y,bw,bh,C.bubble,20);
  r.lines.forEach((l,i)=>{svg+=text(RIGHT-bw+24,y+42+i*36,l,{size:24});});
  return `<g ${fade}>${svg}</g>`;
 }
 if(r.kind==='text'){
  const color=r.tone==='muted'?C.muted:r.tone==='dim'?C.dim:C.ink;
  return text(452,y+30,typed(r.text),{size:r.size||24,fill:color});
 }
 if(r.kind==='check')return `<g ${fade}>${text(452,y+28,'✓',{size:22,fill:C.muted,weight:600})}${text(484,y+28,r.text,{size:22,fill:C.muted})}</g>`;
 if(r.kind==='headline')return text(452,y+50,typed(r.text),{size:34,weight:700});
 if(r.kind==='card'){
  let svg=rect(LEFT,y+8,RIGHT-LEFT,124,C.card,18,C.strong);
  svg+=text(476,y+56,r.title,{size:30,weight:700});
  svg+=pill(476+width(r.title,30,700)+16,y+56,r.tag,C.muted);
  svg+=text(RIGHT-28,y+54,r.source,{size:18,fill:C.dim,anchor:'end'});
  svg+=text(476,y+104,r.text,{size:22,fill:C.muted});
  return `<g ${fade}>${svg}</g>`;
 }
 if(r.kind==='route'){
  let svg=r.recommended?rect(LEFT,y,RIGHT-LEFT,86,C.pick,16,C.strong):'';
  svg+=text(472,y+38,r.letter,{size:26,weight:700,font:MONO,fill:r.recommended?C.ink:C.muted});
  svg+=text(512,y+38,r.title,{size:25,weight:700,fill:r.recommended?C.ink:C.muted});
  if(r.tag)svg+=pill(512+width(r.title,25,700)+16,y+37,r.tag,r.recommended?C.muted:C.dim);
  svg+=text(512,y+70,r.note,{size:21,fill:r.recommended?C.muted:C.dim});
  return `<g ${fade}>${svg}</g>`;
 }
 return '';
}

function camera(t){
 const keys=S.camera;
 let i=keys.findIndex(k=>k.t>t);
 if(i===-1)return keys[keys.length-1];
 if(i===0)return keys[0];
 const a=keys[i-1], b=keys[i], p=ease((t-a.t)/(b.t-a.t));
 return {zoom:a.zoom+(b.zoom-a.zoom)*p,x:a.x+(b.x-a.x)*p,y:a.y+(b.y-a.y)*p};
}

function endCard(t){
 const p=ease((t-S.end.at)/.6);
 if(p<=0)return '';
 const e=S.end, q=ease((t-S.end.at-.3)/.6);
 let svg=rect(0,0,W,H,C.bg,0,'none',p);
 svg+=`<g opacity="${q}">${cube(960,360,34,C.ink)}`;
 svg+=text(960,520,e.title,{size:88,weight:700,anchor:'middle'});
 svg+=text(960,590,e.line,{size:36,fill:C.muted,anchor:'middle'});
 svg+=`<text x="960" y="690" font-family="${MONO}" font-size="28" text-anchor="middle" xml:space="preserve">`+
  e.usage.map(u=>{const [cmd,...rest]=u.split(' ');return `<tspan fill="${C.ink}" font-weight="600">${esc(cmd)}</tspan><tspan fill="${C.muted}"> ${esc(rest.join(' '))}</tspan>`;}).join(`<tspan fill="${C.dim}">   ·   </tspan>`)+'</text>';
 svg+=text(960,790,e.url,{size:24,fill:C.dim,anchor:'middle',font:MONO})+'</g>';
 return svg;
}

function frame(t){
 const revealed=rows.reduce((sum,r)=>sum+(t<r.at?0:r.h*ease((t-r.at)/.45)),0);
 const top=Math.min(118,868-revealed);
 let content='';
 for(const r of rows)if(t>=r.at)content+=row(r,top+r.cum,t);
 const cam=camera(t);
 const scene=text(960,62,'New chat',{size:18,fill:C.dim,anchor:'middle'})+`<g clip-path="url(#messages)">${content}</g>`+
  `<rect x="0" y="92" width="${W}" height="56" fill="url(#fade)"/>`+composer(t);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
 <defs><clipPath id="messages"><rect x="0" y="92" width="${W}" height="${COMPOSER_BOTTOM-82-92-14}"/></clipPath>
 <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.bg}"/><stop offset="1" stop-color="${C.bg}" stop-opacity="0"/></linearGradient></defs>
 ${rect(0,0,W,H,C.bg)}
 <g transform="translate(${W/2-cam.x*cam.zoom} ${H/2-cam.y*cam.zoom}) scale(${cam.zoom})">${scene}</g>
 ${endCard(t)}
 ${text(40,1050,'EDITED DEMO · REAL RESEARCH',{size:14,fill:C.dim,font:MONO})}
 ${text(1880,1050,'boldtonic / jumpstart',{size:14,fill:C.dim,font:MONO,anchor:'end'})}
 </svg>`;
}

async function prepare(){
 for(const line of S.message.lines)for(let i=0;i<=line.length;i++)await measure(line.slice(0,i),SIZE);
 await measure(S.skill.name,24,600);
 for(const r of rows){
  if(r.kind==='user')for(const l of r.lines)await measure(l,24);
  if(r.kind==='card'){await measure(r.title,30,700);await measure(r.tag,18);}
  if(r.kind==='route'){await measure(r.title,25,700);if(r.tag)await measure(r.tag,18);}
 }
}

async function main(){
 await prepare();
 fs.mkdirSync(out,{recursive:true});
 await sharp(Buffer.from(frame(1.7))).png().toFile(path.join(out,'jumpstart-launch-poster.png'));
 if(process.argv.includes('--poster'))return;
 const ffmpeg=process.env.FFMPEG||'ffmpeg';
 const video=path.join(out,'jumpstart-launch.mp4');
 const proc=spawn(ffmpeg,['-y','-hide_banner','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-vcodec','png','-i','pipe:0','-an','-c:v','libx264','-preset','slow','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',video],{stdio:['pipe','inherit','inherit']});
 const completion=once(proc,'close');
 proc.stdin.on('error',()=>{});
 for(let i=0;i<Math.round(FPS*S.duration);i++){
  const png=await sharp(Buffer.from(frame(i/FPS))).png().toBuffer();
  if(!proc.stdin.write(png))await once(proc.stdin,'drain');
  if(i%(FPS*5)===0)console.log(`Rendered ${i/FPS} / ${S.duration} seconds`);
 }
 proc.stdin.end();
 const [code]=await completion;
 if(code!==0)throw new Error(`Video export failed: ${code}`);
 const gif=spawnSync(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',video,'-filter_complex','fps=10,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle','-loop','0',path.join(out,'jumpstart-launch.gif')],{stdio:'inherit'});
 if(gif.status!==0)throw new Error('GIF export failed');
 console.log(`Exported ${S.duration}-second launch video, README GIF and poster.`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
