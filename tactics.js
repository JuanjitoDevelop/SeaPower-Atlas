'use strict';
function renderTactics(){
  const root=$('#page-content');
  if(!tactics || !Array.isArray(tactics.scenarios)){root.innerHTML='<div class="panel muted">Cargando guía táctica…</div>';return}
  const categories=[{id:'all',label:'Todas'},...tactics.categories];
  const scenes=tactics.scenarios;
  const filtered=scenes.filter(x=>(tacticCategory==='all'||x.category===tacticCategory)&&norm([x.title,x.situation,x.goal,...(x.tags||[])].join(' ')).includes(norm(tacticQuery)));
  const selected=scenes.find(x=>x.id===tacticSelected)||scenes[0];
  const nav=categories.map(c=>`<button class="tactic-filter ${tacticCategory===c.id?'active':''}" data-tactic-filter="${esc(c.id)}" aria-pressed="${tacticCategory===c.id}">${esc(c.label)} <small>${c.id==='all'?scenes.length:scenes.filter(s=>s.category===c.id).length}</small></button>`).join('');
  const cards=filtered.map(x=>`<button class="tactic-item ${selected?.id===x.id?'selected':''}" data-tactic="${esc(x.id)}" aria-current="${selected?.id===x.id?'true':'false'}"><span class="tactic-kind">${esc(categories.find(c=>c.id===x.category)?.label||x.category)} · ${esc(x.priority||'Normal')}</span><strong>${esc(x.title)}</strong><span>${esc(x.situation)}</span><span class="tactic-item-cta">Consultar respuesta →</span></button>`).join('')||'<p class="empty">No hay situaciones con ese filtro.</p>';
  let detail='';
  if(selected){
    const steps=(arr,ordered)=>arr?.length?`<${ordered?'ol':'ul'} class="tactic-steps">${arr.map(t=>`<li>${esc(t)}</li>`).join('')}</${ordered?'ol':'ul'}>`:'';
    const equipment=(selected.units||[]).map(([id,loadout,purpose])=>{
      const item=entry(id),name=item?item.name:id;
      return `<div class="tactic-equipment"><div><button class="tactic-unit-link" data-open="${esc(id)}">${esc(name)} ↗</button><span>${esc(purpose||'')}</span></div><div class="tactic-loadout">${esc(loadout||'Según perfil')}</div></div>`;
    }).join('');
    const weapons=(selected.weapons||[]).map(id=>{const item=entry(id);return item?`<button class="pill click" data-open="${esc(id)}">${esc(item.name)} ↗</button>`:''}).join('');
    const modMatches=all().filter(e=>e.pack!=='core'&&e.category!=='weapon'&&(selected.tags||[]).some(tag=>norm([e.name,e.role,e.summary,...(e.tags||[])].join(' ')).includes(norm(tag)))).slice(0,4);
    detail=`<section class="tactic-sheet" id="tactic-sheet" aria-label="Procedimiento ${esc(selected.title)}"><div class="tactic-sheet-top"><span class="eyebrow">GUÍA DE SITUACIÓN · 1985</span><span class="tactic-priority">${esc(selected.priority)}</span></div><h2>${esc(selected.title)}</h2><p class="tactic-premise">${esc(selected.situation)}</p><div class="tactic-goal"><strong>Objetivo</strong><p>${esc(selected.goal)}</p></div><div class="tactic-section"><h3>Comprobar primero</h3>${steps(selected.check,false)}</div><div class="tactic-section"><h3>Respuesta orientativa</h3>${steps(selected.steps,true)}</div><div class="tactic-section"><h3>Fuerza y configuración</h3><div class="tactic-equipment-list">${equipment}</div></div>${weapons?`<div class="tactic-section"><h3>Armamento relacionado</h3><div class="tactic-weapons">${weapons}</div></div>`:''}<div class="tactic-section"><h3>Errores frecuentes</h3>${steps(selected.risks,false)}</div>${modMatches.length?`<div class="tactic-section"><h3>Fichas de mods con palabras relacionadas</h3><p class="asset-notice">Coincidencias automáticas, no recomendaciones tácticas verificadas.</p><div>${modMatches.map(e=>`<button class="pill click" data-open="${esc(e.id)}">${esc(e.name)} ↗</button>`).join('')}</div></div>`:''}<p class="asset-notice">Guía educativa para Sea Power, no órdenes automáticas. Prioriza los datos reales, el año y los presets de tu instalación.</p></section>`;
  }
  root.innerHTML=`<div class="tactic-header"><div class="eyebrow">ASESOR DE MISIÓN · GRUPO NIMITZ · 1985</div><h1>¿Qué está pasando?</h1><p>Elige una amenaza o una misión. Consulta qué revisar, qué unidades emplear y con qué loadouts prepararlas.</p><div class="tactic-hint">La guía no controla el juego ni consume recursos. Los consejos son orientativos y conservan tus municiones limitadas en Task Force.</div></div><div class="tactic-toolbar"><input id="tactic-search" type="search" aria-label="Buscar situaciones" placeholder="Buscar submarino, Harpoon, radar, interceptación..." value="${esc(tacticQuery)}"></div><div class="tactic-filters">${nav}</div><div class="tactic-layout"><div class="tactic-list" aria-label="Situaciones disponibles">${cards}</div>${detail}</div>`;
}

function selectTactic(id){
  if(!tactics?.scenarios?.some(x=>x.id===id))return;
  tacticSelected=id;
  setRoute(routePath('tactics','mission',id));
  renderTactics();
  const target=$('#tactic-sheet');
  if(target)target.scrollIntoView({behavior:'smooth',block:'start'});
}
