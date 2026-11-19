# Seguridad

## Fronteras de confianza

DEMO no constituye una frontera de seguridad: el usuario puede modificar localStorage. Firebase es un proveedor separado; nunca copia esos datos a la nube. El navegador muestra estimaciones de tiempo y precio, el servidor decide con Timestamp.now en transacciones.

Firestore niega por defecto. Productos, subastas, remates e historial efectivo son públicos; perfiles y documentos de identificación/pago son privados. Todas las escrituras de precio, ganador, producto, pedido, pago y entrega pasan por Functions con Admin SDK; por ello Functions valida autenticación, correo verificado, perfil activo, propiedad, plazo, incremento y pertenencia al pedido. Correo verificado no equivale a identidad KYC.

Reglas bloquean a comprador y vendedor para escribir directamente datos económicos. Editar título/descripción requiere ser vendedor, publicación activa sin pujas y plazo no vencido. Precio y foto no cambian después de publicar. Los máximos de auto-puja solo pueden leerse por su propietario; Admin los compara. Historial no almacena máximos.

Chats: participantes fijados al comprar; no se permite añadir participantes desde cliente. Mensajes requieren perfil activo, correo verificado, senderId propio, timestamp servidor, texto 1–1000 caracteres y campos exactos. Son inmutables. Los participantes pueden consultar el historial completo; no hay acceso de terceros.

Storage: paths products/{uid}/{productId}/main, propietario autenticado con correo verificado, máximo 2 MiB, JPEG/PNG/WebP; solo creación. Los objetos publicados son públicos y no pueden reemplazarse desde cliente. Validación MIME y tamaño no sustituye inspección antivirus/contenido: antes de producción añadir escaneo y normalización de imagen si el riesgo lo requiere. Un fallo entre upload y publicación puede dejar un objeto huérfano; no se borra automáticamente para evitar borrar imágenes de operaciones que sí se confirmaron. Añadir limpieza administrativa con antigüedad y comprobación de referencia antes de escala.

## Dinero e idempotencia

Importes positivos de dos decimales, máximo S/ 1,000,000; tarifas redondeadas a céntimos. La UI envía un precio máximo aceptado, nunca un precio final impuesto. Un documento transactions/{productId} impide ventas dobles. Misma compra/mismo comprador devuelve el pedido anterior. Pujas guardan requestId/resultado; un reintento idéntico no duplica historial o extensión. Recepción completada es idempotente y exclusiva del comprador.

El proveedor de pagos es DEMO en ambos modos. realFundsHeld=false siempre. No hay números de tarjeta, webhooks reales, Yape, Plin ni retención real. Para producción deben integrarse proveedor autorizado, validación de webhooks y conciliación; no basta cambiar una etiqueta o estado de Firestore.

## Antes de producción

No se ejecutó deploy. Configurar proyecto/región/dominios/facturación manualmente, revisar IAM y activar App Check/rate limiting con estrategia de rollout antes de admitir tráfico público. Actualmente Auth y validación de negocios protegen integridad, pero no constituyen protección completa contra abuso/costos. Configurar límites, presupuesto, alertas, retención y monitorización de Scheduler. Las claves públicas de configuración web no son secretos; credenciales Admin nunca van en frontend o git.

Las reglas y Functions se prueban con Emulator Suite; el emulador no sustituye IAM, entrega programada real, cuotas, índices en producción ni un proveedor de pagos. Consultar docs/pruebas.md para los resultados reales de esta ejecución.
