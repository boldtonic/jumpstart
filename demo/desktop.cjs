// Desktop-chat launch variants: an ongoing conversation, then Jumpstart, typed by the user or chosen by the assistant.
// The app, model name and earlier conversation are invented; research lines are abridged from demo/interview-research/decision.md.
const fs = require('node:fs');
const path = require('node:path');
const {spawn, spawnSync} = require('node:child_process');
const {once} = require('node:events');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..');
const out = path.join(ROOT, 'assets');
const file = process.argv[2];
if (!file || !file.endsWith('.json')) throw new Error('Usage: node desktop.cjs <storyboard.json> [--poster]');
const S = JSON.parse(fs.readFileSync(path.resolve(__dirname, file)));
const W=1920, H=1080, FPS=24;
const SANS="'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF="Charter, 'Iowan Old Style', Georgia, serif";
const MONO="Menlo, 'DejaVu Sans Mono', monospace";
const C={bg:'#262624',side:'#1f1e1d',active:'#302f2c',composer:'#30302e',bubble:'#1c1b1a',block:'#2c2b29',line:'#403f3b',ink:'#f2f0e8',muted:'#b4b1a6',dim:'#85837b',send:'#c6613f',idle:'#4a4946'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const rect=(x,y,w,h,fill,r=0,stroke='none',opacity=1)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" opacity="${opacity}"/>`;
const text=(x,y,s,{size=22,fill=C.ink,weight=400,font=SANS,anchor='start'}={})=>
 `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" xml:space="preserve">${esc(s)}</text>`;
const cube=(x,y,s,color)=>{
 const p=[[0,-s],[.866*s,-.5*s],[.866*s,.5*s],[0,s],[-.866*s,.5*s],[-.866*s,-.5*s]].map(([a,b])=>`${x+a},${y+b}`).join(' ');
 return `<polygon points="${p}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/><path d="M${x} ${y}V${y+s}M${x} ${y}L${x-.866*s} ${y-.5*s}M${x} ${y}L${x+.866*s} ${y-.5*s}" stroke="${color}" stroke-width="2"/>`;
};
const plus=(x,y,color)=>`<path d="M${x-8} ${y}H${x+8}M${x} ${y-8}V${y+8}" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
const chevron=(x,y,color)=>`<path d="M${x-5} ${y-3}L${x} ${y+2}L${x+5} ${y-3}" stroke="${color}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

// Text widths come from the renderer itself, so wrapping, bubbles and the cursor fit the real glyphs.
const widths=new Map();
const key=(s,size,weight,font)=>[s,size,weight,font].join('|');
async function measure(s,size,weight=400,font=SANS){
 const k=key(s,size,weight,font);
 if(widths.has(k))return widths.get(k);
 const trailing=(s.length-s.trimEnd().length)*size*.28;
 let w=trailing;
 if(s.trim()){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(s.length*size+40)}" height="${size*2}">${text(0,size*1.4,s,{size,weight,font,fill:'#fff'})}</svg>`;
  const {info}=await sharp(Buffer.from(svg)).trim().toBuffer({resolveWithObject:true});
  w+=info.width-(info.trimOffsetLeft||0);
 }
 widths.set(k,w);
 return w;
}
const width=(s,size,weight=400,font=SANS)=>widths.get(key(s,size,weight,font));

