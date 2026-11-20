'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const zlib=require('node:zlib');
// ZIP mínimo generado en la prueba: evita distribuir imágenes propietarias en el repositorio.
function zipFixture(name,payload,method){
 const title=Buffer.from(name,'utf8');
 const comp=method===8?zlib.deflateRawSync(payload):payload;
 const local=Buffer.alloc(30);
 local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(method,8);
 local.writeUInt32LE(comp.length,18);local.writeUInt32LE(payload.length,22);local.writeUInt16LE(title.length,26);
 const central=Buffer.alloc(46);
 central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(method,10);
 central.writeUInt32LE(comp.length,20);central.writeUInt32LE(payload.length,24);central.writeUInt16LE(title.length,28);
 const offset=local.length+title.length+comp.length;
 const end=Buffer.alloc(22);
 end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(1,8);end.writeUInt16LE(1,10);
 end.writeUInt32LE(central.length+title.length,12);end.writeUInt32LE(offset,16);
 const bytes=Buffer.concat([local,title,comp,central,title,end]);
 const b=new Blob([bytes],{type:'application/zip'});
 b.name='ui.zip';return b;
}
const context=vm.createContext({
 Blob,Response,TextDecoder,DataView,Uint8Array,console,DecompressionStream,
 state:{imageAssignments:{}},
 esc:x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))
});
vm.runInContext(fs.readFileSync('image_pack.js','utf8')+'\nthis.tests={galleryZipEntries,galleryZipRead,galleryCardMarkup,galleryDetailMarkup,gallerySettingsMarkup}',context,{filename:'image_pack.js'});
(async()=>{
 for(const method of [0,8]){
  const original=Buffer.from('example bytes for an original PNG','utf8');
  const zip=zipFixture('ui/photos/air nato 2.jpg',original,method);
  const entries=await context.tests.galleryZipEntries(zip);
  assert.equal(entries.length,1,'una imagen detectada');
  assert.equal(entries[0].method,method);
  const blob=await context.tests.galleryZipRead(zip,entries[0]);
  assert.equal(Buffer.compare(Buffer.from(await blob.arrayBuffer()),original),0,'datos extraídos sin corrupción');
 }
 const hidden=zipFixture('../../evil.png',Buffer.from('bad'),0);
 assert.equal((await context.tests.galleryZipEntries(hidden)).length,0,'prohibido usar rutas fuera de ui');
 vm.runInContext("galleryIndex=[{id:'ui/photos/air nato 2.jpg',name:'air nato 2',folder:'photos'}];galleryKeySet=new Set(galleryIndex.map(x=>x.id));",context);
 const aircraft={id:'a6e',category:'aircraft',name:'A-6E',nation:'EE. UU.'};
 assert.equal(context.tests.galleryCardMarkup(aircraft),'','no se muestran imágenes genéricas');
 const manifest=JSON.parse(fs.readFileSync('verified_images.json','utf8'));
 assert.equal(Object.keys(manifest.items).length,36);
 const units=['a6e','fa18a','f14a','ea6b','e2c','s3a','sh2f','sh3h','hh3e','ah1t','nimitz','missouri','virginia','kidd','samuel','losangeles'];
 const catalog=JSON.parse(fs.readFileSync('data.json','utf8'));
 const armament=catalog.entries.filter(e=>e.category==='weapon').map(e=>e.id);
 assert.equal(armament.length,20);
 for(const id of [...units,...armament]){
   const p=manifest.items[id];
   assert.ok(p,'Imagen documentada para '+id);
   assert.match(p.source,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
   assert.match(p.license,/Dominio público/);
   assert.ok(p.file&&p.label&&p.year&&p.author);
   if(armament.includes(id))assert.ok(Array.isArray(p.ammoIds)&&p.ammoIds.length,'ID interno para '+id);
 }
 assert.equal(manifest.items.agm84c.exactVariant,false,'No confundir AGM-84A y C');
 assert.match(manifest.items.agm84c.note,/NO identifica el AGM-84C/);
 assert.match(manifest.items.missouri.note,/1986/);
 assert.match(manifest.items.samuel.note,/1986/);
 assert.equal(manifest.items.aim54.exactVariant,false,'Prototipo YAIM-54A identificado como tal');
 vm.runInContext('galleryVerified='+JSON.stringify(manifest.items),context);
 assert.match(context.tests.galleryCardMarkup(aircraft),/Fotografía histórica/);
 assert.match(context.tests.galleryCardMarkup(aircraft),/commons.wikimedia.org/);
 assert.match(context.tests.galleryCardMarkup(aircraft),/Fuente y licencia/);
 const gameHarpoon={id:'game-ammo:usn_agm-84c',gameAmmoId:'usn_agm-84c',category:'weapon',name:'AGM-84C'};
 assert.match(context.tests.galleryCardMarkup(gameHarpoon),/AGM-84A Harpoon/,'La foto se vincula a la entrada de munición interna');
 const gameMissile={id:'game-ammo:usn_rim-67b',gameAmmoId:'usn_rim-67b',category:'weapon',name:'RIM-67'};
 assert.match(context.tests.galleryCardMarkup(gameMissile),/RIM-67 Standard ER/,'El misil naval tiene imagen');
 const unknown={id:'game-ammo:unknown',gameAmmoId:'unknown',category:'weapon',name:'Desconocido'};
 assert.equal(context.tests.galleryCardMarkup(unknown),'','No asignar fotografías arbitrarias a otros INI');

 assert.match(context.tests.galleryDetailMarkup({id:'agm84c',name:'Harpoon',category:'weapon',nation:'EE. UU.'}),/NO identifica el AGM-84C/);
 assert.match(context.tests.galleryCardMarkup({id:'hh3e',name:'HH-3E',category:'aircraft',nation:'EE. UU.'}),/U.S. Air Force/);
 assert.match(context.tests.galleryDetailMarkup(aircraft),/data-gallery-pick="a6e"/);
 vm.runInContext("state.imageAssignments.a6e='ui/photos/air nato 2.jpg'",context);
 assert.match(context.tests.galleryCardMarkup(aircraft),/Imagen asignada por ti/);
 assert.match(context.tests.gallerySettingsMarkup(),/imágenes guardadas/);
 console.log('OK: ZIP almacenado y DEFLATE, rutas seguras, fotografías verificadas y asignación privada');
})().catch(e=>{console.error(e);process.exitCode=1});
