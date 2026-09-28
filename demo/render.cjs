// Code-authored motion graphics. No model calls, remote assets, or simulated app UI.
const fs = require('node:fs');
const path = require('node:path');
const {spawn, spawnSync} = require('node:child_process');
const {once} = require('node:events');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..');
const out = path.join(ROOT, 'assets');
const evidence = JSON.parse(fs.readFileSync(path.join(__dirname, 'evidence.json')));
if (evidence.test_exit_code !== 0 || !/Ran 7 tests/.test(evidence.tests)) throw new Error('Refresh successful evidence first.');
const W=1280, H=720, FPS=24, DURATION=24;
const C={bg:'#121417',panel:'#1e2227',line:'#383d43',ink:'#f3f1e9',muted:'#a9adb0',yellow:'#ffe263',green:'#a9d6b7'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const rect=(x,y,w,h,fill=C.panel,r=10,stroke='none')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const text=(x,y,s,size=24,fill=C.ink,weight=400,mono=false)=>`<text x="${x}" y="${y}" font-family="${mono?'Menlo, DejaVu Sans Mono, monospace':'Arial, Helvetica, sans-serif'}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(s)}</text>`;
const lines=(x,y,arr,size=24,fill=C.ink,gap=36,weight=400,mono=false)=>arr.map((s,i)=>text(x,y+i*gap,s,size,fill,weight,mono)).join('');
const small=(x,y,s,fill=C.muted)=>text(x,y,s,14,fill,600,true);
const arrow=(x,y,w=52)=>`<path d="M${x},${y}h${w}m-12,-10l12,10l-12,10" fill="none" stroke="${C.yellow}" stroke-width="3"/>`;
const pill=(x,y,w,s,accent=false)=>rect(x,y,w,30,accent?C.yellow:C.panel,15)+text(x+13,y+21,s,13,accent?C.bg:C.ink,600);
function frame(t){
 const chapter=Math.min(3,Math.floor(t/6)), local=t%6;
 const enter=chapter===0?1:1-Math.pow(1-Math.min(1,local/.55),3);
 const leave=local>5.72?(6-local)/.28:1;
 let body='';
 if(chapter===0){
  body+=small(64,125,'01 / START WITH YOUR PRODUCT',C.yellow);
  body+=lines(60,238,['Build on','what exists.'],88,C.ink,90,700);
  body+=lines(64,392,['Find the open-source foundations.','Make them your own.'],26,C.muted,38);
  body+=pill(64,512,105,'DISCOVER')+pill(181,512,99,'INSPECT')+pill(292,512,116,'COMBINE',true);
  body+=rect(690,158,526,384,C.panel,12,C.line);
  body+=small(722,203,'THE BRIEF');
  body+=lines(722,258,['“I need a local','Markdown previewer.'],32,C.ink,44,600);
  body+=lines(722,358,['Find pieces we can combine.','Show me what to keep,','simplify, and write.”'],25,C.muted,38);
  body+=small(722,508,'AVAILABLE CONTEXT → BETTER OPTIONS',C.yellow);
 }
 if(chapter===1){
  body+=small(64,125,'02 / CHOOSE A DIRECTION',C.yellow);
  body+=text(60,202,'A menu with a recommendation.',53,C.ink,700);
  body+=rect(64,250,764,326,C.panel,12,C.line)+pill(88,272,150,'A · RECOMMENDED',true);
  body+=text(90,357,'markdown-it-py',36,C.ink,600)+text(405,357,'+',32,C.yellow,600)+text(452,357,'nh3',36,C.ink,600);
  body+=text(90,393,'Markdown → HTML',21,C.muted)+text(452,393,'Explicit HTML filtering',21,C.muted);
  body+=`<path d="M90,420h711" stroke="${C.line}"/>`;
  body+=small(90,461,'KEEP')+small(344,461,'SIMPLIFY')+small(585,461,'WRITE');
  body+=lines(90,496,['Parser + sanitizer'],19,C.ink,28);
  body+=lines(344,496,['No web framework','or database'],19,C.ink,28);
  body+=lines(585,496,['Product policy','+ a small adapter'],19,C.ink,28);
  body+=rect(852,250,364,326,'none',12,C.line)+small(878,303,'B / ALTERNATIVE');
  body+=text(878,357,'Mistune + nh3',30,C.ink,600);
  body+=lines(878,404,['Another parser behind','the same boundary.'],22,C.muted,34);
  body+=small(878,532,'INSPECTED · NOT INTEGRATED');
 }
 if(chapter===2){
  body+=small(64,125,'03 / CONNECT THE PIECES',C.yellow);
  body+=lines(60,229,['Their foundations.','Your product.'],65,C.ink,76,700);
  body+=lines(64,417,['Reuse the hard parts.','Own the policy and the connection.'],25,C.muted,38);
  body+=pill(64,530,200,'SELECTIVE INTEGRATION',true);
  body+=rect(744,161,472,100,C.panel,10,C.line)+small(772,190,'01 / PARSE')+text(772,235,'markdown-it-py',31,C.ink,600);
  body+=`<path d="M979,268v27m-9,-9l9,9l9,-9" stroke="${C.yellow}" stroke-width="3" fill="none"/>`;
  body+=rect(744,302,472,100,C.panel,10,C.line)+small(772,331,'02 / FILTER')+text(772,376,'nh3',31,C.ink,600);
  body+=`<path d="M979,409v27m-9,-9l9,9l9,-9" stroke="${C.yellow}" stroke-width="3" fill="none"/>`;
  body+=rect(744,444,472,120,C.yellow,10)+small(772,478,'03 / YOUR ADAPTER',C.bg)+text(772,525,'preview.py',36,C.bg,600,true);
 }
 if(chapter===3){
  body+=small(64,125,'04 / TEST IT. CREDIT THE CREATORS.',C.yellow);
  body+=text(60,202,'A working slice. Clear ownership.',55,C.ink,700);
  body+=rect(64,250,552,304,C.panel,12,C.line)+small(92,289,'EXECUTED EXAMPLE');
  body+=text(92,336,'7 / 7',61,C.green,700)+text(275,331,'integration tests passed',23,C.ink,600);
  body+=lines(92,392,['Markdown + allowed HTML preserved','Scripts + unsafe links filtered','File output + input limits checked'],20,C.muted,35);
  body+=small(92,524,'PINNED VERSIONS · LICENSES PRESERVED',C.yellow);
  body+=rect(642,250,574,304,'#f1efe6',12)+small(672,291,'ACTUAL OUTPUT · STYLED FOR THIS DEMO','#646762');
  body+=text(672,349,evidence.output.match(/<h1>(.*?)<\/h1>/)[1],40,'#191c20',700);
  body+=text(672,395,evidence.output.match(/<strong>(.*?)<\/strong>/)[1],25,'#191c20',600);
  body+=lines(680,440,[...evidence.output.matchAll(/<li>(.*?)<\/li>/g)].map(m=>'•  '+m[1]),23,'#454a4e',36);
  body+=small(64,600,'markdown-it-py · ExecutableBookProject    /    nh3 · Messense Lv');
 }
 const names=['BRIEF','MENU','COMBINE','PROVE'];
 let footer='';
 names.forEach((n,i)=>{
  footer+=rect(64+i*292,647,268,2,C.line,0);
  const progress=Math.max(0,Math.min(1,(t-i*6)/6));
  footer+=rect(64+i*292,647,268*progress,2,C.yellow,0);
  footer+=small(64+i*292,680,`0${i+1} ${n}`,i===chapter?C.ink:C.muted);
 });
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
 ${rect(0,0,W,H,C.bg,0)}
 <path d="M65 66l22-22m-19 0h19v19" stroke="${C.yellow}" stroke-width="5" fill="none"/>
 ${text(103,66,'jumpstart',32,C.ink,700)}
 ${small(846,61,'OPEN SOURCE → YOUR PRODUCT',C.yellow)}
 <path d="M64 88h1152" stroke="${C.line}"/>
 <g opacity="${Math.max(0,Math.min(enter,leave))}" transform="translate(0,${(1-enter)*16})">${body}</g>
 ${footer}
 ${small(846,706,'EDITED WALKTHROUGH · REAL EXAMPLE')}
 </svg>`;
}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 for(const [name,t] of [['poster',2],['menu',8],['result',20]]){
  const svg=frame(t);
  if(name==='poster') fs.writeFileSync(path.join(out,'jumpstart-poster.svg'),svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(out,`jumpstart-${name}.png`));
 }
 if(process.argv.includes('--stills')) return;
 const ffmpeg=process.env.FFMPEG || 'ffmpeg';
 const video=path.join(out,'jumpstart.mp4');
 const proc=spawn(ffmpeg,['-y','-hide_banner','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-vcodec','png','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',video],{stdio:['pipe','inherit','inherit']});
 const completion=once(proc,'close');
 for(let i=0;i<FPS*DURATION;i++){
  const png=await sharp(Buffer.from(frame(i/FPS))).png().toBuffer();
  if(!proc.stdin.write(png)) await once(proc.stdin,'drain');
  if(i%144===0) console.log(`Rendered ${Math.floor(i/FPS)} / ${DURATION} seconds`);
 }
 proc.stdin.end();
 const [code]=await completion;
 if(code!==0) throw new Error(`Video export failed: ${code}`);
 const gif=spawnSync(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',video,'-filter_complex','fps=10,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5','-loop','0',path.join(out,'jumpstart.gif')],{stdio:'inherit'});
 if(gif.status!==0) throw new Error('GIF export failed');
 console.log('Exported 24-second MP4, looping README GIF and three stills.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