// Minimal rich text: **bold** spans, wrapped by measured word widths and streamed character by character.
const tokens=md=>md.split('**').flatMap((seg,i)=>seg.split(' ').filter(Boolean).map(w=>({w,bold:i%2===1})));
async function wrap(md,size,font,max){
 const lines=[[]];
 let used=0;
 for(const tok of tokens(md)){
  const tw=await measure(tok.w,size,tok.bold?700:400,font);
  const line=lines[lines.length-1], add=(line.length?size*.28:0)+tw;
  if(line.length&&used+add>max){lines.push([tok]);used=tw;}else{line.push(tok);used+=add;}
 }
 return lines;
}
const lineChars=line=>line.reduce((n,tok,i)=>n+tok.w.length+(i?1:0),0);
const lineWidth=(line,size,font)=>line.reduce((n,tok,i)=>n+width(tok.w,size,tok.bold?700:400,font)+(i?size*.28:0),0);
function rich(x,y,line,{size,font,fill=C.ink,limit=Infinity}){
 let used=0, body='';
 line.forEach((tok,i)=>{
  const piece=(i?' ':'')+tok.w, part=piece.slice(0,Math.max(0,limit-used));
  used+=piece.length;
  if(part)body+=`<tspan font-weight="${tok.bold?700:400}">${esc(part)}</tspan>`;
 });
 return `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" fill="${fill}" xml:space="preserve">${body}</text>`;
}

const SIDE=300, LEFT=660, RIGHT=1560, COMPOSER_BOTTOM=1000, BASE=120, TOP=100, ANCHOR=COMPOSER_BOTTOM-BASE-34;
const TEXT_X=LEFT+26, CSIZE=22, CLINE=32;
const STYLE={prose:{size:23,font:SERIF,lh:36,x:LEFT,max:880,gap:22},heading:{size:28,font:SERIF,lh:40,x:LEFT,max:880,gap:14},list:{size:23,font:SERIF,lh:36,x:LEFT+40,max:840,gap:14}};
const message=S.message.parts.map(p=>p.text).join('');
let composerLines=[], offsets=[], rows=[];

async function prepare(){
 composerLines=(await wrap(message,CSIZE,SANS,RIGHT-LEFT-70)).map(line=>line.map(tok=>tok.w).join(' '));
 let offset=0;
 offsets=composerLines.map(line=>{const o=offset;offset+=line.length+1;return o;});
 for(const line of composerLines)for(let i=0;i<=line.length;i++)await measure(line.slice(0,i),CSIZE);
 await measure(S.skill.name,20,600);
 await measure(S.skill.name,19,600);
 rows=[];
 for(const r of S.rows){
  const row={...r};
  if(r.kind==='user'){
   row.lines=await wrap(r.text,21,SANS,600);
   row.bw=Math.max(...row.lines.map(l=>lineWidth(l,21,SANS)))+42;
   row.bh=row.lines.length*31+30;
   row.h=row.bh+28;
  } else if(STYLE[r.kind]){
   const st=STYLE[r.kind];
   row.lines=await wrap(r.kind==='heading'?`**${r.text}**`:r.text,st.size,st.font,st.max);
   row.total=row.lines.reduce((n,l)=>n+lineChars(l),0);
   row.h=row.lines.length*st.lh+st.gap;
  } else if(r.kind==='skill')row.h=58+18;
  else if(r.kind==='activity')row.h=r.items.length*30+30+18;
  else if(r.kind==='dim')row.h=36;
  rows.push(row);
 }
 let cumulative=0;
 for(const row of rows){row.cum=cumulative;cumulative+=row.h;}
}

function typedCount(t){
 return S.message.parts.reduce((n,p)=>n+Math.floor(p.text.length*clamp((t-p.start)/(p.end-p.start))),0);
}

function skillLine(x,y,size,tag){
 let s=cube(x,y-7,11,C.ink)+text(x+26,y,S.skill.name,{size,weight:600});
 s+=text(x+26+width(S.skill.name,size,600)+16,y,S.skill.description,{size:size-1,fill:C.muted});
 return s+text(RIGHT-24,y,tag,{size:size-1,fill:C.dim,anchor:'end'});
}

