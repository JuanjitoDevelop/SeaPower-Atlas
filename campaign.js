'use strict';
// Estado local de campaña: nunca se supone que lee la partida de Sea Power.
let armoryData=null;
const CAMPAIGN_UNITS=[
 ['nimitz','USS Nimitz','Buques'],['missouri','USS Missouri','Buques'],['virginia','Crucero Virginia','Buques'],['kidd','Destructor Kidd','Buques'],['samuel','Samuel B. Roberts','Buques'],['losangeles','USS Los Angeles','Buques'],
 ['a6e','A-6E Intruder','Aeronaves'],['f14a','F-14A Tomcat','Aeronaves'],['fa18a','F/A-18A Hornet','Aeronaves'],['ea6b','EA-6B Prowler','Aeronaves'],['e2c','E-2C Hawkeye','Aeronaves'],['s3a','S-3A Viking','Aeronaves'],['sh2f','SH-2F Seasprite','Aeronaves'],['sh3h','SH-3H Sea King','Aeronaves'],['hh3e','HH-3E SAR','Aeronaves'],['ah1t','AH-1T Cobra','Aeronaves']
];
const CAMPAIGN_DEFAULTS={nimitz:1,missouri:1,virginia:1,kidd:1,samuel:1,losangeles:1,
 a6e:14,f14a:8,fa18a:12,ea6b:2,e2c:2,s3a:4,sh2f:4,sh3h:1,hh3e:6,ah1t:2};
