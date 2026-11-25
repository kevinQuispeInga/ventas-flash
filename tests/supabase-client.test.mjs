import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
const bundle=await build({entryPoints:['src/services/supabase.ts'],bundle:true,write:false,platform:'browser',format:'esm',define:{'import.meta.env':'{}'}});
const {watchRows,mapProduct,SupabaseService}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const turn=()=>new Promise(r=>setTimeout(r,10));
function fakeClient() {
  const channels=[];
  let authCallback;
  const client={
    channels,
    channel() {
      const c={removed:false,on(_type,_filter,callback){this.change=callback;return this;},subscribe(callback){this.status=callback;return this;}};
      channels.push(c);return c;
    },
    removeChannel(c){c.removed=true;},
    from(table){
      const query={select(){return this;},eq(){return this;},order(){return this;},or(){return this;},then(resolve){return Promise.resolve({data:[],error:null}).then(resolve);}};
      return query;
    },
    rpc(){return Promise.resolve({data:Date.now(),error:null});},
    auth:{onAuthStateChange(cb){authCallback=cb;return {data:{subscription:{unsubscribe(){authCallback=null;}}}};}},
    emitAuth(event,user){authCallback?.(event,user?{user}:null);},
    storage:{from(){return {getPublicUrl(path){return {data:{publicUrl:'https://example.test/'+path}};}};}},
  };
  return client;
}
test('Suscripción recupera cambios durante lectura inicial y reconexión, sin callbacks tras cleanup',async()=>{
  const client=fakeClient();let resolveFirst;let calls=0;const received=[];
  const stop=watchRows(client,'products',()=>{
    calls++; if(calls===1)return new Promise(r=>resolveFirst=r);
    return Promise.resolve({data:[{id:calls}],error:null});
  },rows=>received.push(rows),e=>assert.fail(e));
  client.channels[0].status('SUBSCRIBED');
  resolveFirst({data:[{id:1}],error:null});await turn();
  assert.equal(calls,2);assert.equal(received.at(-1)[0].id,2);
  client.channels[0].status('SUBSCRIBED');await turn();assert.equal(calls,3);
  stop();client.channels[0].change();await turn();assert.equal(calls,3);assert.equal(client.channels[0].removed,true);
});
test('Errores PostgREST conservan mensaje y no se publican después de cancelar',async()=>{
  const client=fakeClient();let resolve;const errors=[];
  const stop=watchRows(client,'orders',()=>new Promise(r=>resolve=r),()=>assert.fail('No debe emitir datos'),e=>errors.push(e));
  resolve({data:null,error:{code:'42501',message:'permission denied for table orders'}});await turn();assert.deepEqual(errors,['No tienes permiso para realizar esta acción. Comprueba que ingresaste con la cuenta correcta.']);
  client.channels[0].change();stop();resolve({data:null,error:{message:'Tardío'}});await turn();assert.equal(errors.length,1);
});
test('Productos convierten céntimos, reloj, privacidad e imagen pública',()=>{
  const p=mapProduct({id:'p',mode:'remate',original_cents:10000,price_cents:9000,floor_cents:7000,step_cents:200,
    created_at:'2026-01-01T00:00:00Z',end_at:'2026-01-01T00:03:00Z',latitude:null,longitude:null,image_path:'seller/p/main'},fakeClient());
  assert.equal(p.price,100);assert.equal(p.floor,70);assert.equal(p.step,2);assert.equal(p.end-p.created,180000);
  assert.equal(p.latitude,undefined);assert.equal(p.image,'https://example.test/seller/p/main');
});

test('La pérdida de conexión en tiempo real muestra un aviso en español',async()=>{
  const client=fakeClient();const errors=[];
  const stop=watchRows(client,'products',()=>Promise.resolve({data:[],error:null}),()=>{},e=>errors.push(e));
  client.channels[0].status('CHANNEL_ERROR');
  assert.match(errors.at(-1),/Revisa tu conexión a internet/);
  client.channels[0].status('TIMED_OUT');
  assert.match(errors.at(-1),/tardó demasiado/);
  stop();client.channels[0].status('CLOSED');assert.equal(errors.length,2);
});
test('Salida de sesión cancela lecturas privadas y vacía perfil, pedidos y favoritos',async()=>{
  const client=fakeClient();const service=new SupabaseService(client);let snapshot;
  const stop=service.subscribe(s=>snapshot=s);
  client.emitAuth('SIGNED_IN',{id:'buyer',email:'buyer@example.test'});await turn();
  const privateChannels=client.channels.filter(c=>!c.removed).slice(2);assert.equal(privateChannels.length,3);
  client.emitAuth('SIGNED_OUT',null);await turn();
  assert.equal(snapshot.user,null);assert.deepEqual(snapshot.state.orders,[]);assert.deepEqual(snapshot.state.favorites,[]);
  assert.ok(privateChannels.every(c=>c.removed));
  stop();assert.ok(client.channels.every(c=>c.removed));
});

test('Comisión del vendedor: céntimos exactos y pedidos anteriores preservados',async()=>{
  const result=await build({entryPoints:['src/lib/pricing.ts'],bundle:true,write:false,platform:'node',format:'esm'});
  const {sellerProceeds,orderAmounts}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
  assert.deepEqual(sellerProceeds(100),{gross:100,fee:4,net:96});
  assert.deepEqual(sellerProceeds(19.99),{gross:19.99,fee:0.8,net:19.19});
  assert.deepEqual(sellerProceeds(1),{gross:1,fee:0.04,net:0.96});
  assert.deepEqual(sellerProceeds(70),{gross:70,fee:2.8,net:67.2});
  assert.deepEqual(orderAmounts({price:100,fee:4,feePayer:'seller'}),{buyerTotal:100,sellerNet:96});
  assert.deepEqual(orderAmounts({price:100,fee:4}),{buyerTotal:104,sellerNet:100});
});
