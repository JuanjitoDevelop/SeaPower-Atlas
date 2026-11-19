'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={};
const sourceData=JSON.parse(fs.readFileSync('source_1985.json','utf8'));
context.gameData=sourceData;
context.esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
context.entry=id=>({id,name:id});
vm.runInNewContext(fs.readFileSync('source.js','utf8')+'\nthis.sourceFns={gameUnit,gameAmmoName,gameItemsMarkup,gamePlanProfile,gamePlanLoadoutMarkup}',context);
vm.runInNewContext(fs.readFileSync('planner.js','utf8')+'\nthis.engine={computePlan,PLAN_DEFAULT,PLAN_MISSIONS,renderPlanner}',context);
const {computePlan,PLAN_DEFAULT,PLAN_MISSIONS}=context.engine;
let count=0;
function check(name,partial,verify){
 const p={...PLAN_DEFAULT,...partial,mods:{...PLAN_DEFAULT.mods,...(partial.mods||{})},inventory:{...PLAN_DEFAULT.inventory,...(partial.inventory||{})},ammo:{...PLAN_DEFAULT.ammo,...(partial.ammo||{})}};
 const result=computePlan(p);
 assert.equal(Boolean(verify(result)),true,name+' | '+JSON.stringify(result).slice(0,450));
 console.log('OK',name);count++;
}
const airIds=['a6e','fa18a','f14a','ea6b','e2c','s3a','sh2f','sh3h','hh3e','ah1t'];
assert.equal(airIds.reduce((n,id)=>n+PLAN_DEFAULT.inventory[id],0),55,'inventario de 55 aeronaves');
assert.equal(PLAN_MISSIONS.length,6);
check('No atacar contacto sin identificar',{mission:'surface',identified:'uncertain'},x=>x.primary.every(u=>u.id!=='a6e')&&x.headline.includes('identifica'));
check('Ataque Harpoon identificado',{mission:'surface',identified:'confirmed',ammo:{harpoon:'stock'}},x=>x.primary.some(u=>u.id==='a6e'));
check('Harpoon agotados bloquea Intruder',{mission:'surface',identified:'confirmed',ammo:{harpoon:'empty'}},x=>!x.primary.some(u=>u.id==='a6e'));
check('A6E no disponibles cambia alternativa',{mission:'surface',identified:'confirmed',inventory:{a6e:0}},x=>!x.primary.some(u=>u.id==='a6e'));
check('SH-3H mod activo cambia resultado',{mission:'surface',identified:'confirmed',range:'near',aswRisk:false,inventory:{a6e:0},mods:{sh3:true},ammo:{harpoon:'stock'}},x=>x.primary.some(u=>u.id==='sh3h'));
check('SH-3H no se usa si ASW necesario',{mission:'surface',identified:'confirmed',range:'near',aswRisk:true,inventory:{a6e:0},mods:{sh3:true},ammo:{harpoon:'stock'}},x=>!x.primary.some(u=>u.id==='sh3h'));
check('SH-3H no se recomienda lejos',{mission:'surface',identified:'confirmed',range:'far',aswRisk:false,inventory:{a6e:0},mods:{sh3:true},ammo:{harpoon:'stock'}},x=>!x.primary.some(u=>u.id==='sh3h'));
check('Hornet suplanta F14 si éste no está',{mission:'air',scenario:'bombers',identified:'confirmed',inventory:{f14a:0}},x=>x.primary.some(u=>u.id==='fa18a'));
check('Sin cazas no afirma disponer de CAP',{mission:'air',scenario:'bombers',identified:'confirmed',inventory:{f14a:0,fa18a:0}},x=>x.primary.length===0&&x.status==='sin cazas');
check('Phoenix agotados produce advertencia',{mission:'air',scenario:'bombers',identified:'confirmed',ammo:{phoenix:'empty'}},x=>x.warnings.some(w=>w.includes('cero Phoenix')));
check('Defensa sin escoltas principales se advierte',{mission:'defend',inventory:{virginia:0,kidd:0}},x=>x.status==='defensa comprometida');
check('Torpedos agotados bloquea suposición de munición',{mission:'sub',ammo:{torpedo:'empty'}},x=>x.warnings.some(w=>w.includes('agotados')));
check('Identificación radar no propone ataque',{mission:'identify',scenario:'esm'},x=>x.primary.every(u=>u.id!=='a6e'));
check('Ataque costero con SAM incluye SEAD',{mission:'land',scenario:'sam',identified:'confirmed'},x=>x.primary.some(u=>u.id==='a6e'&&u.profile.includes('SEAD')));
// Datos de los INI originales, resueltos en 1985.
const catalog=JSON.parse(fs.readFileSync('data.json','utf8'));
assert.equal(sourceData.aircraft.length,10);
assert.equal(sourceData.aircraft.reduce((n,x)=>n+x.loadouts.length,0),52);
const s3a=sourceData.aircraft.find(x=>x.id==='s3a');
assert.equal(s3a.loadouts.length,7,'Los originales definen siete perfiles del S-3A');
const preset=s3a.loadouts.find(x=>x.code==='ASW');
assert.ok(preset);
assert.equal(preset.ready,30);
assert.deepEqual(preset.items.filter(x=>x.type==='Sonobuoy').map(x=>[x.id,x.qty]),
 [['usn_ssq-53',42],['usn_ssq-62',12],['usn_ssq-77',8]]);
