import { spanishValidation, clearValidation } from "../lib/formValidation";
import { friendly } from "../lib/errors";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Radio,
  Play,
  Users,
  Clock,
  ShieldCheck,
  Plus,
  Flame,
  Sparkles,
  ChevronRight,
  TrendingDown,
  ShoppingBag,
  AlertCircle,
  Video,
} from "lucide-react";
import type { LiveSession, Product } from "../model";
import { money, priceAt, remaining } from "../model";
import type { UserProfile } from "../types/marketplace";

interface LiveHubProps {
  liveStreams: LiveSession[];
  products: Product[];
  user: UserProfile | null;
  now: number;
  onCreateStream: (title: string, description: string, productIds: string[]) => Promise<string>;
}

export function LiveHub({
  liveStreams,
  products,
  user,
  now,
  onCreateStream,
}: LiveHubProps) {
  const navigate = useNavigate();
  const [filterTab, setFilterTab] = useState<"todos" | "live" | "scheduled" | "ended">("todos");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Productos propios del usuario para asociar a su directo
  const myProducts = products.filter(
    (p) => user && p.sellerId === user.id && (p.status === "active" || !p.status)
  );

  const filteredStreams = liveStreams.filter((s) => {
    if (filterTab === "todos") return true;
    return s.status === filterTab;
  });

  const activeCount = liveStreams.filter((s) => s.status === "live").length;

  function toggleProductSelection(id: string) {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) {
      setErrorMsg("Escribe un título para tu transmisión.");
      return;
    }
    if (selectedProductIds.length === 0) {
      setErrorMsg("Selecciona al menos un producto para presentar en el directo.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const streamId = await onCreateStream(newTitle, newDesc, selectedProductIds);
      setShowCreateModal(false);
      navigate(`/live/${streamId}`);
    } catch (err: unknown) {
      const msg = friendly(err);
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="live-hub-page">
      {/* Banner Principal */}
      <section className="live-hero-banner">
        <div className="live-hero-copy">
          <span className="live-chip-active">
            <Radio size={14} className="pulse-icon" /> FLASH LIVE · TRANSMISIONES EN VIVO
          </span>
          <h1>Compra y puja en tiempo real mientras miras el directo</h1>
          <p>
            Los vendedores muestran sus productos en vídeo interactivo. Realiza
            pujas sincronizadas, haz preguntas en el chat público y asegura las mejores
            oportunidades de Lima sin esperas.
          </p>
          <div className="live-hero-actions">
            <button
              type="button"
              className="button primary lime"
              onClick={() => {
                if (!user) {
                  navigate("/login");
                } else if (myProducts.length === 0) {
                  navigate("/vender");
                } else {
                  setShowCreateModal(true);
                }
              }}
            >
              <Video size={17} /> Transmitir en Flash Live
            </button>
            <a href="#live-list" className="button live-outline-btn">
              <Play size={15} /> Ver directos ({activeCount} en vivo)
            </a>
          </div>
        </div>

        <div className="live-hero-badges">
          <div className="live-stat-card">
            <Flame size={24} className="flame-icon" />
            <div>
              <strong>Subastas en tiempo real</strong>
              <small>Pujas y reloj anti-robo activos durante la transmisión</small>
            </div>
          </div>
          <div className="live-stat-card">
            <ShieldCheck size={24} className="shield-icon" />
            <div>
              <strong>Protección del 4%</strong>
              <small>Garantía de entrega y chat bilateral postventa</small>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs de Filtro */}
      <section className="live-filter-section" id="live-list">
        <div className="live-tabs">
          <button
            type="button"
            className={`live-tab ${filterTab === "todos" ? "active" : ""}`}
            onClick={() => setFilterTab("todos")}
          >
            Todas ({liveStreams.length})
          </button>
          <button
            type="button"
            className={`live-tab ${filterTab === "live" ? "active" : ""}`}
            onClick={() => setFilterTab("live")}
          >
            🔴 En directo ({liveStreams.filter((s) => s.status === "live").length})
          </button>
          <button
            type="button"
            className={`live-tab ${filterTab === "scheduled" ? "active" : ""}`}
            onClick={() => setFilterTab("scheduled")}
          >
            📅 Programadas ({liveStreams.filter((s) => s.status === "scheduled").length})
          </button>
          <button
            type="button"
            className={`live-tab ${filterTab === "ended" ? "active" : ""}`}
            onClick={() => setFilterTab("ended")}
          >
            Terminadas ({liveStreams.filter((s) => s.status === "ended").length})
          </button>
        </div>

        {/* Cuadrícula de Salas Live */}
        <div className="live-grid">
          {filteredStreams.length === 0 ? (
            <div className="live-empty-state">
              <AlertCircle size={40} />
              <h3>No hay transmisiones en esta categoría</h3>
              <p>Sé el primero en iniciar un directo para vender tus productos.</p>
              <button
                type="button"
                className="button primary"
                onClick={() => {
                  if (!user) navigate("/login");
                  else if (myProducts.length === 0) navigate("/vender");
                  else setShowCreateModal(true);
                }}
              >
                <Plus size={16} /> Crear transmisión Flash Live
              </button>
            </div>
          ) : (
            filteredStreams.map((stream) => {
              const streamProducts = products.filter((p) =>
                stream.productIds.includes(p.id)
              );
              const featured =
                streamProducts.find((p) => p.id === stream.activeProductId) ||
                streamProducts[0];
              const isLive = stream.status === "live";

              return (
                <article key={stream.id} className={`live-card ${stream.status}`}>
                  <div className="live-card-media">
                    {featured?.image ? (
                      <img src={featured.image} alt={stream.title} />
                    ) : (
                      <div className="live-card-placeholder">
                        <Video size={40} />
                      </div>
                    )}
                    <div className="live-card-overlay">
                      <span className={`live-status-badge ${stream.status}`}>
                        {isLive ? (
                          <>
                            <span className="dot-pulse" /> EN DIRECTO
                          </>
                        ) : stream.status === "scheduled" ? (
                          "PROGRAMADO"
                        ) : (
                          "FINALIZADO"
                        )}
                      </span>
                      {isLive && (
                        <span className="viewer-count-chip">
                          <Users size={12} /> {stream.viewerCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="live-card-body">
                    <div className="live-host-meta">
                      <span className="live-host-name">
                        <ShieldCheck size={14} /> {stream.sellerName}
                      </span>
                      <small className="product-count-chip">
                        {streamProducts.length} {streamProducts.length === 1 ? "artículo" : "artículos"}
                      </small>
                    </div>

                    <h3>{stream.title}</h3>
                    <p className="live-desc-preview">{stream.description || "Transmisión en directo en Ventas Flash."}</p>

                    {featured && (
                      <div className="live-card-featured-box">
                        <span className="featured-label">Destacado ahora:</span>
                        <div className="featured-row">
                          <strong>{featured.title}</strong>
                          <span className="featured-price">{money(priceAt(featured, now))}</span>
                        </div>
                      </div>
                    )}

                    <div className="live-card-actions">
                      <Link to={`/live/${stream.id}`} className="button primary full">
                        <Play size={15} /> {isLive ? "Entrar al directo" : "Ver sala"}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* Modal de Creación de Sesión Flash Live */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-card live-create-modal">
            <h2>Crear nueva sesión Flash Live</h2>
            <p>Organiza tu transmisión en vivo, muestra tus artículos y recibe pujas al instante.</p>

            <form onInvalidCapture={spanishValidation} onInputCapture={clearValidation} onChangeCapture={clearValidation} onSubmit={handleCreate}>
              <label>
                Título del directo
                <input
                  required
                  maxLength={120}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Remate especial de cámaras y tecnología"
                />
              </label>

              <label>
                Descripción de la transmisión
                <textarea
                  maxLength={1000}
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Cuenta qué productos vas a probar y en qué distrito coordinas la entrega..."
                />
              </label>

              <div className="product-picker-section">
                <span className="picker-title">
                  Selecciona tus productos para el directo ({selectedProductIds.length} seleccionados):
                </span>
                {myProducts.length === 0 ? (
                  <div className="picker-empty">
                    <p>No tienes publicaciones activas para transmitir.</p>
                    <Link to="/vender" className="button">
                      Publicar un producto primero
                    </Link>
                  </div>
                ) : (
                  <div className="product-picker-grid">
                    {myProducts.map((p) => {
                      const isSelected = selectedProductIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          className={`picker-item ${isSelected ? "selected" : ""}`}
                          onClick={() => toggleProductSelection(p.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            aria-label={`Seleccionar ${p.title}`}
                          />
                          <div className="picker-info">
                            <strong>{p.title}</strong>
                            <span>{money(p.price)} · {p.mode}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {errorMsg && <p className="error-text">{errorMsg}</p>}

              <div className="modal-btn-row">
                <button
                  type="button"
                  className="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="button primary"
                  disabled={isSubmitting || selectedProductIds.length === 0}
                >
                  {isSubmitting ? "Creando sala..." : "Iniciar sala Flash Live"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
