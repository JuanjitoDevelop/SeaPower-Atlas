# SEA POWER ATLAS — Copiloto táctico personal

Asistente de decisiones para móvil y escritorio, con enciclopedia secundaria y apoyo para la campaña Task Force ambientada en **1985**.

## Estado actual · versión 2.1

- **45 fichas de referencia**: 10 tipos de aeronaves, 6 buques, 20 entradas de armamento (incluida una variante de Mk 46), 3 sonoboyas y 6 amenazas soviéticas.
- **Copiloto táctico interactivo** con decisiones basadas en misión, distancia, identificación, munición, disponibilidad y mods seleccionados.
- **S-3A Viking ASW (18) verificado mediante captura del juego**: Mk-46 Mod 5 NEARTIP ×4, AN/SSQ-53 DIFAR ×42, AN/SSQ-62 DICASS ×12 y AN/SSQ-77 VLAD ×8, preparación 30 min. Los otros cinco perfiles visibles se registran sin inventar su composición.
- **21 mods de Steam Workshop** catalogados, con opciones de armamento añadidas y advertencias.
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
3. En GitHub: **Settings → Pages → Deploy from a branch → main / (root)**.
4. Abre la URL HTTPS de Pages en tus dispositivos. Usa **Añadir a pantalla de inicio / Instalar aplicación** para disponer de ella como PWA.

La publicación **no sincroniza tus datos privados**: favoritos, notas y paquetes importados se almacenan localmente en cada navegador. Para migrarlos, usa Mods y datos → Exportar/Restaurar. Si deseas sincronización real multi-dispositivo, una futura versión necesitará backend y autenticación (o integración específica con algún almacenamiento remoto).

**No publiques notas privadas dentro de `data.json`, `app.js` ni archivos del repositorio.** La app guarda las notas en `localStorage` en cada navegador, pero una copia JSON exportada sí contiene datos privados.

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

Categorías: `aircraft`, `ship`, `weapon`, `enemy`. Requiere `id`, `name`, `category`, `summary`. El ID debe ser único en toda la biblioteca; utiliza un prefijo de mod. Se admiten hasta 500 fichas por paquete, 2 MB máximo en la interfaz. `packs/ejemplo-euromod.json` incluye un ejemplo **didáctico**, no una extracción del mod.

**La v1 no convierte automáticamente los INI ni el Workshop de Sea Power a fichas.** Una futura herramienta de escritorio podría extraer los archivos del juego y mods instalados, normalizar sus unidades, sensores, armamento y loadouts y generar paquetes JSON verificados. No se han copiado archivos propietarios del juego.

## Precisión y limitaciones

Las 45 fichas son una **base educativa editorial**. Los datos reales de alcance y disponibilidad cambian según versión, fecha, unidad, configuración y mod. En particular, el USS Missouri (BB-63) volvió al servicio en **mayo de 1986** y la fragata USS Samuel B. Roberts (FFG-58) entró en servicio en **abril de 1986**, aunque ambas figuren en la campaña personal de 1985. No se incluye información obtenida de una extracción del juego y no se prometen valores exactos de sus archivos internos.

Fuentes para contrastar futuras ampliaciones:

- Sea Power anuncios / notas de cambios: https://steamcommunity.com/app/1286220/allnews/
- Referencia comunitaria: https://sea-power.pmctactical.org/unit-reference.php
- EuroMod (Steam Workshop): https://steamcommunity.com/sharedfiles/filedetails/?id=3390330875
- Manual oficial, accesible desde Steam: https://store.steampowered.com/app/1286220/

## Estructura

- `index.html`: interfaz.
- `styles.css`: diseño responsive y tema oscuro.
- `app.js`: navegación, filtros, notas, favoritos, mod packs y comparación.
- `data.json`: catálogo editable.
- `sw.js`: caché PWA.
- `manifest.webmanifest`, `assets/icon.svg`: instalación y marca.
- `packs/`: ejemplos de archivos de datos.

Licencia: código de ejemplo para uso personal. Sea Power y nombres comerciales corresponden a sus respectivos titulares; esta guía no es un producto oficial.

Fuentes históricas oficiales para estas fechas: [USS Missouri](https://www.history.navy.mil/research/histories/ship-histories/danfs/m/missouri-iii.html) y [USS Samuel B. Roberts](https://www.history.navy.mil/research/histories/ship-histories/danfs/s/samuel-b--roberts--ffg-58--iii.html).