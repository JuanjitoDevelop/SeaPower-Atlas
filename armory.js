'use strict';
let armoryText='',armoryScope='fleet',armoryType='all',armoryEra='all',armoryLimit=45;
const ARMORY_TYPES={Missile:'Misil',Torpedo:'Torpedo',Projectile:'Proyectil',Bomb:'Bomba',AirDepthCharge:'Carga de profundidad',ASROC:'ASROC',RBU:'Cohete antisubmarino',AerialRocket:'Cohete aéreo',MLRS:'Cohete artillería',MOSS:'Señuelo submarino',Sonobuoy:'Sonoboya',Chaff:'Contramedida',Noisemaker:'Señuelo acústico',Fueltank:'Depósito',Container:'Lanzador / contenedor',Paratrooper:'Transporte',SinClasificar:'Otro'};
function armoryNormalizePayload(p){
 if(!p||!Array.isArray(p.i)||!p.p)throw Error('Archivo de armamento inválido');
 const items=p.i.map(row=>({id:row[0],name:row[1],type:row[2],target:row[3],ioc:row[4],foc:row[5],era:row[6],origin:row[7]}));
 const platforms=Object.fromEntries(Object.entries(p.p).map(([id,row])=>[id,{source:row[0],variant:row[1],weapons:row[2]}]));
 // Además de las 471 definiciones originales, incorporar las municiones propias de mods que no estén en vanilla.
 const known=new Set(items.map(i=>i.id));
 for(const [id,d] of Object.entries(modData?.ammo||{})){
  if(!known.has(id)){items.push({id,name:d.name||id,type:d.type||'Sin clasificar',target:'',ioc:d.ioc?Number(d.ioc):null,foc:d.foc?Number(d.foc):null,era:Number(d.ioc)>1985||Number(d.foc)>1985?'future':'undated',origin:'Workshop'});known.add(id)}
 }
 return {items,platforms,source:'original.zip · ammunition/*.ini',year:1985,originalCount:p.i.length};
}
async function armoryLoad(){
 try{
  const r=await fetch('./armory_1985.json');
  if(!r.ok)throw Error('No se ha encontrado el catálogo');
  armoryData=armoryNormalizePayload(await r.json());
 }catch(e){
  // Versión mínima si no se puede cargar el JSON completo.
  const records=new Map();
  for(const [id,d] of Object.entries(gameData?.ammo||{}))records.set(id,{id,name:typeof gameAmmoName==='function'?gameAmmoName(id):id,type:d.type||'Sin clasificar',target:d.target||'',ioc:d.ioc?Number(d.ioc):null,foc:d.foc?Number(d.foc):null,era:Number(d.ioc)>1985||Number(d.foc)>1985?'future':'undated',origin:'USN'});
  for(const [id,d] of Object.entries(modData?.ammo||{}))if(!records.has(id))records.set(id,{id,name:d.name||id,type:d.type||'Sin clasificar',target:'',ioc:Number(d.ioc)||null,foc:Number(d.foc)||null,era:Number(d.ioc)>1985||Number(d.foc)>1985?'future':'undated',origin:'Workshop'});
  armoryData={items:[...records.values()],platforms:{},source:'catálogo parcial de referencia',year:1985,originalCount:0,error:e.message};
 }
}
function armoryEraLabel(x){
 return x.era==='future'?'Posterior a 1985':x.era==='limited'?'Uso inicial en 1985':x.era==='undated'?'Sin fecha de servicio':'Fechas compatibles con 1985';
}
function renderArmory(){
 const c=campaignInit(),db=armoryData;
 if(!db){$('#page-content').innerHTML='<div class="panel">El catálogo aún no está disponible.</div>';return}
 const filtered=db.items.filter(i=>{
  const used=campaignAmmoUsed(i.id),count=campaignAmmoCount(i.id);
  if(armoryScope==='fleet'&&!used)return false;
  if(armoryScope==='stock'&&!(count!==null&&count>0))return false;
  if(armoryScope==='unknown'&&count!==null)return false;
  if(armoryType!=='all'&&i.type!==armoryType)return false;
  if(armoryEra==='1985'&&i.era==='future')return false;
  if(armoryText&&!norm([i.name,i.id,i.type,i.target].join(' ')).includes(norm(armoryText)))return false;
  return true;
 });
 filtered.sort((a,b)=>Number(campaignAmmoUsed(b.id))-Number(campaignAmmoUsed(a.id))||a.name.localeCompare(b.name,'es'));
 const active=db.items.filter(x=>campaignAmmoUsed(x.id)).length;
 const totalStock=Object.values(c.stock).filter(v=>typeof v==='number').length;
 const types=[...new Set(db.items.map(i=>i.type))].sort((a,b)=>a.localeCompare(b,'es'));
 const option=(val,title,current)=>'<option value="'+esc(val)+'" '+(current===val?'selected':'')+'>'+esc(title)+'</option>';
 const controls='<div class="armory-controls"><label>Mostrar<select id="armory-scope">'+[['fleet','Relacionado con mi flota'],['all','Todo el juego'],['stock','Con existencias registradas'],['unknown','Existencias sin comprobar']].map(x=>option(x[0],x[1],armoryScope)).join('')+'</select></label><label>Tipo<select id="armory-type">'+option('all','Todos los tipos',armoryType)+types.map(t=>option(t,ARMORY_TYPES[t]||t,armoryType)).join('')+'</select></label><label>Época<select id="armory-era">'+option('all','Todas las fechas',armoryEra)+option('1985','Excluir posterior a 1985',armoryEra)+'</select></label></div>';
 const shown=filtered.slice(0,armoryLimit);
 const rows=shown.map(i=>{
  const stock=campaignAmmoCount(i.id),linked=campaignPlatformsForAmmo(i.id);
  const hasAuto=linked.length>0,manual=c.use[i.id]||'auto';
  const status=campaignAmmoUsed(i.id);
  const ships=linked.map(id=>CAMPAIGN_UNITS.find(x=>x[0]===id)?.[1]||entry(id)?.name||id).join(', ');
  const w=catalogWeaponMap.get(i.id);
  const range=w?(w.max!==null?'Lanzamiento: mín. '+(w.min===null?'no definida':catalogNum(w.min)+' mn')+' · máx. '+catalogNum(w.max)+' mn':w.min!==null?'Lanzamiento mínimo: '+catalogNum(w.min)+' mn':w.torpRanges?.length?'Recorrido de torpedo: '+w.torpRanges.map(catalogNum).join(' / ')+' mn':'Alcance no definido en el INI'):'Alcance no extraído';
  const extra='<p class="armory-range"><strong>'+esc(range)+'</strong></p>';

  return '<article class="armory-item"><div class="armory-item-top"><div><span class="armory-kind">'+esc(ARMORY_TYPES[i.type]||i.type)+' · '+esc(i.origin)+'</span><h3>'+esc(i.name)+'</h3><code>'+esc(i.id)+'</code></div><span class="armory-link-status '+(status?'present':'inactive')+'">'+(status?'Relacionado con flota':'Fuera de uso')+'</span></div><div class="armory-attrs"><span>'+esc(armoryEraLabel(i))+'</span>'+(i.target?'<span>Objetivo: '+esc(i.target)+'</span>':'')+(i.ioc?'<span>IOC '+i.ioc+'</span>':'')+(i.foc?'<span>FOC '+i.foc+'</span>':'')+'</div>'+extra+(ships?'<p class="armory-carriers">Referenciado en: '+esc(ships)+'</p>':'<p class="armory-carriers">Sin plataforma activa identificada en este catálogo.</p>')+'<div class="armory-edits"><label>En uso<select data-armory-use="'+esc(i.id)+'">'+option('auto','Automático ('+(hasAuto?'sí':'no')+')',manual)+option('on','Marcar en uso',manual)+option('off','No usar',manual)+'</select></label><label>Existencias<input type="number" inputmode="numeric" min="0" max="1000000" placeholder="Sin comprobar" data-armory-stock="'+esc(i.id)+'" value="'+(stock===null?'':stock)+'"></label></div><button type="button" class="armory-full-link" data-open="game-ammo:'+esc(i.id)+'">Ver ficha de alcance ↗</button></article>';
 }).join('');
 $('#page-content').innerHTML='<div class="armory-page"><div class="eyebrow">ARSENAL · DATOS ORIGINALES + MODS</div><h1>Mi arsenal</h1><p class="lead">El juego define '+db.originalCount+' archivos de munición y equipo. Filtra lo que puede usar tu flota y registra las existencias reales. «En uso» significa asociado a plataformas o marcado por ti, no que esté cargado o disponible ahora.</p><div class="armory-stats"><div><strong>'+db.items.length+'</strong><small>Definiciones</small></div><div><strong>'+active+'</strong><small>En uso / vinculadas</small></div><div><strong>'+totalStock+'</strong><small>Con stock anotado</small></div></div>'+(db.error?'<p class="armory-warning">Catálogo reducido: '+esc(db.error)+'</p>':'')+'<p class="asset-notice">Los archivos INI no contienen el inventario de tu partida. Una casilla vacía significa «no comprobado»; 0 significa «agotado». Las referencias de buques son por clase/variante y requieren comprobación en tu unidad concreta.</p><label class="armory-search-label" for="armory-search">Buscar arma o equipo</label><input type="search" id="armory-search" placeholder="Harpoon, torpedo, RIM-66, sonoboya…" autocomplete="off" value="'+esc(armoryText)+'">'+controls+'<div class="armory-results-heading">'+filtered.length+' resultados · '+Math.min(armoryLimit,filtered.length)+' visibles</div><div class="armory-list">'+(rows||'<p class="armory-empty">No hay coincidencias. Puedes cambiar «Mostrar» a «Todo el juego».</p>')+'</div>'+(filtered.length>armoryLimit?'<button id="armory-more" class="armory-more">Mostrar más ('+(filtered.length-armoryLimit)+' restantes)</button>':'')+'<div class="campaign-foot-actions"><button type="button" data-page="fleet">Gestionar mi flota →</button><button type="button" data-page="ops">Volver al copiloto →</button></div></div>';
}
function armorySearchInput(v){
 armoryText=v;armoryLimit=45;
 const caret=document.activeElement?.id==='armory-search'?document.activeElement.selectionStart:null;
 renderArmory();
 if(caret!==null){const el=$('#armory-search');el?.focus();el?.setSelectionRange(caret,caret)}
}
