/**
 * Integración con Google Gemini 2.5 Flash para tasación y redacción de productos con IA Real.
 * Soporta entrada de texto y visión multimodal (análisis de la foto del producto).
 * Incluye fallback automático a motor de reglas local sin interrupciones.
 */

export interface AIPublishSuggestion {
  category: string;
  price: number;
  description: string;
  isRealAI: boolean;
}

export async function generateProductDraft(
  title: string,
  base64Image?: string
): Promise<AIPublishSuggestion> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (apiKey && apiKey.trim()) {
    try {
      const parts: any[] = [];

      // Si el usuario subió una imagen, la enviamos a Gemini (visión multimodal)
      if (base64Image && base64Image.includes(",")) {
        const [meta, rawData] = base64Image.split(",");
        const mimeMatch = meta.match(/data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

        parts.push({
          inlineData: {
            mimeType,
            data: rawData,
          },
        });
      }

      const prompt = `
Eres el asistente inteligente de tasación y publicación de "Ventas Flash", el marketplace más rápido de Perú.
El vendedor quiere publicar: "${title}".
${base64Image ? "Inspecciona cuidadosamente la foto adjunta para identificar marca, modelo, estado y accesorios reales." : ""}

Tu misión es generar la mejor publicación posible para el mercado peruano:
1. Categoría: Escoge exactamente una de: ["Tecnología", "Videojuegos", "Música", "Fotografía", "Deportes", "Hogar", "Moda", "Otros"].
2. Precio (price): Sugiere un precio de venta justo y atractivo de segunda mano en Soles peruanos (PEN/S/). Solo el número entero.
3. Descripción (description): Redacta una descripción atractiva, transparente y convincente dirigida a compradores en Lima (menciona estado estético y operativo, características clave, accesorios y entrega coordinada en punto seguro).

Responde ÚNICAMENTE en formato JSON con esta estructura exacta:
{
  "category": "Videojuegos",
  "price": 1250,
  "description": "Texto descriptivo aquí..."
}
`;

      parts.push({ text: prompt });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.4,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          return {
            category: parsed.category || "Otros",
            price: Number(parsed.price) || 150,
            description: parsed.description || "",
            isRealAI: true,
          };
        }
      }
    } catch (err) {
      console.warn("Fallo en llamada a Gemini API, usando motor de respaldo:", err);
    }
  }

  // Fallback a motor local heurístico si la API no está disponible o no hay clave
  return localFallbackAI(title);
}

function localFallbackAI(title: string): AIPublishSuggestion {
  const lower = title.toLowerCase();
  let category = "Otros";
  let price = 150;
  let description = `${title.trim()} en muy buen estado, cuidado y listo para una nueva historia. Entrega coordinada en Lima. Consulta los detalles antes de comprar.`;

  if (/macbook|laptop|notebook|thinkpad|dell|asus|acer|computadora|pc/i.test(lower)) {
    category = "Tecnología";
    price = 1850;
    description = `${title.trim()} en óptimo estado de conservación y funcionamiento 10/10. Procesador potente, batería con excelente autonomía y pantalla sin rayones. Incluye cargador original y accesorios completos. Entrega inmediata coordinada en zona segura de Lima.`;
  } else if (/iphone|samsung|galaxy|xiaomi|redmi|celular|smartphone|motorola|pixel/i.test(lower)) {
    category = "Tecnología";
    price = 1150;
    description = `${title.trim()} 100% operativo, liberado para cualquier operador en Perú. Pantalla original sin quiñes, batería con salud al 90%+ y cámaras nítidas. Incluye cable USB, cargador y mica protectora instalada.`;
  } else if (/playstation|ps5|ps4|nintendo|switch|xbox|consola|gamer|joystick|mando/i.test(lower)) {
    category = "Videojuegos";
    price = 1250;
    description = `${title.trim()} en impecable estado estético y operativo. Cero recalentamiento ni drift en los controles. Incluye cables de conexión, mando inalámbrico y juegos listos para disfrutar.`;
  } else if (/guitarra|bajo|teclado|piano|bateria|amplificador|pedal|microfono/i.test(lower)) {
    category = "Música";
    price = 650;
    description = `${title.trim()} con sonido cálido y excelente calibración. Maderas y electrónica afinadas, cuerdas y componentes en óptimo estado. Se entrega con funda acolchada para transporte seguro.`;
  } else if (/camara|lente|sony|canon|nikon|fujifilm|tripode|fotografia/i.test(lower)) {
    category = "Fotografía";
    price = 1400;
    description = `${title.trim()} muy bien cuidada por aficionado a la fotografía. Sensor limpio, óptica libre de hongos y polvo. Se entrega con batería original, cargador, correa y tapa de lente.`;
  } else if (/bicicleta|bici|trek|giant|patineta|scooter|mancuerna|pesas|gym|gimnasio/i.test(lower)) {
    category = "Deportes";
    price = 580;
    description = `${title.trim()} listo para salir a rodar o entrenar. Mantenimiento general al día, componentes y frenos en perfecto estado. Ideal para uso diario o recreación en ciclovías de Lima.`;
  } else if (/zapatilla|sneaker|nike|adidas|jordan|casaca|polo|pantalon|reloj|casio/i.test(lower)) {
    category = "Moda";
    price = 240;
    description = `${title.trim()} 100% original, en estado casi nuevo (9.5/10). Materiales de alta durabilidad, diseño urbano y corte cómodo. Viene con empaque original o etiquetas.`;
  } else if (/silla|escritorio|mesa|sofa|lampara|mueble|cafetera|licuadora|freidora/i.test(lower)) {
    category = "Hogar";
    price = 320;
    description = `${title.trim()} en excelente estado funcional y estético. Materiales duraderos y acabados modernos, listo para ambientar tu hogar u oficina. Entrega rápida en Lima.`;
  }

  return { category, price, description, isRealAI: false };
}
