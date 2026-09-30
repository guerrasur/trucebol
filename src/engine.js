export const VERSION = '0.2.0';
export const COLORS = ['#ee664b','#438de0','#e9b83f','#5aac7e'];
export const CLUBS = ['Los del Potrero','Deportivo Trinchera','Barrio Unido','Atlético Baldío'];
export const SLOTS = ['ARQ',...Array(4).fill('DEF'),...Array(3).fill('MED'),...Array(3).fill('DEL')];
const first = ['Lolo','Tito','Rafa','Nico','Beto','Ciro','Tano','Pato','Rulo','Dani','Fede','Mati','Pepe','Nacho','Santi','Luca'];
const last = ['Vega','Ríos','Costa','Luna','Paz','Sosa','Díaz','Rey','Cruz','Gil','Arias','Soto'];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;

export function random(s) { s.rng = (Math.imul(s.rng,1664525)+1013904223)>>>0; return s.rng/4294967296; }
function hashString(value){let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function deterministicJitter(p,key,range=5){const h=hashString(`${p.id}|${p.name}|${p.position}|${p.rating}|${key}`);return (h%(range*2+1))-range;}
function deriveSkills(p){
  const bias={
    ARQ:{attack:-43,passing:-12,defense:-9,keeping:9},
    DEF:{attack:-18,passing:-5,defense:9,keeping:-48},
    MED:{attack:-4,passing:9,defense:-1,keeping:-52},
    DEL:{attack:10,passing:-1,defense:-22,keeping:-55}
  }[p.position]||{attack:0,passing:0,defense:0,keeping:-50};
  const skill={};
  for(const key of ['attack','passing','defense','keeping'])skill[key]=clamp(Math.round(p.rating+bias[key]+deterministicJitter(p,key)),5,99);
  return skill;
}
export function playerSkills(p){
  if(!p.skills||!['attack','passing','defense','keeping'].every(k=>Number.isFinite(p.skills[k])))p.skills=deriveSkills(p);
  return p.skills;
}
export function player(s, position) {
  const roll=random(s); const rating=roll>.98?90+Math.floor(random(s)*9):roll>.8?78+Math.floor(random(s)*12):52+Math.floor(random(s)*26);
  const p={id:++s.nextId,name:`${first[Math.floor(random(s)*first.length)]} ${last[Math.floor(random(s)*last.length)]}`,position:position||['ARQ','DEF','MED','DEL'][Math.floor(random(s)*4)],rating};
  p.skills=deriveSkills(p);return p;
}
export function createGame(options={}) {
  const config={size:8,teams:2,startTiles:3,threshold:3,timing:'end',mode:'solo',...options};
  if(![2,3,4].includes(config.teams)||![8,10,12].includes(config.size)||![1,3,4].includes(config.startTiles)||![2,3,4].includes(config.threshold)||!['end','immediate','cut'].includes(config.timing)||!['solo','local'].includes(config.mode)) throw Error('Configuración inválida');
  const s={version:VERSION,config,rng:(options.seed??Date.now())>>>0,nextId:0,turn:0,round:1,actions:3,board:Array(config.size**2).fill(null),teams:[],market:[],matches:[],log:[],cooldowns:{},economy:{enabled:false},finished:false};
  for(let i=0;i<config.teams;i++) {
    const squad=SLOTS.map(p=>player(s,p));
    s.teams.push({id:i,name:CLUBS[i],color:COLORS[i],bot:config.mode==='solo'&&i>0,squad,bench:Array.from({length:4},()=>player(s)),stats:{pj:0,g:0,e:0,p:0,gf:0,gc:0,pts:0}});
    const n=config.size; const anchors=[n+1,n*(n-2)+n-2,n+n-2,n*(n-2)+1];
    const a=anchors[i]; const group=[a,a+(i===1||i===2?-1:1),a+(i===1||i===3?-n:n),a+(i===1||i===2?-1:1)+(i===1||i===3?-n:n)];
    group.slice(0,config.startTiles).forEach(x=>s.board[x]=i);
  }
  s.market=Array.from({length:4},()=>player(s)); return s;
}
export function neighbors(s,i) { const n=s.config.size,x=i%n,y=Math.floor(i/n); return [x>0?i-1:null,x<n-1?i+1:null,y>0?i-n:null,y<n-1?i+n:null].filter(x=>x!==null); }
export function avg(team) { return Math.round(team.squad.reduce((a,p)=>a+p.rating,0)/11); }
export function territory(s,id) { return s.board.filter(x=>x===id).length; }
export function expandable(s,id=s.turn) { return s.board.map((owner,i)=>owner===null&&neighbors(s,i).some(j=>s.board[j]===id)?i:null).filter(i=>i!==null); }
export function borders(s,a,b) { return s.board.map((owner,i)=>owner===a&&neighbors(s,i).some(j=>s.board[j]===b)?i:null).filter(i=>i!==null); }
export function fronts(s,id=s.turn) { return s.teams.filter(t=>t.id!==id).map(t=>({rival:t.id,count:Math.max(borders(s,id,t.id).length,borders(s,t.id,id).length),played:s.cooldowns[[id,t.id].sort().join('-')]===s.round})).filter(f=>f.count>0); }
export function slotPosition(index){return SLOTS[index]||'DEL';}
export function fitFactor(p,slot){
  if(p.position===slot)return 1;
  if(slot==='ARQ'||p.position==='ARQ')return slot==='ARQ' ? .36 : .52;
  const pair=new Set([p.position,slot]);
  if(pair.has('MED')&&(pair.has('DEF')||pair.has('DEL')))return .84;
  return .69;
}
function slotScore(p,index,kind){
  const slot=slotPosition(index),fit=fitFactor(p,slot),sk=playerSkills(p);
  if(kind==='attack'){
    const role={ARQ:.03,DEF:.17,MED:.58,DEL:1}[slot];
    return (sk.attack*.78+sk.passing*.22)*role*fit;
  }
  if(kind==='passing'){
    const role={ARQ:.28,DEF:.55,MED:1,DEL:.62}[slot];
    return (sk.passing*.8+sk.attack*.1+sk.defense*.1)*role*fit;
  }
  if(kind==='defense'){
    const role={ARQ:.22,DEF:1,MED:.62,DEL:.15}[slot];
    return (sk.defense*.82+sk.passing*.18)*role*fit;
  }
  return sk.keeping*fit;
}
export function teamProfile(team){
  const forwards=team.squad.map((p,i)=>slotPosition(i)==='DEL'?slotScore(p,i,'attack'):null).filter(x=>x!==null);
  const midfield=team.squad.map((p,i)=>slotPosition(i)==='MED'?slotScore(p,i,'passing'):null).filter(x=>x!==null);
  const defenders=team.squad.map((p,i)=>slotPosition(i)==='DEF'?slotScore(p,i,'defense'):null).filter(x=>x!==null);
  const keeper=slotScore(team.squad[0],0,'keeping');
  const attack=mean(forwards)*.74+mean(midfield)*.26;
  const middle=mean(midfield)*.72+mean(defenders)*.15+mean(forwards)*.13;
  const defense=mean(defenders)*.7+mean(midfield)*.2+keeper*.1;
  return {attack:Math.round(attack),midfield:Math.round(middle),defense:Math.round(defense),keeper:Math.round(keeper),overall:Math.round((attack+middle+defense+keeper)/4)};
}
function note(s,text) { s.log.unshift({round:s.round,team:s.turn,text}); s.log=s.log.slice(0,60); }
function spend(s) { if(s.finished||s.actions<1) throw Error('No quedan acciones. Podés reorganizar o cerrar el turno.'); s.actions--; }
export function expand(s,i) { if(!expandable(s).includes(i)) throw Error('Elegí una casilla libre junto a tu territorio.'); spend(s);s.board[i]=s.turn;note(s,`Pintó ${i%s.config.size+1}, ${Math.floor(i/s.config.size)+1}.`); const results=s.config.timing==='end'?[]:resolveFronts(s);if(s.config.timing==='cut'&&results.length)endTurn(s);return results; }
export function sign(s,index) { if(!s.market[index])throw Error('Jugador no disponible'); spend(s);const p=s.market[index];s.teams[s.turn].bench.push(p);s.market[index]=player(s);note(s,`Fichó a ${p.name} (${p.rating}).`);return p; }
export function pack(s) { spend(s);const players=Array.from({length:5},()=>player(s));s.teams[s.turn].bench.push(...players);note(s,'Abrió un paquete de 5 jugadores.');return players; }
export function swap(s,starter,bench) { const t=s.teams[s.turn];if(!t.squad[starter]||!t.bench[bench])throw Error('Elegí un titular y un suplente.');[t.squad[starter],t.bench[bench]]=[t.bench[bench],t.squad[starter]]; }
function patches(s,a,b) {
  const candidates=[...new Set([...borders(s,a,b),...borders(s,b,a)])];
  if(candidates.length<4)return [];
  return candidates.map(center=>{const patch=[center],seen=new Set(patch);
  for(let k=0;k<patch.length&&patch.length<6;k++)for(const i of neighbors(s,patch[k]))if(!seen.has(i)&&(s.board[i]===a||s.board[i]===b)){seen.add(i);patch.push(i);if(patch.length===6)break;}
  return patch.length>=4?patch.slice(0,patch.length>=6?6:4):[];}).filter(p=>p.length);
}
function weightedPick(s,items,weight){
  const weights=items.map(weight),total=weights.reduce((a,b)=>a+b,0);if(total<=0)return items[Math.floor(random(s)*items.length)];
  let roll=random(s)*total;for(let i=0;i<items.length;i++){roll-=weights[i];if(roll<=0)return items[i];}return items.at(-1);
}
function pickPlayer(s,team,kind,excludeId=null){
  const choices=team.squad.map((p,index)=>({p,index,slot:slotPosition(index),sk:playerSkills(p),fit:fitFactor(p,slotPosition(index))})).filter(x=>x.p.id!==excludeId);
  return weightedPick(s,choices,x=>{
    if(kind==='shot')return ({ARQ:.03,DEF:.32,MED:1.25,DEL:3.4}[x.slot])*(x.sk.attack+20)*x.fit;
    if(kind==='create')return ({ARQ:.2,DEF:.8,MED:3.2,DEL:1.5}[x.slot])*(x.sk.passing+20)*x.fit;
    if(kind==='defend')return ({ARQ:.3,DEF:3.4,MED:1.5,DEL:.35}[x.slot])*(x.sk.defense+20)*x.fit;
    return 1;
  });
}
function round1(n){return Math.round(n*10)/10;}
function performance(teams,events,score,stats){
  const rows=teams.flatMap((team,side)=>team.squad.map((p,index)=>({team:team.id,playerId:p.id,name:p.name,position:p.position,slot:slotPosition(index),rating:6,goals:0,assists:0,saves:0})));
  const byId=new Map(rows.map(r=>[`${r.team}-${r.playerId}`,r]));
  for(const e of events){
    const row=byId.get(`${e.team}-${e.playerId}`);
    if(!row)continue;
    if(e.type==='goal'){row.goals++;row.rating+=1.05;const a=e.assistId?byId.get(`${e.team}-${e.assistId}`):null;if(a){a.assists++;a.rating+=.5;}}
    else if(e.type==='save'){row.rating-=.03;const keeper=rows.find(r=>r.team!==e.team&&r.slot==='ARQ');if(keeper){keeper.saves++;keeper.rating+=.12;}}
    else if(e.type==='miss')row.rating-=.04;
    else if(e.type==='block'){row.rating-=.02;const defender=rows.find(r=>r.team!==e.team&&r.playerId===e.defenderId);if(defender)defender.rating+=.08;}
  }
  teams.forEach((team,side)=>{
    const won=score[side]>score[1-side],draw=score[side]===score[1-side],clean=score[1-side]===0;
    rows.filter(r=>r.team===team.id).forEach(r=>{r.rating+=(won ? .2 : draw ? .05 : -.12);if(clean&&(r.slot==='ARQ'||r.slot==='DEF'))r.rating+=.25;});
    const keeper=rows.find(r=>r.team===team.id&&r.slot==='ARQ');if(keeper)keeper.rating+=Math.min(.4,(stats[side].saves||0)*.04);
  });
  rows.forEach(r=>r.rating=round1(clamp(r.rating,4.5,10)));
  rows.sort((a,b)=>b.rating-a.rating||b.goals-a.goals||b.assists-a.assists);
  return rows;
}
export function playMatch(s,a,b) {
  const key=[a,b].sort().join('-');
  if(a===b||!s.teams[a]||!s.teams[b]||s.cooldowns[key]===s.round)throw Error('Frente no disponible');
  if(Math.max(borders(s,a,b).length,borders(s,b,a).length)<s.config.threshold)throw Error('El frente todavía no llegó al umbral.');
  const options=patches(s,a,b);if(!options.length)throw Error('El frente necesita 4 casillas conectadas para disputar.');const tiles=options[Math.floor(random(s)*options.length)];
  const teams=[s.teams[a],s.teams[b]],ratings=teams.map(avg),profiles=teams.map(teamProfile),score=[0,0],events=[];
  const stats=[0,1].map(()=>({possession:0,attacks:0,shots:0,onTarget:0,xg:0,saves:0}));
  const possession0=clamp(.5+(profiles[0].midfield-profiles[1].midfield)/210,.32,.68);
  const sequences=34+Math.floor(random(s)*9);
  for(let n=0;n<sequences;n++){
    const side=random(s)<possession0?0:1,other=1-side;stats[side].attacks++;
    const shooter=pickPlayer(s,teams[side],'shot'),creator=pickPlayer(s,teams[side],'create',shooter.p.id);
    const sk=shooter.sk,ck=creator?.sk||sk,atk=profiles[side],opp=profiles[other];
    const build=sk.attack*.42+ck.passing*.25+atk.attack*.2+atk.midfield*.13;
    const resistance=opp.defense*.72+opp.midfield*.28;
    const shotChance=clamp(.52+(build-resistance)/180,.26,.78);
    if(random(s)>shotChance)continue;
    stats[side].shots++;
    const minute=1+Math.floor(random(s)*90);
    const xg=clamp(.09+(build-opp.defense)/230+(sk.attack-opp.keeper)/420+random(s)*.13,.03,.58);
    stats[side].xg+=xg;
    const onTargetProb=clamp(.43+(sk.attack-opp.defense)/230+(ck.passing-60)/480,.27,.78);
    if(random(s)<onTargetProb){
      stats[side].onTarget++;
      const goalProb=clamp(xg*.72+(sk.attack-opp.keeper)/320,.045,.52);
      if(random(s)<goalProb){
        score[side]++;
        const assisted=creator&&random(s)<.76;
        events.push({type:'goal',minute,team:teams[side].id,player:shooter.p.name,playerId:shooter.p.id,assist:assisted?creator.p.name:null,assistId:assisted?creator.p.id:null,xg:round1(xg)});
      }else{
        stats[other].saves++;
        events.push({type:'save',minute,team:teams[side].id,player:shooter.p.name,playerId:shooter.p.id,xg:round1(xg)});
      }
    }else if(random(s)<.42){
      const defender=pickPlayer(s,teams[other],'defend');
      events.push({type:'block',minute,team:teams[side].id,player:shooter.p.name,playerId:shooter.p.id,defender:defender.p.name,defenderId:defender.p.id,xg:round1(xg)});
    }else{
      events.push({type:'miss',minute,team:teams[side].id,player:shooter.p.name,playerId:shooter.p.id,xg:round1(xg)});
    }
  }
  events.sort((x,y)=>x.minute-y.minute||({goal:0,save:1,block:2,miss:3}[x.type]-({goal:0,save:1,block:2,miss:3}[y.type])));
  const totalAttacks=Math.max(1,stats[0].attacks+stats[1].attacks);
  stats[0].possession=Math.round(stats[0].attacks/totalAttacks*100);stats[1].possession=100-stats[0].possession;
  stats.forEach(st=>st.xg=round1(st.xg));
  const winner=score[0]===score[1]?null:score[0]>score[1]?a:b;
  const before=tiles.map(i=>s.board[i]);
  if(winner!==null)tiles.forEach(i=>s.board[i]=winner);
  else tiles.forEach((i,index)=>s.board[i]=index<tiles.length/2?a:b);
  teams.forEach((t,i)=>{const st=t.stats;st.pj++;st.gf+=score[i];st.gc+=score[1-i];if(winner===null){st.e++;st.pts++;}else if(winner===t.id){st.g++;st.pts+=3;}else st.p++;});
  const playerRatings=performance(teams,events,score,stats),star=playerRatings[0]||null;
  const match={id:s.matches.length+1,round:s.round,teams:[a,b],ratings,profiles,score,stats,events,playerRatings,star,winner,tiles,before,after:tiles.map(i=>s.board[i]),chronicle:winner===null?'El partido terminó empatado y el territorio disputado se divide entre ambos equipos.':`${s.teams[winner].name} ganó el partido y toma el territorio disputado.`};
  s.matches.unshift(match);s.cooldowns[key]=s.round;note(s,`${teams[0].name} ${score[0]}–${score[1]} ${teams[1].name}.`);return match;
}
export function resolveFronts(s) { const results=[];for(const rival of s.teams.filter(t=>t.id!==s.turn)){const f=fronts(s).find(f=>f.rival===rival.id);if(f&&f.count>=s.config.threshold&&!f.played&&patches(s,s.turn,f.rival).length)results.push(playMatch(s,s.turn,f.rival));}return results; }
export function endTurn(s) { if(s.finished)throw Error('La partida terminó');const matches=s.config.timing==='end'?resolveFronts(s):[];note(s,'Cerró su turno.');s.turn=(s.turn+1)%s.teams.length;if(s.turn===0)s.round++;s.actions=3;return matches; }
export function botTurn(s) {
  if(!s.teams[s.turn].bot)throw Error('Este equipo es humano');
  const startingTurn=s.turn,t=s.teams[s.turn];
  for(let i=0;i<11;i++){let best=-1;t.bench.forEach((p,j)=>{if(p.position===slotPosition(i)&&(!t.squad[i]||p.rating>t.squad[i].rating)&&(best<0||p.rating>t.bench[best].rating))best=j;});if(best>=0)swap(s,i,best);}
  const matches=[];
  while(s.actions>0&&s.turn===startingTurn){const cells=expandable(s);if(cells.length&&random(s)<.85){cells.sort((a,b)=>neighbors(s,b).filter(i=>s.board[i]!==null&&s.board[i]!==s.turn).length-neighbors(s,a).filter(i=>s.board[i]!==null&&s.board[i]!==s.turn).length);matches.push(...expand(s,cells[Math.floor(random(s)*Math.min(3,cells.length))]));}else pack(s);}
  if(s.turn===startingTurn)matches.push(...endTurn(s));return matches;
}
export function standings(s) { return [...s.teams].sort((a,b)=>b.stats.pts-a.stats.pts||(b.stats.gf-b.stats.gc)-(a.stats.gf-a.stats.gc)||b.stats.gf-a.stats.gf); }
export function migrateSave(s){
  if(!s||!['0.1.0',VERSION].includes(s.version))return s;
  if(Array.isArray(s.teams))for(const t of s.teams){for(const p of [...(t.squad||[]),...(t.bench||[])])playerSkills(p);}
  if(Array.isArray(s.market))for(const p of s.market)playerSkills(p);
  if(Array.isArray(s.matches))for(const m of s.matches)if(Array.isArray(m.events))for(const e of m.events)if(!e.type)e.type='goal';
  s.version=VERSION;return s;
}
export function validSave(s) {
  if(!s||s.version!==VERSION||!s.config||![8,10,12].includes(s.config.size)||![2,3,4].includes(s.config.teams)||!Array.isArray(s.teams)||s.teams.length!==s.config.teams||!Array.isArray(s.board)||s.board.length!==s.config.size**2||!Number.isInteger(s.turn)||s.turn<0||s.turn>=s.teams.length||!Number.isInteger(s.actions)||s.actions<0||s.actions>3||!Number.isInteger(s.round)||s.round<1||!Number.isInteger(s.rng)||!Array.isArray(s.matches)||!Array.isArray(s.market)||!Array.isArray(s.log)||!s.cooldowns)return false;
  return s.board.every(x=>x===null||(Number.isInteger(x)&&x>=0&&x<s.teams.length))&&s.teams.every((t,i)=>t.id===i&&typeof t.name==='string'&&t.stats&&Array.isArray(t.squad)&&t.squad.length===11&&Array.isArray(t.bench)&&[...t.squad,...t.bench].every(p=>p&&Number.isFinite(p.rating)&&typeof p.name==='string'&&['ARQ','DEF','MED','DEL'].includes(p.position)&&['attack','passing','defense','keeping'].every(k=>Number.isFinite(playerSkills(p)[k]))));
}