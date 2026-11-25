# Revisión previa al despliegue — 25/11/2026

Dictamen: apto para pruebas locales; no aprobado todavía para producción pública.

## Hallazgos que bloquean publicación

1. firestore.rules:54 permite a cualquier autenticado leer/escribir toda señalización de Live, incluso la de otras personas. Restringir participantes/propietario y validar campos; añadir prueba negativa.
2. functions/src/index.ts guarda latitude/longitude en products públicos aunque locationVisibility sea hidden. Ocultar en la interfaz no protege el dato; separar coordenadas privadas y publicar solo la precisión autorizada. Probar lectura anónima.
3. El entorno actual usa VITE_USE_FIREBASE_EMULATORS=true. firebase.json no define hosting ni rewrite de rutas SPA. Falta preparar y verificar un destino de pruebas remoto con configuración real antes de aprobar producción.
4. Pagos siguen siendo proveedor demo y realFundsHeld=false. No habilitar compras con dinero real sin integración autorizada y conciliación.

## Verificación

Compilación frontend y Functions correctas. 40 pruebas locales correctas. Bundle JS 1.28 MB (347 kB gzip): advertencia de rendimiento, no error de compilación. Los resultados del 18 de noviembre no representan por sí solos las nuevas funciones Radar y Live.

## Prueba de aceptación propuesta: 48 horas, sin publicación automática

Primera sesión (60–90 minutos): registro/login y recuperación; publicar con imagen; filtros/favoritos/Radar; dos cuentas pujando; auto-puja; anti-robo en últimos 30 segundos (+60 al vencimiento); compra simultánea; total con 4%; chat y recepción; crear/iniciar/finalizar Live.

Segunda sesión (30–60 minutos al día siguiente): repetir en móvil y escritorio, recargar páginas de detalle, cerrar/reabrir sesión, reiniciar emuladores de forma ordenada y comprobar persistencia, probar conexión interrumpida y errores de permisos.

Usar solo datos ficticios y ubicaciones no sensibles. Anotar ruta, pasos, resultado esperado y resultado observado. Aprobar únicamente cuando los bloqueos estén corregidos, las pruebas negativas pasen y el usuario confirme su revisión. No hay fecha de despliegue automática.

Inicio local: npm start (en PowerShell, npm.cmd start). Mantener abierta la terminal durante las pruebas. El entorno usa emuladores y los datos exportados de emulator-data.
`npm run test:emulators`: 28/28 pruebas correctas en esta revisión. Total: 68 pruebas aprobadas. Los emuladores de prueba se detuvieron al terminar. Las pruebas actuales no detectan los dos permisos excesivos señalados arriba; pasar la suite no equivale a aprobar seguridad de producción.
