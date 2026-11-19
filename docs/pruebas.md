# Pruebas ejecutadas · 18/11/2026 (America/Lima)

## Resultado final

- `npm test`: **17/17 correctas** (11 motor puro + 6 proveedor DEMO).
- `npm run test:emulators`: **18/18 correctas** (10 integración + 8 reglas/Storage).
- `npm run build`: TypeScript y bundle Vite correctos.
- `npm run build:functions`: TypeScript del backend correcto.
- `npm audit --omit=dev`: cero vulnerabilidades conocidas en dependencias de ejecución frontend.
- `npm audit --prefix functions --omit=dev`: cero vulnerabilidades conocidas en dependencias de ejecución backend.

Los tests se ejecutaron con Node 24.16.0 y Java 21 en este equipo; runtime de despliegue declarado Node 22. Firebase Emulator Suite usó exclusivamente `demo-ventas-flash`, sin credenciales ni datos de una cuenta real. Auth, Firestore, Functions y Storage se levantaron localmente y se detuvieron al terminar las pruebas.

## Cobertura

Motor: incremento mínimo, plazo exacto, anti-robo a 30 s y a 25 s (resultado 85 s), ausencia de extensión fuera de ventana, máximos, empate determinista, no reducir compromisos, no pujar contra el propio límite, cierre idempotente y ganador, remate/inicio/mínimo, redondeo tarifa 4% y rechazo de importes inválidos.

DEMO: cuatro productos/precios, favoritos persistidos, publicación, prohibición de compra propia, comprador/vendedor distintos, chat bilateral, confirmación exclusiva por comprador, recepción persistida, auto-puja, logout, migración de fase 1, nombre persistido y conservación del vencimiento antes de cualquier interacción. Tests usan almacenamiento en memoria, no borran datos del navegador del usuario.

Integración: registro real del SDK en Auth Emulator, perfil, login/logout, solicitud de recuperación, creación/edición autorizada, rechazo de usuario no verificado y vendedor que intenta pujar, dos pujas simultáneas obsoletas (solo una aceptada), extensión +60 s con requestId idempotente, resolución auto-puja, historial sin máximos, cierre/ganador/compra, dos compradores simultáneos (solo uno obtiene el producto), tarifa 4%, recepción idempotente, remate al precio servidor, mensajes recibidos mediante listener y barrido de vencidas sin cerrar subastas aún vigentes.

Reglas: catálogo público, escritura anónima bloqueada, cambios directos de precio/ganador/pujas bloqueados, auto-puja privada, perfil privado y privilegios inmutables, participantes de chat y autor/timestamp válidos, estados de pago bloqueados al cliente, favoritos privados y subida de imágenes con validación de propietario/MIME/tamaño e inmutabilidad.

Revisión de interfaz DEMO: catálogo con cuatro productos, búsqueda «Sony» devuelve un resultado, perfil Marta/Carlos, logout redirige a acceso protegido, vuelta a Marta y catálogo. Vista previa: http://127.0.0.1:5173/.

## Hallazgos corregidos

Codificación BOM incompatible con reglas; cierre de sintaxis en Storage; guardia explícita `resource == null` para impedir reemplazo de imagen; actualización del campo de nombre al cambiar usuario; persistencia inicial de temporizadores. Se conservaron pruebas de regresión relevantes.

## Límites de la verificación

- El barrido de cierre se invoca directamente en un test contra Firestore Emulator. No se ha verificado la entrega cron de Cloud Scheduler en un proyecto remoto ni IAM, latencia o cuotas reales.
- Recuperación de contraseña se comprobó como solicitud al emulador; no se envió correo real.
- Auth y el resto de la integración se probaron con el SDK y emuladores; la revisión visual del navegador se hizo en modo DEMO.
- Vite advierte sobre el tamaño del bundle (~1.09 MB sin comprimir, ~293 kB gzip), al incluir Firebase. Conviene carga diferida antes de optimizar una versión pública.
- El audit completo de herramientas de desarrollo conserva **14 avisos moderados transitivos de firebase-tools**. `npm audit fix` no los resolvió sin proponer un downgrade incompatible de CLI. No se aplicó `--force`. No hay avisos altos/críticos ni avisos en dependencias de ejecución. El override de @grpc/grpc-js fija una versión corregida y fue validado con los emuladores.
- No se ha conectado Firebase de producción ni se ha desplegado ningún recurso. No hay proveedor de pagos real.
