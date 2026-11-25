/** Explicitly authored Spanish messages are safe to display; raw provider errors are not. */
export class UserFacingError extends Error {
  constructor(message = "") { super(message); this.name = "UserFacingError"; }
}

const messages = {
  unknown: "No pudimos completar la acción. Inténtalo de nuevo. Si el problema continúa, contacta con soporte.",
  connection: "No pudimos conectarnos. Revisa tu conexión a internet e inténtalo de nuevo.",
  timeout: "La conexión tardó demasiado. Revisa si la acción se completó antes de volver a intentarlo.",
  credentials: "El correo o la contraseña no son correctos. Revísalos o pulsa «¿Olvidaste tu contraseña?».",
  email: "Escribe un correo válido, por ejemplo: nombre@correo.com.",
  confirmed: "Confirma tu correo para continuar. Busca el enlace de registro en tu bandeja de entrada o en correo no deseado.",
  exists: "Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.",
  weak: "Elige una contraseña más segura, con al menos 8 caracteres. Combina mayúsculas, minúsculas, números y símbolos.",
  same: "La nueva contraseña debe ser diferente de la anterior.",
  session: "Tu sesión terminó. Vuelve a iniciar sesión para continuar.",
  link: "Este enlace venció o ya fue utilizado. Solicita un enlace nuevo y abre el correo más reciente.",
  rate: "Has realizado varios intentos seguidos. Espera unos minutos antes de volver a intentarlo.",
  mailRate: "Ya se solicitaron varios correos. Revisa tu bandeja de entrada y espera unos minutos antes de pedir otro.",
  permission: "No tienes permiso para realizar esta acción. Comprueba que ingresaste con la cuenta correcta.",
  service: "El servicio no está disponible en este momento. Inténtalo más tarde. Si continúa, contacta con soporte.",
  setup: "Esta función todavía no está disponible. Contacta con soporte si el problema continúa.",
  mail: "No pudimos enviar el correo. Inténtalo más tarde. Si no llega, contacta con soporte.",
  size: "La imagen es demasiado grande. Elige una de hasta 2 MB.",
  type: "Ese formato de imagen no está permitido. Elige una foto JPG, PNG o WebP.",
  duplicate: "Ese registro o archivo ya existe. Revisa si la acción anterior se completó antes de repetirla.",
  invalid: "Revisa los datos ingresados. Hay un campo vacío o un valor que no está permitido.",
  missing: "El contenido ya no está disponible. Actualiza la página y vuelve a intentarlo.",
  suspended: "Tu cuenta no está habilitada para esta acción. Contacta con soporte.",
  signup: "El registro de cuentas no está disponible por el momento. Inténtalo más tarde.",
};
type MessageKey = keyof typeof messages;
const codes: Record<string, MessageKey> = {};
function register(key: MessageKey, ...names: string[]) { for (const name of names) codes[name.toLowerCase()] = key; }
register("credentials", "invalid_credentials", "auth/invalid-credential", "auth/wrong-password", "current_password_invalid", "user_not_found", "auth/user-not-found");
register("email", "email_address_invalid", "auth/invalid-email");
register("confirmed", "email_not_confirmed", "provider_email_needs_verification");
register("exists", "user_already_exists", "email_exists", "auth/email-already-in-use");
register("weak", "weak_password", "auth/weak-password");
register("same", "same_password");
register("session", "session_not_found", "session_expired", "refresh_token_not_found", "refresh_token_already_used", "bad_jwt", "reauthentication_needed", "no_authorization", "invalidjwt", "pgrst301", "pgrst303", "auth/user-token-expired");
register("link", "otp_expired", "flow_state_expired", "flow_state_not_found", "flow_state_already_used", "bad_code_verifier");
register("rate", "over_request_rate_limit", "too_many_requests", "auth/too-many-requests", "slowdown");
register("mailRate", "over_email_send_rate_limit");
register("permission", "42501", "accessdenied", "permission-denied", "unauthorized");
register("connection", "auth/network-request-failed", "enotfound", "econnrefused", "econnreset");
register("timeout", "request_timeout", "etimedout", "57014", "locktimeout");
register("service", "unexpected_failure", "internalerror", "unavailable", "pgrst000", "pgrst001", "pgrst002");
register("setup", "42p01", "42703", "42883", "pgrst202", "pgrst204", "pgrst205", "nosuchbucket", "invalidapikey");
register("mail", "email_address_not_authorized", "email_provider_disabled");
register("signup", "signup_disabled");
register("suspended", "user_banned");
register("size", "entitytoolarge", "payload_too_large");
register("type", "invalidmimetype");
register("duplicate", "23505", "resourcealreadyexists", "keyalreadyexists");
register("invalid", "23502", "23514", "22p02", "22003", "validation_failed", "invalidkey");
register("missing", "23503", "nosuchkey", "nosuchupload", "not_found");

