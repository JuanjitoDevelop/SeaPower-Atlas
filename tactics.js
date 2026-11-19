'use strict';

function renderTactics(){
  const root=$('#page-content');
  if(!tactics?.scenarios?.length){root.innerHTML='<p class="guide-error">No se ha podido cargar la guía de situaciones.</p>';return}
  const guideCategories=[
    {id:'ofensiva',icon:'↗',label:'Atacar',hint:'Buques, costa y radares'},
    {id:'defensiva',icon:'◇',label:'Defenderme',hint:'Misiles y escolta'},
    {id:'contacto',icon:'◎',label:'Identificar',hint:'Contactos y emisiones'},
    {id:'interceptacion',icon:'✈',label:'Interceptar',hint:'Aeronaves hostiles'},
    {id:'antisubmarina',icon:'≈',label:'Submarinos',hint:'Sonar y torpedos'},
    {id:'mantenimiento',icon:'▤',label:'Entre misiones',hint:'Rearme y pérdidas'}
  ];
  const route=parseRoute();
  const selected=route.mode==='mission'?tactics.scenarios.find(s=>s.id===route.id):null;
  const getCategory=id=>guideCategories.find(g=>g.id===id)?.label||id;
  if(selected){
    const checklist=arr=>`<ul class="guide-points">${(arr||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`;
    const firstSteps=(selected.steps||[]).slice(0,2);
    const extraSteps=(selected.steps||[]).slice(2);
    const unitCards=(selected.units||[]).map(([id,profile,purpose])=>{
      const x=entry(id);
      return `<article class="guide-unit"><div class="guide-unit-top"><button type="button" class="guide-unit-title" data-open="${esc(id)}">${esc(x?.name||id)} <span aria-hidden="true">↗</span></button><span class="guide-unit-purpose">${esc(purpose||'')}</span></div><div class="guide-profile"><span>Configuración</span><strong>${esc(profile||'Según misión')}</strong></div></article>`;
    }).join('');
    const weapons=(selected.weapons||[]).map(id=>{
      const x=entry(id);
      return x?`<button type="button" class="guide-weapon" data-open="${esc(id)}">${esc(x.name)} <span aria-hidden="true">↗</span></button>`:'';
    }).join('');
    root.innerHTML=`<div class="guide-detail">
      <div class="guide-back-row"><button type="button" class="guide-back" id="tactic-back">← Volver a situaciones</button><span>CAMPAÑA 1985</span></div>
      <header class="guide-detail-head"><div class="guide-kicker">${esc(getCategory(selected.category))} · ${esc(selected.priority||'Situación')}</div><h1 id="tactic-title" tabindex="-1">${esc(selected.title)}</h1><p>${esc(selected.situation)}</p></header>
      <section class="guide-target" aria-label="Objetivo de la situación"><span>OBJETIVO</span><p>${esc(selected.goal)}</p></section>
      <section class="guide-block"><h2>1. Qué hacer primero</h2><ol class="guide-first-steps">${firstSteps.map((t,i)=>`<li><span class="guide-number" aria-hidden="true">${i+1}</span><span>${esc(t)}</span></li>`).join('')}</ol></section>
      <section class="guide-block"><h2>2. Qué preparar</h2><p class="guide-helper">Pulsa una unidad para ver su ficha completa.</p><div class="guide-unit-list">${unitCards}</div></section>
      <section class="guide-block"><h2>3. Antes de actuar</h2>${checklist((selected.check||[]).slice(0,2))}
        ${selected.check?.length>2?`<details class="guide-disclosure"><summary>Ver más comprobaciones</summary>${checklist(selected.check.slice(2))}</details>`:''}
      </section>
      ${extraSteps.length?`<details class="guide-disclosure guide-more-plan"><summary>Continuar con el resto del procedimiento (${extraSteps.length})</summary><ol class="guide-extra-steps" start="3">${extraSteps.map(t=>`<li>${esc(t)}</li>`).join('')}</ol></details>`:''}
      ${weapons?`<section class="guide-block"><h2>Armas relacionadas</h2><div class="guide-weapon-list">${weapons}</div></section>`:''}
      <details class="guide-disclosure guide-warning"><summary>Precauciones y errores habituales</summary>${checklist(selected.risks||[])}</details>
      <p class="guide-footnote">Referencia orientativa para Sea Power en 1985. Comprueba el armamento y los perfiles disponibles en tu juego y tus mods.</p>
      <button type="button" class="guide-end-back" id="tactic-back-bottom">← Consultar otra situación</button>
      </div>`;
    return;
  }
  const hasSearch=Boolean(tacticQuery.trim());
  const isCategory=tacticCategory!=='all';
  const results=tactics.scenarios.filter(s=>(!isCategory||s.category===tacticCategory)&&(!hasSearch||norm([s.title,s.situation,s.goal,...(s.tags||[])].join(' ')).includes(norm(tacticQuery))));
  const featured=['misiles-entrantes','bombarderos','contacto-sin-identificar','ataque-flota','submarino'];
  const displayed=(!hasSearch&&!isCategory&&!tacticShowAll)?featured.map(id=>results.find(s=>s.id===id)).filter(Boolean):results;
  const cards=displayed.map(s=>`<button type="button" class="guide-result" data-tactic="${esc(s.id)}"><span class="guide-result-text"><span class="guide-result-kind">${esc(getCategory(s.category))}</span><strong>${esc(s.title)}</strong><span class="guide-result-description">${esc(s.situation)}</span></span><span class="guide-result-arrow" aria-hidden="true">›</span></button>`).join('');
  const categoryButtons=guideCategories.map(c=>`<button type="button" class="guide-action ${tacticCategory===c.id?'is-active':''}" data-tactic-filter="${esc(c.id)}" aria-pressed="${tacticCategory===c.id}"><span class="guide-action-icon" aria-hidden="true">${c.icon}</span><strong>${esc(c.label)}</strong><span>${esc(c.hint)}</span></button>`).join('');
  root.innerHTML=`<section class="guide-home" aria-label="Consulta rápida">
      <div class="guide-hero"><div class="guide-kicker">SEA POWER ATLAS · GUÍA RÁPIDA · 1985</div><h1>¿Qué necesitas hacer?</h1><p>Elige qué ocurre en tu partida y consulta una respuesta clara.</p></div>
      <label class="guide-search-label" for="tactic-search">Buscar por situación, amenaza o arma</label>
      <div class="guide-search"><span aria-hidden="true">⌕</span><input id="tactic-search" type="search" enterkeyhint="search" autocomplete="off" placeholder="Ej.: Harpoon, submarino, radar…" value="${esc(tacticQuery)}"></div>
      <div class="guide-choose">${!isCategory&&!hasSearch?'<div class="guide-section-heading"><h2>Elige una acción</h2></div><div class="guide-action-grid">'+categoryButtons+'</div>':'<button type="button" id="tactic-clear-filter" class="guide-clear">← '+(hasSearch?'Borrar búsqueda':'Elegir otra acción')+'</button>'}</div>
      <section class="guide-lookup"><div class="guide-section-heading"><h2>${hasSearch?'Resultados de búsqueda':isCategory?'Situaciones: '+esc(getCategory(tacticCategory)):tacticShowAll?'Todas las situaciones':'Situaciones frecuentes'}</h2><span role="status">${displayed.length} ${displayed.length===1?'opción':'opciones'}</span></div>
      <div class="guide-results">${cards||'<div class="guide-empty">No hay coincidencias. Prueba otra palabra o selecciona una categoría.</div>'}</div>
      ${!hasSearch&&!isCategory&&!tacticShowAll?`<button type="button" id="tactic-all" class="guide-show-all">Ver todas las situaciones (${tactics.scenarios.length}) →</button>`:''}
      </section>
      <p class="guide-footnote">Guía orientativa para tu Task Force en 1985. No controla el juego ni sustituye los datos de tus unidades o mods.</p>
    </section>`;
}

function selectTactic(id){
  if(!tactics?.scenarios?.some(x=>x.id===id))return;
  tacticSelected=id;
  setRoute(routePath('tactics','mission',id));
  renderTactics();
  window.scrollTo({top:0,behavior:'instant'});
  requestAnimationFrame(()=>$('#tactic-title')?.focus({preventScroll:true}));
}

function backToTactics(){
  if(history.state?.seaPowerAtlas&&history.state?.backable){history.back();return}
  setRoute(routePath('tactics'),true);
  restoreRoute();
}
