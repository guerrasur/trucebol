export const VERSION = '0.1.0';
export const COLORS = ['#ee664b','#438de0','#e9b83f','#5aac7e'];
export const CLUBS = ['Los del Potrero','Deportivo Trinchera','Barrio Unido','Atlético Baldío'];
const first = ['Lolo','Tito','Rafa','Nico','Beto','Ciro','Tano','Pato','Rulo','Dani','Fede','Mati','Pepe','Nacho','Santi','Luca'];
const last = ['Vega','Ríos','Costa','Luna','Paz','Sosa','Díaz','Rey','Cruz','Gil','Arias','Soto'];
export function random(s) { s.rng = (Math.imul(s.rng,1664525)+1013904223)>>>0; return s.rng/4294967296; }
export function player(s, position) {
  const roll=random(s); const rating=roll>.98?90+Math.floor(random(s)*9):roll>.8?78+Math.floor(random(s)*12):52+Math.floor(random(s)*26);
  return {id:++s.nextId,name:`${first[Math.floor(random(s)*first.length)]} ${last[Math.floor(random(s)*last.length)]}`,position:position||['ARQ','DEF','MED','DEL'][Math.floor(random(s)*4)],rating};
}
export function createGame(options={}) {
  const config={size:8,teams:2,startTiles:3,threshold:3,timing:'end',mode:'solo',...options};
  if(![2,3,4].includes(config.teams)||![8,10,12].includes(config.size)||![1,3,4].includes(config.startTiles)||![2,3,4].includes(config.threshold)||!['end','immediate','cut'].includes(config.timing)||!['solo','local'].includes(config.mode)) throw Error('Configuración inválida');
  const s={version:VERSION,config,rng:(options.seed??Date.now())>>>0,nextId:0,turn:0,round:1,actions:3,board:Array(config.size**2).fill(null),teams:[],market:[],matches:[],log:[],cooldowns:{},economy:{enabled:false},finished:false};
  for(let i=0;i<config.teams;i++) {
    const squad=['ARQ',...Array(4).fill('DEF'),...Array(3).fill('MED'),...Array(3).fill('DEL')].map(p=>player(s,p));
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
function note(s,text) { s.log.unshift({round:s.round,team:s.turn,text}); s.log=s.log.slice(0,60); }
function spend(s) { if(s.finished||s.actions<1) throw Error('No quedan acciones. Podés reorganizar o cerrar el turno.'); s.actions--; }
export function expand(s,i) { if(!expandable(s).includes(i)) throw Error('Elegí una casilla libre junto a tu territorio.'); spend(s);s.board[i]=s.turn;note(s,`Pintó ${i%s.config.size+1}, ${Math.floor(i/s.config.size)+1}.`); const results=s.config.timing==='end'?[]:resolveFronts(s);if(s.config.timing==='cut'&&results.length)endTurn(s);return results; }
export function sign(s,index) { if(!s.market[index])throw Error('Jugador no disponible'); spend(s);const p=s.market[index];s.teams[s.turn].bench.push(p);s.market[index]=player(s);note(s,`Fichó a ${p.name} (${p.rating}).`);return p; }
export function pack(s) { spend(s);const players=Array.from({length:5},()=>player(s));s.teams[s.turn].bench.push(...players);note(s,'Abrió un paquete de 5 jugadores.');return players; }
export function swap(s,starter,bench) { const t=s.teams[s.turn];if(!t.squad[starter]||!t.bench[bench])throw Error('Elegí un titular y un suplente.');[t.squad[starter],t.bench[bench]]=[t.bench[bench],t.squad[starter]]; }
function patches(s,a,b) {
  const candidates=[...new Set([...borders(s,a,b),...borders(s,b,a)])];
  if(candidates.length<4)return [];
  // A compact patch around a central border tile, always even for an exact draw split.
  return candidates.map(center=>{const patch=[center],seen=new Set(patch);
  for(let k=0;k<patch.length&&patch.length<6;k++)for(const i of neighbors(s,patch[k]))if(!seen.has(i)&&(s.board[i]===a||s.board[i]===b)){seen.add(i);patch.push(i);if(patch.length===6)break;}
  return patch.length>=4?patch.slice(0,patch.length>=6?6:4):[];}).filter(p=>p.length);
}
export function playMatch(s,a,b) {
  const key=[a,b].sort().join('-');
  if(a===b||!s.teams[a]||!s.teams[b]||s.cooldowns[key]===s.round)throw Error('Frente no disponible');
  if(Math.max(borders(s,a,b).length,borders(s,b,a).length)<s.config.threshold)throw Error('El frente todavía no llegó al umbral.');
  const options=patches(s,a,b);if(!options.length)throw Error('El frente necesita 4 casillas conectadas para disputar.');const tiles=options[Math.floor(random(s)*options.length)];
  const teams=[s.teams[a],s.teams[b]],ratings=teams.map(avg),score=[0,0],events=[];
  const chances=4+Math.floor(random(s)*5);
  for(let i=0;i<chances;i++) {
    const side=random(s)<Math.max(.2,Math.min(.8,.5+(ratings[0]-ratings[1])/100))?0:1;
    if(random(s)<.43) { score[side]++;const lineup=teams[side].squad;const attackers=lineup.filter(p=>p.position==='DEL'||p.position==='MED');const group=attackers.length?attackers:lineup;const scorer=group[Math.floor(random(s)*group.length)];events.push({minute:1+Math.floor(random(s)*90),team:teams[side].id,player:scorer.name,playerId:scorer.id}); }
  }
  events.sort((x,y)=>x.minute-y.minute);
  const winner=score[0]===score[1]?null:score[0]>score[1]?a:b;
  const before=tiles.map(i=>s.board[i]);
  if(winner!==null)tiles.forEach(i=>s.board[i]=winner);
  else tiles.forEach((i,index)=>s.board[i]=index<tiles.length/2?a:b);
  teams.forEach((t,i)=>{const st=t.stats;st.pj++;st.gf+=score[i];st.gc+=score[1-i];if(winner===null){st.e++;st.pts++;}else if(winner===t.id){st.g++;st.pts+=3;}else st.p++;});
  const match={id:s.matches.length+1,round:s.round,teams:[a,b],ratings,score,events,winner,tiles,before,after:tiles.map(i=>s.board[i]),chronicle:winner===null?'Silbato de tregua: la cancha se reparte por mitades.':`${s.teams[winner].name} ganó el potrero: las banderas avanzan y la pelota vuelve al medio.`};
  s.matches.unshift(match);s.cooldowns[key]=s.round;note(s,`${teams[0].name} ${score[0]}–${score[1]} ${teams[1].name}.`);return match;
}
export function resolveFronts(s) { const results=[];for(const rival of s.teams.filter(t=>t.id!==s.turn)){const f=fronts(s).find(f=>f.rival===rival.id);if(f&&f.count>=s.config.threshold&&!f.played&&patches(s,s.turn,f.rival).length)results.push(playMatch(s,s.turn,f.rival));}return results; }
export function endTurn(s) { if(s.finished)throw Error('La partida terminó');const matches=s.config.timing==='end'?resolveFronts(s):[];note(s,'Cerró su turno.');s.turn=(s.turn+1)%s.teams.length;if(s.turn===0)s.round++;s.actions=3;return matches; }
export function botTurn(s) {
  if(!s.teams[s.turn].bot)throw Error('Este equipo es humano');
  const startingTurn=s.turn,t=s.teams[s.turn];
  for(let i=0;i<11;i++){let best=-1;t.bench.forEach((p,j)=>{if(p.position===t.squad[i].position&&p.rating>t.squad[i].rating&&(best<0||p.rating>t.bench[best].rating))best=j;});if(best>=0)swap(s,i,best);}
  const matches=[];
  while(s.actions>0&&s.turn===startingTurn){const cells=expandable(s);if(cells.length&&random(s)<.85){cells.sort((a,b)=>neighbors(s,b).filter(i=>s.board[i]!==null&&s.board[i]!==s.turn).length-neighbors(s,a).filter(i=>s.board[i]!==null&&s.board[i]!==s.turn).length);matches.push(...expand(s,cells[Math.floor(random(s)*Math.min(3,cells.length))]));}else pack(s);}
  if(s.turn===startingTurn)matches.push(...endTurn(s));return matches;
}
export function standings(s) { return [...s.teams].sort((a,b)=>b.stats.pts-a.stats.pts||(b.stats.gf-b.stats.gc)-(a.stats.gf-a.stats.gc)||b.stats.gf-a.stats.gf); }
export function validSave(s) {
  if(!s||s.version!==VERSION||!s.config||![8,10,12].includes(s.config.size)||![2,3,4].includes(s.config.teams)||!Array.isArray(s.teams)||s.teams.length!==s.config.teams||!Array.isArray(s.board)||s.board.length!==s.config.size**2||!Number.isInteger(s.turn)||s.turn<0||s.turn>=s.teams.length||!Number.isInteger(s.actions)||s.actions<0||s.actions>3||!Number.isInteger(s.round)||s.round<1||!Number.isInteger(s.rng)||!Array.isArray(s.matches)||!Array.isArray(s.market)||!Array.isArray(s.log)||!s.cooldowns)return false;
  return s.board.every(x=>x===null||(Number.isInteger(x)&&x>=0&&x<s.teams.length))&&s.teams.every((t,i)=>t.id===i&&typeof t.name==='string'&&t.stats&&Array.isArray(t.squad)&&t.squad.length===11&&Array.isArray(t.bench)&&[...t.squad,...t.bench].every(p=>p&&Number.isFinite(p.rating)&&typeof p.name==='string'));
}
