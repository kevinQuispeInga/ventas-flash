import { friendly } from "../lib/errors";
import React, { useState } from "react";
import {
  Users,
  Database,
  RotateCcw,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  X,
  ExternalLink,
  Shield,
  MapPin,
  Sparkles,
} from "lucide-react";
import type { MarketplaceService } from "../services/contracts";
import type { UserProfile } from "../types/marketplace";
import { SEED_USERS, DEFAULT_TEST_PASSWORD, type SeedUser } from "../data/seedData";

interface DevSeedBarProps {
  service: MarketplaceService;
  user: UserProfile | null;
  productCount: number;
  liveCount: number;
}

export function DevSeedBar({
  service,
  user,
  productCount,
  liveCount,
}: DevSeedBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<"all" | "vendedor" | "comprador">("all");

  const notify = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`Copiado: ${label}`);
    } catch {
      notify(`Copiado: ${text}`);
    }
  };

  const handleSeed = () => {
    if (service.mode === "demo") {
      service.seedDemoData?.(true);
      notify("🌱 Catálogo poblado: 60 productos, 5 Flash Live y órdenes DEMO");
    } else {
      notify("Los datos de ejemplo solo están disponibles en modo demo.");
    }
  };

  const handleReset = () => {
    if (window.confirm("¿Restablecer datos DEMO a su estado inicial limpio?")) {
      service.resetDemoData?.();
      notify("🔄 Datos restablecidos a estado inicial limpio");
    }
  };

  const handleSwitchUser = async (targetUser: SeedUser) => {
    try {
      if (service.mode === "demo") {
        await service.switchDemo(targetUser.id);
        notify(`Sesión cambiada a ${targetUser.name} (${targetUser.role})`);
        setShowModal(false);
      } else {
        await service.login(targetUser.email, DEFAULT_TEST_PASSWORD);
        notify(`Sesión iniciada como ${targetUser.name}`);
        setShowModal(false);
      }
    } catch (err: any) {
      notify(friendly(err));
    }
  };

  const sellers = SEED_USERS.filter((u) => u.role === "vendedor");
  const buyers = SEED_USERS.filter((u) => u.role === "comprador");
  const visibleUsers =
    filterRole === "vendedor"
      ? sellers
      : filterRole === "comprador"
      ? buyers
      : SEED_USERS;

  return (
    <>
      {/* Toast de notificación rápida */}
      {toastMessage && (
        <div className="dev-toast" role="status">
          <Sparkles size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Barra de Desarrollo */}
      <div className={`dev-seed-bar ${collapsed ? "collapsed" : ""}`}>
        <div className="dev-seed-bar-content">
          <div className="dev-status-pill">
            <span className="dev-indicator-dot demo" />
            <strong>DEMOSTRACIÓN LOCAL</strong>
            <span className="dev-stat-badge">
              {productCount} items · {liveCount} lives
            </span>
          </div>

          {!collapsed && (
            <div className="dev-actions-group">
              {/* Botón Modal de Usuarios */}
              <button
                type="button"
                className="dev-btn dev-btn-users"
                onClick={() => setShowModal(true)}
                title="Ver lista de los 15 usuarios con credenciales para copiar y cambiar sesión"
              >
                <Users size={15} />
                <span>Credenciales (15)</span>
              </button>

              {/* Selector Rápido de Usuario de Prueba */}
              <div className="dev-user-select-wrap">
                <label htmlFor="dev-quick-user" className="sr-only">
                  Cambiar usuario rápido:
                </label>
                <select
                  id="dev-quick-user"
                  className="dev-user-select"
                  value={user?.id || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    const found = SEED_USERS.find((u) => u.id === val);
                    if (found) {
                      handleSwitchUser(found);
                    }
                  }}
                >
                  <option value="" disabled>
                    👤 {user ? `${user.name}` : "Seleccionar usuario..."}
                  </option>
                  <optgroup label="Vendedores (6)">
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        🛒 {s.name} ({s.district})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Compradores (9)">
                    {buyers.map((b) => (
                      <option key={b.id} value={b.id}>
                        🛍️ {b.name} ({b.district})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Botón Cargar SEED */}
              <button
                type="button"
                className="dev-btn dev-btn-seed"
                onClick={handleSeed}
                title="Poblar el catálogo completo con 60 productos, 5 transmisiones Flash Live y órdenes"
              >
                <Database size={15} />
                <span>{productCount >= 60 ? "🌱 Re-cargar SEED" : "🌱 Cargar 60 productos SEED"}</span>
              </button>

              {/* Botón Restablecer */}
              {service.mode === "demo" && (
                <button
                  type="button"
                  className="dev-btn dev-btn-reset"
                  onClick={handleReset}
                  title="Limpiar LocalStorage y volver al estado inicial"
                >
                  <RotateCcw size={15} />
                  <span>Restablecer</span>
                </button>
              )}
            </div>
          )}

          {/* Toggle para colapsar */}
          <button
            type="button"
            className="dev-btn-toggle"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expandir barra de prueba" : "Minimizar barra de prueba"}
            aria-label={collapsed ? "Expandir" : "Minimizar"}
          >
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Modal de Credenciales y Cambio de Usuarios */}
      {showModal && (
        <div className="dev-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="dev-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="dev-modal-title"
          >
            <div className="dev-modal-header">
              <div>
                <h2 id="dev-modal-title" className="dev-modal-title">
                  👥 Usuarios de Prueba (SEED)
                </h2>
                <p className="dev-modal-subtitle">
                  15 identidades peruanas ficticias para vendedores y compradores.
                  Contraseña universal: <code>{DEFAULT_TEST_PASSWORD}</code>
                </p>
              </div>
              <button
                type="button"
                className="dev-modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Filtros de rol */}
            <div className="dev-modal-filters">
              <button
                type="button"
                className={`dev-filter-pill ${filterRole === "all" ? "active" : ""}`}
                onClick={() => setFilterRole("all")}
              >
                Todos (15)
              </button>
              <button
                type="button"
                className={`dev-filter-pill ${filterRole === "vendedor" ? "active" : ""}`}
                onClick={() => setFilterRole("vendedor")}
              >
                🛒 Vendedores (6)
              </button>
              <button
                type="button"
                className={`dev-filter-pill ${filterRole === "comprador" ? "active" : ""}`}
                onClick={() => setFilterRole("comprador")}
              >
                🛍️ Compradores (9)
              </button>

              <button
                type="button"
                className="dev-btn-copy-all"
                onClick={() => {
                  const creds = SEED_USERS.map(
                    (u) => `${u.name} (${u.role}): ${u.email} | Clave: ${DEFAULT_TEST_PASSWORD}`
                  ).join("\n");
                  copyToClipboard(creds, "15 credenciales");
                }}
              >
                <Copy size={13} /> Copiar todas
              </button>
            </div>

            {/* Lista de Usuarios */}
            <div className="dev-user-grid">
              {visibleUsers.map((u) => {
                const isActive = user?.id === u.id || user?.email === u.email;
                return (
                  <div
                    key={u.id}
                    className={`dev-user-card ${isActive ? "active-user" : ""}`}
                  >
                    <div className="dev-user-card-top">
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        className="dev-user-avatar"
                        loading="lazy"
                      />
                      <div className="dev-user-info">
                        <div className="dev-user-name-row">
                          <strong>{u.name}</strong>
                          {u.identityVerified && (
                            <span className="dev-verified-tag" title="Identidad verificada">
                              <Shield size={12} /> Verificado
                            </span>
                          )}
                        </div>
                        <span className={`dev-role-badge ${u.role}`}>
                          {u.role === "vendedor" ? "Vendedor" : "Comprador"}
                        </span>
                        <div className="dev-user-district">
                          <MapPin size={12} /> {u.district}, Lima
                        </div>
                      </div>
                    </div>

                    <div className="dev-user-creds">
                      <div className="dev-cred-field">
                        <span className="dev-cred-label">Email:</span>
                        <code className="dev-cred-value">{u.email}</code>
                        <button
                          type="button"
                          className="dev-btn-copy"
                          onClick={() => copyToClipboard(u.email, u.email)}
                          title="Copiar email"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <div className="dev-cred-field">
                        <span className="dev-cred-label">Clave:</span>
                        <code className="dev-cred-value">{DEFAULT_TEST_PASSWORD}</code>
                        <button
                          type="button"
                          className="dev-btn-copy"
                          onClick={() => copyToClipboard(DEFAULT_TEST_PASSWORD, "contraseña")}
                          title="Copiar contraseña"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>

                    <div className="dev-user-actions">
                      <button
                        type="button"
                        className={`dev-btn-switch ${isActive ? "current" : ""}`}
                        onClick={() => handleSwitchUser(u)}
                        disabled={isActive}
                      >
                        {isActive ? (
                          <>
                            <Check size={14} /> Usuario activo
                          </>
                        ) : (
                          <>
                            {service.mode === "demo"
                              ? "Cambiar a este usuario"
                              : "Iniciar sesión"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="dev-modal-footer">
              <span className="dev-footer-note">
                💡 Todas las identidades son 100% ficticias y aptas para pruebas locales.
                Datos ficticios guardados en este navegador.
              </span>
              <button
                type="button"
                className="button secondary"
                onClick={() => setShowModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
