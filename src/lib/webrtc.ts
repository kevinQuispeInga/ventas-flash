/**
 * Módulo de transmisión de vídeo para Flash Live con WebRTC P2P real
 * y señalización sobre Supabase Realtime Broadcast (S/ 0 de costo).
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export interface MediaStreamState {
  stream: MediaStream | null;
  error: string | null;
  isDemo: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
}

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];

/**
 * Solicita captura real de cámara y micrófono con consentimiento explícito del navegador.
 */
export async function requestUserMedia(): Promise<{ stream: MediaStream | null; error: string | null }> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return {
      stream: null,
      error: "No pudimos acceder a la cámara y al micrófono. Usa un navegador actualizado y abre la página con una conexión segura.",
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
  let animId = 0;
  function draw() {
    if (!ctx) return;
    frame++;

    // Fondo degradado de estudio
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

    // Icono central
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

    // Badge de anfitrión
    ctx.fillStyle = "#b8f227";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText(`Anfitrión: ${sellerName} · Ventas Flash Live`, 320, 252);

    // Marca de agua y reloj en tiempo real
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = "12px monospace";
    const nowStr = new Date().toLocaleTimeString("es-PE");
    ctx.fillText(`TRANSMISIÓN EN VIVO · ${nowStr}`, 320, 320);

    // Indicador REC
    ctx.fillStyle = Math.floor(frame / 20) % 2 === 0 ? "#e74c3c" : "#7f1d1d";
    ctx.beginPath();
    ctx.arc(35, 35, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("REC · LIVE", 50, 40);

    animId = requestAnimationFrame(draw);
  }

  draw();

  const stream = canvas.captureStream(30);
  // Asignar limpieza de animación al stream
  (stream as any)._cleanupAnim = () => cancelAnimationFrame(animId);
  return stream;
}

/**
 * Detiene y libera todas las pistas de un MediaStream.
 */
export function stopMediaStream(stream: MediaStream | null) {
  if (!stream) return;
  if ((stream as any)._cleanupAnim) {
    (stream as any)._cleanupAnim();
  }
  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

/**
 * Gestor de Señalización WebRTC sobre Supabase Realtime Broadcast.
 * Permite transmisión P2P del anfitrión a un grupo de espectadores (1:N mesh).
 */
export interface WebRTCSession {
  stop: () => void;
}

export function startWebRTCSignaling({
  client,
  streamId,
  userId,
  isHost,
  localStream,
  onRemoteStream,
  onStatusChange,
}: {
  client: SupabaseClient;
  streamId: string;
  userId: string;
  isHost: boolean;
  localStream: MediaStream | null;
  onRemoteStream?: (stream: MediaStream) => void;
  onStatusChange?: (status: string) => void;
}): WebRTCSession {
  const peers = new Map<string, RTCPeerConnection>();
  const channelName = `live-webrtc:${streamId}`;
  let isStopped = false;

  const channel = client.channel(channelName, {
    config: { broadcast: { ack: false } },
  });

  function createHostPeer(viewerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peers.set(viewerId, pc);

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && !isStopped) {
        channel.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { from: userId, to: viewerId, candidate: event.candidate },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
        pc.close();
        peers.delete(viewerId);
      }
    };

    return pc;
  }

  function createViewerPeer(hostId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peers.set(hostId, pc);

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        onRemoteStream?.(event.streams[0]);
        onStatusChange?.("connected");
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && !isStopped) {
        channel.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { from: userId, to: hostId, candidate: event.candidate },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        onStatusChange?.("connected");
      } else if (pc.connectionState === "failed") {
        onStatusChange?.("failed");
      }
    };

    return pc;
  }

  // Escuchar eventos de señalización Broadcast
  channel
    .on("broadcast", { event: "viewer-join" }, async ({ payload }) => {
      if (!isHost || isStopped || !payload?.viewerId) return;
      const viewerId = payload.viewerId;
      try {
        const pc = peers.get(viewerId) || createHostPeer(viewerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        channel.send({
          type: "broadcast",
          event: "offer",
          payload: { from: userId, to: viewerId, sdp: offer },
        });
      } catch (err) {
        console.warn("Error creando oferta para espectador:", err);
      }
    })
    .on("broadcast", { event: "offer" }, async ({ payload }) => {
      if (isHost || isStopped || payload?.to !== userId || !payload?.sdp) return;
      try {
        const hostId = payload.from;
        const pc = peers.get(hostId) || createViewerPeer(hostId);
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        channel.send({
          type: "broadcast",
          event: "answer",
          payload: { from: userId, to: hostId, sdp: answer },
        });
      } catch (err) {
        console.warn("Error procesando oferta SDP de anfitrión:", err);
      }
    })
    .on("broadcast", { event: "answer" }, async ({ payload }) => {
      if (!isHost || isStopped || payload?.to !== userId || !payload?.sdp) return;
      try {
        const viewerId = payload.from;
        const pc = peers.get(viewerId);
        if (pc && pc.signalingState !== "stable") {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        }
      } catch (err) {
        console.warn("Error procesando respuesta SDP de espectador:", err);
      }
    })
    .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
      if (isStopped || payload?.to !== userId || !payload?.candidate) return;
      try {
        const pc = peers.get(payload.from);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } catch (err) {
        console.warn("Error agregando candidato ICE:", err);
      }
    })
    .on("broadcast", { event: "viewer-leave" }, ({ payload }) => {
      if (isHost && payload?.viewerId) {
        const pc = peers.get(payload.viewerId);
        if (pc) {
          pc.close();
          peers.delete(payload.viewerId);
        }
      }
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED" && !isHost && !isStopped) {
        // Notificar al anfitrión que nos unimos a la sala para iniciar el apretón de manos SDP
        channel.send({
          type: "broadcast",
          event: "viewer-join",
          payload: { viewerId: userId },
        });
      }
    });

  return {
    stop: () => {
      isStopped = true;
      if (!isHost) {
        channel.send({
          type: "broadcast",
          event: "viewer-leave",
          payload: { viewerId: userId },
        });
      }
      peers.forEach((pc) => pc.close());
      peers.clear();
      void client.removeChannel(channel);
    },
  };
}
