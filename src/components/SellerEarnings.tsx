import { Wallet } from "lucide-react";
import { money, type Mode } from "../model";
import { sellerProceeds, COMMISSION_PERCENT } from "../lib/pricing";

export function SellerEarnings({ price, mode }: { price: string; mode: Mode }) {
  const amount = Number(price);
  const valid = price.trim() !== "" && Number.isFinite(amount) && amount >= 1 && amount <= 1000000;
  const proceeds = sellerProceeds(valid ? amount : 0);
  const floor = sellerProceeds(Math.round((valid ? amount : 0) * 100 * 0.7) / 100);
  return <section className="seller-earnings" aria-label="Resumen de lo que recibirás">
    <div className="seller-earnings-heading"><span className="seller-wallet"><Wallet size={22} /></span><div><h2>Tu venta, en números</h2><p>Sin sorpresas. Conoce cuánto recibirás.</p></div><span className="seller-rate">Comisión {COMMISSION_PERCENT}%</span></div>
    <div className="seller-breakdown"><div><span>{mode === "normal" ? "Precio de venta" : "Precio inicial"}</span><b>{valid ? money(proceeds.gross) : "—"}</b></div><div><span>Comisión de Ventas Flash ({COMMISSION_PERCENT}%)</span><b>{valid ? "− " + money(proceeds.fee) : "—"}</b></div></div>
    <div className="seller-net" aria-live="polite"><span>{mode === "normal" ? "Recibirás" : "Recibirías al precio inicial"}<small>Después de la comisión</small></span><strong>{valid ? money(proceeds.net) : "S/ —"}</strong></div>
    <p className="seller-earnings-note">{!valid ? "Ingresa un precio para calcular tu ingreso neto." : mode === "subasta" ? "El monto final dependerá de la puja ganadora. La comisión será el 4% del precio de cierre." : mode === "remate" ? `Tu ingreso cambia con el precio del remate. Al precio mínimo de ${money(floor.gross)}, recibirías ${money(floor.net)}.` : "La comisión se descuenta de tu venta. El comprador paga el precio publicado."} Los pagos actuales son simulados.</p>
  </section>;
}