function composer(t){
 const typed=typedCount(t), sent=t>=S.message.send;
 const visible=sent?[]:composerLines.map((line,i)=>line.slice(0,Math.max(0,typed-offsets[i]))).filter((l,i)=>i===0||l);
 const lines=visible.length?visible:[''];
 const h=BASE+(lines.length-1)*CLINE, top=COMPOSER_BOTTOM-h;
 let svg='';
 if(S.chip){
  const o=ease((t-S.chip.from)/.25)*(1-ease((t-S.chip.to)/.25));
  if(o>0){
   const y=top-72+(1-o)*12;
   svg+=rect(LEFT,y,RIGHT-LEFT,58,C.block,16,C.line,o);
   svg+=`<g opacity="${o}">${skillLine(LEFT+30,y+36,20,S.skill.tag)}</g>`;
  }
 }
 svg+=rect(LEFT,top,RIGHT-LEFT,h,C.composer,20,C.line);
 const empty=!lines[0];
 if(empty)svg+=text(TEXT_X,top+42,`Reply to ${S.app}…`,{size:CSIZE,fill:C.dim});
 lines.forEach((line,i)=>{svg+=text(TEXT_X,top+42+i*CLINE,line,{size:CSIZE});});
 if(!sent&&Math.floor(t*2)%2===0){
  const last=lines[lines.length-1];
  svg+=rect(TEXT_X+(empty?0:width(last,CSIZE))+2,top+42+(lines.length-1)*CLINE-22,2.5,28,C.ink);
 }
 const bar=top+h-32;
 svg+=plus(LEFT+34,bar,C.muted);
 svg+=text(RIGHT-84,bar+6,S.model,{size:17,fill:C.muted,anchor:'end'})+chevron(RIGHT-72,bar,C.muted);
 svg+=rect(RIGHT-56,bar-18,36,36,typed>0&&!sent?C.send:C.idle,10);
 svg+=`<path d="M${RIGHT-38} ${bar+8}V${bar-8}M${RIGHT-45} ${bar-1}L${RIGHT-38} ${bar-8}L${RIGHT-31} ${bar-1}" stroke="${C.ink}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
 return svg;
}

function row(r,y,t){
 const p=r.at<0?1:ease((t-r.at)/.35), fade=`opacity="${p}" transform="translate(0 ${(1-p)*8})"`;
 if(r.kind==='user'){
  let svg=rect(RIGHT-r.bw,y,r.bw,r.bh,C.bubble,18);
  r.lines.forEach((l,i)=>{svg+=rich(RIGHT-r.bw+21,y+36+i*31,l,{size:21,font:SANS});});
  return `<g ${fade}>${svg}</g>`;
 }
 if(STYLE[r.kind]){
  const st=STYLE[r.kind];
  let limit=r.at<0?Infinity:Math.ceil(r.total*clamp((t-r.at)/(r.type||r.total/100))), svg='';
  if(r.kind==='list')svg+=text(LEFT+4,y+27,r.letter,{size:st.size,font:SERIF,weight:700,fill:C.muted});
  r.lines.forEach((l,i)=>{svg+=rich(st.x,y+27+i*st.lh,l,{size:st.size,font:st.font,limit});limit-=lineChars(l)+1;});
  return r.kind==='list'?`<g ${fade}>${svg}</g>`:svg;
 }
 if(r.kind==='skill')return `<g ${fade}>${rect(LEFT,y,RIGHT-LEFT,58,C.block,14,C.line)}${skillLine(LEFT+28,y+36,19,'Skill')}</g>`;
 if(r.kind==='activity'){
  let svg=rect(LEFT,y,RIGHT-LEFT,r.items.length*30+30,C.block,14,C.line);
  r.items.forEach((item,i)=>{
   const q=ease((t-item.at)/.3);
   if(q>0)svg+=`<g opacity="${q}">${text(LEFT+26,y+37+i*30,'✓',{size:18,fill:C.muted,weight:600})}${text(LEFT+54,y+37+i*30,item.text,{size:19,fill:C.muted})}</g>`;
  });
  return `<g ${fade}>${svg}</g>`;
 }
 if(r.kind==='dim')return `<g ${fade}>${text(LEFT,y+24,r.text,{size:18,fill:C.dim})}</g>`;
 return '';
}

function sidebar(){
 let s=rect(0,0,SIDE,H,C.side)+`<path d="M${SIDE} 0V${H}" stroke="${C.line}"/>`;
 s+=text(32,56,S.app,{size:26,weight:700,font:SERIF});
 s+=plus(40,106,C.ink)+text(62,112,'New chat',{size:17});
 s+=text(32,172,'Recents',{size:14,fill:C.dim,weight:600});
 S.chats.forEach((chat,i)=>{
  const y=212+i*42;
  if(i===0)s+=rect(16,y-26,SIDE-32,38,C.active,10);
  s+=text(32,y,chat,{size:17,fill:i===0?C.ink:C.muted});
 });
 s+=`<circle cx="46" cy="996" r="18" fill="#5a5854"/>`+text(46,1002,'F',{size:17,weight:600,anchor:'middle'})+text(76,1002,'fer',{size:17,fill:C.muted});
 return s;
}

function camera(t){
 const keys=S.camera;
 const i=keys.findIndex(k=>k.t>t);
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
 const revealed=rows.reduce((sum,r)=>sum+(t<r.at?0:r.h*(r.at<0?1:ease((t-r.at)/.45))),0);
 const top=Math.min(TOP,ANCHOR-revealed);
 let content='';
 for(const r of rows)if(t>=r.at)content+=row(r,top+r.cum,t);
 const cam=camera(t);
 const scene=sidebar()+text(1110,50,S.title,{size:17,fill:C.muted,anchor:'middle'})+chevron(1110+width(S.title,17)/2+14,45,C.dim)+
  `<g clip-path="url(#messages)">${content}</g><rect x="${SIDE+1}" y="84" width="${W-SIDE}" height="56" fill="url(#fade)"/>`+composer(t);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
 <defs><clipPath id="messages"><rect x="${SIDE+1}" y="84" width="${W-SIDE}" height="${COMPOSER_BOTTOM-BASE-12-84}"/></clipPath>
 <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.bg}"/><stop offset="1" stop-color="${C.bg}" stop-opacity="0"/></linearGradient></defs>
 ${rect(0,0,W,H,C.bg)}
 <g transform="translate(${W/2-cam.x*cam.zoom} ${H/2-cam.y*cam.zoom}) scale(${cam.zoom})">${scene}</g>
 ${endCard(t)}
 ${text(1880,1050,'EDITED DEMO · REAL RESEARCH · boldtonic / jumpstart',{size:14,fill:C.dim,font:MONO,anchor:'end'})}
 </svg>`;
}

