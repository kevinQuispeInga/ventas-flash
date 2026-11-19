# Informe de Pruebas Finales y Validación QA · Ventas Flash

**Fecha de ejecución:** 18 de Noviembre de 2026  
**Resultado Global:** **58 pruebas aprobadas / 0 fallos**  
**Entorno de pruebas:** Node.js v24.16.0 en Windows 11 + Firebase Emulator Suite (demo-ventas-flash)

---

## 1. Resumen de Pruebas Ejecutadas

```
+-------------------------------------+--------+-----------+
| Suite de Pruebas                    | Total  | Estado    |
+-------------------------------------+--------+-----------+
| 1. tests/domain.test.mjs            |   11   | APROBADO  |
| 2. tests/demo.test.mjs              |    6   | APROBADO  |
| 3. tests/radar.test.mjs             |    9   | APROBADO  |
| 4. tests/live.test.mjs              |    4   | APROBADO  |
| 5. tests/rules.test.mjs             |   10   | APROBADO  |
| 6. tests/integration.test.mjs       |   10   | APROBADO  |
| 7. tests/e2e-workflow.test.mjs      |    8   | APROBADO  |
+-------------------------------------+--------+-----------+
| TOTAL                               |   58   | 100% PASS |
+-------------------------------------+--------+-----------+
```

---

## 2. Detalle de Casos de Prueba

### A. Dominio y Subastas (`tests/domain.test.mjs`)
1. **Reloj anti-robo (25s a 85s):** Verifica que una puja a falta de 25s extienda el plazo a 85s.
2. **Límite exacto de 30s:** Verifica que en el segundo 30 exacto el reloj aplique la extensión.
3. **No extensión fuera de ventana:** Pujas con más de 30s restantes conservan el plazo original.
4. **Rechazo al vencer:** Pujas recibidas con plazo expirado o incrementos inválidos son rechazadas.
5. **Auto-puja (Proxy Bid):** El motor responde sin superar el tope máximo del postor.
6. **Resolución de empates:** Desempate determinista por prioridad temporal y UID.
7. **Tope no reducible:** Un postor no puede disminuir su oferta máxima ya registrada.
8. **Cierre de subasta idempotente:** Cierre prematuro y designación justa del postor ganador.
9. **Remates descendentes:** Respeta precio inicial, intervalo de 30s y precio piso garantizado.
10. **Cálculo de comisión del 4%:** Redondeo exacto en céntimos; rechaza montos no finitos o con decimales extras.
11. **No sobre-puja propia:** Aumentar el tope máximo personal no provoca pujar contra uno mismo.

### B. Modo DEMO Desconectado (`tests/demo.test.mjs`)
1. Conservación de productos, precios y favoritos tras recargar el servicio.
2. Publicación de producto, compra con otro usuario, chat bilateral y confirmación de entrega persistida.
3. Auto-puja y rechazo de auto-pujas del propio vendedor.
4. Migración de datos previos sin pérdida de órdenes ni favoritos.
5. Persistencia del nombre de perfil al alternar entre Marta y Carlos.
6. Inicialización determinista de contadores antes de cualquier interacción.

### C. Radar Flash y Matemáticas Geográficas (`tests/radar.test.mjs`)
1. **Distancias conocidas de Lima:** Comprueba Haversine entre Miraflores, San Isidro (2.78 km), Barranco (3.22 km), Surco (4.24 km) y Centro de Lima (8.36 km).
2. **Identidad y simetría:** $d(A, A) = 0$ y $d(A, B) = d(B, A)$.
3. **Paridad matemática frontend-backend:** El cálculo en TypeScript del cliente coincide al 100% con la Cloud Function.
4. **Resiliencia ante entradas inválidas:** Manejo seguro de `NaN`, `Infinity` y valores nulos.
5. **Formateo legible (`formatDistance`):** Convierte distancias a metros (< 1 km) o kilómetros con un decimal.
6. **Clasificación en anillos de proximidad:** Filtros de 1 km, 2 km, 3 km, 5 km y 10 km.
7. **Validación territorial de Lima:** Coordenadas de los 12 distritos dentro de los límites metropolitanos.
8. **Fallback seguro:** Miraflores (Parque Kennedy) como ubicación por defecto transparente.
9. **Dispersión de privacidad (`approximateCoordinates`):** Dispersión máxima controlada (< 350 m) y redondeo estricto a 4 decimales.

### D. Flash Live Transmisiones en Vivo (`tests/live.test.mjs`)
1. **Ciclo de vida:** Creación de sala, inicio del directo, marcado `isLive: true`, cambio de producto destacado y finalización sin cerrar subastas activas.
2. **Chat público:** Envío de mensajes en tiempo real, distinción visual del anfitrión y recepción limpia.
3. **Pujas en vivo:** Comprador puja sobre el artículo presentado en el directo con actualización de precio.
4. **Seguridad del anfitrión:** Usuarios terceros no pueden iniciar ni finalizar salas ajenas.

### E. Reglas de Seguridad de Firestore (`tests/rules.test.mjs`)
1. Catálogo público; usuarios anónimos no pueden publicar.
2. Ni vendedor ni comprador pueden escribir precios, ganadores o pujas directamente en Firestore.
3. Máximo de auto-puja confidencial y legible únicamente por su autor.
4. Datos personales de usuarios aislados; privilegios de verificación inmutables por cliente.
5. Chat bilateral restringido a los participantes legítimos de la transacción.
6. Estados económicos de escrow y entregas protegidos contra modificación por cliente.
7. Favoritos privados e imposibilidad de suplantar UID.
8. Storage exige autenticación, tipo MIME (JPG/PNG/WebP) y límite de 2 MB; rechaza sobrescrituras.
9. Campos geográficos protegidos: cliente no puede escribir ni alterar coordenadas en productos.
10. Reglas Flash Live: chat público y señalización WebRTC restringidas; bloqueo de escrituras directas a `liveStreams`.

### F. Integración y Flujos E2E (`tests/integration.test.mjs` y `tests/e2e-workflow.test.mjs`)
1. **E2E Flujo 1:** Registro, autenticación y persistencia de perfiles en Firestore.
2. **E2E Flujo 2:** Subida de imagen a Cloud Storage emulado y publicación de producto.
3. **E2E Flujo 3:** Subastas con sincronización en tiempo real y reloj anti-robo de 60 segundos.
4. **E2E Flujo 4:** Auto-puja inteligente con confidencialidad del tope máximo.
5. **E2E Flujo 5:** Cierre de subasta, compra inmediata con tarifa del 4% y verificación de escrow.
6. **E2E Flujo 6:** Chat bilateral postventa en tiempo real y confirmación de recepción física.
7. **E2E Flujo 7:** Radar Flash - Publicación con ubicación, persistencia, redondeo a 4 decimales y filtrado Haversine.
8. **E2E Flujo 8:** Flash Live - Creación de sala, inicio de transmisión, sincronización de productos, pujas en vivo y finalización sin cerrar subastas.
