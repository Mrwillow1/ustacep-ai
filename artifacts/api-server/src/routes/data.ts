import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@workspace/db";
import {
  companySettingsTable,
  customersTable,
  quoteItemsTable,
  quotesTable,
} from "@workspace/db";

const router: IRouter = Router();
const DEFAULT_COMPANY_ID = "default";
const statuses = ["Taslak", "Gönderildi", "Onaylandı", "Reddedildi"] as const;

const companySchema = z.object({
  name: z.string().trim().min(1).max(160),
  phone: z.string().trim().max(40).default(""),
  email: z.string().trim().max(160).default(""),
  address: z.string().trim().max(300).default(""),
  taxInfo: z.string().trim().max(160).default(""),
  logoDataUrl: z.string().max(2_000_000).nullable().optional(),
  vatPercent: z.number().min(0).max(100),
  profitPercent: z.number().min(0).max(500),
  darkMode: z.boolean(),
});
const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(160),
  firm: z.string().trim().max(160).default(""),
  phone: z.string().trim().max(40).default(""),
  email: z.string().trim().max(160).default(""),
  address: z.string().trim().max(300).default(""),
  notes: z.string().trim().max(1200).default(""),
});
const quoteSchema = z.object({
  id: z.string().optional(),
  number: z.string().optional(),
  customerId: z.string().nullable().optional(),
  customerName: z.string().trim().min(1).max(160),
  title: z.string().trim().min(1).max(200),
  status: z.enum(statuses),
  total: z.number().finite().min(0),
  createdAt: z.string().datetime().optional(),
  data: z.record(z.string(), z.unknown()),
  items: z.array(z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1).max(200),
    quantity: z.number().finite().min(0),
    unit: z.string().trim().max(30),
    unitPrice: z.number().finite().min(0),
  })).default([]),
});

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const yearNumber = (number: string) => {
  const match = number.match(/^UC-\d{4}-(\d+)$/);
  return match ? Number(match[1]) : 0;
};

router.get("/data/bootstrap", async (_req, res) => {
  try {
    const [company, customers, quotes, items] = await Promise.all([
      db.select().from(companySettingsTable).where(eq(companySettingsTable.id, DEFAULT_COMPANY_ID)).limit(1),
      db.select().from(customersTable).orderBy(desc(customersTable.updatedAt)),
      db.select().from(quotesTable).orderBy(desc(quotesTable.createdAt)),
      db.select().from(quoteItemsTable),
    ]);
    res.json({
      company: company[0] ?? null,
      customers,
      quotes: quotes.map((quote) => ({
        ...quote.data,
        id: quote.id,
        number: quote.number,
        customerId: quote.customerId,
        customerName: quote.customerName,
        title: quote.title,
        status: quote.status,
        total: quote.total,
        createdAt: quote.createdAt.toISOString(),
        items: items.filter((item) => item.quoteId === quote.id),
      })),
    });
  } catch (error) {
    res.status(503).json({ error: "Kalıcı veriye erişilemedi." });
  }
});

router.put("/data/company", async (req, res) => {
  const parsed = companySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Firma bilgileri geçersiz." }); return; }
  try {
    const [company] = await db.insert(companySettingsTable).values({
      id: DEFAULT_COMPANY_ID,
      ...parsed.data,
      logoDataUrl: parsed.data.logoDataUrl ?? null,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: companySettingsTable.id,
      set: { ...parsed.data, logoDataUrl: parsed.data.logoDataUrl ?? null, updatedAt: new Date() },
    }).returning();
    res.json(company);
  } catch (error) {
    req.log.error({ err: error }, "Company save failed");
    res.status(503).json({ error: "Firma bilgileri kaydedilemedi." });
  }
});

