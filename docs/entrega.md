# Inventario de fase 2

## Archivos creados

- `.env.example`: selección de proveedor y parámetros públicos Firebase, sin credenciales reales.
- `firebase.json`, `firestore.rules`, `firestore.indexes.json`, `storage.rules`.
- `src/lib/firebase.ts`, `src/vite-env.d.ts`.
- `src/types/firestore.ts`.
- `src/services/contracts.ts`, `index.ts`, `demo.ts`, `firebase.ts`, `records.ts`.
- `functions/package.json`, `functions/package-lock.json`, `functions/tsconfig.json`.
- `functions/src/domain.ts`: motor determinista de importes, remates y auto-puja.
- `functions/src/index.ts`: callable Functions, transacciones y cierre programado.
- `tests/domain.test.mjs`, `demo.test.mjs`, `integration.test.mjs`, `rules.test.mjs`.
- `docs/arquitectura.md`, `firebase-setup.md`, `modelo-datos.md`, `seguridad.md`, `pruebas.md`, `entrega.md`.

## Archivos modificados

- `src/main.tsx`: conserva App/Header/Catalog/Card/Detail/Sell/Checkout/Orders, sustituye escrituras locales por servicios y añade acceso/perfil, auto-puja y listeners.
- `src/model.ts`: amplía IDs de propietario, estados, ganador y fechas de mensajes; conserva los datos iniciales.
- `src/style.css`: mantiene diseño, añade avisos de proveedor, acceso y estados de mensajes.
- `package.json`, `package-lock.json`: Firebase SDK, CLI, pruebas de reglas, scripts y formato.
- `.gitignore`: excluye env, compilados de Functions, logs y emuladores.
- `README.md`: instrucciones de fase 2.
- `vite.config.ts`: formato únicamente, configuración conservada.

`dist/`, `functions/lib/` y `tsconfig.tsbuildinfo` son salidas de compilación; no deben versionarse.

## Cloud Functions exportadas

ensureProfile, updateProfile, createProduct, editProduct, placeBid, setAutoBid, closeAuctionNow, closeExpiredAuctions, purchaseProduct, confirmReceipt, serverTime.

El chat y los favoritos usan SDK Firestore y reglas de seguridad; no requieren un callable adicional. `closeOne` y `sweepExpiredAuctions` son helpers de servidor, no endpoints públicos adicionales.

## Pendiente manual

Crear/seleccionar proyecto y app web en Firebase Console, habilitar Email/Password, Firestore y Storage, completar `.env.local`, elegir región, configurar dominios y revisar facturación/IAM. El despliegue requiere autorización futura y no se ejecutó. KYC, pagos con tarjeta/Yape/Plin, streaming y reseñas están modelados pero no integrados con proveedores reales.
