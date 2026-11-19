'use strict';
const GAME_AMMO_NAMES={
  "usa_bgm-71d": "BGM-71D TOW",
  "usn_agm-123": "AGM-123 Skipper II",
  "usn_agm-45": "AGM-45 Shrike",
  "usn_agm-78": "AGM-78 Standard ARM",
  "usn_agm-84c": "AGM-84C Harpoon",
  "usn_agm-88a": "AGM-88A HARM",
  "usn_aim-54a": "AIM-54A Phoenix",
  "usn_aim-7m": "AIM-7M Sparrow",
  "usn_aim-9l": "AIM-9L Sidewinder",
  "usn_aim-9m": "AIM-9M Sidewinder",
  "usn_d-704": "Pod de repostaje D-704",
  "usn_fa-18_tank_330": "Depósito externo 330 gal (F/A-18)",
  "usn_gbu-12": "GBU-12 Paveway II",
  "usn_gbu-24": "GBU-24 Paveway III",
  "usn_lau-10a": "Lanzador LAU-10A (4 Zuni)",
  "usn_lau-3a": "Lanzador LAU-3A (19 Hydra)",
  "usn_lau-68": "Lanzador LAU-68 (7 Hydra)",
  "usn_mk-82": "Bomba Mk 82",
  "usn_mk-82_snakeye": "Mk 82 Snakeye",
  "usn_mk-83": "Bomba Mk 83",
  "usn_mk-84": "Bomba Mk 84",
  "usn_mk44_air": "Torpedo Mk 44",
  "usn_mk46_mod5_air": "Torpedo Mk 46 Mod 5 (NEARTIP)",
  "usn_mk54_dc": "Carga de profundidad Mk 54",
  "usn_pod_aww-9": "Pod AN/AWW-9",
  "usn_rockeye": "Mk 20 Rockeye (CBU-100)",
  "usn_ssq-53": "AN/SSQ-53 DIFAR",
  "usn_ssq-62": "AN/SSQ-62 DICASS",
  "usn_ssq-77": "AN/SSQ-77 VLAD",
  "usn_tank_267_f-14": "Depósito externo 267 gal (F-14)",
  "usn_tank_300_a-6": "Depósito externo 300 gal (A-6)",
  "usn_tank_300_a-6_c": "Depósito ventral 300 gal (A-6)",
  "usn_tank_600_f-4j": "Depósito externo 600 gal",
  "usn_tank_60gal_sh-2": "Depósito externo 60 gal (SH-2)",
  "usn_walleye2": "AGM-62 Walleye II"
};
function gameUnit(id){return gameData?.aircraft?.find(x=>x.id===id)||null}
function gameAmmoName(id){return GAME_AMMO_NAMES[id]||String(id||'Equipo no identificado').replace(/^us[a-z]*_/,'').replaceAll('_',' ')}
function gameAmmoDetail(id){return gameData?.ammo?.[id]||{}}
function gameItemsMarkup(items){
 if(!items?.length)return '<div class="game-noarm">Sin cargas definidas en los archivos originales para este perfil.</div>';
 const groups=[['armas','Armamento',x=>!['Fueltank','Sonobuoy','Container'].includes(x.type)],['sonoboyas','Sonoboyas',x=>x.type==='Sonobuoy'],['equipos','Depósitos, pods y lanzadores',x=>['Fueltank','Container'].includes(x.type)]];
 return groups.map(([group,title,predicate])=>{
  const row=items.filter(predicate);if(!row.length)return '';
  return '<div class="game-payload-group"><h4>'+title+'</h4><div class="game-ammo-list">'+row.map(item=>{
    const definition=gameAmmoDetail(item.id);
    const child=definition.containerItem&&Number(definition.attachments)>0?' · '+esc(Number(definition.attachments)*item.qty)+' proyectiles internos ('+esc(definition.containerItem.replace(/^usn_/,'').replaceAll('_',' '))+')':'';
    const qty='×'+esc(item.qty);
    const stock=definition.foc&&Number(definition.foc)>gameData.year?' · FOC '+esc(definition.foc):'';
    return '<div class="game-ammo-line"><span>'+esc(gameAmmoName(item.id))+'<small>'+esc(item.id)+child+stock+'</small></span><b>'+qty+'</b></div>';
  }).join('')+'</div></div>';
 }).join('');
}
function gameLoadoutsMarkup(unit){
 const actual=gameUnit(unit.id);
 if(!actual)return unit.loadouts?.length?'<div class="source-missing">No hay datos originales extraídos para esta unidad; las configuraciones anteriores son orientativas.</div>':'';
 return '<section class="detail-section game-source-section"><div class="game-section-head"><h3>Configuraciones reales · '+esc(gameData.year)+'</h3><span>'+actual.loadouts.length+' perfiles</span></div><p class="game-source-notice">Leídos de <code>'+esc(actual.source)+'</code>. Resueltas las variantes dependientes del año. Datos del juego original, sin las sobrescrituras de Workshop.</p><div class="game-loadouts">'+actual.loadouts.map((l,i)=>{
  const bullets=['Preparación: '+(l.ready??'—')+' min','Mantenimiento: '+(l.cooldown??'—')+' min'];
  return '<details class="game-loadout" '+(i===0&&actual.id==='s3a'?'open':'')+'><summary><span><strong>'+esc(l.name)+'</strong><small>'+esc(l.code)+' · '+bullets.join(' · ')+'</small></span><span class="game-chevron" aria-hidden="true">⌄</span></summary><div class="game-loadout-content">'+gameItemsMarkup(l.items)+'</div></details>'
 }).join('')+'</div><p class="game-data-limit">Las cantidades se calculan a partir de estaciones y posiciones de los racks del INI; comprueba en el juego los casos modificados por mods o reglas de disponibilidad.</p></section>';
}
function gamePlanProfile(unitId,profile){
 const unit=gameUnit(unitId);if(!unit)return null;
 const s=String(profile||'').toLowerCase();
 let ids=[];
 if(unitId==='a6e'){
  if(s.includes('sead'))ids=s.includes('advanced')?['SEADAdvanced','SEAD']:['SEAD','SEADAdvanced'];
  else if(s.includes('anti ship'))ids=s.includes('long range')?['AntiShipLongRange','AntiShip']:s.includes('heavy')?['AntiShipHeavy','AntiShip']:['AntiShip','AntiShipHeavy'];
  else if(s.includes('precision'))ids=['StrikePrecision'];
 }
 if(unitId==='s3a' && s.includes('asw'))ids=['ASW','ASWBomb'];
 if(unitId==='f14a')ids=s.includes('intercept')?['AirToAirIntercept','AirToAirLongRange']:['AirToAir','AirToAirIntercept'];
 if(unitId==='fa18a')ids=s.includes('strike')?['Strike','StrikePrecision']:['AirToAir','AirToAirLongRange'];
 if(unitId==='sh2f' && s.includes('asw'))ids=['ASW','ASWHunter','ASWKiller'];
 if(unitId==='sh3h' && s.includes('asw'))ids=['ASW','ASWHunter','ASWKiller'];
 if(unitId==='e2c')ids=['AEW'];
 if(unitId==='ea6b')ids=['EW'];
 if(unitId==='ah1t')ids=['CAS','AntiArmor'];
 const found=ids.map(id=>unit.loadouts.find(l=>l.code===id)).filter(Boolean);
 return found.length?found[0]:null;
}
function gamePlanLoadoutMarkup(id,profile){
 const actual=gamePlanProfile(id,profile);
 if(!actual)return '';
 return '<details class="plan-game-payload"><summary>Ver composición real: '+esc(actual.name)+' · '+esc(actual.ready??'—')+' min</summary><div>'+gameItemsMarkup(actual.items)+'</div><p>Datos originales para '+esc(gameData.year)+'. Los mods activos pueden cambiar esta carga.</p></details>';
}
