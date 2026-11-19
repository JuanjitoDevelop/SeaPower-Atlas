'use strict';

function workshopCatalogMarkup(){
 if(!workshopCatalog?.mods?.length)return '<section id="workshop-catalog" class="workshop-catalog"><p class="muted">No se ha podido cargar el inventario de mods.</p></section>';
 const data=workshopCatalog;
 const available=data.mods.filter(m=>(workshopFilter==='all'||m.category===workshopFilter)&&norm([m.name,m.role,m.note].join(' ')).includes(norm(workshopSearch)));
 const buttons=[{id:'all',title:'Todos'},...data.categories.map(c=>({id:c.id,title:c.title}))].map(c=>`<button type="button" data-workshop-category="${esc(c.id)}" aria-pressed="${workshopFilter===c.id}" class="workshop-filter ${workshopFilter===c.id?'active':''}">${esc(c.title)}<span> ${c.id==='all'?data.mods.length:data.mods.filter(m=>m.category===c.id).length}</span></button>`).join('');
 const cards=available.map(m=>{
  const c=data.categories.find(c=>c.id===m.category);
  const related=(m.related||[]).map(id=>{const x=entry(id);return x?`<button type="button" class="workshop-related" data-open="${esc(id)}">${esc(x.name)} ↗</button>`:''}).join('');
  return `<details class="workshop-mod"><summary><span class="workshop-mod-icon" aria-hidden="true">${esc(c?.icon||'◈')}</span><span class="workshop-mod-title"><strong>${esc(m.name)}</strong><small>${esc(m.role)}</small></span><span class="workshop-chevron" aria-hidden="true">⌄</span></summary><div class="workshop-mod-content">${m.workshopFolder?`<p class="workshop-file-origin">Carpeta Workshop: <code>${esc(m.workshopFolder)}</code> · INI inspeccionados</p>`:""}<p>${esc(m.note)}</p>${m.watch?`<p class="workshop-caution">${esc(m.watch)}</p>`:''}${related?`<div class="workshop-related-wrap"><span>Fichas relacionadas</span><div>${related}</div></div>`:''}${m.url?`<a href="${esc(m.url)}" target="_blank" rel="noopener noreferrer">Ficha de Steam Workshop ↗</a>`:''}</div></details>`;
 }).join('');
 return `<section class="workshop-catalog" id="workshop-catalog">
 <div class="workshop-overview"><div><div class="eyebrow">COLECCIÓN DEL JUGADOR · STEAM WORKSHOP</div><h2>Mis mods <span class="workshop-count">${data.mods.length}</span></h2><p>Inventario basado en tus capturas. Las opciones disponibles dependen de cuáles estén activadas en tu juego.</p></div><a href="${esc(data.collection)}" target="_blank" rel="noopener noreferrer">Abrir colección en Steam ↗</a></div>
 <div class="workshop-alerts"><strong>Revisar compatibilidad</strong><details><summary>Flight Deck Ops / Deck Crew</summary><p>${esc(data.warnings[0].text)}</p></details><details><summary>Anchor Chain / R.A.T.S. Keel</summary><p>${esc(data.warnings[1].text)}</p></details></div>
 <label for="workshop-search" class="workshop-search-label">Buscar en tus mods</label><input type="search" id="workshop-search" autocomplete="off" placeholder="Por ejemplo: SH-2, radar, SAR…" value="${esc(workshopSearch)}" class="workshop-search">
 <div class="workshop-filters" aria-label="Filtrar tipos de mods">${buttons}</div><div class="workshop-result-count" aria-live="polite">${available.length} ${available.length===1?'mod':'mods'}</div>
 <div class="workshop-mod-list">${cards||'<p class="workshop-empty">No hay mods con ese filtro.</p>'}</div>
 <p class="workshop-disclaimer">No se han añadido 21 unidades militares ficticias: estos mods afectan a loadouts, controles, mapas o funciones. EuroMod no aparece en las capturas.</p>
 </section>`;
}

function updateWorkshopCatalog(keepFocus=false){
 const root=$('#workshop-catalog');if(!root)return;
 let pos=0;const active=keepFocus&&document.activeElement?.id==='workshop-search';
 if(active)pos=document.activeElement.selectionStart??0;
 root.outerHTML=workshopCatalogMarkup();
 if(active){const input=$('#workshop-search');input?.focus();input?.setSelectionRange(pos,pos)}
}

