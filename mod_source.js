'use strict';
// Capa de datos Workshop: las opciones del editor NO son cargas ya equipadas.
function modUnit(id){return modData?.mods?.[id]||null}
function modIsActive(id){return id==='sh2f'?Boolean(state?.planner?.mods?.sh2):id==='sh3h'?Boolean(state?.planner?.mods?.sh3):false}
function modAmmoName(id){return modData?.ammo?.[id]?.name||gameAmmoName(id)}
function modLoadoutItemMarkup(items){
 if(!items?.length)return '<p class="game-noarm">Sin armamento identificado en este perfil.</p>';
 const groups=[['Armas',x=>!['Fueltank','Sonobuoy','Container'].includes(x.type)],['Sonoboyas',x=>x.type==='Sonobuoy'],['Depósitos y lanzadores',x=>['Fueltank','Container'].includes(x.type)]];
 return groups.map(([title,pred])=>{
 const rows=items.filter(pred);if(!rows.length)return '';
 return '<div class="game-payload-group"><h4>'+title+'</h4><div class="game-ammo-list">'+rows.map(i=>{
   const d=modData?.ammo?.[i.id]||{};
   const extra=d.childCountPerContainer?'<small>'+esc(i.qty*d.childCountPerContainer)+' proyectiles internos ('+esc(d.child||'')+')</small>':'';
   const warning=(Number(d.ioc)>modData.year||Number(d.foc)>modData.year)?'<small class="mod-year-warning">Fecha interna posterior a '+modData.year+'</small>':'';
   return '<div class="game-ammo-line"><span>'+esc(modAmmoName(i.id))+'<small>'+esc(i.id)+'</small>'+extra+warning+'</span><b>×'+esc(i.qty)+'</b></div>';
 }).join('')+'</div></div>';
 }).join('');
}
function modLoadoutsMarkup(unit){
 const m=modUnit(unit.id);if(!m)return '';
 const active=modIsActive(unit.id);
 const removed=(m.removedBase||[]).length?'<p class="mod-removed">El archivo del mod sustituye al original: al activarlo dejan de estar definidos estos perfiles originales: <strong>'+m.removedBase.map(esc).join(', ')+'</strong>.</p>':'';
 const changes=m.speedComparison?'<p class="mod-changes">El mod también cambia la velocidad máxima configurada a nivel del mar: '+esc(m.speedComparison.base)+' → '+esc(m.speedComparison.mod)+' nudos (dato del INI, no prueba de rendimiento).</p>':'';
 const lines=m.loadouts.map(l=>'<details class="game-loadout"><summary><span><strong>'+esc(l.name)+'</strong><small>'+esc(l.code)+' · Preparación: '+(l.ready===null?'no indicada en el INI':esc(l.ready)+' min')+'</small></span><span class="game-chevron" aria-hidden="true">⌄</span></summary><div class="game-loadout-content">'+modLoadoutItemMarkup(l.items)+(l.yearWarning?'<p class="mod-year-warning">'+esc(l.yearWarning)+'. La presencia en el INI no confirma la disponibilidad efectiva en el juego.</p>':'')+'</div></details>').join('');
 return '<section class="detail-section mod-source-section"><div class="game-section-head"><h3>Cargas del mod · Workshop</h3><span>'+m.loadouts.length+' perfiles</span></div><p class="game-source-notice"><strong>'+esc(m.name)+'</strong> · Carpeta '+esc(m.modId)+' · '+(active?'Mod marcado como activo en Atlas.':'Mod aportado en ZIP, no marcado como activo en el planificador.')+'</p>'+removed+changes+'<div class="game-loadouts">'+lines+'</div><p class="game-data-limit">Fuente: <code>'+esc(m.source)+'</code>. Las fechas y la carga efectiva pueden variar con el orden de mods y la versión del juego.</p></section>';
}
function modSelectedProfile(id,profile){
 const mod=modUnit(id);if(!mod||!modIsActive(id))return null;
 const normalized=String(profile||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const find=code=>mod.loadouts.find(l=>l.code.toLowerCase()===code.toLowerCase());
 if(normalized.includes('antiship')||normalized.includes('harpoon')||normalized.includes('penguin'))return find('AntiShip');
 if(normalized.includes('aswhunter'))return find('ASWHunter');
 if(normalized.includes('aswkiller'))return find('ASWKiller');
 if(normalized.includes('asw'))return find('ASW');
 if(normalized.includes('airtoair'))return find('AirToAir');
 if(normalized.includes('sead'))return find('SEADAdvanced');
 if(normalized.includes('cas'))return find('CAS');
 if(normalized.includes('strike'))return find('Strike');
 return find(profile);
}
function modPlanLoadoutMarkup(id,profile){
 const m=modUnit(id);if(!m||!modIsActive(id))return '';
 const selected=modSelectedProfile(id,profile);
 if(!selected)return '<p class="mod-plan-missing">El perfil indicado no figura en el archivo del mod habilitado. Compruébalo antes de preparar la salida.</p>';
 const labels='<span class="mod-preset-tag">WORKSHOP · '+esc(m.name)+'</span>';
 return '<details class="plan-game-payload mod-plan-payload"><summary>Ver carga del mod: '+esc(selected.name)+' · '+(selected.ready===null?'preparación no definida':esc(selected.ready)+' min')+'</summary><div>'+labels+modLoadoutItemMarkup(selected.items)+'</div>'+(selected.yearWarning?'<p class="mod-year-warning">'+esc(selected.yearWarning)+'</p>':'')+'<p>Perfil del INI de Workshop; no verifica existencias, activación ni compatibilidad del editor con esta carga.</p></details>';
}
function editorModOverview(){
 const e=modData?.editor;if(!e)return '';
 const rows=e.fleetSupported.map(x=>'<div class="mod-editor-row"><strong>'+esc(x.stem)+'</strong><span>'+esc(x.stations)+' estaciones · '+esc(x.distinctOptions)+' tipos de opción</span>'+(x.options?'<small>Opciones predeterminadas: '+x.options.map(esc).join(', ')+'</small>':'')+'</div>').join('');
 return '<details class="mod-editor-info"><summary>Compatibilidad de Custom Loadout Editor ('+esc(e.fleetSupported.length)+' tipos de tu flota)</summary><p>El ZIP incluye '+esc(e.definitionFiles)+' archivos de definición de estaciones para distintas aeronaves. <strong>No hemos recibido ninguna configuración personalizada guardada por ti.</strong></p><div>'+rows+'</div><p>Los archivos predeterminados del editor para SH-2F y SH-3H no incluyen Penguin ni Harpoon entre sus opciones de estación. Que el helicóptero tenga un preset por otro mod no garantiza que puedas construirlo con el editor.</p></details>';
}
