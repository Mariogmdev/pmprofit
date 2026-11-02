import { generateResponse, GatewayError } from "npm:@lovable.dev/ai-gateway@0.1.11";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_CHARS = 200_000;

const num = { type: ["number", "null"] };
const str = { type: ["string", "null"] };
const obj = (properties: Record<string, unknown>) => ({
  type: "object",
  additionalProperties: false,
  properties,
  required: Object.keys(properties),
});
const nominaItem = obj({ cargo: { type: "string" }, cantidad: { type: "number" }, salarioMensual: { type: "number" } });
const serviceItem = obj({ concepto: { type: "string" }, costoMensual: { type: "number" } });

const schema = obj({
  project: obj({
    name: str,
    location: str,
    currency: { type: ["string", "null"], enum: ["COP", "USD", "EUR", "MXN", null] },
    opening_hour: num,
    closing_hour: num,
    days_per_month: num,
    discount_rate: num,
    inflation_rate: num,
    projection_years: num,
  }),
  activities: {
    type: "array",
    items: obj({
      name: { type: "string" },
      modeloIngreso: { type: "string", enum: ["reserva", "membresia", "pase-diario", "trafico"] },
      cantidad: num,
      areaPorUnidad: num,
      duracionReserva: num,
      jugadoresPorReserva: num,
      capexPorUnidad: num,
      horarios: {
        type: "array",
        items: obj({
          nombre: { type: "string" },
          inicio: { type: "number" },
          fin: { type: "number" },
          tarifa: { type: "number" },
          tipo: { type: "string", enum: ["pico", "valle"] },
          ocupacion: { type: "number" },
        }),
      },
      precioMembresia: num,
      miembrosAno1: num,
      precioPase: num,
      pasesDia: num,
      ticketPromedio: num,
      visitantesExternosDia: num,
      costoVentasPorcentaje: num,
      fuente: { type: "string" },
    }),
  },
  opex: obj({
    nomina_administrativa: { type: "array", items: nominaItem },
    nomina_operativa: { type: "array", items: nominaItem },
    arrendamiento_modelo: { type: "string", enum: ["propio", "fijo", "variable", "mixto"] },
    arrendamiento_fijo: num,
    arrendamiento_variable_porcentaje: num,
    servicios_publicos: { type: "array", items: serviceItem },
    marketing: { type: "array", items: serviceItem },
    tecnologia: { type: "array", items: serviceItem },
    seguros: { type: "array", items: serviceItem },
    mantenimiento_general: { type: "array", items: serviceItem },
    administrativos: { type: "array", items: serviceItem },
    otros_gastos: { type: "array", items: serviceItem },
  }),
  capex_obra_civil_total: num,
  notas: { type: "array", items: { type: "string" } },
});

const instructions = `Eres un analista financiero experto en clubes deportivos (pádel, fitness, F&B).
Extrae del plan de negocio los supuestos operativos y organízalos según el esquema.
Reglas:
- Usa SOLO valores presentes en el documento. Si un dato no aparece, usa null (o lista vacía). No inventes cifras.
- Montos en la moneda del documento, como números sin separadores. Valores mensuales para salarios y gastos.
- Ocupación y porcentajes en 0-100. Horas en formato 0-24 (ej. 18.5 = 18:30).
- Canchas/salas reservables = "reserva"; gimnasio con cuotas = "membresia"; acceso por día = "pase-diario"; restaurante, bar, tienda = "trafico".
- En "fuente" indica brevemente de dónde salió la actividad (página, hoja o sección).
- En "notas" lista supuestos relevantes que no encajan en el esquema, ambigüedades y datos faltantes importantes. Escribe en español.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return json({ error: "No autorizado" }, 401);

    const { text, fileName } = await req.json();
    if (typeof text !== "string" || text.trim().length < 50) {
      return json({ error: "El documento no tiene suficiente texto para analizar." }, 400);
    }
    const content = text.slice(0, MAX_CHARS);

    const response = await generateResponse({
      model: "openai/gpt-6-astra",
      instructions,
      reasoning: { effort: "low" },
      input: [
        {
          role: "user",
          content: `Archivo: ${String(fileName ?? "plan")}\n\n${content}`,
        },
      ],
      text: { format: { type: "json_schema", name: "business_plan_draft", strict: true, schema } },
    });

    let outputText = "";
    for (const item of (response as { output?: Array<Record<string, unknown>> }).output ?? []) {
      if (item.type === "message" && Array.isArray(item.content)) {
        for (const c of item.content as Array<Record<string, unknown>>) {
          if (c.type === "output_text" && typeof c.text === "string") outputText += c.text;
          if (c.type === "refusal") return json({ error: "El modelo no pudo procesar este documento." }, 422);
        }
      }
    }
    if (!outputText) return json({ error: "No se obtuvo respuesta del modelo." }, 502);

    return json({ draft: JSON.parse(outputText), truncated: text.length > MAX_CHARS });
  } catch (error) {
    if (error instanceof GatewayError) {
      console.error("Gateway error", error.code, error.httpStatus, error.ids);
      if (error.httpStatus === 429) return json({ error: "Demasiadas solicitudes, intenta en unos minutos." }, 429);
      if (error.httpStatus === 402) return json({ error: "Se agotaron los créditos de IA del espacio de trabajo." }, 402);
      return json({ error: "El servicio de IA falló. Intenta de nuevo." }, 502);
    }
    console.error("extract-business-plan error", error);
    return json({ error: "Error procesando el documento." }, 500);
  }
});
