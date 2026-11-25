import { spanishValidation, clearValidation } from "./lib/formValidation";
import { UserFacingError } from "./lib/errors";
import React, { useState, useEffect, createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  Zap,
  Search,
  Plus,
  ShieldCheck,
  Heart,
  Clock,
  TrendingDown,
  ShoppingBag,
  SlidersHorizontal,
  MapPin,
  Check,
  Sparkles,
  Send,
  Camera,
  Package,
  ChevronRight,
  Gavel,
  Compass,
  Radio,
} from "lucide-react";
import {
  type State,
  type Product,
  type Mode,
  money,
  priceAt,
  remaining,
} from "./model";
import "./style.css";
import { getService } from "./services";
import {
  friendly,
  type MarketplaceService,
  type Snapshot,
} from "./services/contracts";
import { orderAmounts } from "./lib/pricing";
import { AccessPanel } from "./components/AccessPanel";
import { SellerEarnings } from "./components/SellerEarnings";
import { validateImage } from "./lib/images";
import type { UserProfile } from "./types/marketplace";
import { RadarView } from "./components/RadarView";
import { LiveHub } from "./components/LiveHub";
import { LiveRoom } from "./components/LiveRoom";
import { DevSeedBar } from "./components/DevSeedBar";
import { LIMA_DISTRICTS, approximateCoordinates } from "./lib/geo";
import { generateProductDraft } from "./lib/gemini";
const Ctx = createContext<{
  state: State;
  service: MarketplaceService;
  user: UserProfile | null;
  now: number;
  query: string;
  setQuery: (s: string) => void;
  act: (f: () => Promise<unknown>) => Promise<boolean>;
}>(null!);
const useApp = () => useContext(Ctx);
const labels = {
  subasta: "Subasta",
  remate: "Remate",
  normal: "Compra directa",
};
function Badge({ mode }: { mode: Mode }) {
  return (
    <span className={"badge " + mode}>
      {mode === "subasta" ? (
        <Gavel size={13} />
      ) : mode === "remate" ? (
        <TrendingDown size={14} />
      ) : (
        <ShoppingBag size={13} />
      )}{" "}
      {labels[mode]}
    </span>
  );
}
function Photo({ p }: { p: Product }) {
  const [failed, F] = useState(false);
  useEffect(() => F(false), [p.image]);
  return !p.image || failed ? (
    <div className="photo-placeholder" aria-label={p.title}>
      <Camera size={34} />
      <span>{p.title}</span>
    </div>
  ) : (
    <img src={p.image} alt={p.title} onError={() => F(true)} />
  );
}
function App() {
  const [setup] = useState(() => {
    try {
      return { service: getService(), error: "" };
    } catch (e) {
      return { service: null, error: friendly(e) };
    }
  });
  const [snap, S] = useState<Snapshot>({
    state: { products: [], orders: [], favorites: [], liveStreams: [] },
    user: null,
    loading: true,
    error: "",
    clockOffset: 0,
  });
  const [now, tick] = useState(Date.now()),
    [query, setQuery] = useState(""),
    [error, E] = useState("");
  useEffect(() => setup.service?.subscribe(S), [setup]);
  useEffect(() => {
    const t = setInterval(() => tick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  async function act(f: () => Promise<unknown>) {
    E("");
    try {
      await f();
      return true;
    } catch (e) {
      E(friendly(e));
      return false;
    }
  }
  if (!setup.service)
    return (
      <main>
        <h1>No pudimos abrir Ventas Flash</h1>
        <p role="alert">{setup.error}</p>
        <p>Intenta abrir la página más tarde.</p>
      </main>
    );
  if (snap.loading)
    return (
      <main>
        <p role="status">Cargando sesión…</p>
        {snap.error && <p role="alert">{snap.error}</p>}
      </main>
    );
  const service = setup.service;
  return (
    <Ctx.Provider
      value={{
        state: snap.state,
        service,
        user: snap.user,
        now: now + snap.clockOffset,
        query,
        setQuery,
        act,
      }}
    >
      <BrowserRouter>
        <Header />
        {(error || snap.error) && (
          <div className="error-banner" role="alert">
            {error || snap.error}
            <button aria-label="Cerrar aviso" onClick={() => E("")}>
              ×
            </button>
          </div>
        )}
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route
            path="/radar"
            element={
              <RadarView
                products={snap.state.products}
                now={now + snap.clockOffset}
              />
            }
          />
          <Route
            path="/live"
            element={
              <LiveHub
                liveStreams={snap.state.liveStreams || []}
                products={snap.state.products}
                user={snap.user}
                now={now + snap.clockOffset}
                onCreateStream={(t, d, p) => service.createLiveStream(t, d, p)}
              />
            }
          />
          <Route path="/live/:id" element={<LiveRoomWrapper />} />
          <Route path="/acceso" element={<Access />} />
          <Route path="/restablecer" element={<ResetPassword />} />
          <Route
            path="/perfil"
            element={
              <Protected>
                <Profile />
              </Protected>
            }
          />
          <Route
            path="/favoritos"
            element={
              <Protected>
                <Catalog favorites />
              </Protected>
            }
          />
          <Route path="/producto/:id" element={<Detail />} />
          <Route
            path="/vender"
            element={
              <Protected>
                <Sell />
              </Protected>
            }
          />
          <Route
            path="/checkout/:id"
            element={
              <Protected>
                <Checkout />
              </Protected>
            }
          />
          <Route
            path="/pedidos"
            element={
              <Protected>
                <Orders />
              </Protected>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        {import.meta.env.DEV && service.mode === "demo" && (
          <DevSeedBar
            service={service}
            user={snap.user}
            productCount={snap.state.products.length}
            liveCount={snap.state.liveStreams.length}
          />
        )}
        <footer>
          <Link className="logo" to="/">
            <Zap fill="currentColor" />
            ventas<span>flash</span>
          </Link>
          <span>Hecho para encontrar. Pensado para confiar.</span>
          <small>Perú · S/ · Pagos DEMO</small>
        </footer>
      </BrowserRouter>
    </Ctx.Provider>
  );
}
function LiveRoomWrapper() {
  const { id } = useParams();
  const { state, user, service, now } = useApp();
  return (
    <LiveRoom
      streamId={id || ""}
      streams={state.liveStreams || []}
      products={state.products}
      user={user}
      service={service}
      now={now}
    />
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const loc = useLocation();
  return user ? (
    <>{children}</>
  ) : (
    <Navigate to="/acceso" state={{ from: loc.pathname }} replace />
  );
}
function Access() {
  const { service, user } = useApp();
  const nav = useNavigate(),
    loc = useLocation();
  const [mode, M] = useState("login"),
    [name, N] = useState(""),
    [email, E] = useState(""),
    [password, P] = useState(""),
    [busy, B] = useState(false),
    [notice, T] = useState(""),
    [accessError, setAccessError] = useState("");
  const from = loc.state?.from || "/perfil";
  if (user) return <Navigate to={from} replace />;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    B(true);
    T("");
    setAccessError("");
    try {
      if (mode === "reset") await service.resetPassword(email);
      else if (mode === "register") await service.register(name, email, password);
      else await service.login(email, password);
      if (mode === "reset") T("Si el correo es válido, recibirás instrucciones de recuperación.");
      else if (mode === "register" && service.mode === "supabase") {
        T("Revisa tu correo y confirma tu cuenta. Después podrás iniciar sesión.");
        M("login");
      } else nav(from, { replace: true });
    } catch (error) {
      setAccessError(friendly(error));
    } finally {
      B(false);
    }
  }
  return <AccessPanel mode={mode} name={name} email={email} password={password} busy={busy} notice={notice} error={accessError}
    setMode={value => { M(value); T(""); setAccessError(""); }} setName={N} setEmail={E} setPassword={P} submit={submit} />;
}

function ResetPassword() {
  const { service, user, act } = useApp();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  return <main className="narrow"><h1>Nueva contraseña</h1>
    {!user ? <p>Abre el enlace de recuperación enviado a tu correo. <Link to="/acceso">Solicitar otro enlace</Link></p>
      : done ? <p role="status">Contraseña actualizada. <Link to="/perfil">Continuar</Link></p>
      : <form onInvalidCapture={spanishValidation} onInputCapture={clearValidation} onChangeCapture={clearValidation} className="panel" onSubmit={async e => {
        e.preventDefault(); setBusy(true);
        const ok = await act(async () => {
          if (password !== confirm) throw new UserFacingError("Las contraseñas no coinciden.");
          if (!service.updatePassword) throw new UserFacingError("No se puede cambiar la contraseña en una cuenta de demostración.");
          await service.updatePassword(password);
        });
        setBusy(false); setDone(ok);
      }}>
        <label>Nueva contraseña<input type="password" autoComplete="new-password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} /></label>
        <label>Repite la contraseña<input type="password" autoComplete="new-password" required minLength={8} value={confirm} onChange={e => setConfirm(e.target.value)} /></label>
        <button className="button primary" disabled={busy}>{busy ? "Guardando…" : "Guardar contraseña"}</button>
      </form>}
  </main>;
}
function Profile() {
  const { service, user, act } = useApp();
  const [name, N] = useState(user?.name || ""),
    [notice, T] = useState("");
  useEffect(() => {
    N(user?.name || "");
    T("");
  }, [user?.id, user?.name]);
  return (
    <main className="narrow">
      <h1>Mi perfil</h1>
      <div className="panel">
        <p>{user?.email}</p>
        <p>
          Correo:{" "}
          {user?.emailVerified ? "Verificado" : "Pendiente de verificación"}
        </p>
        <p>
          Identidad:{" "}
          {user?.identityVerified
            ? service.mode === "demo"
              ? "Verificada (DEMO)"
              : "Verificada"
            : "Sin verificar"}
        </p>
        {!user?.emailVerified && (
          <>
            <p>
              Verifica tu correo para publicar, pujar, comprar y enviar
              mensajes.
            </p>
            <button
              className="button ai"
              onClick={async () => {
                if (await act(() => service.verifyEmail()))
                  T("Correo de verificación enviado.");
              }}
            >
              Enviar verificación
            </button>
            <button
              className="button"
              onClick={() => act(() => service.refreshUser())}
            >
              Ya verifiqué mi correo
            </button>
          </>
        )}
        <form onInvalidCapture={spanishValidation} onInputCapture={clearValidation} onChangeCapture={clearValidation}
          onSubmit={async (e) => {
            e.preventDefault();
            if (await act(() => service.updateProfile(name)))
              T("Perfil actualizado.");
          }}
        >
          <label>
            Nombre
            <input
              required
              maxLength={80}
              value={name}
              onChange={(e) => N(e.target.value)}
            />
          </label>
          <button className="button primary">Guardar perfil</button>
        </form>
        <p role="status">{notice}</p>
        <button
          className="text-button"
          onClick={() => act(() => service.logout())}
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}

function Header() {
  const { query, setQuery, state, user, service } = useApp();
  const nav = useNavigate();
  return (
    <>
      <header>
        <Link className="logo" to="/">
          <span className="logo-icon">
            <Zap fill="currentColor" size={23} />
          </span>
          ventas<span>flash</span>
          <i />
        </Link>
        <div className="search">
          <Search size={19} />
          <input
            aria-label="Buscar productos"
            placeholder="¿Qué estás buscando hoy?"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              nav("/");
            }}
          />
          <kbd>⌕</kbd>
        </div>
        <Link className="button primary sell-top" to="/vender">
          <Plus size={18} /> Vender rápido
        </Link>
        <Link to={user ? "/perfil" : "/acceso"} className="profile">
          <span className="avatar">{user?.name[0] || "?"}</span>
          <span>
            <b>{user?.name || "Ingresar"}</b>
            <small>
              <ShieldCheck size={12} />
              {user?.identityVerified
                ? service.mode === "demo"
                  ? "Verificado demo"
                  : "Verificado"
                : user?.emailVerified
                  ? "Correo verificado"
                  : "Mi cuenta"}
            </small>
          </span>
        </Link>
      </header>
      <nav className="subnav">
        <div>
          <NavLink to="/" end>
            Explorar
          </NavLink>
          <NavLink to="/radar">
            <Compass size={16} /> Radar Flash
          </NavLink>
          <NavLink to="/live" className="nav-live-item">
            <Radio size={16} className="live-pulse-icon" /> Flash Live
            {state.liveStreams?.some((s) => s.status === "live") && (
              <span className="live-dot-mini" />
            )}
          </NavLink>
          <NavLink to="/favoritos">
            <Heart size={16} /> Favoritos{" "}
            {state.favorites.length > 0 && `(${state.favorites.length})`}
          </NavLink>
          <NavLink to="/pedidos">
            <ShoppingBag size={16} /> Mis compras
          </NavLink>
        </div>
        <Link to="/radar" className="subnav-radar-pill" title="Explorar en Radar Flash">
          <MapPin size={14} /> Lima, Perú · <b>Ver Radar</b>
        </Link>
      </nav>
    </>
  );
}
function Catalog({ favorites = false }: { favorites?: boolean }) {
  const { state, now, query, setQuery } = useApp();
  const [mode, setMode] = useState("todos");
  const [category, setCategory] = useState("Todas");
  const [sort, setSort] = useState("recent");
  const [max, setMax] = useState("");
  const list = state.products
    .filter(
      (p) =>
        (!favorites || state.favorites.includes(p.id)) &&
        (mode === "todos" || p.mode === mode) &&
        (category === "Todas" || p.category === category) &&
        p.title.toLowerCase().includes(query.toLowerCase()) &&
        (!max || priceAt(p, now) <= Number(max)),
    )
    .sort((a, b) =>
      sort === "low"
        ? priceAt(a, now) - priceAt(b, now)
        : sort === "high"
          ? priceAt(b, now) - priceAt(a, now)
          : b.created - a.created,
    );
  return (
    <main>
      {!favorites && (
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <span /> MENOS ESPERA. MÁS OPORTUNIDADES.
            </span>
            <h1>
              Lo bueno no espera.
              <br />
              <em>Tú tampoco.</em>
            </h1>
            <p>
              Puja, atrapa un remate o compra al instante.
              <br />
              Tu próxima gran compra está a un flash de distancia.
            </p>
            <div className="hero-btn-group">
              <a href="#catalog" className="button lime">
                <Zap size={17} fill="currentColor" /> Explorar oportunidades
              </a>
              <Link to="/radar" className="button radar-hero-btn">
                <Compass size={17} /> Abrir Radar Flash
              </Link>
              <Link to="/live" className="button live-hero-btn">
                <Radio size={16} /> Flash Live
              </Link>
            </div>
            <div className="hero-trust">
              <ShieldCheck size={17} /> Compras protegidas <span>·</span>{" "}
              Vendedores verificados
            </div>
          </div>
          <div className="hero-art">
            <div className="orbit" />
            <span className="floating-label">
              <Zap size={15} fill="currentColor" /> El momento es ahora
            </span>
            <img
              alt="Cámara para tu próxima aventura"
              src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=700&auto=format&fit=crop&q=85"
            />
            <div className="hero-ticket">
              <span>GRANDES HALLAZGOS</span>
              <strong>Pequeños precios.</strong>
              <small>Una segunda vida. Mil nuevas historias.</small>
            </div>
            <span className="asterisk">✳</span>
          </div>
        </section>
      )}
      <section className="benefits">
        <span>
          <ShieldCheck />
          Tu compra, protegida <small>Tranquilidad de principio a fin</small>
        </span>
        <span>
          <Zap />
          Tres formas de ganar <small>Tú eliges cómo comprar</small>
        </span>
        <span>
          <Package />
          De persona a persona <small>Más cerca, más simple</small>
        </span>
      </section>
      <section id="catalog">
        <div className="section-heading">
          <div>
            <span className="eyebrow muted">
              BUENAS COSAS, NUEVAS HISTORIAS
            </span>
            <h2>
              {favorites ? "Tus favoritos" : "Encuentra tu próxima oportunidad"}
              <span className="tiny-lime">✦</span>
            </h2>
          </div>
          <span className="live">
            <i /> En vivo ahora
          </span>
        </div>
        <div className="catalog-layout">
          <aside>
            <h3>
              <SlidersHorizontal size={17} /> Filtros
            </h3>
            <label>
              Categoría
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {[
                  "Todas",
                  "Tecnología",
                  "Música",
                  "Fotografía",
                  "Hogar",
                  "Moda",
                  "Otros",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Precio máximo (S/)
              <input
                type="number"
                min="0"
                placeholder="Sin límite"
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </label>
            <div className="filter-caption">Modalidad de venta</div>
            {["todos", "subasta", "remate", "normal"].map((m) => (
              <label className="radio" key={m}>
                <input
                  type="radio"
                  checked={mode === m}
                  onChange={() => setMode(m)}
                />
                {m === "todos" ? "Todas las oportunidades" : labels[m as Mode]}
              </label>
            ))}
            <button
              className="text-button"
              onClick={() => {
                setMax("");
                setCategory("Todas");
                setMode("todos");
                setQuery("");
              }}
            >
              Limpiar filtros
            </button>
            <div className="aside-note">
              <ShieldCheck size={27} />
              <b>Compra con confianza</b>
              <p>
                En esta demo, la recepción completa el pedido sin mover dinero
                real.
              </p>
              <small>Comisión de venta del 4%.</small>
            </div>
          </aside>
          <div className="results">
            <div className="catalog-toolbar">
              <div className="tabs">
                {["todos", "subasta", "remate", "normal"].map((m) => (
                  <button
                    className={mode === m ? "selected" : ""}
                    key={m}
                    onClick={() => setMode(m)}
                  >
                    {m === "todos" ? "Todo" : labels[m as Mode]}
                  </button>
                ))}
              </div>
              <select
                aria-label="Ordenar productos"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="recent">Más recientes</option>
                <option value="low">Menor precio</option>
                <option value="high">Mayor precio</option>
              </select>
            </div>
            <p className="result-count">{list.length} oportunidades para ti</p>
            <div className="product-grid">
              {list.map((p) => (
                <Card key={p.id} p={p} />
              ))}
            </div>
            {!list.length && (
              <div className="empty">
                <Search size={35} />
                <h3>No encontramos productos</h3>
                <p>Prueba otra búsqueda o ajusta los filtros.</p>
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="sell-banner">
        <div className="banner-icon">
          <Sparkles size={30} />
        </div>
        <div>
          <h2>Eso que ya no usas, alguien lo está buscando.</h2>
          <p>Publica en minutos con una mano de nuestra IA simulada.</p>
        </div>
        <Link className="button primary" to="/vender">
          <Plus size={17} /> Quiero vender
        </Link>
      </section>
    </main>
  );
}
function Card({ p }: { p: Product }) {
  const { state, service, act, now } = useApp();
  const favorite = state.favorites.includes(p.id);
  const sold =
    p.status === "sold" || state.orders.some((o) => o.productId === p.id);
  return (
    <article className="product-card">
      <div className={"product-image " + p.id}>
        <Link to={"/producto/" + p.id}>
          <Photo p={p} />
        </Link>
        <Badge mode={p.mode} />
        <button
          aria-label={favorite ? "Quitar de favoritos" : "Guardar en favoritos"}
          className={"heart " + (favorite ? "hearted" : "")}
          onClick={() => act(() => service.toggleFavorite(p.id))}
        >
          <Heart size={18} fill={favorite ? "currentColor" : "none"} />
        </button>
        <div className={"image-bottom " + p.mode}>
          {sold ? (
            <>
              <Check size={14} /> Vendido
            </>
          ) : p.mode === "subasta" ? (
            <>
              <Clock size={14} /> {remaining(p.end, now)}{" "}
              <span>para terminar</span>
            </>
          ) : p.mode === "remate" ? (
            <>
              <TrendingDown size={15} /> Baja {money(p.step)} cada 30 s
            </>
          ) : (
            <>
              <ShoppingBag size={14} /> Tuyo, sin esperar
            </>
          )}
        </div>
      </div>
      <div className="card-info">
        <span className="condition">
          Como nuevo <span>· Lima</span>
        </span>
        <Link to={"/producto/" + p.id}>
          <h3>{p.title}</h3>
        </Link>
        <div className="price-caption">
          {p.mode === "subasta"
            ? "Puja actual"
            : p.mode === "remate"
              ? "Precio en este momento"
              : "Precio de venta"}
        </div>
        <div className="price-row">
          <strong>{money(priceAt(p, now))}</strong>
          <del>{money(p.original)}</del>
        </div>
        <div className="card-bottom">
          <span>
            <ShieldCheck size={14} />
            {p.seller}
          </span>
          <Link to={"/producto/" + p.id}>
            {p.mode === "subasta"
              ? "Pujar"
              : p.mode === "remate"
                ? "Atrapar"
                : "Ver producto"}
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
function Detail() {
  const { id } = useParams();
  const { state, service, user, act, now } = useApp();
  const p = state.products.find((p) => p.id === id);
  const [amount, A] = useState(""),
    [maximum, M] = useState(""),
    [message, T] = useState(""),
    [busy, B] = useState(false),
    [bids, Bids] = useState<Product["bids"]>([]),
    [cap, Cap] = useState<number | null>(null);
  const [editing, E] = useState(false),
    [title, Title] = useState(""),
    [description, D] = useState("");
  useEffect(() => {
    if (!p || p.mode !== "subasta") return;
    const a = service.subscribeBids(p.id, Bids, T),
      b = service.subscribeAutoBid(p.id, Cap, T);
    return () => {
      a();
      b();
    };
  }, [service, p?.id, p?.mode, user?.id]);
  if (!p) return <NotFound />;
  const sold = p.status === "sold",
    ended = now >= p.end,
    winner = (p.winnerId || p.leaderId) === user?.id,
    own = p.sellerId === user?.id;
  async function bid(e: React.FormEvent, automatic = false) {
    e.preventDefault();
    B(true);
    await act(async () => {
      const r = await service.bid(
        p!.id,
        Number(automatic ? maximum : amount || p!.price + 50),
        automatic,
      );
      T(
        r.extended
          ? "Puja registrada: se añadieron 60 segundos al vencimiento."
          : "Oferta registrada. Revisa quién lidera la subasta.",
      );
      A("");
    });
    B(false);
  }
  return (
    <main>
      <Link className="back" to="/">
        Catálogo / {p.category} / {p.title}
      </Link>
      <div className="detail-grid">
        <div>
          <div className="detail-image">
            <Photo p={p} />
          </div>
          <div className="panel">
            <h3>Una buena compra empieza por los detalles</h3>
            <p>{p.description}</p>
            <span className="seller">
              <span className="avatar">{p.seller[0]}</span>
              {p.seller}
              {p.sellerVerified && <ShieldCheck size={18} />}
            </span>
            {own && (
              <>
                <button
                  className="button"
                  onClick={() => {
                    E(!editing);
                    Title(p.title);
                    D(p.description);
                  }}
                >
                  Editar publicación
                </button>
                {editing && (
                  <form onInvalidCapture={spanishValidation} onInputCapture={clearValidation} onChangeCapture={clearValidation}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (
                        await act(() =>
                          service.editProduct(p.id, title, description),
                        )
                      )
                        E(false);
                    }}
                  >
                    <label>
                      Título
                      <input
                        required
                        maxLength={100}
                        value={title}
                        onChange={(e) => Title(e.target.value)}
                      />
                    </label>
                    <label>
                      Descripción
                      <textarea
                        required
                        maxLength={2000}
                        value={description}
                        onChange={(e) => D(e.target.value)}
                      />
                    </label>
                    <p>
                      Solo se permite editar publicaciones activas sin pujas.
                    </p>
                    <button className="button primary">Guardar cambios</button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
        <div className="panel detail-info">
          {p.isLive && (
            <div className="product-live-banner">
              <span className="dot-pulse" />
              <span>
                <b>En directo ahora:</b> Este producto está en transmisión en Flash Live.
              </span>
              <Link to="/live" className="button small lime">
                Ver en directo
              </Link>
            </div>
          )}
          <Badge mode={p.mode} />
          <h1>{p.title}</h1>
          <p>
            <MapPin size={15} />
            <Link to="/radar" className="detail-geo-link" title="Ver en Radar Flash">
              {p.locationLabel || "Lima, Perú"} · Ver en Radar Flash
            </Link>
            {" · Como nuevo"}
          </p>
          <span className="price-caption">
            {p.mode === "subasta" ? "Puja actual" : "Precio estimado actual"}
          </span>
          <h2 className="detail-price">{money(priceAt(p, now))}</h2>
          {sold ? (
            <div className="notice">Producto vendido.</div>
          ) : p.mode === "subasta" ? (
            <>
              <div className="timer">
                <Clock />
                {remaining(p.end, now)}
                <small>{ended ? "Plazo vencido" : "Tiempo restante"}</small>
              </div>
              <div className="notice">
                <ShieldCheck />
                <span>
                  <b>Reloj anti-robo</b>
                  <br />
                  Si faltan 30 segundos o menos, una puja válida añade 60
                  segundos al vencimiento vigente.
                </span>
              </div>
              {!ended && !own ? (
                <>
                  {user ? (
                    <>
                      <form onInvalidCapture={spanishValidation} onInputCapture={clearValidation} onChangeCapture={clearValidation} onSubmit={(e) => bid(e)}>
                        <label>
                          Tu puja (mínimo {money(p.price + 50)})
                          <input
                            type="number"
                            min={p.price + 50}
                            step="0.01"
                            value={amount}
                            placeholder={String(p.price + 50)}
                            onChange={(e) => A(e.target.value)}
                          />
                        </label>
                        <button disabled={busy} className="button primary full">
                          Pujar {money(Number(amount) || p.price + 50)}
                        </button>
                      </form>
                      <form onInvalidCapture={spanishValidation} onInputCapture={clearValidation} onChangeCapture={clearValidation} onSubmit={(e) => bid(e, true)}>
                        <label>
                          Máximo privado de auto-puja
                          <input
                            required
                            type="number"
                            min={p.price + 50}
                            step="0.01"
                            value={maximum}
                            onChange={(e) => M(e.target.value)}
                          />
                        </label>
                        <button disabled={busy} className="button ai full">
                          Activar / aumentar auto-puja
                        </button>
                        <small>
                          {cap
                            ? "Tu máximo: " + money(cap)
                            : "Solo tú puedes ver tu límite. No se puede reducir una oferta comprometida."}
                        </small>
                      </form>
                    </>
                  ) : (
                    <Link className="button primary" to="/acceso">
                      Ingresar para pujar
                    </Link>
                  )}
                </>
              ) : ended ? (
                <>
                  {p.status === "active" && user && (
                    <button
                      className="button"
                      onClick={() => act(() => service.closeAuction(p.id))}
                    >
                      Verificar cierre en el servidor
                    </button>
                  )}
                  {winner ? (
                    <Link
                      className="button primary full"
                      to={"/checkout/" + id}
                    >
                      Completar compra ganadora
                    </Link>
                  ) : (
                    <p>
                      No tienes una puja ganadora. El backend confirma el
                      cierre.
                    </p>
                  )}
                </>
              ) : (
                <p>Esta es tu publicación. No puedes pujar en ella.</p>
              )}
              <p role="status">{message}</p>
              <h3>Historial de pujas ({bids.length})</h3>
              {!bids.length ? (
                <p>Aún no hay pujas.</p>
              ) : (
                bids.map((b, i) => (
                  <div className="bid-row" key={i}>
                    <span>
                      {b.name}
                      {i === 0 ? " · Lidera" : ""}
                      <small className="message-time">
                        {new Date(b.time).toLocaleString("es-PE")}
                      </small>
                    </span>
                    <b>{money(b.amount)}</b>
                  </div>
                ))
              )}
            </>
          ) : own ? (
            <p>Esta es tu publicación.</p>
          ) : (
            <>
              {p.mode === "remate" && (
                <div className="notice">
                  <TrendingDown />
                  <span>
                    <b>Precio descendente</b>
                    <br />
                    {priceAt(p, now) <= p.floor
                      ? "Precio mínimo alcanzado."
                      : "Baja " + money(p.step) + " cada 30 segundos."}
                    <br />
                    Mínimo: {money(p.floor)}. El servidor confirma el precio al
                    comprar.
                  </span>
                </div>
              )}
              <Link className="button primary full" to={"/checkout/" + id}>
                Comprar ahora
              </Link>
            </>
          )}
          <p className="protection">
            <ShieldCheck />
            Comisión incluida en el precio · Sin cobros reales
          </p>
        </div>
      </div>
    </main>
  );
}

function NotFound() {
  return (
    <main>
      <h1>Producto no encontrado</h1>
      <Link to="/">Volver al catálogo</Link>
    </main>
  );
}
function Sell() {
  const { service, act } = useApp();
  const nav = useNavigate();
  const [draft] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("ventas_flash_sell_draft") || "{}");
    } catch {
      return {};
    }
  });
  const [title, T] = useState(draft.title || "");
  const [desc, D] = useState(draft.desc || "");
  const [category, C] = useState(draft.category || "Tecnología");
  const [mode, M] = useState<Mode>(draft.mode || "normal");
  const [price, P] = useState(draft.price || "");
  const [image, I] = useState(draft.image || "");
  const [file, F] = useState<File>();
  const [status, S] = useState("");
  const [busy, B] = useState(false);
  const initialDistrict = LIMA_DISTRICTS.find((d) => d.name === draft.district) || LIMA_DISTRICTS[0];
  const initialApprox = approximateCoordinates(initialDistrict.latitude, initialDistrict.longitude);
  const [district, SetDistrict] = useState(draft.district || initialDistrict.name);
  const [lat, SetLat] = useState(initialApprox.latitude);
  const [lon, SetLon] = useState(initialApprox.longitude);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        "ventas_flash_sell_draft",
        JSON.stringify({ title, desc, category, mode, price, image, district })
      );
    } catch {}
  }, [title, desc, category, mode, price, image, district]);
  async function photo(file?: File) {
    if (!file) return;
    try {
      validateImage(file);
    } catch (e) {
      S(friendly(e));
      return;
    }
    F(file);
    const reader = new FileReader();
    reader.onload = () => I(String(reader.result));
    reader.onerror = () => S("No se pudo leer la imagen.");
    reader.readAsDataURL(file);
  }
  async function ai() {
    if (!title.trim() && !image) {
      S("Escribe el nombre de tu producto o añade una foto primero.");
      return;
    }
    B(true);
    S("Consultando a Google Gemini AI para tasación y descripción…");
    try {
      const result = await generateProductDraft(title.trim() || "Artículo en venta", image || undefined);
      D(result.description);
      C(result.category);
      P(String(result.price));
      S(
        result.isRealAI
          ? `✨ ¡Generado con Google Gemini 2.5 Flash! Categoría: ${result.category} · Precio estimado: S/ ${result.price}.`
          : `¡Borrador generado para ${result.category}! Precio referencial: S/ ${result.price}. Puedes personalizarlo.`
      );
    } catch {
      S("No se pudo completar la consulta de IA. Revisa el borrador.");
    } finally {
      B(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    B(true);
    const ok = await act(async () => {
      const id = await service.createProduct({
        id: crypto.randomUUID(),
        title,
        description: desc,
        category,
        mode,
        price: Number(price),
        image,
        file,
        latitude: lat,
        longitude: lon,
        locationLabel: district,
        locationVisibility: "approximate",
      });
      try {
        sessionStorage.removeItem("ventas_flash_sell_draft");
      } catch {}
      nav("/producto/" + id);
    });
    B(false);
    if (!ok) S("No se pudo publicar. Revisa el aviso e inténtalo de nuevo.");
  }
  return (
    <main className="narrow">
      <Link className="back" to="/">
        Volver al catálogo
      </Link>
      <span className="eyebrow muted">DALE UNA NUEVA HISTORIA</span>
      <h1>Vende rápido. Así de simple.</h1>
      <p>Los buenos hallazgos empiezan con una buena publicación.</p>
      <form onInvalidCapture={spanishValidation} onInputCapture={clearValidation} onChangeCapture={clearValidation} className="panel sell-form" onSubmit={submit}>
        <label className="upload">
          <Camera size={30} />
          {image ? (
            <img src={image} alt="Vista previa del producto" />
          ) : (
            <>
              <b>Añade una foto de tu producto</b>
              <span>JPG, PNG o WebP · Máximo 2 MB</span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => photo(e.target.files?.[0])}
          />
        </label>
        <label>
          ¿Qué vendes?
          <input
            required
            maxLength={100}
            value={title}
            onChange={(e) => T(e.target.value)}
            placeholder="Ej. Bicicleta de montaña"
          />
        </label>
        <button
          className="button ai"
          type="button"
          onClick={ai}
          disabled={busy}
        >
          <Sparkles size={18} />
          {busy ? "Consultando a Google Gemini AI…" : "Ayúdame con IA (Gemini 2.5 Flash)"}
        </button>
        <label>
          Descripción
          <textarea
            required
            maxLength={2000}
            value={desc}
            onChange={(e) => D(e.target.value)}
            placeholder="Estado, accesorios y detalles de entrega"
          />
        </label>
        <div className="form-row">
          <label>
            Categoría
            <select value={category} onChange={(e) => C(e.target.value)}>
              {[
                "Tecnología",
                "Videojuegos",
                "Música",
                "Fotografía",
                "Deportes",
                "Hogar",
                "Moda",
                "Otros",
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Precio inicial (S/)
            <input
              required
              type="number"
              min="1"
              max="1000000"
              step="0.01"
              value={price}
              onChange={(e) => P(e.target.value)}
            />
          </label>
        </div>
        <label>
          Modalidad
          <select value={mode} onChange={(e) => M(e.target.value as Mode)}>
            {Object.entries(labels).map(([v, l]) => (
              <option value={v} key={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Zona aproximada para Radar Flash
          <select
            value={district}
            onChange={(e) => {
              const d = LIMA_DISTRICTS.find((x) => x.name === e.target.value);
              if (d) {
                const approx = approximateCoordinates(d.latitude, d.longitude);
                SetDistrict(d.name);
                SetLat(approx.latitude);
                SetLon(approx.longitude);
              }
            }}
          >
            {LIMA_DISTRICTS.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <p className="privacy-hint">
          <ShieldCheck size={14} /> Por tu privacidad, solo mostramos tu distrito en el mapa, nunca tu dirección exacta.
        </p>
        <p>
          {mode === "subasta"
            ? "Subasta demo de 3 minutos, con incremento mínimo de S/ 50 y reloj anti-robo."
            : mode === "remate"
              ? "Baja un 2% del precio inicial cada 30 segundos (mínimo S/ 1 por paso), hasta el 70% del precio inicial."
              : "Precio fijo: compra inmediata."}
        </p>
        <SellerEarnings price={price} mode={mode} />
        <p role="status">{status}</p>
        <button disabled={busy} className="button primary full">
          <Plus size={18} /> Publicar producto
        </button>
      </form>
    </main>
  );
}
function Checkout() {
  const { id } = useParams();
  const { state, service, user, now, act } = useApp();
  const nav = useNavigate();
  const p = state.products.find((x) => x.id === id);
  const [accepted, A] = useState(false),
    [busy, B] = useState(false);
  const [quote] = useState(() => (p ? priceAt(p, now) : 0));
  if (!p) return <NotFound />;
  if (p.status === "sold")
    return (
      <main className="narrow">
        <h1>Producto comprado</h1>
        <Link to="/pedidos">Ver pedidos</Link>
      </main>
    );
  if (p.sellerId === user?.id)
    return (
      <main>
        <h1>No puedes comprar tu publicación</h1>
      </main>
    );
  if (
    p.mode === "subasta" &&
    (now < p.end || (p.winnerId || p.leaderId) !== user?.id)
  )
    return (
      <main>
        <h1>Compra no disponible</h1>
        <Link to={"/producto/" + id}>Volver a la subasta</Link>
      </main>
    );

  async function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!accepted) return;
    B(true);
    if (await act(() => service.purchase(id!, quote))) nav("/pedidos");
    B(false);
  }
  return (
    <main className="narrow">
      <Link className="back" to={"/producto/" + id}>
        Volver al producto
      </Link>
      <h1>Tu hallazgo, casi tuyo.</h1>
      <p>Proveedor de pagos DEMO · No ingreses datos bancarios.</p>
      <form onInvalidCapture={spanishValidation} onInputCapture={clearValidation} onChangeCapture={clearValidation} className="panel" onSubmit={pay}>
        <div className="checkout-product">
          <Photo p={p} />
          <div>
            <Badge mode={p.mode} />
            <h2>{p.title}</h2>
            <span>{p.seller}</span>
          </div>
        </div>
        <div className="bid-row">
          <span>Producto (máximo autorizado)</span>
          <b>{money(quote)}</b>
        </div>
        <p className="checkout-commission">Sin comisión adicional para el comprador. La comisión del 4% se descuenta al vendedor.</p>
        <div className="bid-row total">
          <span>Total máximo</span>
          <strong>{money(quote)}</strong>
        </div>
        <p className="notice">
          <ShieldCheck />
          Simulación: no se cobra ni retiene dinero real. El backend
          calcula el importe final y evita compras duplicadas.
        </p>
        {p.mode === "remate" && (
          <p>
            Si el precio baja antes de confirmar, se aplica el menor precio
            calculado al comprar.
          </p>
        )}
        <label className="radio">
          <input
            required
            type="checkbox"
            checked={accepted}
            onChange={(e) => A(e.target.checked)}
          />
          Entiendo que es una compra de demostración sin cobro real.
        </label>
        <button className="button primary full" disabled={!accepted || busy}>
          {busy ? "Confirmando…" : "Confirmar compra DEMO"}
        </button>
      </form>
    </main>
  );
}

function Orders() {
  const { state, user } = useApp();
  return (
    <main className="narrow">
      <span className="eyebrow muted">
        TU ESPACIO, {user?.name.toUpperCase()}
      </span>
      <h1>Mis compras y ventas</h1>
      <p>Coordina entregas con la otra persona. Los pagos son DEMO.</p>
      {!state.orders.length ? (
        <div className="panel empty">
          <ShoppingBag size={40} />
          <h2>Aún no tienes pedidos</h2>
          <Link className="button primary" to="/">
            Explorar oportunidades
          </Link>
        </div>
      ) : (
        state.orders.map((o) => <OrderPanel key={o.id} order={o} />)
      )}
    </main>
  );
}
function OrderPanel({ order: o }: { order: State["orders"][number] }) {
  const { service, user, act } = useApp();
  const [messages, M] = useState(o.messages),
    [draft, D] = useState(""),
    [error, E] = useState(""),
    [busy, B] = useState(false);
  useEffect(
    () => service.subscribeMessages(o.id, M, E),
    [service, o.id, user?.id],
  );
  return (
    <section className="panel order">
      <div className="order-heading">
        <h2>{o.title}</h2>
        <span className="badge normal">
          {o.received ? "Completado" : "Entrega pendiente"}
        </span>
      </div>
      <p>
        {o.buyerId === user?.id ? "Tu compra" : "Tu venta"} · Total:{" "}
        <b>{money(orderAmounts(o).buyerTotal)}</b> · Proveedor DEMO
      </p>
      {o.sellerId === user?.id && <div className="order-proceeds"><span>Comisión de la plataforma: <b>{money(o.fee)}</b>{o.feePayer !== "seller" && " (a cargo del comprador en este pedido anterior)"}</span><strong>Recibirás: {money(orderAmounts(o).sellerNet)}</strong></div>}
      <div className="notice">
        <ShieldCheck />
        {o.received
          ? "Recepción confirmada. Liberación simulada completada, sin movimiento de dinero."
          : "Pago retenido simulado. Solo el comprador puede confirmar la recepción."}
      </div>
      <h3>Chat de entrega</h3>
      <p role="alert">{error}</p>
      <div className="messages">
        {messages.map((m, i) => (
          <p key={i} className={m.mine ? "mine" : ""}>
            {m.text}
            <small className="message-time">
              {m.time ? new Date(m.time).toLocaleString("es-PE") : "Enviando…"}
            </small>
          </p>
        ))}
      </div>
      <form onInvalidCapture={spanishValidation} onInputCapture={clearValidation} onChangeCapture={clearValidation}
        className="chat-input"
        onSubmit={async (e) => {
          e.preventDefault();
          B(true);
          if (await act(() => service.sendMessage(o.id, draft))) D("");
          B(false);
        }}
      >
        <input
          aria-label="Mensaje al participante"
          value={draft}
          maxLength={1000}
          onChange={(e) => D(e.target.value)}
          placeholder="Coordina tu entrega…"
        />
        <button
          className="button primary"
          aria-label="Enviar mensaje"
          disabled={busy || !draft.trim()}
        >
          <Send size={18} />
        </button>
      </form>
      {!o.received && o.buyerId === user?.id && (
        <button
          disabled={busy}
          className="button primary full"
          onClick={async () => {
            B(true);
            await act(() => service.confirmReceipt(o.id));
            B(false);
          }}
        >
          <Check size={18} />
          Confirmar que recibí el producto
        </button>
      )}
    </section>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
