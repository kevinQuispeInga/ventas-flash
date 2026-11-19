import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Radio,
  Play,
  Square,
  Users,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  Send,
  Clock,
  ShieldCheck,
  TrendingDown,
  ShoppingBag,
  Gavel,
  Zap,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Eye,
} from "lucide-react";
import type { LiveSession, LiveChatMessage, Product, Mode } from "../model";
import { money, priceAt, remaining } from "../model";
import type { UserProfile } from "../types/firestore";
import type { MarketplaceService } from "../services/contracts";
import {
  requestUserMedia,
  createDemoMediaStream,
  stopMediaStream,
} from "../lib/webrtc";

interface LiveRoomProps {
  streamId: string;
  streams: LiveSession[];
  products: Product[];
  user: UserProfile | null;
  service: MarketplaceService;
  now: number;
}

export function LiveRoom({
  streamId,
  streams,
  products,
  user,
  service,
  now,
}: LiveRoomProps) {
  const navigate = useNavigate();
  const stream = streams.find((s) => s.id === streamId);

  // Estados de vídeo y WebRTC
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoActive, setIsVideoActive] = useState(true);

  // Estados de Chat
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Estados de Subasta / Producto activo
  const [activeProductId, setActiveProductId] = useState<string>(
    stream?.activeProductId || stream?.productIds[0] || ""
  );
  const [bidAmount, setBidAmount] = useState("");
  const [autoBidAmount, setAutoBidAmount] = useState("");
  const [actionStatus, setActionStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const isHost = user && stream && user.id === stream.sellerId;
  const isLive = stream?.status === "live";

  // Productos de este directo
  const streamProducts = products.filter((p) =>
    stream?.productIds.includes(p.id)
  );
  const currentProduct =
    streamProducts.find((p) => p.id === activeProductId) || streamProducts[0];

  // Suscripción al chat público en tiempo real
  useEffect(() => {
    const unsub = service.subscribeLiveMessages(
      streamId,
      (msgs) => {
        setMessages(msgs);
        setTimeout(() => {
          if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
          }
        }, 50);
      },
      (err) => setChatError(err)
    );
    return unsub;
  }, [service, streamId]);

  // Manejo de vídeo (WebRTC vs Demo Stream)
  useEffect(() => {
    let currentLocalStream: MediaStream | null = null;

    async function initMedia() {
      if (isHost && !isDemoMode) {
        const { stream: mediaStream, error } = await requestUserMedia();
        if (mediaStream) {
          currentLocalStream = mediaStream;
          setActiveStream(mediaStream);
          setCameraError(null);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } else {
          setCameraError(error);
          setIsDemoMode(true); // Fallback a demo si no hay cámara
        }
      } else {
        // Modo demostración: genera un stream de canvas de alta fidelidad
        const demoStream = createDemoMediaStream(
          stream?.title || "Ventas Flash Live",
          stream?.sellerName || "Anfitrión"
        );
        currentLocalStream = demoStream;
        setActiveStream(demoStream);
        if (videoRef.current) {
          videoRef.current.srcObject = demoStream;
        }
      }
    }

    initMedia();

    return () => {
      stopMediaStream(currentLocalStream);
    };
  }, [isHost, isDemoMode, stream?.title, stream?.sellerName]);

  // Actualizar producto activo si el host lo cambia remotamente
  useEffect(() => {
    if (stream?.activeProductId && stream.activeProductId !== activeProductId) {
      setActiveProductId(stream.activeProductId);
    }
  }, [stream?.activeProductId]);

  if (!stream) {
    return (
      <main className="live-not-found">
        <AlertCircle size={48} />
        <h2>Transmisión no encontrada</h2>
        <p>Esta sala Flash Live no existe o ya no está disponible.</p>
        <Link to="/live" className="button primary">
          Volver a Flash Live
        </Link>
      </main>
    );
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (!user) {
      setChatError("Inicia sesión para participar en el chat.");
      return;
    }

    try {
      setChatError("");
      await service.sendLiveChatMessage(streamId, chatInput.trim());
      setChatInput("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "No se pudo enviar el mensaje.";
      setChatError(msg);
    }
  }

  async function handleStartStream() {
    setIsBusy(true);
    setActionStatus("");
    try {
      await service.startLiveStream(streamId);
      setActionStatus("¡Directo iniciado!");
    } catch (err: unknown) {
      setActionStatus(err instanceof Error ? err.message : "Error al iniciar el directo.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleEndStream() {
    if (!confirm("¿Deseas finalizar la transmisión en vivo? Las subastas seguirán activas según su tiempo restante.")) {
      return;
    }
    setIsBusy(true);
    setActionStatus("");
    try {
      await service.endLiveStream(streamId);
      setActionStatus("Transmisión finalizada.");
    } catch (err: unknown) {
      setActionStatus(err instanceof Error ? err.message : "Error al finalizar el directo.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSelectFeaturedProduct(pid: string) {
    setActiveProductId(pid);
    if (isHost) {
      try {
        await service.setFeaturedLiveProduct(streamId, pid);
      } catch (err: unknown) {
        console.error("Error al actualizar producto destacado:", err);
      }
    }
  }

  async function handleQuickBid(increment: number) {
    if (!currentProduct || !user) {
      navigate("/login");
      return;
    }
    setIsBusy(true);
    setActionStatus("");
    try {
      const currentPrice = priceAt(currentProduct, now);
      const nextPrice = currentPrice + increment;
      await service.bid(currentProduct.id, nextPrice);
      setActionStatus(`¡Puja registrada por ${money(nextPrice)}!`);
    } catch (err: unknown) {
      setActionStatus(err instanceof Error ? err.message : "No se pudo registrar la puja.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCustomBid(e: React.FormEvent) {
    e.preventDefault();
    if (!currentProduct || !user) {
      navigate("/login");
      return;
    }
    const val = Number(bidAmount);
    if (!val || val <= 0) return;

    setIsBusy(true);
    setActionStatus("");
    try {
      await service.bid(currentProduct.id, val);
      setBidAmount("");
      setActionStatus(`¡Puja registrada por ${money(val)}!`);
    } catch (err: unknown) {
      setActionStatus(err instanceof Error ? err.message : "No se pudo registrar la puja.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSetAutoBid(e: React.FormEvent) {
    e.preventDefault();
    if (!currentProduct || !user) {
      navigate("/login");
      return;
    }
    const val = Number(autoBidAmount);
    if (!val || val <= 0) return;

    setIsBusy(true);
    setActionStatus("");
    try {
      await service.bid(currentProduct.id, val, true);
      setAutoBidAmount("");
      setActionStatus(`¡Auto-puja configurada hasta ${money(val)}!`);
    } catch (err: unknown) {
      setActionStatus(err instanceof Error ? err.message : "No se pudo configurar la auto-puja.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="live-room-page">
      {/* Barra superior de la sala */}
      <header className="live-room-topbar">
        <Link to="/live" className="back-link">
          <ArrowLeft size={16} /> Volver a Flash Live
        </Link>

        <div className="live-room-title-block">
          <span className={`live-status-pill ${stream.status}`}>
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
          <h2>{stream.title}</h2>
        </div>

        <div className="live-room-meta-actions">
          <span className="viewer-counter">
            <Eye size={15} /> {stream.viewerCount} espectadores
          </span>
          <span className="host-pill">
            <ShieldCheck size={14} /> Anfitrión: <b>{stream.sellerName}</b>
          </span>
        </div>
      </header>

      {/* Contenido Principal: Grid de 3 Columnas (Vídeo + Subasta + Chat) */}
      <div className="live-room-grid">
        {/* Columna 1: Reproductor de Vídeo y Controles */}
        <section className="live-player-column">
          <div className="video-viewport">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMuted}
              className="live-video-element"
            />

            {/* Overlay informativo de la transmisión */}
            <div className="video-overlay-top">
              <span className="channel-watermark">
                ⚡ VENTAS FLASH LIVE · {isDemoMode ? "MODO DEMO" : "CÁMARA WEBRTC"}
              </span>
              <div className="video-quick-controls">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? "Activar audio" : "Silenciar"}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => {
                    if (videoRef.current?.requestFullscreen) {
                      videoRef.current.requestFullscreen();
                    }
                  }}
                  title="Pantalla completa"
                >
                  <Maximize2 size={18} />
                </button>
              </div>
            </div>

            {/* Aviso de cámara / fallback */}
            {cameraError && (
              <div className="video-notice-banner">
                <AlertCircle size={15} /> {cameraError}
              </div>
            )}
          </div>

          {/* Panel de Control del Anfitrión / Ajustes de Vídeo */}
          <div className="live-stream-controls-bar">
            {isHost ? (
              <div className="host-actions-row">
                {!isLive ? (
                  <button
                    type="button"
                    className="button primary lime"
                    onClick={handleStartStream}
                    disabled={isBusy}
                  >
                    <Play size={16} fill="currentColor" /> Iniciar transmisión en vivo
                  </button>
                ) : (
                  <button
                    type="button"
                    className="button danger"
                    onClick={handleEndStream}
                    disabled={isBusy}
                  >
                    <Square size={16} /> Finalizar directo
                  </button>
                )}

                <button
                  type="button"
                  className="button"
                  onClick={() => setIsDemoMode(!isDemoMode)}
                >
                  <Video size={16} /> {isDemoMode ? "Activar Cámara WebRTC" : "Cambiar a Modo Demo"}
                </button>
              </div>
            ) : (
              <div className="viewer-info-row">
                <span>
                  🔴 Mirando directo de <b>{stream.sellerName}</b>
                </span>
                <button
                  type="button"
                  className="button small"
                  onClick={() => setIsDemoMode(!isDemoMode)}
                >
                  {isDemoMode ? "Probar señal WebRTC" : "Volver a Modo Demo"}
                </button>
              </div>
            )}

            {actionStatus && <p className="status-msg">{actionStatus}</p>}
          </div>

          {/* Selector de productos del directo */}
          <div className="live-products-drawer">
            <span className="drawer-heading">
              Artículos presentados en este directo ({streamProducts.length}):
            </span>
            <div className="drawer-product-chips">
              {streamProducts.map((p) => {
                const isActive = p.id === activeProductId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`product-drawer-chip ${isActive ? "active" : ""}`}
                    onClick={() => handleSelectFeaturedProduct(p.id)}
                  >
                    <strong>{p.title}</strong>
                    <span>{money(priceAt(p, now))}</span>
                    {isActive && <span className="chip-badge">Destacado</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Columna 2: Subasta y Puja en Tiempo Real */}
        <section className="live-auction-column">
          {currentProduct ? (
            <div className="live-product-box">
              <div className="product-header-row">
                <span className={`badge ${currentProduct.mode}`}>
                  {currentProduct.mode === "subasta" ? (
                    <Clock size={12} />
                  ) : currentProduct.mode === "remate" ? (
                    <TrendingDown size={12} />
                  ) : (
                    <ShoppingBag size={12} />
                  )}
                  {currentProduct.mode === "subasta"
                    ? "Subasta Flash"
                    : currentProduct.mode === "remate"
                    ? "Remate Flash"
                    : "Compra Directa"}
                </span>
                <span className="product-id-label"># {currentProduct.category}</span>
              </div>

              {currentProduct.image && (
                <div className="live-product-thumb">
                  <img src={currentProduct.image} alt={currentProduct.title} />
                </div>
              )}

              <h3>{currentProduct.title}</h3>
              <p className="product-desc-short">{currentProduct.description}</p>

              {/* Precios y Contadores */}
              <div className="live-price-card">
                <span className="caption">
                  {currentProduct.mode === "subasta" ? "Puja actual líder" : "Precio actual"}
                </span>
                <div className="live-price-amount">{money(priceAt(currentProduct, now))}</div>

                {currentProduct.mode === "subasta" && (
                  <div className="live-auction-timer">
                    <Clock size={16} />
                    <strong>{remaining(currentProduct.end, now)}</strong>
                    <small>Reloj anti-robo activo</small>
                  </div>
                )}
              </div>

              {/* Botones de Puja / Compra */}
              {isHost ? (
                <div className="host-notice-box">
                  <ShieldCheck size={16} />
                  <span>Esta es tu publicación. Puedes presentarla a los compradores.</span>
                </div>
              ) : currentProduct.status === "sold" ? (
                <div className="sold-notice">Producto vendido.</div>
              ) : currentProduct.mode === "subasta" ? (
                <div className="live-bidding-controls">
                  <div className="quick-bids-row">
                    <button
                      type="button"
                      className="button lime"
                      onClick={() => handleQuickBid(50)}
                      disabled={isBusy}
                    >
                      + S/ 50
                    </button>
                    <button
                      type="button"
                      className="button lime"
                      onClick={() => handleQuickBid(100)}
                      disabled={isBusy}
                    >
                      + S/ 100
                    </button>
                    <button
                      type="button"
                      className="button lime"
                      onClick={() => handleQuickBid(200)}
                      disabled={isBusy}
                    >
                      + S/ 200
                    </button>
                  </div>

                  <form onSubmit={handleCustomBid} className="custom-bid-form">
                    <input
                      type="number"
                      step="1"
                      min={priceAt(currentProduct, now) + 1}
                      placeholder="Monto de puja (S/)"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                    />
                    <button type="submit" className="button primary" disabled={isBusy}>
                      <Gavel size={15} /> Pujar
                    </button>
                  </form>

                  {/* Auto-puja inteligente */}
                  <form onSubmit={handleSetAutoBid} className="autobid-form">
                    <input
                      type="number"
                      step="1"
                      min={priceAt(currentProduct, now) + 50}
                      placeholder="Tope auto-puja (S/)"
                      value={autoBidAmount}
                      onChange={(e) => setAutoBidAmount(e.target.value)}
                    />
                    <button type="submit" className="button" disabled={isBusy}>
                      <Zap size={14} /> Auto-puja
                    </button>
                  </form>
                </div>
              ) : (
                <Link
                  to={`/checkout/${currentProduct.id}`}
                  className="button primary full"
                >
                  <ShoppingBag size={16} /> Comprar ahora por {money(priceAt(currentProduct, now))}
                </Link>
              )}

              <Link to={`/producto/${currentProduct.id}`} className="view-full-details-link">
                Ver ficha completa del producto <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="no-product-selected">
              <AlertCircle size={32} />
              <p>No hay producto seleccionado para este directo.</p>
            </div>
          )}
        </section>

        {/* Columna 3: Chat Público del Directo en Tiempo Real */}
        <section className="live-chat-column">
          <div className="chat-header">
            <h4>Chat del directo</h4>
            <span className="live-dot-tag">En vivo</span>
          </div>

          <div className="live-chat-messages" ref={chatScrollRef}>
            {messages.length === 0 ? (
              <div className="chat-empty">
                <p>¡El chat está abierto! Sé el primero en saludar o hacer una pregunta sobre los productos.</p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`chat-msg ${m.isSeller ? "seller-msg" : ""} ${
                    user && m.senderId === user.id ? "own-msg" : ""
                  }`}
                >
                  <div className="msg-sender-line">
                    <span className="sender-name">{m.senderName}</span>
                    {m.isSeller && <span className="seller-badge">Anfitrión</span>}
                    <small className="msg-time">
                      {new Date(m.createdAt).toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                  </div>
                  <p className="msg-text">{m.text}</p>
                </div>
              ))
            )}
          </div>

          {chatError && <p className="chat-error-inline">{chatError}</p>}

          <form onSubmit={handleSendMessage} className="live-chat-input-row">
            <input
              type="text"
              maxLength={300}
              placeholder={user ? "Escribe un mensaje al anfitrión..." : "Inicia sesión para chatear..."}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={!user}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!user || !chatInput.trim()}
              title="Enviar mensaje al directo"
            >
              <Send size={16} />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
