'use strict';
// Prueba de integración sin servicios de pago: carga la SPA real, simula navegación
// y detecta excepciones que node --check y las pruebas del motor no cubren.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname);
const handlers={};
const elements={};
function element(id){
 if(!elements[id])elements[id]={
  innerHTML:'',textContent:'',hidden:id==='#modal-scrim',value:'',dataset:{},style:{},
  classList:{add(){},remove(){},contains(){return false},toggle(){}},
  setAttribute(){},addEventListener(){},focus(){},scrollIntoView(){},
  setSelectionRange(){},scrollTop:0
 };
 return elements[id];
}
const doc={
 body:{style:{}},activeElement:null,
 querySelector:element,querySelectorAll:()=>[],
 addEventListener(type,cb){(handlers[type]??=[]).push(cb)}
};
const location={hash:'#/ops',protocol:'https:'};
const history={
 state:null,
 replaceState(s,title,url){this.state=s;location.hash=url},
 pushState(s,title,url){this.state=s;location.hash=url},
 back(){}
};
const storage=new Map();
const context=vm.createContext({
 document:doc,window:{addEventListener(){},scrollTo(){}},navigator:{onLine:true},
 location,history,
 localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},
 requestAnimationFrame:fn=>fn(),setTimeout,clearTimeout,
 confirm:()=>true,console,
 fetch:async url=>{
  const name=url.replace(/^\.\//,'');
  const locationOnDisk=path.join(root,name);
  return {ok:fs.existsSync(locationOnDisk),status:fs.existsSync(locationOnDisk)?200:404,
    json:async()=>JSON.parse(fs.readFileSync(locationOnDisk,'utf8'))};
 }
});
const scripts=['source.js','mod_source.js','planner.js','campaign.js','armory.js','operations.js','workshop.js','tactics.js','catalog.js','app.js'];
for(const script of scripts)vm.runInContext(fs.readFileSync(path.join(root,script),'utf8'),context,{filename:script});
const tick=()=>new Promise(res=>setImmediate(res));
function click(page){
 const btn={dataset:{page},id:'',closest(){return this}};
 for(const handler of handlers.click||[])handler({target:btn});
}
function visible(name,pattern){
 const content=element('#page-content').innerHTML;
 assert.match(content,pattern,'No se renderiza '+name);
 assert.doesNotMatch(content,/No se pudo cargar el catálogo|no se ha podido abrir|Error de la interfaz/i,'Error visible en '+name);
 console.log('OK: vista '+name+' ('+content.length+' caracteres)');
}
async function main(){
 for(let i=0;i<5;i++)await tick();
 visible('copiloto inicial',/¿Qué está ocurriendo a la vez\?/);
 click('armory');visible('entrada antigua de Arsenal',/Unidades y armamento/);
 assert.equal(location.hash,'#/library');
 assert.match(element('#page-content').innerHTML,/data-catalog-stock/);
 click('fleet');visible('flota',/Mi Task Force/);
 assert.match(element('#page-content').innerHTML,/data-roster-ready/);
 click('planner');visible('plan individual',/Qué necesitas conseguir/);
 click('ops');visible('volver al copiloto',/¿Qué está ocurriendo a la vez\?/);
 const toggler=(id)=>{const b={dataset:{opsToggle:id},id:'',closest(){return this}};for(const h of handlers.click||[])h({target:b})};
 toggler('missiles');toggler('submarine');
 const result=element('#page-content').innerHTML;
 assert.match(result,/Misiles antibuque entrantes/);
 assert.match(result,/Submarino localizado/);
 assert.match(result,/Orden de respuesta recomendado/);
 console.log('OK: dos amenazas simultáneas, orden y reparto');
 const stats=vm.runInContext('({assigned:Object.values(campaignInit().roster).reduce((n,r)=>n+r.assigned,0),original:armoryData.originalCount,results:computeOperations(campaignInit().threats,campaignInit().roster,campaignInit().stock,campaignMods()).results.length})',context);
 assert.equal(stats.original,471);
 assert.equal(stats.results,2);
 assert.equal(stats.assigned,61);
 console.log('OK: catálogo de 471 definiciones, flota 55+6');
 location.hash='#/armory';
 vm.runInContext('initializeRoute()',context);
 visible('redirección URL antigua de Arsenal',/Unidades y armamento/);
 assert.equal(location.hash,'#/library');
 // Comprobar catálogo completo, distancias de lanzamiento y filtro por Task Force.
 const numbers=vm.runInContext('({u:catalogSource.units.length,w:catalogSource.weapons.length,min:catalogWeaponMap.get("usn_agm-84c").min,max:catalogWeaponMap.get("usn_agm-84c").max,f14:catalogWeaponMap.get("usn_aim-54a").max,cruise:catalogUnitMap.get("usn_a-6e").maxNm,heli:catalogUnitMap.get("usn_sh-2f").maxNm})',context);
 assert.equal(numbers.u,636);assert.equal(numbers.w,471);
 assert.equal(numbers.min,3.5);assert.equal(numbers.max,65);assert.equal(numbers.f14,110);
 assert.equal(numbers.cruise,2138);assert.equal(numbers.heli,229);
 console.log('OK: 636 unidades, 471 armas, autonomías y alcance mínimo/máximo');
 click('library');visible('fichas completas',/Unidades y armamento/);
 assert.match(element('#page-content').innerHTML,/data-catalog-scope="fleet"/);
 assert.match(element('#page-content').innerHTML,/data-catalog-scope="stock"/);
 const scopeButton={dataset:{catalogScope:'fleet'},id:'',closest(){return this}};
 for(const cb of handlers.click||[])cb({target:scopeButton});
 const fleetHTML=element('#page-content').innerHTML;
 assert.match(fleetHTML,/Mi flota/);
 assert.match(fleetHTML,/A-6E/);
 assert.doesNotMatch(fleetHTML,/ARA A-4P/);
 // Los números deben limitarse a la selección actual, no al total del juego.
 assert.match(fleetHTML,/Todas \(73\)/,'todas las fichas de mi flota');
 assert.match(fleetHTML,/Aeronaves \(10\)/,'solo las diez aeronaves de mi flota');
 assert.match(fleetHTML,/Buques \(6\)/,'solo los seis buques de mi flota');
 assert.doesNotMatch(fleetHTML,/Unidades en esta selección<\/span>.*636/);
 assert.doesNotMatch(fleetHTML,/Aeronaves \(144\)/);
 assert.match(fleetHTML,/<strong>16<\/strong><span>Unidades en esta selección<\/span>/);
 const aircraftButton={dataset:{filter:'aircraft'},id:'',closest(){return this}};
 for(const cb of handlers.click||[])cb({target:aircraftButton});
 const filteredAircraft=element('#page-content').innerHTML;
 assert.match(filteredAircraft,/<strong>10<\/strong><span>Unidades en esta selección<\/span>/);
 assert.match(filteredAircraft,/<strong>0<\/strong><span>Armas y sensores en esta selección<\/span>/);
 assert.match(filteredAircraft,/10 resultados de mi flota/);
 const weaponButton={dataset:{filter:'weapon'},id:'',closest(){return this}};
 for(const cb of handlers.click||[])cb({target:weaponButton});
 const filteredWeapons=element('#page-content').innerHTML;
 assert.match(filteredWeapons,/<strong>0<\/strong><span>Unidades en esta selección<\/span>/);
 assert.doesNotMatch(filteredWeapons,/Armas y sensores en esta selección<\/span>.*471/);
 console.log('OK: contadores por flota, categorías y tipo activos');
 console.log('OK: filtro rápido de flota activa');
 vm.runInContext('openDetail("game-ammo:usn_agm-84c",{skipHistory:true})',context);
 assert.match(element('#detail-panel').innerHTML,/65 mn/);
 assert.match(element('#detail-panel').innerHTML,/3,5 mn/);
 vm.runInContext('openDetail("a6e",{skipHistory:true})',context);
 assert.match(element('#detail-panel').innerHTML,/(?:2\\.138|2138) mn/);
 // Navegación directa desde unidad a arma y de regreso a plataformas que la referencian.
 assert.match(element('#detail-panel').innerHTML,/data-open="game-ammo:usn_agm-84c"/);
 const inline=vm.runInContext("catalogInlineText('Un A-6E escoltado por F-14A y armado con AGM-84C.','test')",context);
 assert.match(inline,/data-open="a6e"/);
 assert.match(inline,/data-open="f14a"/);
 assert.match(inline,/data-open="game-ammo:usn_agm-84c"/);
 vm.runInContext('openDetail("game-ammo:usn_agm-84c",{skipHistory:true})',context);
 assert.match(element('#detail-panel').innerHTML,/Unidades relacionadas/);
 assert.match(element('#detail-panel').innerHTML,/data-open="a6e"/);
 vm.runInContext('openDetail("a6e",{skipHistory:true})',context);
 const jump={dataset:{open:'game-ammo:usn_agm-84c'},id:'',closest(){return this}};
 for(const cb of handlers.click||[])cb({target:jump});
 assert.match(element('#detail-panel').innerHTML,/Envolvente de ataque/);
 assert.match(location.hash,/game-ammo%3Ausn_agm-84c/);
 vm.runInContext('openDetail("sh2f",{skipHistory:true})',context);
 assert.match(element('#detail-panel').innerHTML,/class="game-ammo-open" data-open="game-ammo:/);
 console.log('OK: enlaces bidireccionales, texto, loadouts y navegación directa entre fichas');
 console.log('OK: ficha del Harpoon y autonomía de A-6E');
 // Uso y stock se actualizan desde la ficha sin abrir una segunda herramienta.
 const change=(dataset,value)=>{
  const input={dataset,value,id:'',checked:false};
  for(const cb of handlers.change||[])cb({target:input});
 };
 vm.runInContext('openDetail("game-ammo:usn_agm-84c",{skipHistory:true})',context);
 assert.match(element('#detail-panel').innerHTML,/Disponibilidad en mi campaña/);
 change({catalogStock:'usn_agm-84c'},'8');
 assert.equal(vm.runInContext('campaignAmmoCount("usn_agm-84c")',context),8);
 assert.match(element('#detail-panel').innerHTML,/value="8"/);
 change({catalogUse:'usn_agm-84c'},'off');
 assert.equal(vm.runInContext('campaignAmmoUsed("usn_agm-84c")',context),false);
 assert.match(element('#detail-panel').innerHTML,/No se considera en uso/);
 change({catalogUse:'usn_agm-84c'},'on');
 assert.equal(vm.runInContext('campaignAmmoUsed("usn_agm-84c")',context),true);
 const stockScope={dataset:{catalogScope:'stock'},id:'',closest(){return this}};
 for(const cb of handlers.click||[])cb({target:stockScope});
 assert.match(element('#page-content').innerHTML,/En stock/);
 assert.match(element('#page-content').innerHTML,/AGM-84C/);
 assert.doesNotMatch(element('#page-content').innerHTML,/No se pudo cargar el catálogo/);
 console.log('OK: existencias, uso y filtro de stock integrados con catálogo');
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 // El menú debe ofrecer una sola entrada, sin dos secciones similares.
 assert.doesNotMatch(html,/class="mnav" data-page="armory"/);
 assert.match(html,/class="mnav" data-page="library"/);
 assert.doesNotMatch(html,/class="nav-btn" data-page="armory"/);
 
 for(const script of scripts)assert.ok(html.includes('src="'+script+'?v=3.3.0"'),'Falta script actualizado '+script);
 console.log('OK: scripts versionados para evitar archivos antiguos en Android');
}
main().catch(e=>{console.error(e);process.exitCode=1});