function campaignInit(){
 if(!state.campaign||typeof state.campaign!=='object')state.campaign={};
 const c=state.campaign;
 c.roster=c.roster&&typeof c.roster==='object'?c.roster:{};
 c.stock=c.stock&&typeof c.stock==='object'?c.stock:{};
 c.use=c.use&&typeof c.use==='object'?c.use:{};
 c.threats=Array.isArray(c.threats)?c.threats.filter(x=>x&&typeof x.id==='string').slice(0,18):[];
 for(const [id] of CAMPAIGN_UNITS){
  const old=c.roster[id];
  if(!old){
   const def=CAMPAIGN_DEFAULTS[id]||0;
   const previous=Number(state.planner?.inventory?.[id]);
   const ready=Number.isFinite(previous)?Math.max(0,Math.floor(previous)):def;
   c.roster[id]={assigned:Math.max(def,ready),ready:Math.min(Math.max(def,ready),ready)};
  }else{
   old.assigned=Math.max(0,Math.min(999,Math.floor(Number(old.assigned)||0)));
   old.ready=Math.max(0,Math.min(old.assigned,Math.floor(Number(old.ready)||0)));
  }
 }
 // El inventario anterior del asistente sigue funcionando, pero se alimenta de esta única fuente.
 if(!state.planner||typeof state.planner!=='object')state.planner={};
 state.planner.inventory={...(state.planner.inventory||{}),...Object.fromEntries(CAMPAIGN_UNITS.map(([id])=>[id,c.roster[id].ready]))};
 return c;
}
function campaignUnit(id){return campaignInit().roster[id]||{assigned:0,ready:0}}
function campaignMods(){return state?.planner?.mods||{}}
function campaignPlatformWeapons(id){
 const p=CAMPAIGN_UNITS.find(x=>x[0]===id);if(!p){const e=entry(id);return catalogGetUnit(e||{id})?.weapons||[];}
 if(p[2]==='Buques')return armoryData?.platforms?.[id]?.weapons||[];
 const asMod=id==='sh2f'&&campaignMods().sh2||id==='sh3h'&&campaignMods().sh3;
 const unit=asMod?modData?.mods?.[id]:gameData?.aircraft?.find(x=>x.id===id);
 const codes=unit?.loadouts||[];
 return [...new Set(codes.flatMap(l=>(l.items||[]).map(x=>x.id)))];
}
function campaignPlatformsForAmmo(id){
 const known=CAMPAIGN_UNITS.filter(([unit])=>campaignUnit(unit).assigned>0&&campaignPlatformWeapons(unit).includes(id)).map(x=>x[0]);
 const extra=(state.fleetIds||[]).filter(unit=>unit.startsWith('game-unit:')&&campaignPlatformWeapons(unit).includes(id));
 return [...known,...extra];
}
function campaignAmmoAuto(id){return campaignPlatformsForAmmo(id).length>0}
function campaignAmmoUsed(id){
 const v=campaignInit().use[id];
 return v==='on'?true:v==='off'?false:campaignAmmoAuto(id);
}
function campaignAmmoCount(id){
 const val=campaignInit().stock[id];
 return typeof val==='number'&&Number.isFinite(val)&&val>=0?Math.floor(val):null;
}
function campaignStockStatus(id){
 const n=campaignAmmoCount(id);
 return n===null?'unknown':n===0?'empty':'stock';
}
function campaignUpdateUnit(id,field,value){
 if(!CAMPAIGN_UNITS.some(x=>x[0]===id)||!['assigned','ready'].includes(field))return;
 const c=campaignInit(),u=c.roster[id];
 const n=Math.max(0,Math.min(999,Math.floor(Number(value)||0)));
 if(field==='assigned'){u.assigned=n;u.ready=Math.min(u.ready,n)}
 if(field==='ready'){u.ready=Math.min(n,u.assigned)}
 state.planner.inventory[id]=u.ready;save();
}
function campaignUpdateStock(id,value){
 if(!id||typeof id!=='string'||id.length>120)return;
 const c=campaignInit();
 if(value===''||value===null){delete c.stock[id]}
 else{const n=Number(value);if(!Number.isFinite(n)||n<0)return;c.stock[id]=Math.min(1000000,Math.floor(n))}
 // Mantener compatibilidad con el asistente monomisión anterior sin mezclar Harpoon A/C y Penguin.
 const mapping={'usn_agm-84c':'harpoon','knm_penguin_mk2':'penguin','usn_aim-54a':'phoenix','usn_mk46_mod5_air':'torpedo'};
 if(mapping[id])state.planner.ammo={...(state.planner.ammo||{}),[mapping[id]]:campaignStockStatus(id)};
 save();
}
function campaignUpdateUsage(id,value){
 if(!id)return;
 const c=campaignInit();
 if(value==='auto')delete c.use[id];
 else if(value==='on'||value==='off')c.use[id]=value;
 save();
}
function campaignResetDraft(){
 if(!confirm('¿Restablecer el registro manual de flota y arsenal? Esto no borra las fichas, notas ni favoritos.'))return;
 delete state.campaign;
 campaignInit();
 save();
 if(page==='fleet')renderFleetCampaign();else if(page==='armory')renderArmory();
}
function renderFleetCampaign(){
 const c=campaignInit();
 const list=(group)=>CAMPAIGN_UNITS.filter(x=>x[2]===group).map(([id,name])=>{
  const u=c.roster[id],warnings=u.assigned>0&&u.ready===0?' · Sin unidades listas':'';
  const n=campaignPlatformWeapons(id).length;
  return '<div class="campaign-unit"><div class="campaign-unit-main"><strong>'+esc(name)+'</strong><small>'+esc(n)+' tipos de munición/equipo referenciados'+warnings+'</small></div><label>En flota<input type="number" min="0" max="999" inputmode="numeric" data-roster-total="'+esc(id)+'" value="'+u.assigned+'"></label><label>Listos<input type="number" min="0" max="'+u.assigned+'" inputmode="numeric" data-roster-ready="'+esc(id)+'" value="'+u.ready+'"></label></div>';
 }).join('');
 const sum=(group,field)=>CAMPAIGN_UNITS.filter(x=>x[2]===group).reduce((n,[id])=>n+c.roster[id][field],0);
 $('#page-content').innerHTML='<div class="campaign-page"><div class="eyebrow">ESTADO DE CAMPAÑA · REGISTRO MANUAL</div><h1>Mi Task Force</h1><p class="lead">Actualiza cuántas unidades forman parte del grupo y cuántas están listas. El copiloto empleará estas cantidades y nunca duplicará un mismo recurso al planificar varias respuestas.</p><div class="campaign-metrics"><div><small>AERONAVES EN FLOTA</small><strong>'+sum('Aeronaves','assigned')+'</strong><span>Listas: '+sum('Aeronaves','ready')+'</span></div><div><small>BUQUES EN FLOTA</small><strong>'+sum('Buques','assigned')+'</strong><span>Listos: '+sum('Buques','ready')+'</span></div><div><small>ARMAS CON STOCK ANOTADO</small><strong>'+Object.keys(c.stock).length+'</strong><span>Sin anotar ≠ ilimitado</span></div></div><p class="asset-notice">Datos iniciales basados en tu Task Force. Son un punto de partida: la web no lee la partida ni estima daños automáticamente. Si un barco queda averiado, marca 0 en «Listos» sin retirarlo de «En flota».</p><h2>Aeronaves</h2><div class="campaign-units">'+list('Aeronaves')+'</div><h2>Buques y submarino</h2><div class="campaign-units">'+list('Buques')+'</div>'+((state.fleetIds||[]).filter(id=>id.startsWith('game-unit:')).length?'<h2>Otras unidades activadas</h2><div class="campaign-units">'+(state.fleetIds||[]).filter(id=>id.startsWith('game-unit:')).map(id=>{const e=entry(id);return e?'<div class="campaign-unit"><div class="campaign-unit-main"><strong>'+esc(e.name)+'</strong><small>'+esc(e.gameId||'')+' · Activada manualmente; disponibilidad individual no registrada</small></div><button type="button" data-open="'+esc(id)+'" class="btn secondary">Ficha</button><button type="button" data-assign="'+esc(id)+'" class="btn warn">Quitar</button></div>':''}).join('')+'</div>':'')+'<div class="campaign-foot-actions"><button type="button" data-page="armory">Consultar armas y existencias →</button><button type="button" data-page="ops">Evaluar amenazas simultáneas →</button><button type="button" id="campaign-reset" class="campaign-reset">Restablecer registro</button></div></div>';
}