function workshopUnitHints(id){
 if(!workshopCatalog?.mods?.length)return '';
 const hints={
 sh2f:{mod:'Better SH-2 Loadouts',text:'El INI aportado define 12 perfiles: AntiShip con 2 Penguin Mk 2, CAS con 2 lanzadores LAU-3A (38 cohetes Hydra), AirToAir con 2 AIM-9L y SEADAdvanced con 2 AGM-122A. El Sidearm tiene IOC 1986: anacrónico para 1985.'},
 sh3h:{mod:'Harpoon SH-3H',text:'El INI modifica el SH-3H para cargar 4 AGM-84A Harpoon en AntiShip, sin tiempo de preparación explícito. Sustituye dos perfiles ASW originales y no tiene base histórica.'}
 };
 const item=hints[id];if(!item)return '';
 return `<div class="detail-section workshop-unit-note"><h3>Con tus mods</h3><strong>${esc(item.mod)}</strong><p>${esc(item.text)}</p><button type="button" data-page="packs" class="btn secondary">Consultar mis mods →</button></div>`;
}

function workshopScenarioHints(id){
 if(!workshopCatalog?.mods?.length)return '';
 const hints={
 'ataque-flota':[{mod:'Harpoon SH-3H',text:'Con Harpoon SH-3H activo, el preset AntiShip lleva 4 AGM-84A, no AGM-84C. Es ficticio y consume capacidad ASW.'},{mod:'Better SH-2 Loadouts',text:'El SH-2F modificado lleva 2 Penguin Mk 2 en AntiShip, no Harpoon. Confirma la reserva de Penguin y la defensa enemiga.'}],
 'saturacion-naval':[{mod:'Harpoon SH-3H',text:'Existe una opción de Harpoon en el Sea King por mod, pero consume cuatro misiles y compromete tu cobertura antisubmarina.'}],
 'ataque-costero':[{mod:'Better SH-2 Loadouts',text:'Puede aparecer CAS en SH-2F; evalúa su distancia al objetivo y las defensas antes de usarlo.'}],
 'radar-sam':[{mod:'Better SH-2 Loadouts',text:'El perfil SEADAdvanced del SH-2F contiene 2 AGM-122A Sidearm (IOC 1986 en los INI originales). No lo trates como carga históricamente correcta para 1985.'}],
 'submarino':[{mod:'ASW Find, Fix and Prosecute (Beta)',text:'El mod añade herramientas de apoyo a procedimientos ASW. Confirma las órdenes que ejecuta y su estado beta antes de depender de él.'},{mod:'Better SH-2 Loadouts / Harpoon SH-3H',text:'Para esta situación conserva ASW en tus helicópteros: usar sus perfiles ofensivos elimina temporalmente parte de tu cobertura antisubmarina.'}],
 'torpedo-detectado':[{mod:'ASW Find, Fix and Prosecute (Beta)',text:'Úsalo como apoyo a la búsqueda posterior, no como garantía de interceptar un torpedo ya lanzado.'}],
 'contacto-sin-identificar':[{mod:'Identify Expanded',text:'Puede ayudarte con la identificación; verifica el resultado antes de tratar el contacto como hostil.'}],
 'misiles-entrantes':[{mod:'Alternative Weapons Control',text:'Consulta su nueva pestaña de armas para revisar medios disponibles. No sustituye la gestión de defensa aérea.'}],
 'retiro-rearme':[{mod:'Custom Loadout Editor',text:'Las cargas personalizadas deben contrastarse con la munición disponible en Task Force, sin asumir reabastecimiento ilimitado.'}],
 'convoy':[{mod:'Automatic SAR / One Click Formation Manager',text:'Ofrecen funciones de apoyo para rescate y organización de escoltas. Comprueba primero sus controles en el juego.'}],
 'helicopteros-con-mods':[{mod:'Better SH-2 Loadouts',text:'Los archivos aportados confirman AntiShip: 2 Penguin Mk 2; CAS: 2 LAU-3A; AirToAir: 2 AIM-9L y SEADAdvanced: 2 AGM-122A (IOC 1986). El mod sustituye la lista original de perfiles.'},{mod:'Harpoon SH-3H',text:'La carga AntiShip del SH-3H utiliza 4 AGM-84A. Es ficticia; recuerda que este archivo elimina ASWBomb y ASWHunterLight del menú original.'},{mod:'Custom Loadout Editor',text:'El ZIP contiene 43 archivos de opciones de estación del editor, NO tus cargas personalizadas guardadas. Sus opciones predeterminadas para SH-2F/SH-3H no incluyen Penguin/Harpoon.'}]
 };
 const list=hints[id];if(!list?.length)return '';
 return `<section class="guide-block workshop-scenario-block"><h2>Opciones de tus mods</h2><p class="guide-helper">Solo si esos mods están activos; no sustituyen a los perfiles históricos.</p>${list.map(x=>`<div class="workshop-scenario-hint"><strong>${esc(x.mod)}</strong><p>${esc(x.text)}</p></div>`).join('')}<button type="button" class="workshop-more" data-page="packs">Ver catálogo de mods →</button></section>`;
}
