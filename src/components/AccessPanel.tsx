import { spanishValidation, clearValidation } from "../lib/formValidation";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Zap, ShoppingBag, MapPin, Compass, Wallet, Mail, LockKeyhole, Eye, EyeOff, ShieldCheck } from "lucide-react";

type Props = {
  mode: string; name: string; email: string; password: string; busy: boolean; notice: string; error?: string;
  setMode: (s: string) => void; setName: (s: string) => void;
  setEmail: (s: string) => void; setPassword: (s: string) => void;
  submit: (e: FormEvent) => void;
};
export function AccessPanel(p: Props) {
  const [showPassword, setShowPassword] = useState(false);
  return <main className="access-page">
    <section className="access-story" aria-label="Tu espacio en Ventas Flash">
      <span className="access-kicker"><Zap size={16} fill="currentColor" /> CADA HALLAZGO TIENE UNA HISTORIA</span>
      <h1>Lo que ya no usas.<br /><em>Lo que alguien<br />está buscando.</em></h1>
      <p>Compra cerca, descubre oportunidades y dale una nueva vida a lo que tienes.</p>
      <div className="access-preview" aria-hidden="true">
        <div className="access-preview-icon"><ShoppingBag size={36} /></div>
        <div><span>TU PRÓXIMA VENTA</span><strong>Una nueva historia empieza aquí</strong><small><MapPin size={14} /> Cerca de ti, en Lima</small></div>
        <span className="access-spark"><Zap size={20} fill="currentColor" /></span>
      </div>
      <div className="access-benefits">
        <span><Compass size={20} /><b>Encuentra cerca</b><small>Explora con Radar Flash</small></span>
        <span><Wallet size={20} /><b>Vende con claridad</b><small>Conoce cuánto recibirás</small></span>
      </div>
      <span className="access-story-foot">MENOS COSAS GUARDADAS. MÁS POSIBILIDADES.</span>
    </section>
    <section className="access-form-side">
      <div className="access-mark"><Zap size={24} fill="currentColor" /></div>
      <span className="access-form-kicker">TU COMUNIDAD DE HALLAZGOS</span>
      <h2>{p.mode === "register" ? "Empieza una nueva historia" : p.mode === "reset" ? "Recupera tu acceso" : "Qué bueno verte de nuevo"}</h2>
      <p className="access-intro">{p.mode === "register" ? "Crea tu cuenta para comprar, vender y guardar tus favoritos." : p.mode === "reset" ? "Te enviaremos un enlace para cambiar tu contraseña." : "Entra a tu cuenta. Tu próximo hallazgo te espera."}</p>
      {p.mode !== "reset" && <div className="access-tabs" aria-label="Opciones de acceso">
        <button type="button" aria-pressed={p.mode === "login"} onClick={() => p.setMode("login")}>Iniciar sesión</button>
        <button type="button" aria-pressed={p.mode === "register"} onClick={() => p.setMode("register")}>Crear cuenta</button>
      </div>}
      <form onInvalidCapture={spanishValidation} onInputCapture={clearValidation} onChangeCapture={clearValidation} className="access-form" onSubmit={p.submit}>
        {p.mode === "register" && <label>Tu nombre<input required maxLength={80} autoComplete="name" value={p.name} onChange={e => p.setName(e.target.value)} placeholder="¿Cómo te llamas?" /></label>}
        <label>Correo electrónico<div className="access-input"><Mail size={18} /><input type="email" required value={p.email} onChange={e => p.setEmail(e.target.value)} autoComplete="email" placeholder="tu@correo.com" /></div></label>
        {p.mode !== "reset" && <label>Contraseña<div className="access-input"><LockKeyhole size={18} /><input type={showPassword ? "text" : "password"} required minLength={p.mode === "register" ? 8 : 1} value={p.password} onChange={e => p.setPassword(e.target.value)} autoComplete={p.mode === "register" ? "new-password" : "current-password"} placeholder={p.mode === "register" ? "Al menos 8 caracteres" : "Escribe tu contraseña"} /><button type="button" aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>}
        {p.mode === "login" && <button className="access-forgot" type="button" onClick={() => p.setMode("reset")}>¿Olvidaste tu contraseña?</button>}
        <button disabled={p.busy} className="button primary full access-submit">{p.busy ? "Procesando…" : p.mode === "register" ? "Crear mi cuenta" : p.mode === "reset" ? "Enviar enlace de recuperación" : "Entrar a Ventas Flash"}</button>
        {p.error && <p id="access-error" className="access-notice error" role="alert">{p.error}</p>}
        {p.notice && <p className="access-notice" role="status">{p.notice}</p>}
        {p.mode === "reset" && <button type="button" className="access-return" onClick={() => p.setMode("login")}>Volver a iniciar sesión</button>}
      </form>
      <div className="access-bottom"><ShieldCheck size={18} /><span>Tu cuenta, tus favoritos y tus ventas.<br />Todo en un solo lugar.</span></div>
      <Link className="access-explore" to="/">Seguir explorando sin cuenta</Link>
    </section>
  </main>;
}
