'use strict';
const PLAN_MISSIONS=[
  {
    "id": "surface",
    "name": "Atacar buques",
    "icon": "↗",
    "hint": "Ataque de superficie",
    "choices": [
      [
        "screened",
        "Formación con escoltas y SAM"
      ],
      [
        "light",
        "Buques con defensa limitada"
      ],
      [
        "unknown",
        "Defensas desconocidas"
      ]
    ]
  },
  {
    "id": "land",
    "name": "Atacar tierra",
    "icon": "⌖",
    "hint": "Objetivos costeros",
    "choices": [
      [
        "sam",
        "Hay radares o SAM"
      ],
      [
        "clear",
        "Sin SAM confirmado"
      ],
      [
        "unknown",
        "Defensas desconocidas"
      ]
    ]
  },
  {
    "id": "air",
    "name": "Interceptar",
    "icon": "✈",
    "hint": "Amenaza aérea",
    "choices": [
      [
        "bombers",
        "Bombarderos antibuque"
      ],
      [
        "fighters",
        "Cazas hostiles"
      ],
      [
        "unknown",
        "Contacto aéreo no identificado"
      ]
    ]
  },
  {
    "id": "defend",
    "name": "Defender flota",
    "icon": "◇",
    "hint": "Protección del Nimitz",
    "choices": [
      [
        "missiles",
        "Misiles antibuque en vuelo"
      ],
      [
        "airraid",
        "Posible ataque aéreo"
      ],
      [
        "general",
        "Proteger un convoy o formación"
      ]
    ]
  },
  {
    "id": "sub",
    "name": "Antisubmarina",
    "icon": "≈",
    "hint": "Sonar y torpedos",
    "choices": [
      [
        "confirmed",
        "Submarino confirmado"
      ],
      [
        "possible",
        "Contacto submarino dudoso"
      ],
      [
        "torpedo",
        "Torpedo detectado"
      ]
    ]
  },
  {
    "id": "identify",
    "name": "Identificar",
    "icon": "◎",
    "hint": "Contactos desconocidos",
    "choices": [
      [
        "surface",
        "Contacto de superficie"
      ],
      [
        "air",
        "Contacto aéreo"
      ],
      [
        "sub",
        "Contacto submarino"
      ],
      [
        "esm",
        "Emisiones radar"
      ]
    ]
  }
];
const PLAN_DEFAULT={
  "mission": "surface",
  "scenario": "screened",
  "range": "medium",
  "identified": "uncertain",
  "aswRisk": true,
  "mods": {
    "sh2": false,
    "sh3": false
  },
  "inventory": {
    "a6e": 14,
    "fa18a": 12,
    "f14a": 8,
    "ea6b": 2,
    "e2c": 2,
    "s3a": 4,
    "sh2f": 4,
    "sh3h": 1,
    "virginia": 1,
    "kidd": 1,
    "samuel": 1,
    "losangeles": 1
  },
  "ammo": {
    "harpoon": "unknown",
    "phoenix": "unknown",
    "torpedo": "unknown"
  }
};
function computePlan(p){
 const count=id=>Math.max(0,Math.floor(Number(p.inventory?.[id]??0)||0));
 const ready=id=>count(id)>0;
 const ammo=name=>p.ammo?.[name]||'unknown';
 const out={headline:"",status:"orientativa",why:"",primary:[],support:[],steps:[],warnings:[],alternatives:[],related:[],notes:[]};
 const add=(where,id,profile,why)=>{if(ready(id))out[where].push({id,profile,why,available:count(id)})};
 const note=(msg)=>out.warnings.push(msg);
 const known=p.identified==='confirmed';
 const near=p.range==='near',far=p.range==='far';
 const e2=()=>add("support","e2c","AEW","Mantener un cuadro táctico actualizado");
 const cap=()=>{if(ready("f14a"))add("support","f14a","Air to Air / Intercept","Cobertura aérea");else if(ready("fa18a"))add("support","fa18a","Air to Air","Cobertura aérea alternativa");else note("No has registrado cazas disponibles para cobertura.")};
 const ew=()=>{if(ready("ea6b"))add("support","ea6b","EW","Apoyo electrónico");else note("No hay EA-6B disponibles: falta la opción habitual de apoyo EW.")};
 const patrol=()=>{if(ready("s3a"))add("primary","s3a","ASW / ASW Hunter","Localizar y seguir el contacto");if(ready("sh2f"))add("support","sh2f","ASW","Búsqueda próxima");else if(ready("sh3h"))add("support","sh3h","ASW","Apoyo helicóptero")};
 const weaponWarning=(name,word)=>{if(ammo(name)==="unknown")note("No has registrado existencias de "+word+". Verifica el almacén antes de preparar la salida.")};
 const surfaceTarget=p.mission==="surface"||p.mission==="land";
 if(surfaceTarget&&!known){
  out.status="comprobar primero";out.headline="Primero, identifica el objetivo";
  out.why="La identidad del contacto está marcada como dudosa. No es prudente preparar el lanzamiento como si el blanco estuviera confirmado.";
  e2();if(ready("s3a"))add("primary","s3a","Patrulla / ASW","Exploración y corroboración");else if(ready("losangeles"))add("primary","losangeles","Seguimiento discreto","Observar sin exponer la flota");
  out.steps=["Correlaciona sensores y confirma si el contacto es hostil.","Revisa qué defensas se han detectado y actualiza la identificación.","Cuando esté confirmado, cambia «Identificación» a «Confirmada» para obtener opciones de ataque."];
  out.related=["e2c","s3a"];return out;
 }
 switch(p.mission){
  case "surface":{
   out.headline="Ataque naval coordinado";out.why="El A-6E es el vector antibuque principal de tu campaña; la escolta y la guerra electrónica dependen de la defensa enemiga.";
   e2();cap();
   if(p.scenario!=="light")ew();
   if(ready("a6e")&&ammo("harpoon")!=="empty"){
    add("primary","a6e",far?"Anti Ship Long Range (verificar carga)":"Anti Ship / Anti Ship Heavy (según existencias)","Ataque con AGM-84C Harpoon");
    out.related=["a6e","agm84c"];weaponWarning("harpoon","Harpoon");
   }else{
    out.status="recursos limitados";
    if(!ready("a6e"))note("Has indicado cero A-6E disponibles.");
    if(ammo("harpoon")==="empty")note("Has indicado que no quedan Harpoon.");
    if(p.mods?.sh3&&ready("sh3h")&&!p.aswRisk&&!far&&ammo("harpoon")!=="empty"){
      add("primary","sh3h","Anti-ship · 4 Harpoon (mod)","Alternativa experimental, no histórica");
      note("Usar Harpoon SH-3H aparta a tu único Sea King de ASW y no reproduce una capacidad histórica.");
    }
    if(p.mods?.sh2&&ready("sh2f")&&!p.aswRisk&&!far)out.alternatives.push("Better SH-2 Loadouts podría ofrecer un perfil Anti-ship; confirma las armas exactas antes de usarlo.");
    if(!out.primary.length){out.headline="No hay ataque antibuque listo";out.why="Con los recursos registrados, es preferible reconocer o conservar la fuerza antes que suponer misiles o aviones que no están disponibles.";}
   }
   out.steps=["Confirma composición del grupo enemigo y defensas de sus escoltas.","Mantén vigilancia AEW, escolta aérea y apoyo EW si hay SAM.","Lanza una oleada proporcionada; observa resultados y reservas antes de repetir."];
   if(far)note("Long Range normalmente mejora la autonomía de vuelo, no el alcance del Harpoon.");
   if(p.scenario==="unknown")note("Defensa enemiga desconocida: prioriza reconocimiento antes de comprometer toda la oleada.");
   if(p.aswRisk)out.alternatives.push("Con submarinos próximos, conserva SH-2F y SH-3H para ASW en lugar de emplearlos en ataque modificado.");
   break;
  }
  case "land":{
   out.headline="Ataque costero con protección";out.why="Separa la neutralización de defensas de la fase de ataque al objetivo, cuando corresponda.";
   e2();cap();if(p.scenario!=="clear")ew();
   if(ready("a6e")){
    add("primary","a6e",p.scenario==="clear"?"Strike Precision / Strike":"SEAD / SEAD Advanced y después Strike Precision","Reconocer defensas y emplear el armamento apropiado");
    out.related=["a6e","agm78d","agm45b","gbu12"];
    out.steps=["Identifica SAM, radares y el blanco final.","Si hay radares hostiles, prepara la supresión antes del ataque principal.","Confirma designación, combustible y retorno de la escolta."];
   }else if(ready("fa18a")){
    out.status="opción limitada";add("primary","fa18a","Strike (si existe en tu instalación)","Alternativa de ataque que requiere verificar el preset");
    out.steps=["Revisa la carga real del F/A-18A.","No entres en el sector SAM sin reconocimiento.","Mantén una reserva para proteger la flota."];
    note("No hay A-6E disponibles y el perfil exacto del Hornet debe confirmarse en el juego.");
   }else{out.status="sin vector";out.headline="Faltan aviones de ataque";out.steps=["No comprometas el grupo sin fuerza aérea de ataque.","Reconoce los objetivos y conserva tus unidades.","Revisa disponibilidad de aparatos y municiones."];}
   if(p.scenario==="unknown")note("Defensas no identificadas: la fase de reconocimiento es prioritaria.");
   note("Para 1985 no presupongas AGM-88 HARM en el A-6E.");
   if(far)note("Antes de despegar, confirma autonomía y capacidad real de alcanzar el blanco.");
   break;
  }
  case "air":{
   out.headline=p.scenario==="bombers"?"Interceptar bombarderos antes del lanzamiento":"Establecer superioridad aérea";
   out.why="La detección AEW y los interceptores deben proteger al grupo, no perseguir contactos irrelevantes.";
   e2();
   if(!known||p.scenario==="unknown"){
    out.status="identificar";out.headline="Clasificar antes de atacar";out.steps=["Correlaciona velocidad, rumbo y altura con la información AEW.","Mantén cazas preparados sin identificar cualquier eco como hostil.","Si se confirma la amenaza, usa la CAP e interceptores disponibles."];
   }else if(ready("f14a")){
    add("primary","f14a",p.scenario==="bombers"&&ammo("phoenix")!=="empty"?"Air to Air Intercept":"Air to Air / Intercept (según armas)","Intercepción y cobertura BVR");
    if(ready("fa18a"))add("support","fa18a","Air to Air","Protección complementaria");
    out.steps=["Conserva identificación y cobertura del E-2C.","Intercepta sin desproteger el Nimitz.","Revisa combustible y armas antes de perseguir blancos alejados."];
    if(ammo("phoenix")==="empty")note("Has indicado cero Phoenix; no bases la interceptación en ese misil.");
    if(ammo("phoenix")==="unknown")weaponWarning("phoenix","AIM-54 Phoenix");
    out.related=["f14a","aim54","aim7","aim9"];
   }else if(ready("fa18a")){
    out.status="cobertura reducida";add("primary","fa18a","Air to Air","Alternativa sin F-14 disponibles");
    out.steps=["Asegura la identificación.","Usa Hornet en CAP y reduce distancias de defensa.","Mantén el Hawkeye protegido."];
    note("Cero F-14 registrados: se reduce la defensa de interceptación exterior.");
   }else{out.status="sin cazas";out.headline="No hay cazas registrados";out.steps=["Prioriza evasión y defensa naval.","Mantén vigilancia de la amenaza.","Revisa disponibilidad antes de iniciar una intercepción."];note("No hay F-14A ni F/A-18A disponibles.");}
   if(far)note("Comprueba autonomía y tiempo de interceptación: «lejos» no equivale a alcance de misil.");
   break;
  }
  case "defend":{
   out.headline=p.scenario==="missiles"?"Proteger al grupo de misiles entrantes":"Defensa escalonada de la flota";
   out.why="Los escoltas y la CAP cumplen funciones distintas; preservar el Nimitz es la prioridad.";
   if(ready("virginia"))add("primary","virginia","Defensa aérea naval","Capa de defensa SAM");
   if(ready("kidd"))add("primary","kidd","Defensa aérea de escolta","Protección aérea de la formación");
   if(ready("samuel"))add("support","samuel","Escolta","Cobertura complementaria según armas disponibles");
   e2();cap();out.related=["rim66","rim67"];
   out.steps=p.scenario==="missiles"?["Comprueba rumbo y proximidad de los misiles entrantes.","Emplea las defensas SAM y contramedidas disponibles del grupo.","Después del ataque, revisa daños y munición de los escoltas."]:["Establece una pantalla naval, AEW y CAP.","No disperses los escoltas de la formación.","Mantén reserva para amenazas aéreas y submarinas."];
   if(!ready("virginia")&&!ready("kidd")){out.status="defensa comprometida";note("Has registrado fuera de servicio el Virginia y el Kidd. No presupongas defensa de zona.");}
   if(p.scenario==="missiles")note("No hay garantía de interceptar todos los misiles; la supervivencia depende de la situación del juego.");
   break;
  }
  case "sub":{
   out.headline=p.scenario==="torpedo"?"Torpedo detectado: respuesta defensiva":"Localizar y clasificar contacto submarino";
   out.why="La búsqueda ASW debe evitar confundir submarinos propios y no comprometer recursos sin clasificación.";
   patrol();
   if(ready("losangeles"))add("support","losangeles","Patrulla SSN en sector separado","Seguimiento submarino independiente");
   out.related=["mk46","mk48","s3a"];
   if(p.scenario==="torpedo")out.steps=["Aplica maniobras y contramedidas que admita el juego.","Evita dispersar tus escoltas mientras dura la amenaza.","Localiza la plataforma lanzadora cuando la situación sea estable."];
   else out.steps=["Correlaciona sonar y sonoboyas sin asumir identidad hostil.","Confirma posición del Los Angeles propio y del contacto.","Emplea torpedos solo si hay identificación, geometría y munición suficientes."];
   if(ammo("torpedo")==="empty")note("Torpedos registrados como agotados: la prioridad es seguimiento y evasión, no ataque.");
   else weaponWarning("torpedo","torpedos");
   if(!out.primary.length&&p.scenario!=="torpedo"){out.status="capacidad reducida";note("No hay S-3A registrado: revisa tus otras plataformas ASW.");}
   if(p.mods?.sh3&&!p.aswRisk)out.alternatives.push("El Sea King con Harpoon es una opción antibuque modded, pero no debe confundirse con una carga ASW.");
   break;
  }
  case "identify":{
   out.headline="Identificar antes de decidir";out.why="Una detección no equivale a identificar un blanco hostil.";
   e2();
   if(p.scenario==="sub"){patrol();if(ready("losangeles"))add("support","losangeles","Observación discreta","Correlación de pistas");}
   if(p.scenario==="surface"&&ready("s3a"))add("primary","s3a","Patrulla / ASW","Exploración marítima");
   if(p.scenario==="esm"&&ready("ea6b"))add("support","ea6b","EW","Entorno electromagnético");
   if(p.scenario==="air")cap();
   out.steps=["Reúne pistas con los sensores disponibles.","Comprueba rumbo, velocidad, firmas y correlación con unidades propias.","Clasifica el contacto antes de elegir un procedimiento ofensivo o defensivo."];
   if(p.scenario==="esm")note("Un emisor ESM no identifica necesariamente por sí solo un buque concreto.");
   out.related=["e2c"];
   break;
  }
  default:out.headline="Selecciona una misión";
 }
 if(p.aswRisk&&p.mission!=="sub"&&p.mission!=="identify")out.notes.push("Has indicado riesgo submarino: reserva aeronaves ASW en vez de dedicar todos los helicópteros a ataque.");
 if(p.mods?.sh2&&ready("sh2f")&&!p.aswRisk&&near&&p.mission==="surface")out.alternatives.push("Better SH-2 Loadouts aporta una opción Anti-ship para SH-2F, sujeta a verificación en tu instalación.");
 if(p.mission==="surface"&&p.mods?.sh3&&ready("sh3h")&&!p.aswRisk&&!far&&ammo("harpoon")!=="empty")out.alternatives.push("Harpoon SH-3H es una opción ficticia de mod: no sustituye automáticamente al ataque del A-6E.");
 return out;
}
