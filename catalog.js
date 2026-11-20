'use strict';
// Fuente: INI originales facilitados por el usuario, NO una lectura en directo del juego.
// Filas de unidad: [idOriginal,nombre,grupo,autonomíaMn,tipoAutonomía,velocidadNudos,referenciasAmmo]
// Filas de arma: [idOriginal,lanzamientoMínMn,lanzamientoMáxMn,carrerasTorpedoMn,velocidadesTorpedoKt]
let catalogSource=null,catalogEntries=[],catalogUnitMap=new Map(),catalogWeaponMap=new Map(),catalogByGameId=new Map(),libraryLimit=48;
const CATALOG_GROUP={a:'aircraft',v:'ship',l:'land'};
const CATALOG_FLEET_SOURCES={
 nimitz:'usn_cvn_nimitz',missouri:'usn_bb_iowa',virginia:'usn_cgn_virginia',
 kidd:'usn_ddg_kidd',samuel:'usn_ffg_oliver_hazard_perry_longhull',
 losangeles:'usn_ssn_los_angeles',a6e:'usn_a-6e',f14a:'usn_f-14a',
 fa18a:'usn_fa-18a',ea6b:'usn_ea-6b',e2c:'usn_e-2c',s3a:'usn_s-3a',
 sh2f:'usn_sh-2f',sh3h:'usn_sh-3h',hh3e:'usaf_hh-3',ah1t:'usmc_ah-1t'
};
const LEGACY_AMMO_IDS={
 agm84c:'usn_agm-84c',agm78d:'usn_agm-78',agm45b:'usn_agm-45',
 aim54:'usn_aim-54a',aim7:'usn_aim-7f',aim9:'usn_aim-9l',
 mk46:'usn_mk46_mod5_air',mk46mod5:'usn_mk46_mod5_air',mk48:'usn_mk48_mod4',
 gbu12:'usn_gbu-12',gbu24:'usn_gbu-24',mk82:'usn_mk-82',mk83:'usn_mk-83',
 harpoon_ship:'usn_rgm-84c',rim66:'usn_rim-66e',rim67:'usn_rim-67b',
 tomahawk:'usn_rgm-109c',agm88a:'usn_agm-88a'
};
const SOURCE_TO_FLEET=Object.fromEntries(Object.entries(CATALOG_FLEET_SOURCES).map(([id,source])=>[source,id]));
function catalogNum(v){return Number.isFinite(v)?new Intl.NumberFormat('es-ES',{maximumFractionDigits:1}).format(v):'—'}
function catalogNation(id){
 if(/^(usn|usaf|usmc|usa)_/.test(id))return 'EE. UU.';
 if(/^(rn|raf|uk)_/.test(id))return 'Reino Unido';
 if(/^wp_/.test(id))return 'Pacto de Varsovia';
 if(/^pla_/.test(id))return 'China';
 if(/^ara_/.test(id))return 'Argentina';
 return 'Otros';
}
function catalogInit(data){
 if(!data||!Array.isArray(data.units)||!Array.isArray(data.weapons)||data.units.length<600||data.weapons.length<470)throw Error('Catálogo completo inválido');
 catalogSource=data;catalogEntries=[];catalogUnitMap=new Map();catalogWeaponMap=new Map();catalogByGameId=new Map();
 const labelByAmmo=new Map((armoryData?.items||[]).map(i=>[i.id,i]));
 for(const w of data.weapons){
  const [id,min,max,torpRanges,torpSpeeds]=w;
  catalogWeaponMap.set(id,{id,min,max,torpRanges,torpSpeeds});
  const original=labelByAmmo.get(id);
  catalogEntries.push({
   id:'game-ammo:'+id,gameAmmoId:id,name:original?.name||id.replaceAll('_',' ').toUpperCase(),
   category:'weapon',nation:catalogNation(id),pack:'original-ini',
   role:original?.type||'Munición o equipamiento original',
   summary:min!==null&&max!==null?'Lanzamiento declarado de '+catalogNum(min)+' a '+catalogNum(max)+' millas náuticas.':max!==null?'Alcance máximo de lanzamiento declarado: '+catalogNum(max)+' mn.':'Datos originales del juego; alcance de lanzamiento no especificado en el archivo.',
   tags:[id,original?.type||''],year:original?.ioc||original?.foc||null,sourceFile:'ammunition/'+id+'.ini'
  });
 }
 // También mostrar las municiones exclusivas de mods presentes en los archivos importados.
 for(const [id,d] of Object.entries(modData?.ammo||{})){
  if(catalogWeaponMap.has(id))continue;
  catalogWeaponMap.set(id,{id,min:null,max:null,torpRanges:null,torpSpeeds:null});
  catalogEntries.push({id:'game-ammo:'+id,gameAmmoId:id,name:d.name||id,
   category:'weapon',nation:catalogNation(id),pack:'workshop',role:d.type||'Armamento de mod',
   year:d.ioc||d.foc||null,summary:'Munición incluida en Workshop: las distancias de lanzamiento no están comprobadas en el catálogo original.',
   tags:[id,'Workshop']});
 }
 for(const u of data.units){
  const [originalId,name,kind,maxNm,rangeKind,maxSpeed,weaponIndices]=u;
  const group=CATALOG_GROUP[kind];if(!group)continue;
  const sid=SOURCE_TO_FLEET[originalId];const id=sid||'game-unit:'+kind+':'+originalId;
  catalogUnitMap.set(originalId,{id:originalId,name,kind,maxNm,rangeKind,maxSpeed,
    weapons:(weaponIndices||[]).map(idx=>data.weapons[idx]?.[0]).filter(Boolean)});
  catalogByGameId.set(id,originalId);
  if(sid)continue; // La ficha principal de la Task Force existe y se enriquece, no se duplica.
  const intro={aircraft:'Aeronave',ship:'Buque o embarcación',land:'Unidad terrestre'}[group];
  const unitRange=maxNm!==null?' · Autonomía declarada: '+catalogNum(maxNm)+' mn.':' · Autonomía no especificada en el INI.';
  catalogEntries.push({id,gameId:originalId,name:name||originalId,category:group,
   nation:catalogNation(originalId),pack:'original-ini',
   role:intro+' del juego original',
   summary:intro+': '+originalId+'.'+unitRange,
   tags:[originalId,group],sourceFile:({aircraft:'aircraft',ship:'vessels',land:'land_units'})[group]+'/'+originalId+'.ini'});
 }
}
function catalogGetUnit(e){const src=e.gameId||CATALOG_FLEET_SOURCES[e.id];return src?catalogUnitMap.get(src):null}
function catalogGetWeapon(e){const key=e.gameAmmoId||LEGACY_AMMO_IDS[e.id]||e.id;return catalogWeaponMap.get(key)||null}
function catalogFleetFor(e){
 if(e.gameAmmoId){
  if(state.fleetIds?.includes(e.id))return true;
  return campaignAmmoUsed(e.gameAmmoId);
 }
 if(e.gameId){
  const mapped=SOURCE_TO_FLEET[e.gameId];
  return mapped?campaignUnit(mapped).assigned>0:state.fleetIds?.includes(e.id)||false;
 }
 return null;
}
function catalogUnitWeapons(e){
 const u=catalogGetUnit(e);
 if(!u)return [];
 const real=typeof gameUnit==='function'&&gameUnit(e.id);
 const modified=typeof modUnit==='function'&&modUnit(e.id)&&typeof modIsActive==='function'&&modIsActive(e.id);
 if(modified)return [...new Set((modUnit(e.id).loadouts||[]).flatMap(l=>(l.items||[]).map(x=>x.id)))];
 if(real)return [...new Set(real.loadouts.flatMap(l=>(l.items||[]).map(x=>x.id)))];
 return u.weapons; // Pueden incluir varias fechas y variantes. No es un loadout activo.
}
function catalogAmmoRows(ids){
 const byId=new Map((armoryData?.items||[]).map(i=>[i.id,i]));
 return [...new Set(ids||[])].map(id=>{
  const w=catalogWeaponMap.get(id);if(!w)return null;
  const type=byId.get(id)?.type||'';
  const name=byId.get(id)?.name||id;
  return {...w,name,type};
 }).filter(Boolean);
}
function catalogWeaponRanges(e){
 const w=catalogGetWeapon(e);if(!w)return '';
 const r=(title,value,extra='')=>'<div class="catalog-metric"><small>'+title+'</small><strong>'+value+'</strong>'+extra+'</div>';
 const val=v=>v===null?'No definido':catalogNum(v)+' mn';
 let out='<section class="detail-section catalog-range"><h3>Envolvente de ataque · archivo original</h3><div class="catalog-metrics">'+
 r('Distancia mínima de lanzamiento',val(w.min))+
 r('Distancia máxima de lanzamiento',val(w.max))+'</div>';
 if(w.torpRanges?.length)out+='<div class="catalog-torpedo"><strong>Recorrido del torpedo por velocidad</strong>'+
 w.torpRanges.map((n,i)=>'<span>'+catalogNum(w.torpSpeeds?.[i])+' nudos: '+catalogNum(n)+' mn de recorrido</span>').join('')+
 '<p>El recorrido del torpedo NO equivale a la distancia máxima de lanzamiento ni garantiza impacto.</p></div>';
 out+='<p class="catalog-fine">MinLaunchRange y MaxLaunchRange, cuando están definidos en <code>ammunition/'+esc(w.id)+'.ini</code>. Son límites nominales; sensores, altura, trayectoria y condiciones reales pueden reducir la distancia efectiva.</p></section>';
 return out;
}
function catalogUnitRanges(e){
 const u=catalogGetUnit(e);if(!u)return '';
 const weaponRows=catalogAmmoRows(catalogUnitWeapons(e));
 const sorted=weaponRows.filter(w=>Number.isFinite(w.max)).sort((a,b)=>b.max-a.max);
 const all=weaponRows.filter(w=>Number.isFinite(w.max)||Number.isFinite(w.min)||w.torpRanges?.length);
 const rangeText=u.maxNm===null?'No definido':catalogNum(u.maxNm)+' mn';
 const label=u.rangeKind==='cruise'?'Alcance de crucero declarado':u.rangeKind==='max'?'Autonomía máxima declarada':'Autonomía de navegación';
 const max=sorted[0];
 const maxText=max?catalogNum(max.max)+' mn':'No determinado';
 let result='<section class="detail-section catalog-range"><h3>Autonomía y distancias de ataque</h3><div class="catalog-metrics">'+
 '<div class="catalog-metric"><small>'+label+'</small><strong>'+rangeText+'</strong></div>'+
 '<div class="catalog-metric"><small>Mayor alcance nominal de arma referenciada</small><strong>'+maxText+'</strong></div>'+
 (Number.isFinite(u.maxSpeed)?'<div class="catalog-metric"><small>Velocidad máxima declarada (nivel del mar)</small><strong>'+catalogNum(u.maxSpeed)+' nudos</strong></div>':'')+
 '</div>'+
 (u.rangeKind==='cruise'?'<p class="catalog-fine">La distancia de crucero del INI no es radio de combate ni incluye necesariamente una reserva de regreso.</p>':
 u.maxNm===null?'<p class="catalog-fine">El original no proporciona aquí una autonomía navegable fiable. No se estima a partir de velocidad o combustible.</p>':'')+
 (all.length?'<details class="catalog-weapon-list"><summary>Distancias de armas asociadas ('+all.length+')</summary><div class="catalog-weapon-rows">'+
 all.sort((a,b)=>(b.max??-1)-(a.max??-1)).slice(0,75).map(w=>{
  const attack=w.max===null?'Mín. '+(w.min===null?'—':catalogNum(w.min)+' mn')+' · Máx. no definido':
   'Mín. '+(w.min===null?'—':catalogNum(w.min)+' mn')+' · Máx. '+catalogNum(w.max)+' mn';
  return '<div class="catalog-weapon-row"><div><strong>'+esc(w.name)+'</strong><small>'+esc(w.id)+' · '+esc(attack)+'</small></div><button type="button" data-open="game-ammo:'+esc(w.id)+'" aria-label="Abrir '+esc(w.name)+'">Ficha ↗</button></div>';
 }).join('')+'</div></details>':'<p class="catalog-fine">No hay distancias de lanzamiento específicas para las armas referenciadas en este archivo.</p>')+
 '<p class="catalog-fine">Los alcances corresponden a armas individuales, no a una distancia de combate garantizada para la plataforma. Cada arma tiene su propia distancia mínima. En modelos externos a tu flota, las referencias pueden mezclar años o variantes.</p>'+
 '<p class="catalog-fine">Fuente: <code>'+esc(e.sourceFile||({'a':'aircraft','v':'vessels','l':'land_units'}[u.kind]+'/'+u.id+'.ini'))+'</code>.</p></section>';
 return result;
}
function catalogDetailMarkup(e){return catalogWeaponRanges(e)||catalogUnitRanges(e)}
function catalogCardFact(e){
 const u=catalogGetUnit(e),w=catalogGetWeapon(e);
 if(u?.maxNm!==null&&u?.maxNm!==undefined)return 'Autonomía: '+catalogNum(u.maxNm)+' mn'+(u.rangeKind==='cruise'?' (crucero)':'');
 if(w&&w.max!==null)return 'Arma: '+(w.min===null?'—':catalogNum(w.min))+' – '+catalogNum(w.max)+' mn';
 if(w&&w.min!==null)return 'Distancia mínima: '+catalogNum(w.min)+' mn';
 return '';
}
