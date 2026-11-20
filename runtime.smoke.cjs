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
 click('armory');visible('arsenal',/Mi arsenal/);
 assert.match(element('#page-content').innerHTML,/data-armory-stock/);
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
 vm.runInContext('restoreRoute()',context);
 visible('URL directa al arsenal',/Mi arsenal/);
 // Comprobar catálogo completo, distancias de lanzamiento y filtro por Task Force.
 const numbers=vm.runInContext('({u:catalogSource.units.length,w:catalogSource.weapons.length,min:catalogWeaponMap.get("usn_agm-84c").min,max:catalogWeaponMap.get("usn_agm-84c").max,f14:catalogWeaponMap.get("usn_aim-54a").max,cruise:catalogUnitMap.get("usn_a-6e").maxNm,heli:catalogUnitMap.get("usn_sh-2f").maxNm})',context);
 assert.equal(numbers.u,636);assert.equal(numbers.w,471);
 assert.equal(numbers.min,3.5);assert.equal(numbers.max,65);assert.equal(numbers.f14,110);
 assert.equal(numbers.cruise,2138);assert.equal(numbers.heli,229);
 console.log('OK: 636 unidades, 471 armas, autonomías y alcance mínimo/máximo');
 click('library');visible('fichas completas',/Unidades y armamento/);
 assert.match(element('#page-content').innerHTML,/data-catalog-scope="fleet"/);
 const scopeButton={dataset:{catalogScope:'fleet'},id:'',closest(){return this}};
 for(const cb of handlers.click||[])cb({target:scopeButton});
 const fleetHTML=element('#page-content').innerHTML;
 assert.match(fleetHTML,/Mi flota/);
 assert.match(fleetHTML,/A-6E/);
 assert.doesNotMatch(fleetHTML,/ARA A-4P/);
 console.log('OK: filtro rápido de flota activa');
 vm.runInContext('openDetail("game-ammo:usn_agm-84c",{skipHistory:true})',context);
 assert.match(element('#detail-panel').innerHTML,/65 mn/);
 assert.match(element('#detail-panel').innerHTML,/3,5 mn/);
 vm.runInContext('openDetail("a6e",{skipHistory:true})',context);
 assert.match(element('#detail-panel').innerHTML,/2.138 mn/);
 console.log('OK: ficha del Harpoon y autonomía de A-6E');
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const script of scripts)assert.ok(html.includes('src="'+script+'?v=3.2.0"'),'Falta script actualizado '+script);
 console.log('OK: scripts versionados para evitar archivos antiguos en Android');
}
main().catch(e=>{console.error(e);process.exitCode=1});
