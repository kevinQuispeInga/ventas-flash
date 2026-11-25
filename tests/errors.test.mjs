import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { friendly, UserFacingError } from "../src/lib/errors.ts";
import { validationMessage, spanishValidation, clearValidation } from "../src/lib/formValidation.ts";

test("Acceso: códigos de contraseña, confirmación, sesión y enlace con acciones claras", () => {
  const cases = [
    ["invalid_credentials", /correo o la contraseña no son correctos/],
    ["weak_password", /contraseña más segura/], ["same_password", /diferente de la anterior/],
    ["email_not_confirmed", /Confirma tu correo/], ["email_exists", /recupera tu contraseña/],
    ["email_address_invalid", /nombre@correo.com/], ["refresh_token_not_found", /Vuelve a iniciar sesión/],
    ["session_expired", /Vuelve a iniciar sesión/], ["otp_expired", /Solicita un enlace nuevo/],
    ["flow_state_expired", /Solicita un enlace nuevo/], ["over_email_send_rate_limit", /espera unos minutos/],
    ["email_address_not_authorized", /No pudimos enviar el correo/],
  ];
  for (const [code, expected] of cases) assert.match(friendly({code,message:"Internal English message"}),expected,code);
});
test("Conexión: formatos de Chrome, Safari, Firefox y errores HTTP", () => {
  for (const message of ["Failed to fetch", "NetworkError when attempting to fetch resource.", "Load failed", "fetch failed"])
    assert.match(friendly(new TypeError(message)), /Revisa tu conexión a internet/);
  assert.match(friendly({name:"AbortError"}), /tardó demasiado/);
  assert.match(friendly({status:504}), /antes de volver a intentarlo/);
  assert.match(friendly({statusCode:"503"}), /servicio no está disponible/);
  assert.match(friendly({status:429}), /Espera unos minutos/);
  assert.match(friendly({status:401}), /Vuelve a iniciar sesión/);
});
test("Fotos: códigos de Storage, tamaño, formato, permisos y duplicados", () => {
  assert.match(friendly({code:"EntityTooLarge"}), /hasta 2 MB/);
  assert.match(friendly({error:"InvalidMimeType"}), /JPG, PNG o WebP/);
  assert.match(friendly({statusCode:"413"}), /hasta 2 MB/);
  assert.match(friendly({message:"mime type image/gif is not supported"}), /JPG, PNG o WebP/);
  assert.match(friendly({code:"AccessDenied"}), /cuenta correcta/);
  assert.match(friendly({code:"ResourceAlreadyExists"}), /acción anterior se completó/);
});
test("Base de datos: errores técnicos no muestran tablas ni instrucciones de configuración", () => {
  for (const code of ["42P01","42703","PGRST202","PGRST205"])
    assert.match(friendly({code,message:"relation public.orders missing; secret=abc"}),/función todavía no está disponible/);
  assert.match(friendly({code:"23514",message:"violates products_price_check"}),/Revisa los datos/);
  assert.match(friendly({code:"42501",message:"permission denied"}),/No tienes permiso/);
  assert.doesNotMatch(friendly({message:"Database error querying schema"}),/tablas|schema|autenticación/);
});
test("Los errores SQL del marketplace tienen un mensaje de negocio conocido", async () => {
  const sql=await readFile("supabase/migrations/202611250001_marketplace.sql","utf8");
  for (const match of sql.matchAll(/raise exception '([^']+)'/g)) {
    const result=friendly({code:"P0001",message:match[1]});
    assert.notEqual(result,friendly(undefined),match[1]);
    assert.equal(friendly(result),result,"Traducir dos veces conserva el mensaje");
  }
  assert.match(friendly({code:"P0001",message:"Solo el comprador puede confirmar."}),/persona que compró/);
});
test("Errores desconocidos nunca filtran texto inglés, HTML ni datos internos", () => {
  for(const error of [null,undefined,42,{},new Error("Unexpected internal failure token=secret"),
    {message:"<html>Bad gateway</html>"},{error_description:"Unrecognized upstream failure"},"unknown raw message"])
    assert.equal(friendly(error),friendly(undefined));
  const own=new UserFacingError("Las contraseñas no coinciden.");
  assert.equal(friendly(own),own.message);
  assert.equal(friendly({error_description:"Invalid login credentials"}),friendly({code:"invalid_credentials"}));
});
test("Validación de formularios: todos los estados están en español", () => {
  const states={valueMissing:/Completa este campo/,typeMismatch:/correo válido/,badInput:/número válido/,
    tooShort:/al menos 8/,tooLong:/máximo 80/,rangeUnderflow:/1 o mayor/,rangeOverflow:/1000000 o menor/,
    stepMismatch:/incrementos indicados/,patternMismatch:/formato indicado/};
  for(const [flag,expected] of Object.entries(states))
    assert.match(validationMessage({[flag]:true},{type:"email",minLength:8,maxLength:80,min:"1",max:"1000000"}),expected);
});
test("Corregir un campo borra el error personalizado y permite revalidarlo", () => {
  const old=[globalThis.HTMLInputElement,globalThis.HTMLTextAreaElement,globalThis.HTMLSelectElement];
  class Input { type="email"; validity={valid:false,typeMismatch:true}; message=""; setCustomValidity(message){this.message=message;} }
  globalThis.HTMLInputElement=Input;globalThis.HTMLTextAreaElement=class {};globalThis.HTMLSelectElement=class {};
  try {
    const target=new Input();spanishValidation({target});assert.match(target.message,/correo válido/);
    clearValidation({target});assert.equal(target.message,"");
    target.validity={valid:true};spanishValidation({target});assert.equal(target.message,"");
  } finally { [globalThis.HTMLInputElement,globalThis.HTMLTextAreaElement,globalThis.HTMLSelectElement]=old; }
});
