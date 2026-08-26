import { boolean, jsonb, real, text, timestamp, pgTable } from "drizzle-orm/pg-core";

export const companySettingsTable = pgTable("ustacep_company_settings", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default(""),
  taxInfo: text("tax_info").notNull().default(""),
  logoDataUrl: text("logo_data_url"),
  vatPercent: real("vat_percent").notNull().default(20),
  profitPercent: real("profit_percent").notNull().default(25),
  darkMode: boolean("dark_mode").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customersTable = pgTable("ustacep_customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  firm: text("firm").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  address: text("address").notNull().default(""),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quotesTable = pgTable("ustacep_quotes", {
  id: text("id").primaryKey(),
  number: text("number").notNull().unique(),
  customerId: text("customer_id"),
  customerName: text("customer_name").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("Taslak"),
  total: real("total").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
});

export const quoteItemsTable = pgTable("ustacep_quote_items", {
  id: text("id").primaryKey(),
  quoteId: text("quote_id").notNull(),
  name: text("name").notNull(),
  quantity: real("quantity").notNull().default(0),
  unit: text("unit").notNull().default("adet"),
  unitPrice: real("unit_price").notNull().default(0),
});

export type CompanySettings = typeof companySettingsTable.$inferSelect;
export type Customer = typeof customersTable.$inferSelect;
export type StoredQuote = typeof quotesTable.$inferSelect;
export type QuoteItem = typeof quoteItemsTable.$inferSelect;