async function main(){
 await prepare();
 await measure(S.title,17);
 fs.mkdirSync(out,{recursive:true});
 await sharp(Buffer.from(frame(S.poster||3.6))).png().toFile(path.join(out,`${S.output}-poster.png`));
 if(process.argv.includes('--poster'))return;
 const ffmpeg=process.env.FFMPEG||'ffmpeg';
 const video=path.join(out,`${S.output}.mp4`);
 const proc=spawn(ffmpeg,['-y','-hide_banner','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-vcodec','png','-i','pipe:0','-an','-c:v','libx264','-preset','slow','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',video],{stdio:['pipe','inherit','inherit']});
 const completion=once(proc,'close');
 proc.stdin.on('error',()=>{});
 for(let i=0;i<Math.round(FPS*S.duration);i++){
  const png=await sharp(Buffer.from(frame(i/FPS))).png().toBuffer();
  if(!proc.stdin.write(png))await once(proc.stdin,'drain');
 }
 proc.stdin.end();
 const [code]=await completion;
 if(code!==0)throw new Error(`Video export failed: ${code}`);
 const gif=spawnSync(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',video,'-filter_complex','fps=10,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle','-loop','0',path.join(out,`${S.output}.gif`)],{stdio:'inherit'});
 if(gif.status!==0)throw new Error('GIF export failed');
 console.log(`Exported ${S.output}.mp4 (${S.duration} s), README GIF and poster.`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
