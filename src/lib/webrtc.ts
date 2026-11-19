/**
 * Módulo de transmisión de vídeo para Flash Live.
 * Arquitectura híbrida: WebRTC P2P con señalización y fallback a Modo Demostración (Canvas / Vídeo).
 */

export interface MediaStreamState {
  stream: MediaStream | null;
  error: string | null;
  isDemo: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

/**
 * Solicita captura real de cámara y micrófono con consentimiento explícito del navegador.
 */
export async function requestUserMedia(): Promise<{ stream: MediaStream | null; error: string | null }> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return {
      stream: null,
      error: "Este navegador no soporta captura de cámara y micrófono WebRTC.",
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      audio: true,
    });
    return { stream, error: null };
  } catch (err: unknown) {
    const errorObj = err as { name?: string; message?: string };
    let msg = "No se pudo acceder a la cámara o micrófono.";
    if (errorObj.name === "NotAllowedError" || errorObj.name === "PermissionDeniedError") {
      msg = "Permiso de cámara denegado. Puedes cambiar al Modo Demostración.";
    } else if (errorObj.name === "NotFoundError" || errorObj.name === "DevicesNotFoundError") {
      msg = "No se detectó ninguna cámara o micrófono en este equipo.";
    } else if (errorObj.name === "NotReadableError") {
      msg = "La cámara está siendo utilizada por otra aplicación.";
    }
    return { stream: null, error: msg };
  }
}

/**
 * Genera un MediaStream sintético de demostración mediante HTML5 Canvas (30 FPS)
 * con reloj en vivo, ondas de audio simuladas y gráficos profesionales de estudio.
 */
export function createDemoMediaStream(title: string, sellerName: string): MediaStream {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");

  let frame = 0;
  function draw() {
    if (!ctx) return;
    frame++;

    // Fondo degradado elegante de estudio
    const grad = ctx.createLinearGradient(0, 0, 640, 360);
    grad.addColorStop(0, "#0a2617");
    grad.addColorStop(1, "#04140b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 640, 360);

    // Rejilla de estudio
    ctx.strokeStyle = "rgba(184, 242, 39, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 360);
      ctx.stroke();
    }
    for (let y = 0; y < 360; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(640, y);
      ctx.stroke();
    }

    // Ondas concéntricas de pulso en vivo
    const pulseRadius = 50 + Math.sin(frame * 0.08) * 15;
    ctx.strokeStyle = "rgba(184, 242, 39, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(320, 150, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Icono de cámara central
    ctx.fillStyle = "#b8f227";
    ctx.beginPath();
    ctx.arc(320, 150, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0a3622";
    ctx.font = "bold 24px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⚡", 320, 158);

    // Titular del directo
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px system-ui, sans-serif";
    ctx.fillText(title.length > 40 ? title.slice(0, 40) + "…" : title, 320, 225);

    // Badge de vendedor y modo
    ctx.fillStyle = "#b8f227";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText(`Anfitrión: ${sellerName} · Ventas Flash Live`, 320, 252);

    // Marca de agua y estado
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "12px monospace";
    const nowStr = new Date().toLocaleTimeString("es-PE");
    ctx.fillText(`TRANSMISIÓN EN VIVO · MODO DEMOSTRACIÓN · ${nowStr}`, 320, 320);

    // Indicador REC
    ctx.fillStyle = Math.floor(frame / 20) % 2 === 0 ? "#e74c3c" : "#7f1d1d";
    ctx.beginPath();
    ctx.arc(35, 35, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("REC · DEMO", 50, 40);

    requestAnimationFrame(draw);
  }

  draw();

  // Obtener stream a 30 FPS
  return canvas.captureStream(30);
}

/**
 * Detiene y libera todas las pistas de un MediaStream.
 */
export function stopMediaStream(stream: MediaStream | null) {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}
