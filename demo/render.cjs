// An authored terminal-chat demo grounded in the repository's captured evaluation.
// Layout, dialogue, cursor and timings are reconstructed; this is not a screen recording.
const fs = require('node:fs');
const path = require('node:path');
const {spawn, spawnSync} = require('node:child_process');
const {once} = require('node:events');
const sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..');
const out = path.join(ROOT, 'assets');
const evidence = JSON.parse(fs.readFileSync(path.join(__dirname, 'evidence.json')));
const script = JSON.parse(fs.readFileSync(path.join(__dirname, 'storyboard.json')));
if (evidence.test_exit_code !== 0 || !/Ran 7 tests/.test(evidence.tests)) throw new Error('Refresh successful evidence first.');
for (const name of ['markdown-it-py', 'nh3']) {
 if (!evidence.packages[name]) throw new Error(`Missing package evidence: ${name}`);
}
const W=1440, H=900, FPS=24, DURATION=40;
const C={bg:'#101112',terminal:'#191b1e',bar:'#202226',line:'#35383c',ink:'#eeece6',muted:'#a3a7ad',dim:'#777e86',accent:'#efbd8e',green:'#add3b0',prompt:'#26292d'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const rect=(x,y,w,h,fill,r=0,stroke='none')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const text=(x,y,s,size=23,fill=C.ink,weight=400)=>`<text x="${x}" y="${y}" font-family="Menlo, DejaVu Sans Mono, monospace" font-size="${size}" font-weight="${weight}" fill="${fill}" xml:space="preserve">${esc(s)}</text>`;
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const lineHeight=35;
const rows=script.rows.map(row=>({...row,height:lineHeight+(row.gap||0)}));
let position=0;
for(const row of rows){position+=row.gap||0;row.y=position;position+=lineHeight;}
function offset(t){
 // Keep the conversation above the composer, easing each new line upward.
 const height=rows.reduce((sum,row)=>sum+row.height*(row.at===0?1:ease((t-row.at)/.55)),0);
 return 506-height;
}
function frame(t){
 let content='';
 for(const row of rows){
  if(t<row.at)continue;
  const y=172+row.y+offset(t);
  const p=Math.min(1,(t-row.at)/(row.type||.001));
  let value=row.text.replace('{parser}',evidence.packages['markdown-it-py']).replace('{sanitizer}',evidence.packages.nh3);
  if(row.text==='{test_result}')value='  '+evidence.tests.match(/Ran 7 tests[^\n]*/)[0];
  value=value.slice(0,Math.ceil(value.length*p));
  const color=row.tone==='accent'?C.accent:row.tone==='green'?C.green:row.tone==='muted'?C.muted:row.tone==='dim'?C.dim:C.ink;
  if(row.kind==='user')content+=rect(88,y-27,1264,38,C.prompt,4);
  content+=text(104,y,value,row.size||23,color,row.bold?600:400);
 }
 const command=t>=3.3&&t<7.2?'/jumpstart'.slice(0,Math.floor(Math.max(0,t-3.3)*8)):'';
 const selection=t>=24.8&&t<27?'Integrate A. Keep it small. Test it and credit the authors.'.slice(0,Math.floor((t-24.8)*38)):'';
 const input=command||selection;
 const blink=Math.floor(t*2)%2===0;
 const amount=ease((t-2.6)/.85)*(1-ease((t-6.2)/.85));
 const zoom=1+.55*amount;
 const cameraX=(W/2-500*zoom)*amount;
 const cameraY=(H/2-610*zoom)*amount;
 let terminal=rect(40,36,1360,816,C.terminal,12,C.line);
 terminal+=rect(41,37,1358,52,C.bar,11);
 terminal+=rect(41,70,1358,20,C.bar);
 terminal+=`<circle cx="68" cy="63" r="6" fill="#bd7770"/><circle cx="90" cy="63" r="6" fill="#b9a470"/><circle cx="112" cy="63" r="6" fill="#7d9c80"/>`;
 terminal+=text(166,70,'noted  /  terminal',17,C.muted);
 terminal+=text(1110,70,'Python · local',16,C.dim);
 terminal+=text(103,123,'~/projects/noted',16,C.dim);
 terminal+=`<g clip-path="url(#conversation)">${content}</g>`;
 terminal+=`<path d="M88 715h1264" stroke="${C.line}"/>`;
 terminal+=text(103,758,'>',26,C.accent);
 terminal+=text(140,758,input,26,command?C.accent:C.ink,command?600:400);
 if(blink)terminal+=rect(142+input.length*15.65,734,12,29,C.ink,1);
 let status=t<7.2?'Context ready':t<13?'Researching open-source foundations':t<24.8?'Choose a route':t<31?'Integrating the selected pieces':'Preview tested · credits preserved';
 terminal+=text(103,812,status,16,C.dim);
 terminal+=text(1082,812,'jumpstart',16,C.accent);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
 <defs><clipPath id="conversation"><rect x="80" y="139" width="1290" height="561"/></clipPath></defs>
 ${rect(0,0,W,H,C.bg)}
 <g transform="translate(${cameraX} ${cameraY}) scale(${zoom})">${terminal}</g>
 ${text(43,886,'EDITED DEMO · TESTED EXAMPLE',13,C.dim)}
 ${text(1159,886,'boldtonic / jumpstart',13,C.dim)}
 </svg>`;
}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 for(const [name,t] of [['poster',5.5],['menu',24.3],['result',37]]){
  const svg=frame(t);
  if(name==='poster')fs.writeFileSync(path.join(out,'jumpstart-poster.svg'),svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(out,`jumpstart-${name}.png`));
 }
 if(process.argv.includes('--stills'))return;
 const ffmpeg=process.env.FFMPEG||'ffmpeg';
 const video=path.join(out,'jumpstart.mp4');
 const proc=spawn(ffmpeg,['-y','-hide_banner','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-vcodec','png','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',video],{stdio:['pipe','inherit','inherit']});
 const completion=once(proc,'close');
 proc.stdin.on('error',()=>{});
 for(let i=0;i<FPS*DURATION;i++){
  const png=await sharp(Buffer.from(frame(i/FPS))).png().toBuffer();
  if(!proc.stdin.write(png))await once(proc.stdin,'drain');
  if(i%(FPS*5)===0)console.log(`Rendered ${i/FPS} / ${DURATION} seconds`);
 }
 proc.stdin.end();
 const [code]=await completion;
 if(code!==0)throw new Error(`Video export failed: ${code}`);
 const gif=spawnSync(ffmpeg,['-y','-hide_banner','-loglevel','error','-i',video,'-filter_complex','fps=8,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=48:stats_mode=diff[p];[b][p]paletteuse=dither=none:diff_mode=rectangle','-loop','0',path.join(out,'jumpstart.gif')],{stdio:'inherit'});
 if(gif.status!==0)throw new Error('GIF export failed');
 console.log(`Exported ${DURATION}-second terminal chat, README GIF and three stills.`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
