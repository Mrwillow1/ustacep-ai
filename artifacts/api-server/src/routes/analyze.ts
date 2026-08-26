import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { z } from "zod";

const router: IRouter = Router();

const requestSchema = z.object({
  customerName: z.string().trim().max(160).optional().default(""),
  title: z.string().trim().min(1).max(200),
  type: z.string().trim().min(1).max(80),
  address: z.string().trim().max(300).optional().default(""),
  notes: z.string().trim().max(1200).optional().default(""),
  imageDataUrls: z.array(z.string().startsWith("data:image/")).max(5).optional().default([]),
});

const materialSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.string(),
  estimatedUnitPrice: z.number(),
});

const responseSchema = z.object({
  workType: z.string(),
  description: z.string(),
  dimensions: z.string(),
  materials: z.array(materialSchema),
  laborHours: z.number(),
  approximateCost: z.number(),
  isApproximate: z.boolean(),
  source: z.string(),
});

function localEstimate(input: z.infer<typeof requestSchema>) {
  const isPainting = input.type.toLocaleLowerCase("tr").includes("boy");
  return {
    workType: input.type,
    description: `${input.title} için iş alanının hazırlanması, gerekli uygulamanın yapılması ve son kontrollerin tamamlanması.`,
    dimensions: isPainting ? "Yaklaşık 42 m²" : "Yerinde ölçüm gereklidir",
    materials: isPainting
      ? [
          { name: "İç cephe boyası", quantity: 12, unit: "L", estimatedUnitPrice: 420 },
          { name: "Astar", quantity: 5, unit: "L", estimatedUnitPrice: 280 },
          { name: "Maskeleme bandı", quantity: 3, unit: "adet", estimatedUnitPrice: 85 },
        ]
      : [{ name: "İş için gerekli malzeme", quantity: 1, unit: "set", estimatedUnitPrice: 0 }],
    laborHours: 8,
    approximateCost: isPainting ? 12300 : 0,
    isApproximate: true,
    source: "mock",
  };
}

function parseModelJson(content: string | null | undefined) {
  if (!content) throw new Error("AI returned an empty response");
  const cleaned = content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  return responseSchema.parse(JSON.parse(cleaned));
}

router.post("/analyze", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Analiz bilgileri eksik veya geçersiz." });
    return;
  }

  const input = parsed.data;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    req.log.warn("OPENAI_API_KEY is not configured; using local estimate");
    res.json(localEstimate(input));
    return;
  }

  try {
    const client = new OpenAI({ apiKey });
    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      {
        type: "text",
        text: `Bir usta teklif hazırlıyor. Türkçe, yalnızca JSON döndür.
İş başlığı: ${input.title}
İş türü: ${input.type}
Müşteri: ${input.customerName || "Belirtilmedi"}
Adres: ${input.address || "Belirtilmedi"}
Not: ${input.notes || "Yok"}

Fotoğraf(lar) ve bilgilerden şu şemaya uygun çıktı üret:
{"workType":"string","description":"string","dimensions":"string","materials":[{"name":"string","quantity":0,"unit":"string","estimatedUnitPrice":0}],"laborHours":0,"approximateCost":0,"isApproximate":true,"source":"openai"}
Ölçü, miktar ve maliyetleri kesin değil yaklaşık tahmin et. Fotoğraf yoksa bunu dikkate al ve yerinde ölçüm gerektiğini belirt. approximateCost Türk lirası cinsinden sayı olsun. isApproximate her zaman true olsun.`,
      },
      ...input.imageDataUrls.map((url) => ({ type: "image_url" as const, image_url: { url, detail: "low" as const } })),
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-5.4-mini",
      max_completion_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content }],
    });
    const result = parseModelJson(completion.choices[0]?.message.content);
    res.json({ ...result, isApproximate: true, source: "openai" });
  } catch (error) {
    req.log.error({ err: error }, "AI work analysis failed");
    res.status(503).json({ error: "AI analizi şu anda kullanılamıyor. Lütfen tekrar deneyin." });
  }
});

export default router;