assert.deepEqual(preset.items.filter(x=>x.type==='Torpedo').map(x=>[x.id,x.qty]),[['usn_mk46_mod5_air',4]]);
const s3Attack=s3a.loadouts.find(x=>x.code==='AntiShip');
assert.ok(!s3Attack.items.some(x=>x.id.includes('agm-84')),'S-3A antibuque sin Harpoon en original');
assert.equal(s3Attack.items.find(x=>x.id==='usn_lau-10a').qty,4);
assert.equal(sourceData.ammo['usn_lau-10a'].attachments,'4');
const a6=sourceData.aircraft.find(x=>x.id==='a6e');
for(const [code,quantity] of [['AntiShip',2],['AntiShipLongRange',1],['AntiShipHeavy',4]]){
 assert.equal(a6.loadouts.find(x=>x.code===code).items.find(x=>x.id==='usn_agm-84c').qty,quantity,code);
}
const prowler=sourceData.aircraft.find(x=>x.id==='ea6b');
assert.ok(!prowler.loadouts.some(x=>x.code==='SEADAdvanced'),'No SEADAdvanced en el Prowler para 1985');
const allLoaded=catalog.entries.find(x=>x.id==='s3a');
assert.equal(allLoaded.loadouts.length,7,'Ficha actualizada');
check('S-3A ASW respaldado por datos',{mission:'sub',ammo:{torpedo:'stock'}},x=>x.primary.some(u=>u.id==='s3a'&&u.profile==='ASW'));
check('Sin torpedos usa SH-2F cazador',{mission:'sub',ammo:{torpedo:'empty'}},x=>x.primary.some(u=>u.id==='sh2f'&&u.profile==='ASWHunter')&&!x.primary.some(u=>u.id==='s3a'));
const visible=context.sourceFns.gamePlanLoadoutMarkup('a6e','AntiShip');
assert.match(visible,/AGM-84C Harpoon/);
assert.match(visible,/×2/);
console.log('OK: 52 perfiles verificados, S-3A y tres cargas Harpoon 1985');

// Renderizado mínimo sin navegador: detecta fallos de la interfaz antes de publicar.
const root={innerHTML:''};
context.state={planner:{...PLAN_DEFAULT,identified:'confirmed'}};
context.$=()=>root;
context.esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
context.entry=id=>({id,name:id});
context.engine.renderPlanner();
assert.match(root.innerHTML,/Qué necesitas conseguir/);
assert.match(root.innerHTML,/data-plan-mission=/);
assert.match(root.innerHTML,/data-plan-inv=/);
assert.match(root.innerHTML,/data-plan-mod=/);
assert.match(root.innerHTML,/Fuerza principal/);
const html=fs.readFileSync('index.html','utf8');
assert.ok(html.indexOf('src="planner.js"')<html.indexOf('src="app.js"'),'script del motor antes del controlador');
console.log('OK: renderizado y orden de scripts del asistente');
console.log('Pruebas del planificador correctas:',count);
