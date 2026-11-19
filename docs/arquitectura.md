# Arquitectura de Ventas Flash

## Auditoría previa a fase 2 (19/11/2026 UTC)

La fase 1 usa React 19, TypeScript, Vite 6, Tailwind 4, Router y Lucide. `src/main.tsx` contiene App, Header, Catalog, Card, Detail, Sell, Checkout y Orders. Context comparte State y setState. `src/model.ts` define Product, Order, State, cuatro productos iniciales y cálculos de precio/contador. `src/style.css` define el diseño responsive existente.

Persistencia: efecto de App escribe toda la estructura en localStorage (`ventas-flash-v1`). Marta es la única identidad, sin autenticación. Las pujas se escriben desde Detail, los pedidos desde Checkout y mensajes/recepción desde Orders. Los remates usan Date.now del navegador; el anti-robo anterior añadía 30 segundos. No hay servidor ni permisos. El pago y la IA son simulados. No había pruebas automatizadas, configuración Firebase, Storage ni separación de servicios.

## Arquitectura objetivo

Componentes existentes → contexto React → contrato MarketplaceService → DemoService o FirebaseService. La selección es explícita mediante VITE_BACKEND y nunca migra datos locales a una cuenta remota automáticamente. El proveedor DEMO conserva la clave local y migra IDs de propietarios de datos antiguos; admite Marta/Carlos.

Firebase: Auth persiste la sesión; listeners Firestore alimentan catálogo, pedidos, favoritos y mensajes. Las mutaciones económicas son callable Functions v2. Firestore Rules deniega las escrituras económicas directas. Storage valida propietario, tipo y tamaño. Todos los importes críticos son enteros en céntimos. Un motor puro compartido calcula auto-puja, tarifas y remates; en Firebase solo el servidor confirma sus resultados.

Cierre: función programada cada minuto, consulta paginada de vencidas y transacción que revalida endAt/status. Invocaciones tardías no admiten pujas fuera de plazo. Reintentos son idempotentes. La compra de una subasta también puede cerrarla transaccionalmente si ya venció. La interfaz distingue vencimiento visual de confirmación del servidor.

No se despliega ni se conecta una cuenta sin configuración real. Pagos permanecen DEMO incluso con Firebase; ningún documento representa custodia efectiva de fondos.
