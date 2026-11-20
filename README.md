# SEA POWER ATLAS — Copiloto táctico personal

Asistente táctico para móvil y escritorio, con un catálogo integrado de unidades, armas y existencias para la campaña Task Force ambientada en **1985**.

## Estado actual · versión 3.12

- **Lote 05 — cobertura visual internacional:** 17 nuevas imágenes revisadas en las fichas de Wikimedia Commons, con prioridad para 8 sistemas terrestres, 5 clases de buque y 4 misiles sin aeronave. El catálogo incluye ahora **124 referencias** y representa **123 identificadores distintos** de los 1.107 del juego. Faltan **984**. Las coincidencias parciales de familia y las fotos posteriores a 1985 quedan señaladas.

- **Seguimiento del 100 %:** `reports/galeria-cobertura-1985.json` contabiliza cada uno de los 1.107 ID originales: **106 identificadores distintos con imagen asignada y 1.001 pendientes** (las 107 referencias incluyen una variante editorial duplicada). Se regenera con `node tools/catalog_image_coverage.cjs --write` y se valida con `--check`; las imágenes de familia no se confunden con una fotografía exacta.

- **Lote fotográfico adicional:** 19 archivos individuales de Wikimedia Commons comprobados (1 aeronave, 6 buques, 4 unidades terrestres y 8 armas), elevando a **107** las referencias visuales. Para cada una se ha conservado autor, año, licencia y diferenciación entre variante exacta, familia o ilustración. No se asignan fotografías genéricas a IDs sin correspondencia.

- **Galería internacional ampliada:** 52 entradas visuales del juego fuera de la Task Force (22 aeronaves, 12 buques, 4 terrestres y 14 armas), totalizando **88 referencias**. Las 16 incorporaciones recientes se comprobaron contra páginas originales de Wikimedia Commons y los ID de los INI.
- **Galería internacional del juego original:** 36 nuevas fotografías y fichas externas (16 aeronaves, 9 buques y 11 armas), para un total previo de 72 referencias. Incluye unidades soviéticas, británicas, francesas y argentinas, y munición no perteneciente a tu Task Force. Las imágenes están enlazadas a IDs de los INI y muestran autor, licencia, fecha y limitaciones históricas.
- **Encuadre de armamento corregido:** imágenes completas sin `object-fit: cover`, con once referencias revisadas para mostrar el arma sin aeronaves o con mayor protagonismo. La atribución indica cuándo se utiliza una ilustración o un ejemplar posterior a 1985.
- **Cobertura visual de toda la flota de referencia y su armamento principal:** 16 clases de unidades y 20 fichas de armas reciben imágenes localizadas en Wikimedia Commons, sin subida de fotografías a GitHub Pages.
- **Fuentes y variantes documentadas:** año de la foto, organismo autor, licencia, enlace a la imagen original y advertencia cuando solo se representa la familia de un arma y no la subvariante del INI.
- **Advertencias cronológicas de 1985:** el USS Missouri modernizado y el USS Samuel B. Roberts (FFG-58) entraron en servicio en 1986, aunque el escenario del juego los incorpore en 1985. Sus fotografías están fechadas honestamente.
- **Importación privada opcional:** las asignaciones de imágenes importadas por el usuario mantienen prioridad sobre las fotografías públicas del catálogo.



- **Selección inicial original** de A-6E, F-14A, S-3A, SH-3H y USS Nimitz, ahora ampliada al resto de la Task Force.
- **Sin imágenes genéricas**: las unidades sin fotografía verificada no reciben fotografías aleatorias. Las asignaciones privadas anteriores permanecen disponibles si el usuario las había importado.
- **Imágenes externas**: las fotos se sirven desde Wikimedia Commons, no se redistribuyen en GitHub Pages; requieren conexión para cargarse inicialmente.



