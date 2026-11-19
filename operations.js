'use strict';
// Priorizador multiamenaza: propuesta local, NO ejecuta órdenes ni conoce el estado real del juego.
const OPS_THREATS=[
 {id:'missiles',title:'Misiles antibuque entrantes',icon:'⚠',base:110,kind:'Defensa inmediata',cause:'Impacto potencial inminente sobre la formación'},
 {id:'torpedo',title:'Torpedo detectado',icon:'≈',base:106,kind:'Defensa inmediata',cause:'Riesgo directo para un buque'},
 {id:'bombers',title:'Bombarderos acercándose',icon:'✈',base:88,kind:'Interceptación',cause:'Pueden lanzar misiles antes de llegar a la flota'},
 {id:'fighters',title:'Cazas enemigos',icon:'✦',base:80,kind:'Protección aérea',cause:'Pueden impedir la CAP y amenazar aeronaves de apoyo'},
 {id:'submarine',title:'Submarino localizado',icon:'◉',base:78,kind:'Antisubmarina',cause:'Puede atacar desde una posición difícil de observar'},
 {id:'surface',title:'Buques de guerra hostiles',icon:'↗',base:59,kind:'Ataque de superficie',cause:'Objetivo ofensivo que puede esperar si la flota está bajo ataque'},
 {id:'radar',title:'Radar o SAM enemigo',icon:'⌖',base:51,kind:'Supresión de defensa',cause:'Amenaza a las salidas de ataque'},
 {id:'unknown',title:'Contacto sin identificar',icon:'◎',base:45,kind:'Reconocimiento',cause:'No debe atacarse antes de clasificarlo'},
 {id:'rescue',title:'Pilotos o buque por rescatar',icon:'✚',base:42,kind:'Rescate',cause:'Debe valorarse la seguridad del área y los medios SAR'}
];
function opsRank(t){
 const v=OPS_THREATS.find(x=>x.id===t.id);
 if(!v)return -1;
 const urgency={immediate:23,soon:8,monitor:0}[t.urgency]||0;
 const distance={close:10,medium:4,far:0}[t.range]||0;
 return v.base+urgency+distance;
}
function computeOperations(threats,roster,stock,mods){
 const available=Object.fromEntries(Object.entries(roster||{}).map(([id,u])=>[id,Math.max(0,Math.floor(Number(u.ready)||0))]));
 const original={...available},ammoLeft={...stock},ammoPlanned={},reserve={},shared=new Set();
 const result=[],warnings=[];
 const distinct=[...new Map((threats||[]).filter(x=>OPS_THREATS.some(k=>k.id===x?.id)).map(x=>[x.id,x])).values()];
 const ordered=distinct.sort((a,b)=>opsRank(b)-opsRank(a));
 const give=(r,id,wanted,role)=>{
  const have=available[id]||0;
  const n=Math.min(have,wanted);
  if(n){available[id]-=n;reserve[id]=(reserve[id]||0)+n;r.assigned.push({id,qty:n,role})}
  if(n<wanted)r.gaps.push('Faltan '+(wanted-n)+' '+id+' para '+role);
  return n;
 };
 const share=(r,id,role)=>{if((original[id]||0)>0){shared.add(id);r.shared.push({id,role})}else r.gaps.push('No hay '+id+' disponible para '+role)};
 const takeAmmo=(r,id,qty)=>{
  const old=ammoLeft[id];
  if(old===undefined||old===null){r.notes.push('Existencias de '+id+' sin comprobar: consumo previsto '+qty+'.');ammoPlanned[id]=(ammoPlanned[id]||0)+qty;return true}
  if(old<qty){r.gaps.push('Munición insuficiente: '+id+' (quedan '+old+', necesarios '+qty+').');return false}
  ammoLeft[id]=old-qty;ammoPlanned[id]=(ammoPlanned[id]||0)+qty;return true;
 };
 for(const t of ordered){
  const x=OPS_THREATS.find(k=>k.id===t.id);
  const r={id:t.id,title:x.title,score:opsRank(t),reason:x.cause,assigned:[],shared:[],gaps:[],notes:[],steps:[],urgency:t.urgency||'soon',range:t.range||'medium'};
  switch(t.id){
  case 'missiles':
   r.steps=['Defensa prioritaria: identifica vectores, rumbos y buques amenazados.','Activa medios antimisil y contramedidas que el juego permita.','Después del ataque, revisa daños y municiones.'];
   give(r,'virginia',1,'pantalla SAM');give(r,'kidd',1,'segunda capa SAM');share(r,'e2c','vigilancia aérea compartida');break;
  case 'torpedo':
   r.steps=['Prioriza maniobras y contramedidas defensivas disponibles; no confíes en destruir el submarino a tiempo.','Mantén la búsqueda del origen y separa las pistas propias de las hostiles.','Tras reducir el peligro, investiga con recursos ASW.'];
   give(r,'sh2f',1,'investigación ASW posterior');break;
  case 'bombers':
   r.steps=['Vigila la trayectoria para anticipar un lanzamiento antibuque.','Intercepta con cazas sin vaciar la defensa del Nimitz.','Mantén una segunda capa naval por si ya han lanzado.'];
   if(!give(r,'f14a',Math.min(2,Math.max(1,original.f14a||0)),'interceptación exterior'))give(r,'fa18a',2,'interceptación de relevo');
   share(r,'e2c','alerta temprana compartida');break;
  case 'fighters':
   r.steps=['Identifica los contactos antes de atacar.','Protege al Hawkeye, la CAP y las oleadas propias.','Reevalúa combustible y armas de los cazas.'];
   if(!give(r,'fa18a',2,'CAP y escolta'))give(r,'f14a',1,'CAP de contingencia');
   share(r,'e2c','vigilancia compartida');break;
  case 'submarine':
   r.steps=['Confirma la pista con varias fuentes acústicas y comprueba la posición del SSN propio.','Organiza una barrera de sonoboyas; conserva helicópteros ASW disponibles.','Ataca solo con solución válida y torpedos realmente existentes.'];
   give(r,'s3a',1,'búsqueda exterior');
   if((available.sh2f||0)>0)give(r,'sh2f',1,'búsqueda próxima');
   else give(r,'sh3h',1,'búsqueda próxima');
   if((available.losangeles||0)>0)give(r,'losangeles',1,'caza en sector independiente');
   if(typeof stock?.usn_mk46_mod5_air==='number'&&stock.usn_mk46_mod5_air===0)r.notes.push('Mk-46 Mod 5 agotados: propone vigilancia, no lanzamiento de torpedos.');
   break;
  case 'surface':{
   r.steps=['Confirma identificación, defensa aérea y distancia antes de autorizar el ataque.','Protege al Nimitz: no retires escoltas y CAP reservados para amenazas inmediatas.','Solo lanza con Harpoon registrados; conserva reserva para una segunda oleada.'];
   let n=Math.min(2,available.a6e||0);
   const av=ammoLeft['usn_agm-84c'];
   if(typeof av==='number'){n=Math.min(n,Math.floor(av/2));if(!n)r.gaps.push('No hay AGM-84C suficientes para un A-6E con perfil AntiShip (2 misiles por avión).')}
   if(n){give(r,'a6e',n,'ataque antibuque (AntiShip)');takeAmmo(r,'usn_agm-84c',n*2)}
   if((available.fa18a||0)>0)give(r,'fa18a',Math.min(2,available.fa18a),'escolta del ataque');
   if((available.ea6b||0)>0)give(r,'ea6b',1,'apoyo EW');
   if(!n&&mods?.sh2&&(available.sh2f||0)>0){
    const peng=ammoLeft['knm_penguin_mk2'];
    if(peng===undefined||peng===null||peng>=2){give(r,'sh2f',1,'antibuque Penguin Mk 2 (mod)');takeAmmo(r,'knm_penguin_mk2',2);r.notes.push('Penguin de SH-2F es alternativa modded, no Harpoon; el helicóptero no aporta ASW en esta salida.')}
   }
   if(!n&&mods?.sh3&&(available.sh3h||0)>0){
    const har=ammoLeft['usn_agm-84a'];
    if(har===undefined||har===null||har>=4){give(r,'sh3h',1,'antibuque AGM-84A (mod ficticio)');takeAmmo(r,'usn_agm-84a',4);r.notes.push('El Sea King antibuque es un mod ficticio que consume cobertura ASW.')}
   }
   if(!r.assigned.some(a=>a.role.includes('antibuque')))r.gaps.push('Ningún vector antibuque asignable con la fuerza y existencias registradas.');
   share(r,'e2c','cuadro aéreo común');
   break;
  }
  case 'radar':
   r.steps=['Clasifica el emisor y determina si supone una amenaza SAM real.','Prepara supresión antes de comprometer aviones de ataque.','Comprueba el resultado; silenciar emisiones no equivale a destruir el radar.'];
   give(r,'a6e',Math.min(2,Math.max(1,available.a6e||0)),'SEAD de 1985 (verificar Shrike/Standard ARM)');
   if((available.ea6b||0)>0)give(r,'ea6b',1,'apoyo EW');
   break;
  case 'unknown':
   r.steps=['Mantén una pista y contrasta sensores y posibles unidades civiles o propias.','No dispares hasta clasificar el contacto.','Reevalúa prioridades si pasa a ser amenaza confirmada.'];
   share(r,'e2c','correlación radar');break;
  case 'rescue':
   r.steps=['Asegura la zona antes de desplegar medios SAR.','Mantén escolta y coordinación para recoger supervivientes.','No dejes al Nimitz sin cobertura por ejecutar el rescate.'];
   give(r,'hh3e',1,'búsqueda y rescate');break;
  }
  if(r.gaps.length)warnings.push(x.title+': '+r.gaps.join(' · '));
  result.push(r);
 }
 return {results:result,remaining:available,reserved:reserve,shared:[...shared],ammoPlanned,warnings,
  rationale:'Prioridad basada en peligro inmediato para el grupo, posibilidad de lanzamiento enemigo y urgencia/distancia indicada. Cada unidad lista se reserva como máximo para una tarea; el E-2C se considera apoyo de vigilancia compartido, no dos aparatos diferentes.'};
}
function renderOperations(){
 const c=campaignInit(),selected=new Map(c.threats.map(t=>[t.id,t]));
 const report=computeOperations(c.threats,c.roster,c.stock,campaignMods());
 const picker=OPS_THREATS.map(t=>'<button type="button" class="ops-threat '+(selected.has(t.id)?'selected':'')+'" aria-pressed="'+selected.has(t.id)+'" data-ops-toggle="'+t.id+'"><span class="ops-threat-icon" aria-hidden="true">'+t.icon+'</span><strong>'+esc(t.title)+'</strong><span class="ops-threat-toggle">'+(selected.has(t.id)?'✓ Seleccionada':'+ Añadir')+'</span></button>').join('');
 const options=(list,cur)=>list.map(([v,n])=>'<option value="'+v+'" '+(v===cur?'selected':'')+'>'+n+'</option>').join('');
 const editors=c.threats.map(t=>{
  const base=OPS_THREATS.find(x=>x.id===t.id);if(!base)return '';
  return '<div class="ops-active-row"><div><strong>'+esc(base.title)+'</strong><small>Contexto que cambia la prioridad</small></div><label>Urgencia<select data-ops-urgency="'+esc(t.id)+'">'+options([['immediate','Inmediata'],['soon','Próxima'],['monitor','Vigilar']],t.urgency||'soon')+'</select></label><label>Distancia<select data-ops-range="'+esc(t.id)+'">'+options([['close','Cerca'],['medium','Media'],['far','Lejos']],t.range||'medium')+'</select></label><button type="button" data-ops-toggle="'+esc(t.id)+'" aria-label="Quitar amenaza '+esc(base.title)+'">×</button></div>';
 }).join('');
 const unit=(u)=>'<span class="ops-assignment">'+u.qty+' × '+esc(CAMPAIGN_UNITS.find(x=>x[0]===u.id)?.[1]||u.id)+' · '+esc(u.role)+'</span>';
 const rows=report.results.map((r,i)=>'<article class="ops-response"><div class="ops-response-heading"><div class="ops-priority">'+(i+1)+'</div><div><span>Prioridad '+(i+1)+' · '+esc(r.urgency==='immediate'?'Inmediata':r.urgency==='soon'?'Próxima':'Vigilancia')+'</span><h3>'+esc(r.title)+'</h3></div></div><p class="ops-rationale">'+esc(r.reason)+'</p><ol class="ops-steps">'+r.steps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol><div class="ops-assigned"><strong>Medios reservados</strong><div>'+(r.assigned.map(unit).join('')||'<span>No se han podido reservar medios exclusivos.</span>')+'</div></div>'+(r.shared.length?'<p class="ops-shared">Apoyo común: '+r.shared.map(x=>esc(CAMPAIGN_UNITS.find(u=>u[0]===x.id)?.[1]||x.id)).join(', ')+'</p>':'')+(r.gaps.length?'<div class="ops-gap">'+r.gaps.map(esc).join(' · ')+'</div>':'')+(r.notes.length?'<div class="ops-note">'+r.notes.map(esc).join(' · ')+'</div>':'')+'</article>').join('');
 const ammo=Object.entries(report.ammoPlanned).map(([id,n])=>'<span>'+esc(armoryData?.items?.find(x=>x.id===id)?.name||id)+' × '+n+(campaignAmmoCount(id)===null?' · stock sin comprobar':'')+'</span>').join('');
 const reserved=Object.entries(report.reserved).map(([id,n])=>'<span>'+n+' × '+esc(CAMPAIGN_UNITS.find(u=>u[0]===id)?.[1]||id)+'</span>').join('');
 $('#page-content').innerHTML='<div class="ops-page"><div class="eyebrow">COPILOTO TÁCTICO · 1985</div><h1>¿Qué está ocurriendo a la vez?</h1><p class="lead">Selecciona todas las amenazas presentes. Atlas las ordena por urgencia y reserva medios de tu flota para evitar asignar los mismos aparatos a dos tareas independientes.</p><div class="ops-headstats"><div><strong>'+c.threats.length+'</strong><span>Amenazas seleccionadas</span></div><div><strong>'+report.results.filter(x=>x.gaps.length).length+'</strong><span>Respuestas con carencias</span></div></div><h2>1 · Añade amenazas</h2><div class="ops-threat-grid">'+picker+'</div>'+(editors?'<section class="ops-selected"><h2>2 · Ajusta su urgencia</h2><div>'+editors+'</div></section>':'')+(rows?'<section class="ops-results"><h2>3 · Orden de respuesta recomendado</h2><p class="ops-explanation">'+esc(report.rationale)+'</p><div class="ops-responses">'+rows+'</div><div class="ops-overview"><h3>Reservas propuestas para esta evaluación</h3><div class="ops-chip-list">'+(reserved||'Sin unidades reservadas')+'</div>'+(ammo?'<h3>Consumo de munición estimado</h3><div class="ops-chip-list">'+ammo+'</div>':'')+'<p>Las reservas y los consumos son simulados. NO descuentan existencias ni emiten órdenes en el juego.</p></div></section>':'<div class="ops-empty"><strong>Empieza por añadir una amenaza.</strong><p>Puedes seleccionar varias simultáneamente: por ejemplo, bombarderos, submarino y misiles entrantes. El orden y los recursos cambiarán en consecuencia.</p></div>')+'<div class="ops-navigation"><button data-page="fleet">Actualizar unidades listas →</button><button data-page="armory">Actualizar munición →</button><button data-page="planner">Plan de misión individual →</button></div><p class="plan-disclaimer">Evaluación orientativa basada en reglas explícitas. No se conoce en tiempo real posición, alcance, tiempos de interceptación, visibilidad ni munición embarcada. Confirma las acciones dentro del juego.</p></div>';
}
function toggleOperation(id){
 if(!OPS_THREATS.some(t=>t.id===id))return;
 const c=campaignInit();const idx=c.threats.findIndex(x=>x.id===id);
 if(idx>=0)c.threats.splice(idx,1);else c.threats.push({id,urgency:'soon',range:'medium'});
 save();renderOperations();
}
function updateOperation(id,field,value){
 const c=campaignInit(),x=c.threats.find(t=>t.id===id);if(!x)return;
 if(field==='urgency'&&['immediate','soon','monitor'].includes(value))x.urgency=value;
 else if(field==='range'&&['close','medium','far'].includes(value))x.range=value;
 else return;
 save();renderOperations();
}