// Business errors raised by our SQL functions. No arbitrary database text is displayed.
const businessMessages = new Map<string, string>([
  ["Inicia sesión.", "Inicia sesión para continuar."],
  ["Perfil no habilitado.", messages.suspended],
  ["Verifica tu correo antes de operar.", messages.confirmed],
  ["Importe inválido (S/ 1 a S/ 1,000,000; dos decimales).", "Escribe un precio entre S/ 1 y S/ 1,000,000, con un máximo de dos decimales."],
  ["Ruta de imagen inválida.", "No pudimos guardar esa foto. Selecciónala de nuevo e inténtalo otra vez."],
  ["Ubicación inválida.", "Selecciona una ubicación válida para tu publicación."],
  ["Solicitud inválida.", messages.invalid],
  ["ID de operación reutilizado.", "Esta solicitud ya se usó. Actualiza la página y revisa el resultado de tu operación."],
  ["Producto no encontrado.", messages.missing],
  ["Producto no disponible.", "Este producto ya no está disponible. Vuelve al catálogo para ver otras opciones."],
  ["Límite de 100 participantes.", "Esta subasta alcanzó su límite de participantes. Puedes participar en otra."],
  ["Solo el comprador puede confirmar.", "Solo la persona que compró el producto puede confirmar que lo recibió."],
  ["Producto ajeno al directo.", "Selecciona un producto que pertenezca a esta transmisión."],
  ["Acción inválida.", messages.invalid],
]);
const businessLiterals = [
  "Solo puedes editar publicaciones propias activas sin pujas.", "No puedes pujar en esta publicación.",
  "Supera la puja actual por el incremento mínimo de S/ 50.", "No puedes reducir una oferta comprometida.",
  "Este producto ya fue comprado.", "Solo el ganador puede comprar tras el cierre.",
  "El precio cambió. Revisa el total.", "No tienes acceso a esta conversación.",
  "Selecciona productos propios activos (máximo 50).", "Solo el anfitrión puede modificar el directo.",
  "El directo ya finalizó.", "El directo no está en vivo.",
];
for (const text of businessLiterals) businessMessages.set(text, text);
const translated = new Set([...Object.values(messages), ...businessMessages.values()]);

export function friendly(error: unknown): string {
  if (error instanceof UserFacingError) return error.message || messages.unknown;
  const obj = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const text = (typeof error === "string" ? error :
    [obj.message, obj.error_description, obj.error].find(value => typeof value === "string") as string | undefined)?.trim() || "";
  const code = typeof obj.code === "string" ? obj.code.toLowerCase() : typeof obj.error === "string" ? obj.error.toLowerCase() : "";
  if (codes[code]) return messages[codes[code]];
  if (businessMessages.has(text)) return businessMessages.get(text)!;
  if (translated.has(text)) return text; // Some service callbacks already carry translated strings.
  const msg = text.toLowerCase();
  if (/invalid login credentials|invalid credential|invalid email or password/.test(msg)) return messages.credentials;
  if (/email not confirmed/.test(msg)) return messages.confirmed;
  if (/user already (registered|exists)/.test(msg)) return messages.exists;
  if (/same password|different from.*old password/.test(msg)) return messages.same;
  if (/weak password|password should|password must/.test(msg)) return messages.weak;
  if (/invalid email|email.*invalid/.test(msg)) return messages.email;
  if (/jwt expired|invalid jwt|token.*expired|refresh token|auth session missing/.test(msg)) return messages.session;
  if (/otp.*expired|link.*expired|expired.*link/.test(msg)) return messages.link;
  if (/rate limit|too many requests/.test(msg)) return messages.rate;
  if (/failed to fetch|fetch failed|networkerror|network request failed|load failed|enotfound|econnrefused|econnreset/.test(msg)) return messages.connection;
  if (/timeout|timed out|aborted/.test(msg) || obj.name === "AbortError" || obj.name === "TimeoutError") return messages.timeout;
  if (/permission denied|row-level security|access denied/.test(msg)) return messages.permission;
  if (/mime type|mimetype|unsupported.*type/.test(msg)) return messages.type;
  if (/payload too large|exceeded.*size|maximum allowed size|entity too large/.test(msg)) return messages.size;
  if (/already exists|duplicate key/.test(msg)) return messages.duplicate;
  if (/signup.*disabled|signups not allowed/.test(msg)) return messages.signup;
  if (/smtp|error sending.*email|email address.*not authorized/.test(msg)) return messages.mail;
  if (/schema cache|database error|invalid api key|bucket not found|supabaseurl|supabasekey/.test(msg)) return messages.setup;
  const status = Number(obj.status ?? obj.statusCode);
  if (status === 401) return messages.session;
  if (status === 403) return messages.permission;
  if (status === 413) return messages.size;
  if (status === 429) return messages.rate;
  if (status === 408 || status === 504) return messages.timeout;
  if (status >= 500 && status <= 599) return messages.service;
  return messages.unknown;
}