- **Imágenes privadas del juego:** `ui.zip` se puede importar desde «Mods y datos». Se aceptan las fotografías e ilustraciones incluidas en el ZIP original o en el paquete optimizado facilitado al usuario. Opcionalmente se incluyen fondos de carga.
- **No se distribuyen imágenes propietarias en GitHub Pages.** El navegador redimensiona y almacena las fotos en IndexedDB del dispositivo. El usuario puede asignar fotos a cualquier ficha y eliminar sus importaciones de forma independiente de la campaña.
- **Etiquetado honesto:** las imágenes automáticas por categoría son ilustrativas; ningún archivo de `ui.zip` demuestra por sí solo representar un modelo concreto de avión, buque o arma. Las fotos de las armas deben asignarse manualmente.
- **Límite de copias:** el backup JSON guarda las asignaciones a las fichas, pero no los blobs de imágenes; es necesario importar nuevamente el ZIP en otro dispositivo.



- **Contadores reactivos**: resúmenes, categorías y resultados se ajustan a búsqueda, bando, favoritos, año, tipo y ámbito seleccionado; «Mi flota» no suma unidades externas.
- **Navegación entre fichas**: las unidades enlazan armas y equipos; las armas permiten abrir las plataformas de tu flota que las utilizan y otros modelos del juego. Las menciones específicas y los componentes de loadouts también enlazan sus fichas.


- **Catálogo unificado**: las fichas y el antiguo Arsenal son una única sección «Unidades y armamento». Filtros Todo el juego / Mi flota / En stock / Fuera de flota, búsqueda y edición de existencias desde tarjetas y fichas de armamento.
- **Sin pérdida de registros**: se conserva `state.campaign.stock`, `state.campaign.use`, favoritos y notas. Los enlaces antiguos `#/armory` redirigen al catálogo filtrado por armas.
- **Cobertura de archivos originales**: 636 modelos de unidades y 471 definiciones de munición/equipo, con autonomía y distancias nominales cuando constan en los INI.

- **45 fichas de referencia**: 10 tipos de aeronaves, 6 buques, 20 entradas de armamento (incluida una variante de Mk 46), 3 sonoboyas y 6 amenazas soviéticas.
- **Copiloto táctico interactivo** con decisiones basadas en misión, distancia, identificación, munición, disponibilidad y mods seleccionados.
- **52 loadouts de 10 aeronaves extraídos de `original.zip`, resueltos para 1985**, con 35 tipos de munición/equipo y tiempos de preparación. `source_1985.json` guarda datos estructurados, no los INI completos.
- **S-3A Viking**: siete perfiles originales (ASW, ASWBomb, Strike, StrikeHeavy, StrikeLongRange, AntiShip, CAS). La carga ASW está verificada en los INI y en la captura: cuatro Mk-46 Mod 5 NEARTIP, 42 DIFAR, 12 DICASS y 8 VLAD, preparación de 30 min. Los números entre paréntesis del menú no son IDs de perfiles.
- **Copiloto con desglose real de carga** para la configuración sugerida, distinguiendo bombas, misiles, sonoboyas y depósitos.
- **21 mods de Steam Workshop** catalogados, con opciones de armamento añadidas y advertencias.
- **16 perfiles Workshop extraídos de los INI entregados**: SH-2F (`3683640615`, 12 perfiles) y SH-3H (`3400655872`, 4 perfiles), en `source_workshop_1985.json`. Mantienen su procedencia separada de los originales y señalan qué perfiles originales sustituyen.
- **Custom Loadout Editor** (`3606134711`): 43 archivos de estaciones; siete modelos de tu flota aparecen en la lista de soporte. Son **opciones configurables**, no cargas personales ya guardadas. El ZIP no incluye los presets de usuario.
- **Control independiente de Harpoon y Penguin Mk 2** en el copiloto: el SH-2F modded carga dos Penguin, el SH-3H modded cuatro AGM-84A. `SEADAdvanced` de SH-2F emplea AGM-122A con IOC 1986, advertido como anacrónico para 1985.
- La presencia del INI en la colección no demuestra prioridad de carga ni que el mod esté activado. El usuario marca qué modificaciones están operativas desde el asistente; no se modifica ninguna instalación de juego.
- Búsqueda global, filtros por tipo/bando/campaña/año, favoritos y comparador de dos fichas.
- Ventana de detalle con funciones, ventajas, limitaciones, loadouts orientativos, enlaces a armas y notas privadas.
- Página de la Task Force (55 aeronaves, 5 buques de superficie, un SSN).
- Glosario de conceptos: CAP, AEW, SEAD, ASW, EW, EMCON y más.
- Importación de **paquetes JSON** y creación manual de fichas, con copia de seguridad / restauración.
- PWA instalable y *offline* en HTTPS o localhost después de una primera carga, si el navegador lo permite.
- Sin dependencias, seguimiento, cuentas, publicidad, frameworks ni conexión a servidores propios.