router.post("/data/customers", async (req, res) => {
  const parsed = customerSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Müşteri bilgileri geçersiz." }); return; }
  try {
    const [customer] = await db.insert(customersTable).values({
      id: parsed.data.id ?? id(),
      ...parsed.data,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: customersTable.id,
      set: { ...parsed.data, updatedAt: new Date() },
    }).returning();
    res.json(customer);
  } catch (error) {
    req.log.error({ err: error }, "Customer save failed");
    res.status(503).json({ error: "Müşteri kaydedilemedi." });
  }
});

router.put("/data/customers/:customerId", async (req, res) => {
  const parsed = customerSchema.omit({ id: true }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Müşteri bilgileri geçersiz." }); return; }
  try {
    const [customer] = await db.update(customersTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(customersTable.id, req.params.customerId)).returning();
    if (!customer) { res.status(404).json({ error: "Müşteri bulunamadı." }); return; }
    res.json(customer);
  } catch (error) {
    res.status(503).json({ error: "Müşteri güncellenemedi." });
  }
});

router.delete("/data/customers/:customerId", async (req, res) => {
  try {
    await db.delete(customersTable).where(eq(customersTable.id, req.params.customerId));
    res.status(204).end();
  } catch (error) {
    res.status(503).json({ error: "Müşteri silinemedi." });
  }
});

router.post("/data/quotes", async (req, res) => {
  const parsed = quoteSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Teklif bilgileri geçersiz." }); return; }
  try {
    const existing = await db.select({ number: quotesTable.number }).from(quotesTable);
    const year = new Date().getFullYear();
    const highest = existing.filter((item) => item.number.startsWith(`UC-${year}-`)).reduce((max, item) => Math.max(max, yearNumber(item.number)), 0);
    const quoteId = parsed.data.id ?? id();
    const number = parsed.data.number ?? `UC-${year}-${String(highest + 1).padStart(4, "0")}`;
    const createdAt = parsed.data.createdAt ? new Date(parsed.data.createdAt) : new Date();
    const { items, createdAt: _createdAt, ...quote } = parsed.data;
    await db.transaction(async (tx) => {
      await tx.insert(quotesTable).values({ ...quote, id: quoteId, number, createdAt, updatedAt: new Date() });
      if (items.length) await tx.insert(quoteItemsTable).values(items.map((item) => ({ ...item, id: item.id ?? id(), quoteId })));
    });
    res.status(201).json({ ...quote.data, ...quote, id: quoteId, number, createdAt: createdAt.toISOString(), items });
  } catch (error) {
    req.log.error({ err: error }, "Quote save failed");
    res.status(503).json({ error: "Teklif kaydedilemedi." });
  }
});

router.put("/data/quotes/:quoteId", async (req, res) => {
  const parsed = quoteSchema.omit({ id: true, number: true }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Teklif bilgileri geçersiz." }); return; }
  try {
    const { items, createdAt: _createdAt, ...quote } = parsed.data;
    await db.transaction(async (tx) => {
      const [updated] = await tx.update(quotesTable).set({ ...quote, updatedAt: new Date() }).where(eq(quotesTable.id, req.params.quoteId)).returning();
      if (!updated) throw new Error("NOT_FOUND");
      await tx.delete(quoteItemsTable).where(eq(quoteItemsTable.quoteId, req.params.quoteId));
      if (items.length) await tx.insert(quoteItemsTable).values(items.map((item) => ({ ...item, id: item.id ?? id(), quoteId: req.params.quoteId })));
    });
    res.json({ ...quote.data, ...quote, id: req.params.quoteId, items });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") { res.status(404).json({ error: "Teklif bulunamadı." }); return; }
    res.status(503).json({ error: "Teklif güncellenemedi." });
  }
});

router.delete("/data/quotes/:quoteId", async (req, res) => {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(quoteItemsTable).where(eq(quoteItemsTable.quoteId, req.params.quoteId));
      await tx.delete(quotesTable).where(eq(quotesTable.id, req.params.quoteId));
    });
    res.status(204).end();
  } catch (error) {
    res.status(503).json({ error: "Teklif silinemedi." });
  }
});

export default router;