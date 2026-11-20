'use strict';
// Galería PRIVADA. El repositorio no contiene fotografías ni ilustraciones del juego.
// Los blobs se almacenan solo en IndexedDB del dispositivo del usuario.
let galleryIndex=[],galleryKeySet=new Set(),galleryDBPromise=null,galleryUrls=new Map(),galleryVerified={};
let galleryPickerEntry=null,galleryPickerQuery='',galleryPickerFolder='all',galleryPickerLimit=36,galleryImportBusy=false;
function galleryAssignments(){if(!state.imageAssignments||typeof state.imageAssignments!=='object')state.imageAssignments={};return state.imageAssignments}
function galleryOpenDB(){
 if(typeof indexedDB==='undefined')return Promise.resolve(null);
 if(galleryDBPromise)return galleryDBPromise;
 galleryDBPromise=new Promise((resolve,reject)=>{
  const req=indexedDB.open('sea-power-atlas-images-v1',1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('images'))req.result.createObjectStore('images',{keyPath:'id'})};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error('No se pudo abrir el almacén de imágenes'));
 }).catch(e=>{galleryDBPromise=null;throw e});
 return galleryDBPromise;
}
async function galleryDBRequest(mode,operation){
 const db=await galleryOpenDB();if(!db)return null;
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('images',mode);
  const req=operation(tx.objectStore('images'));
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error('Almacenamiento de imágenes: operación fallida'));
  tx.onerror=()=>reject(tx.error||Error('Error de escritura de imágenes'));
 });
}
async function galleryInit(){
 if(typeof indexedDB==='undefined')return;
 const keys=await galleryDBRequest('readonly',store=>store.getAllKeys());
 galleryIndex=(keys||[]).filter(id=>typeof id==='string').sort().map(id=>({id,name:id.split('/').pop().replace(/\.[^.]+$/,'').replaceAll('_',' '),folder:id.startsWith('ui/photos/')?'photos':id.startsWith('ui/artwork/')?'artwork':'backgrounds'}));
 galleryKeySet=new Set(galleryIndex.map(x=>x.id));
}
function galleryDisplayName(id){
 const name=id.split('/').pop().replace(/\.[^.]+$/,'').replaceAll('_',' ');
 return name.length>52?name.slice(0,49)+'…':name;
}
function galleryPreferredImages(e){
 if(!e||!['aircraft','ship','land'].includes(e.category))return [];
 const nato=!['URSS','Pacto de Varsovia','China'].includes(e.nation);
 let families=[];
 if(e.category==='aircraft')families=nato?['air nato','air us','nato air']:['air pact','air plan'];
 else if(e.category==='ship')families=nato?['naval nato','naval us']:['naval pact','naval plan'];
 else families=nato?['armor nato','armor us','infantry nato']:['armor pact','armor plan','infantry pact'];
 return galleryIndex.filter(x=>x.folder==='photos'&&families.some(f=>x.name.toLowerCase().startsWith(f+' ')));
}
function gallerySourceFor(e){
 const assigned=galleryAssignments()[e.id];
 if(assigned&&galleryKeySet.has(assigned))return {id:assigned,assigned:true,local:true};
 const verified=galleryVerified[e.id];
 if(verified)return {verified:true,record:verified};
 return null;
}
function galleryVerifiedURL(record){
 return 'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(record.file).replace(/%20/g,'_')+'?width=840';
}
function galleryVisualMarkup(e,kind='card'){
 const source=gallerySourceFor(e);if(!source)return '';
 if(source.verified){
  const r=source.record;
  return '<figure class="gallery-visual gallery-visual-'+kind+'"><img src="'+esc(galleryVerifiedURL(r))+'" loading="lazy" decoding="async" referrerpolicy="no-referrer" alt="Fotografía histórica verificada: '+esc(r.label)+'" onerror="this.closest(\'figure\').hidden=true"><figcaption>'+esc(r.label)+' · '+esc(r.year)+' · US Navy · dominio público · <a href="'+esc(r.source)+'" target="_blank" rel="noopener noreferrer">Fuente y licencia ↗</a></figcaption></figure>';
 }
 return '<figure class="gallery-visual gallery-visual-'+kind+'"><img data-gallery-src="'+esc(source.id)+'" loading="lazy" decoding="async" alt="Imagen personal asignada a '+esc(e.name)+'"><figcaption>Imagen asignada por ti</figcaption></figure>';
}
function galleryCardMarkup(e){return galleryVisualMarkup(e,'card')}
function galleryDetailMarkup(e){
 const source=gallerySourceFor(e),assigned=galleryAssignments()[e.id];
 return '<section class="detail-section gallery-detail"><h3>Imagen de referencia</h3>'+
 (source?galleryVisualMarkup(e,'detail'):'<p class="gallery-no-image">No hay una fotografía verificada para este modelo.</p>')+
 (galleryIndex.length?'<div class="gallery-detail-actions"><button type="button" class="btn secondary" data-gallery-pick="'+esc(e.id)+'">Asignar imagen personal</button>'+
 (assigned?'<button type="button" class="btn ghost" data-gallery-unassign="'+esc(e.id)+'">Quitar asignación</button>':'')+'</div>':
 '<p class="gallery-info">Las fotografías históricas verificadas aparecen automáticamente. Opcionalmente puedes importar fotografías propias y asignarlas manualmente.</p>')+
 '<p class="gallery-info">La fotografía identifica el modelo real, pero no necesariamente el escuadrón o unidad de tu campaña. Las imágenes no verificadas no se muestran automáticamente.</p></section>';
}
function gallerySettingsMarkup(){
 return '<section class="panel gallery-settings"><div class="eyebrow">GALERÍA PERSONAL · SIN SUBIR ARCHIVOS</div><h2>Imágenes del juego</h2>'+
 '<p>Importa <code>ui.zip</code> o el paquete optimizado de la conversación. Atlas guarda versiones ligeras en el navegador, sin publicar los archivos de Sea Power en GitHub.</p>'+
 '<div class="gallery-settings-count"><strong>'+galleryIndex.length+'</strong><span>imágenes guardadas en este dispositivo</span></div>'+
 '<label class="gallery-background-toggle"><input type="checkbox" id="gallery-include-backgrounds"> Incluir también los fondos de carga (más almacenamiento)</label>'+
 '<div class="gallery-settings-actions"><button type="button" class="btn" id="gallery-import" '+(galleryImportBusy?'disabled':'')+'>Importar archivo ZIP</button>'+
 (galleryIndex.length?'<button type="button" class="btn secondary" id="gallery-clear">Eliminar solo las imágenes importadas</button>':'')+'</div>'+
 '<p class="gallery-info">Se pueden asignar fotografías a unidades o armas desde sus fichas. Los archivos permanecen privados en este navegador y no se incluyen en las copias JSON; si cambias de dispositivo, tendrás que volver a importarlos.</p></section>';
}
let galleryProgressTimer=0;
function galleryProgress(msg,done=false){
 const el=document.getElementById('gallery-progress');if(!el)return;
 clearTimeout(galleryProgressTimer);
 el.hidden=false;el.textContent=msg;el.classList.toggle('finished',done);
 if(done)galleryProgressTimer=setTimeout(()=>{el.hidden=true},6500);
}
async function galleryZipEntries(file){
 const tailAt=Math.max(0,file.size-66000);
 const tail=new DataView(await file.slice(tailAt).arrayBuffer());
 let eocd=-1;
 for(let i=tail.byteLength-22;i>=0;i--)if(tail.getUint32(i,true)===0x06054b50){eocd=i;break}
 if(eocd<0)throw Error('El ZIP no tiene un directorio válido');
 const entries=tail.getUint16(eocd+10,true),at=tail.getUint32(eocd+16,true),size=tail.getUint32(eocd+12,true);
 if(entries===65535||at===0xffffffff)throw Error('ZIP64 no compatible');
 const cd=new DataView(await file.slice(at,at+size).arrayBuffer());
 const decoder=new TextDecoder();
 const records=[];let p=0;
 for(let i=0;i<entries;i++){
  if(p+46>cd.byteLength||cd.getUint32(p,true)!==0x02014b50)throw Error('Directorio ZIP dañado');
  const method=cd.getUint16(p+10,true),compressed=cd.getUint32(p+20,true),uncompressed=cd.getUint32(p+24,true);
  const n=cd.getUint16(p+28,true),extra=cd.getUint16(p+30,true),comment=cd.getUint16(p+32,true),local=cd.getUint32(p+42,true);
  if(p+46+n+extra+comment>cd.byteLength)throw Error('Nombre ZIP truncado');
  const id=decoder.decode(new Uint8Array(cd.buffer,cd.byteOffset+p+46,n)).replaceAll('\\','/').toLowerCase();
  if(/^ui\/(photos|artwork|backgrounds)\/[^/]+\.(?:jpg|jpeg|png|webp)$/.test(id)&&
   uncompressed>0&&uncompressed<=9_000_000&&compressed>0&&compressed<=9_000_000&&[0,8].includes(method)){
    records.push({id,method,compressed,uncompressed,local});
  }
  p+=46+n+extra+comment;
 }
 return records;
}
async function galleryZipRead(file,x){
 const header=new DataView(await file.slice(x.local,x.local+30).arrayBuffer());
 if(header.byteLength<30||header.getUint32(0,true)!==0x04034b50)throw Error('Cabecera ZIP dañada');
 const at=x.local+30+header.getUint16(26,true)+header.getUint16(28,true);
 const stream=file.slice(at,at+x.compressed).stream();
 const data=x.method===8?stream.pipeThrough(new DecompressionStream('deflate-raw')):stream;
 const blob=await new Response(data).blob();
 if(blob.size!==x.uncompressed)throw Error('Tamaño ZIP incorrecto');
 const ext=x.id.split('.').pop();
 return new Blob([blob],{type:ext==='png'?'image/png':ext==='webp'?'image/webp':'image/jpeg'});
}
async function galleryOptimize(blob){
 if(blob.type==='image/webp'&&blob.size<300000)return blob;
 const bitmap=await createImageBitmap(blob);
 try{
  const scale=Math.min(1,980/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));
  canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
  const result=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',0.74));
  if(!result)throw Error('No se pudo convertir la imagen');
  return result;
 }finally{bitmap.close?.()}
}
async function galleryImportZip(file){
 if(galleryImportBusy)return;
 if(!file||(!/\.zip$/i.test(file.name)&&file.type!=='application/zip'))throw Error('Selecciona un archivo ZIP');
 galleryImportBusy=true;let ok=0,failed=0;
 try{
  galleryProgress('Leyendo índice del ZIP…');
  const records=(await galleryZipEntries(file)).filter(x=>x.id.startsWith('ui/photos/')||x.id.startsWith('ui/artwork/')||Boolean(document.getElementById('gallery-include-backgrounds')?.checked));
  if(!records.length)throw Error('No aparecen fotografías en ui/photos o ui/artwork');
  if(records.length>250)throw Error('Demasiadas imágenes: máximo 250');
  if(!(await galleryOpenDB()))throw Error('Este navegador no permite guardar imágenes locales');
  for(const record of records){
   try{
    const blob=await galleryOptimize(await galleryZipRead(file,record));
    await galleryDBRequest('readwrite',store=>store.put({id:record.id,blob}));
    ok++;
   }catch(e){failed++;if(failed<=2)console.warn('Imagen no importada',record.id,e)}
   if((ok+failed)%5===0||ok+failed===records.length){
    galleryProgress('Importando imágenes: '+(ok+failed)+' de '+records.length);
    await new Promise(resolve=>setTimeout(resolve,0));
   }
  }
  await galleryInit();
  galleryProgress('Galería lista: '+ok+' imágenes importadas'+(failed?', '+failed+' omitidas':''),true);
  if(page==='packs')renderPacks();
  if(page==='library')renderLibrary();
  if(current)openDetail(current,{skipHistory:true});
  galleryHydrate(document);
 }finally{galleryImportBusy=false}
}
async function galleryImageURL(id){
 if(galleryUrls.has(id))return galleryUrls.get(id);
 const result=await galleryDBRequest('readonly',store=>store.get(id));
 if(!result?.blob)return null;
 const url=URL.createObjectURL(result.blob);
 galleryUrls.set(id,url);
 return url;
}
async function galleryHydrate(root=document){
 if(!galleryIndex.length||typeof indexedDB==='undefined'||!root?.querySelectorAll)return;
 const imgs=[...root.querySelectorAll('img[data-gallery-src]:not([data-gallery-loaded])')];
 for(const img of imgs){
  const key=img.dataset.gallerySrc;
  if(!galleryKeySet.has(key))continue;
  img.dataset.galleryLoaded='true';
  galleryImageURL(key).then(url=>{if(url&&img.isConnected!==false)img.src=url}).catch(()=>{});
 }
}
function galleryPickerMarkup(){
 const term=galleryPickerQuery.trim().toLocaleLowerCase('es');
 const rows=galleryIndex.filter(x=>(galleryPickerFolder==='all'||x.folder===galleryPickerFolder)&&(!term||x.name.toLocaleLowerCase('es').includes(term)));
 const visible=rows.slice(0,galleryPickerLimit);
 return '<div class="gallery-picker-dialog" role="dialog" aria-modal="true" aria-label="Seleccionar imagen"><div class="gallery-picker-top"><div><h2>Elegir imagen para esta ficha</h2><p>Las fotografías de Sea Power no identifican automáticamente cada modelo.</p></div><button type="button" id="gallery-picker-close" aria-label="Cerrar selector">✕</button></div>'+
 '<input type="search" id="gallery-picker-search" placeholder="Buscar fotografía por nombre…" value="'+esc(galleryPickerQuery)+'" aria-label="Buscar fotografía">'+
 '<div class="gallery-picker-tabs">'+[['all','Todas'],['photos','Fotos'],['artwork','Ilustraciones'],['backgrounds','Fondos']].map(([id,label])=>'<button type="button" data-gallery-folder="'+id+'" class="'+(galleryPickerFolder===id?'active':'')+'">'+label+'</button>').join('')+'</div>'+
 '<div class="gallery-picker-count">'+rows.length+' imágenes coincidentes</div>'+
 '<div class="gallery-picker-grid">'+visible.map(x=>'<button type="button" data-gallery-assign="'+esc(x.id)+'"><img data-gallery-src="'+esc(x.id)+'" alt="'+esc(x.name)+'" loading="lazy"><span>'+esc(galleryDisplayName(x.id))+'</span></button>').join('')+'</div>'+
 (rows.length>visible.length?'<button type="button" class="gallery-picker-more" id="gallery-picker-more">Mostrar más ('+(rows.length-visible.length)+' restantes)</button>':'')+
 '</div>';
}
function galleryRenderPicker(keepFocus=false){
 const modal=document.getElementById('gallery-picker');if(!modal)return;
 const active=keepFocus&&document.activeElement?.id==='gallery-picker-search';
 const selection=active?document.activeElement.selectionStart||0:0;
 modal.innerHTML=galleryPickerMarkup();modal.hidden=false;
 galleryHydrate(modal);
 if(active){const input=document.getElementById('gallery-picker-search');input.focus();input.setSelectionRange(selection,selection)}
}
function galleryOpenPicker(id){
 if(!galleryIndex.length){document.getElementById('image-pack-file')?.click();return}
 galleryPickerEntry=id;galleryPickerLimit=36;galleryPickerQuery='';galleryPickerFolder='all';
 galleryRenderPicker();
}
function galleryClosePicker(){
 galleryPickerEntry=null;
 const modal=document.getElementById('gallery-picker');
 if(modal){modal.hidden=true;modal.innerHTML=''}
}
function galleryUpdateDetail(){
 if(page==='library')renderLibrary();
 if(current){const node=document.getElementById('detail-panel');const scroll=node?.scrollTop||0;openDetail(current,{skipHistory:true});if(node)node.scrollTop=scroll}
}
function galleryAssignImage(id){
 if(!galleryPickerEntry||!galleryKeySet.has(id))return;
 galleryAssignments()[galleryPickerEntry]=id;save();galleryClosePicker();galleryUpdateDetail();
}
function galleryUnassignImage(id){
 delete galleryAssignments()[id];save();galleryUpdateDetail();
}
async function galleryClearImages(){
 const db=await galleryOpenDB();if(!db)return;
 await galleryDBRequest('readwrite',store=>store.clear());
 for(const url of galleryUrls.values())URL.revokeObjectURL(url);
 galleryUrls.clear();galleryIndex=[];galleryKeySet=new Set();state.imageAssignments={};save();
 if(page==='packs')renderPacks();galleryUpdateDetail();galleryProgress('Solo las imágenes locales se han eliminado.',true);
}
