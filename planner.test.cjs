'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const context={};
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
// Validación de datos tomados de la captura del S-3A.
const catalog=JSON.parse(fs.readFileSync('data.json','utf8'));
const s3a=catalog.entries.find(x=>x.id==='s3a');
assert.ok(s3a,'Ficha del S-3A');
const preset=s3a.loadouts.find(x=>x.name==='ASW (18)');
assert.equal(preset.verified,'screenshot','ASW (18) verificado');
assert.deepEqual(Array.from(preset.items,x=>[x.id,x.qty]),[
 ['mk46mod5',4],['ssq53',42],['ssq62',12],['ssq77',8]
],'Carga exacta del S-3A en la captura');
assert.equal(preset.prepMinutes,30);
assert.equal(preset.items.filter(x=>x.id!=='mk46mod5').reduce((n,x)=>n+x.qty,0),62);
assert.equal(s3a.loadouts.length,6,'Seis opciones visibles del S-3A');
for(const other of s3a.loadouts.filter(x=>x.id!==preset.id)){
 assert.equal(other.verified,'name-only',other.name+' no tiene inventario confirmado');
 assert.equal(other.items.length,0,other.name+' sin cargas inventadas');
}
for(const row of preset.items){
 assert.ok(catalog.entries.some(x=>x.id===row.id),'Componente enlazado '+row.id);
}
assert.equal(catalog.entries.find(x=>x.id==='ssq53').category,'sensor');
check('S-3A propone carga ASW comprobada',{mission:'sub',ammo:{torpedo:'stock'}},x=>x.primary.some(u=>u.id==='s3a'&&u.profile==='ASW (18)'));
check('S-3A evita carga con torpedos agotados',{mission:'sub',ammo:{torpedo:'empty'}},x=>x.primary.some(u=>u.id==='s3a'&&!u.profile.includes('(18)')));
console.log('OK: S-3A, seis perfiles y cuatro componentes verificados');

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
