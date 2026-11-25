import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from 'esbuild';
import { loadEnv } from 'vite';
test('Producción no carga Firebase ni emuladores', async () => {
  const r = await build({entryPoints:['src/services/index.ts'],bundle:true,write:false,metafile:true,platform:'browser',format:'esm'});
  assert.equal(Object.keys(r.metafile.inputs).some(p=>/node_modules\/(?:@firebase|firebase)\//.test(p)),false);
});
test('Demo se activa explícitamente sin sobrescribir configuración local',()=>{
  assert.equal(loadEnv('demo',process.cwd()).VITE_BACKEND,'demo');
});
