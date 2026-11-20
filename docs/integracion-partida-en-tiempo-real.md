# Sea Power Atlas — Estudio de integración con partidas en tiempo real

**Fecha de investigación:** 20 de noviembre de 2026.  
**Estado:** factibilidad respaldada; integración Atlas ↔ Sea Power aún **sin desarrollar ni probar en la instalación del usuario**.

## Hallazgo principal

Sea Power ofrece **Tacview Live Telemetry** desde la actualización beta publicada el 3 de julio de 2025. La telemetría se emite mediante un protocolo abierto de Tacview basado en flujos TCP y registros ACMI 2.x. El protocolo de Tacview está documentado públicamente y permite clientes de terceros con una negociación inicial (handshake). **No se ha confirmado aún el puerto concreto, las opciones ni el contenido efectivo del flujo de Sea Power en la versión local del usuario.**

**Importante: niebla de guerra.** La propia publicación del desarrollador indica que la implementación Tacview mostraba todas las unidades enemigas, incluidas las no detectadas. Por ello **no se puede convertir sin más el flujo Tacview en conocimiento táctico legítimo del jugador**. Tampoco hay garantía de que el flujo incluya las existencias, los daños, los sensores detectados, el estado de cubierta o el catálogo de armas disponibles.

### Vías observadas y evaluación

| Fuente | Situación | Uso inicial | Problema |
|---|---|---|---|
| Tacview en directo | Soporte en Sea Power documentado en notas de actualización | Posiciones, trayectorias y eventos que efectivamente exporte el juego | Puede revelar la posición real de contactos ocultos; campos/puerto y permisos por verificar |
| Archivos `.acmi` | Exportados en `Sea Power_Data\Logs` según documentación del juego | Análisis después de misión; comparación de trayectorias | Puede contener también datos ocultos para el jugador |
| Guardados `.sav` | Directorio `%USERPROFILE%\AppData\LocalLow\Triassic Games\Sea Power\saves` | Instantáneas y estudio del formato, si puede interpretarse | Formato interno aún no documentado/validado; no leer partidas abiertas para impedir corrupción |
| Mod dedicado BepInEx/Harmony | Viabilidad técnica demostrada por mods comunitarios como SeaPowerMultiplayerMod | Exportar exclusivamente datos autorizados desde el estado real de la instancia | Mayor mantenimiento y riesgo de incompatibilidades tras actualizaciones |
| API oficial de estado de la partida | **No verificada** en la investigación | No usar hasta disponer de referencia oficial vigente | No inventar endpoints |

## Arquitectura propuesta sin interferir con el juego

1. Un **puente local de solo lectura** en Windows, ejecutado por el jugador, detectaría el flujo TCP Tacview cuando esté activado. Como alternativa se puede analizar una copia del fichero `.acmi` tras finalizar la misión. No cargar DLL ni cambiar el proceso del juego en esta fase.
2. El puente normalizaría solamente eventos y propiedades que se hayan comprobado: `timestamp`, `unitId`, `type`, `position`, `heading`, etc. Los campos no presentes deben conservarse como **desconocidos**, nunca inventarse.
3. Las posiciones de todas las unidades **no** se deben retransmitir directamente a Atlas. En el prototipo inicial se importarán solo datos de unidades amigas elegidas explícitamente y confirmadas por el jugador. Las etiquetas de coalición de Tacview por sí solas no se consideran prueba suficiente de visibilidad o pertenencia.
4. El bridge ofrecería JSON local de tamaño limitado a través de `127.0.0.1` con control de origen y token de sesión. Si Atlas está en GitHub Pages, el navegador puede restringir accesos a servidores HTTP locales por CORS, políticas de red privada y contenido mixto; la entrega a través de HTTPS local, una página local de Atlas o una importación manual son alternativas que se evaluarían.
5. Nunca abrir el puerto Tacview ni el bridge directamente a Internet. Para usarlo desde el móvil, considerar una conexión privada (por ejemplo la VPN existente), con autenticación y TLS apropiados. La publicación de GitHub Pages no debe recibir datos sensibles de misión.
6. Mantener un modo de **análisis posterior** que pueda mostrar toda la verdad sin afectar a una misión en curso, expresamente activado al terminarla.

## Preguntas pendientes y prueba real mínima

En una instalación local y sin activar mods adicionales:

1. Revisar las opciones de Sea Power para habilitar Tacview/telemetría y ejecutar una misión corta de prueba.
2. Identificar si existe un puerto TCP en escucha, qué handshake acepta y qué campos ACMI entrega.
3. Exportar un archivo `.acmi` de una misión de prueba y analizar **una copia**, sin acceder a los guardados originales. Registrar solo la presencia y los tipos de datos, no compartir información oculta.
4. Verificar dos escenarios: una unidad amiga y un contacto enemigo desconocido. Comprobar expresamente si el flujo filtra o expone el contacto oculto.
5. Si no hay forma demostrable de distinguir los contactos conocidos, **descartar el uso del flujo Tacview para recomendaciones en tiempo real**. Mantener únicamente el análisis posterior o valorar un mod BepInEx limitado a la vista del jugador.
6. Para munición, combustible y daños: medir qué campos están presentes realmente; si faltan, podrían requerir un mod de lectura aislado o seguir en Atlas como datos manuales.

## Prototipo sugerido

**Primera iteración:** importador `.acmi` solo para análisis posterior y validador de estructura, sin red ni acceso en vivo.  
**Segunda iteración (si pasa la prueba):** conexión TCP a localhost, filtrada por allowlist de IDs amistosos comprobados, con indicadores de latencia y desconexión.  
**Tercera iteración:** componentes de Atlas que lean el estado autorizado y presenten diferencias sin sobrescribir existencias manuales, notas o campañas.

## Fuentes y trazabilidad

- Notas de Sea Power del 3 de julio de 2025: https://steamdb.info/patchnotes/19094224/
- Tacview, protocolo público TCP/ACMI 2.x: https://raia-software-inc.gitbook.io/tacview/technical-documentation/real-time-telemetry-public-protocol
- Tacview, formato ACMI: https://www.tacview.net/documentation/
- Ubicación de grabaciones/guardados (Sea Power): https://steamdb.info/patchnotes/18240890/
- Ubicación de guardados en Steam Cloud: https://steamdb.info/app/1286220/ufs/
- Ejemplo de acceso al estado de Unity mediante Harmony/BepInEx (mod comunitario, no oficial): https://github.com/malfboi/SeaPowerMultiplayerMod

> A fecha de este documento NO se ha probado una lectura real de partidas, no se ha inspeccionado un fichero `.sav` ni se ha establecido una conexión TCP a Sea Power. Este documento describe viabilidad y riesgos, no una funcionalidad implementada.
