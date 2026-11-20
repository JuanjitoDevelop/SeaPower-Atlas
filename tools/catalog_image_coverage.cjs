'use strict';
/* Auditoría exclusivamente del catálogo visual: sin peticiones de red ni archivos privados. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function audit(){
 const manifest=JSON.parse(read('verified_images.json'));
 const catalog=JSON.parse(read('catalogo_completo_1985.json'));
 const armory=JSON.parse(read('armory_1985.json'));
 const js=read('catalog.js');
 const fleetBlock=js.match(/const CATALOG_FLEET_SOURCES=\{([\s\S]*?)\};/);
 assert.ok(fleetBlock,'No se encontró el mapeo de unidades propias');
 const fleet={};
 for(const m of fleetBlock[1].matchAll(/(\w+):'([^']+)'/g))fleet[m[1]]=m[2];
 const units=new Map(catalog.units.map(u=>[u[0],u]));
 const weapons=new Map(catalog.weapons.map(w=>[w[0],w]));
 const covered=new Map(),orphans=[];
 function add(prefix,id,record,key){
  const k=prefix+':'+id;
  const rank=record.exactVariant===true?2:1;
  if(!covered.has(k)||rank>covered.get(k).rank)covered.set(k,{key,rank});
 }
 for(const [key,v] of Object.entries(manifest.items)){
  let matches=0;
  if(key.startsWith('game-unit:')){
   const id=key.split(':').slice(2).join(':');
   if(units.has(id)){add('unit',id,v,key);matches++}
  }else if(key.startsWith('game-ammo:')){
   const id=key.slice('game-ammo:'.length);
   if(weapons.has(id)){add('weapon',id,v,key);matches++}
  }else{
   if(fleet[key]&&units.has(fleet[key])){add('unit',fleet[key],v,key);matches++}
   for(const id of v.ammoIds||[])if(weapons.has(id)){add('weapon',id,v,key);matches++}
  }
  if(!matches)orphans.push(key);
 }
 const names=new Map(armory.i.map(x=>[x[0],x[1]||x[0]]));
 const cnt=tag=>catalog.units.filter(x=>x[2]===tag).length;
 const included=tag=>catalog.units.filter(x=>x[2]===tag&&covered.has('unit:'+x[0])).length;
 const pending=tag=>tag==='weapon'?
  catalog.weapons.filter(x=>!covered.has('weapon:'+x[0])).map(x=>[x[0],names.get(x[0])||x[0]]):
  catalog.units.filter(x=>x[2]===tag&&!covered.has('unit:'+x[0])).map(x=>[x[0],x[1]]);
 const exact=[...covered.values()].filter(v=>v.rank===2).length;
 return {
  schema:1,
  source:'catalogo_completo_1985.json (INI extraídos para 1985)',
  notes:[
   'Cobertura por identificador original, sin contar dos veces fichas editoriales que representan el mismo modelo.',
   'Asignación visual documentada no equivale a comprobación automática de que el fichero de Wikimedia siga accesible.',
   'No se marcan como cubiertas unidades parecidas ni variantes sin enlace expreso.'
  ],
  counts:{
   total:catalog.units.length+catalog.weapons.length,
   references:Object.keys(manifest.items).length,
   covered:covered.size,
   exactAssigned:exact,
   familyAssigned:covered.size-exact,
   pending:catalog.units.length+catalog.weapons.length-covered.size,
   byType:{
    aircraft:{total:cnt('a'),covered:included('a')},
    ship:{total:cnt('v'),covered:included('v')},
    land:{total:cnt('l'),covered:included('l')},
    weapon:{total:catalog.weapons.length,covered:[...covered.keys()].filter(x=>x.startsWith('weapon:')).length}
   },
   unmatchedManifestIds:orphans
  },
  pending:{
   aircraft:pending('a'),
   ship:pending('v'),
   land:pending('l'),
   weapon:pending('weapon')
  }
 };
}
if(require.main===module){
 const result=audit();
 assert.equal(result.counts.total,1107,'La extracción base del juego ha cambiado: revisar el alcance');
 assert.equal(result.counts.pending+result.counts.covered,result.counts.total);
 assert.equal(result.counts.unmatchedManifestIds.length,0,'Hay imágenes sin correspondencia en los INI');
 if(process.argv.includes('--check')){
  const stored=JSON.parse(read('reports/galeria-cobertura-1985.json'));
  assert.deepEqual(stored,result,'Informe de cobertura desactualizado');
 }
 if(process.argv.includes('--write')){
  fs.mkdirSync(path.join(root,'reports'),{recursive:true});
  fs.writeFileSync(path.join(root,'reports/galeria-cobertura-1985.json'),JSON.stringify(result,null,2)+'\n');
 }
 console.log('Galería: '+result.counts.covered+'/'+result.counts.total+' modelos enlazados; '+result.counts.pending+' pendientes.');
}
module.exports={audit};