## Cómo abrir desde móvil, tablet y portátil

### Opción A: red local (rápido)

En el ordenador donde hayas descomprimido esta carpeta:

```bash
cd sea-power-atlas
python -m http.server 8080 --bind 0.0.0.0
```

Desde el portátil: `http://localhost:8080`.

Desde el móvil o la tablet, conectados a la **misma Wi-Fi**, abre `http://IP_LOCAL_DEL_ORDENADOR:8080`.

En Windows la IP se consulta con `ipconfig`; en Linux con `hostname -I`. Puede ser necesario permitir el puerto 8080 en el cortafuegos. **Mantén el servidor en una red privada confiable; no abras el puerto a Internet**. El ordenador debe estar encendido. El modo PWA/offline requiere HTTPS o localhost; la conexión HTTP por IP local sirve para navegar, pero quizá no permita instalar o guardar la aplicación offline.

### Opción B: GitHub Pages / hosting estático HTTPS (recomendado para varios dispositivos)

1. Crea un repositorio dedicado (comprueba si será público; GitHub Pages puede publicar contenidos que no quieres compartir).
2. Sube **el contenido de esta carpeta** (index.html, app.js, styles.css, data.json, assets/, packs/, etc.) a la raíz del repositorio.
3. En este repositorio ya funciona **Settings → Pages → GitHub Actions** mediante `.github/workflows/pages.yml` (sin servicios de pago).
4. Abre `https://juanjitodevelop.github.io/SeaPower-Atlas/` y usa **Añadir a pantalla de inicio** para instalarla como PWA.

La publicación **no sincroniza tus datos privados**: favoritos, notas y paquetes importados se almacenan localmente en cada navegador. Para migrarlos, usa Mods y datos → Exportar/Restaurar. Si deseas sincronización real multi-dispositivo, una futura versión necesitará backend y autenticación (o integración específica con algún almacenamiento remoto).

**No publiques notas privadas dentro de `data.json`, `app.js` ni archivos del repositorio.** La app guarda las notas en `localStorage` en cada navegador, pero una copia JSON exportada sí contiene datos privados.

## Regenerar los datos del juego

Tras actualizar Sea Power, comprime el contenido de la carpeta `Sea Power_Data/StreamingAssets/original` preservando rutas internas (`aircraft/...`, `ammunition/...`, etc.). En el equipo donde tengas Python 3:

```bash
python tools/extract_sea_power.py original.zip --year 1985 --output source_1985.json
```

Comprueba los cambios del JSON y sustitúyelo en el repositorio. La herramienta no altera ningún archivo de tu instalación. También puedes exportar auditoría extendida de estaciones con `--full` y otro nombre de archivo.

**Límite:** el extractor abarca únicamente los diez tipos de aeronaves de la campaña actual. No mezcla automáticamente archivos del Workshop ni calcula almacenes disponibles en una partida.

## Paquetes de mods

El importador admite JSON de este esquema:

```json
{
  "name": "Nombre del mod",
  "description": "Datos y versión del paquete",
  "entries": [
    {
      "id": "prefijo-mod-unidad-1",
      "name": "Nombre de la unidad",
      "category": "aircraft",
      "role": "Función",
      "summary": "Descripción",
      "nation": "EE. UU.",
      "year": 1985,
      "tags": ["SEAD"],
      "equipment": ["agm84c"],
      "stats": [{"label": "Dato", "value": "Valor"}],
      "loadouts": [{"name": "Anti Ship", "description": "Configuración verificada"}],
      "strengths": ["Ventaja"],
      "cautions": ["Limitación"],
      "tip": "Consejo"
    }
  ]
}
```

Categorías: `aircraft`, `ship`, `weapon`, `sensor`, `enemy`. Requiere `id`, `name`, `category`, `summary`. El ID debe ser único en toda la biblioteca; utiliza un prefijo de mod. Se admiten hasta 500 fichas por paquete, 2 MB máximo en la interfaz. `packs/ejemplo-euromod.json` incluye un ejemplo **didáctico**, no una extracción del mod.

**Los mods de Workshop no están incorporados en esta extracción.** `source_1985.json` procede de los archivos `StreamingAssets/original` facilitados por el jugador. Los perfiles modificados por Workshop, los sistemas de buques y los sensores de `systems/` deberán comprobarse por separado; no se han copiado los INI completos ni los recursos gráficos del juego.

## Precisión y limitaciones

Las 45 fichas son una **base educativa editorial**. Los 52 perfiles de `source_1985.json` se han calculado desde archivos originales para 1985. Las cantidades se deducen de estaciones/racks y son orientativas cuando hay contenedores, reglas internas y mods. Las reservas reales de Task Force no están sincronizadas con la web. En particular, el USS Missouri (BB-63) volvió al servicio en **mayo de 1986** y la fragata USS Samuel B. Roberts (FFG-58) entró en servicio en **abril de 1986**, aunque ambas figuren en la campaña personal de 1985.

Fuentes para contrastar futuras ampliaciones:

- Sea Power anuncios / notas de cambios: https://steamcommunity.com/app/1286220/allnews/
- Referencia comunitaria: https://sea-power.pmctactical.org/unit-reference.php
- EuroMod (Steam Workshop): https://steamcommunity.com/sharedfiles/filedetails/?id=3390330875
- Manual oficial, accesible desde Steam: https://store.steampowered.com/app/1286220/

## Estructura

- `index.html`: interfaz.
- `styles.css`: diseño responsive y tema oscuro.
- `app.js`: navegación, filtros, notas, favoritos, mod packs y comparación.
- `data.json`: catálogo editorial editable.
- `source_1985.json`: datos compactos calculados de los INI de 10 aeronaves para 1985.
- `source.js`: visualizador y relaciones entre cargas del juego y el copiloto.
- `planner.js`, `planner.test.cjs`: motor de decisiones y pruebas.
- `tools/extract_sea_power.py`: extractor reproducible para regenerar datos tras actualizar el juego.
- `sw.js`: caché PWA.
- `manifest.webmanifest`, `assets/icon.svg`: instalación y marca.
- `packs/`: ejemplos de archivos de datos.

Licencia: código de ejemplo para uso personal. Sea Power y nombres comerciales corresponden a sus respectivos titulares; esta guía no es un producto oficial.

Fuentes históricas oficiales para estas fechas: [USS Missouri](https://www.history.navy.mil/research/histories/ship-histories/danfs/m/missouri-iii.html) y [USS Samuel B. Roberts](https://www.history.navy.mil/research/histories/ship-histories/danfs/s/samuel-b--roberts--ffg-58--iii.html).
## Investigación: datos de una partida activa

Se ha estudiado una integración no invasiva mediante Tacview en tiempo real, archivo `.acmi` y partidas guardadas `.sav`. Los hallazgos, límites y protocolo de seguridad se encuentran en [`docs/integracion-partida-en-tiempo-real.md`](docs/integracion-partida-en-tiempo-real.md). **No hay aún conexión activa ni lectura automática de partidas en Atlas**.
