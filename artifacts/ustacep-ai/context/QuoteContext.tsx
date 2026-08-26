import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  deleteCustomer as deleteCustomerRequest,
  deleteQuote as deleteQuoteRequest,
  getDataBootstrap,
  saveCompany,
  saveCustomer,
  saveQuote,
  updateCustomer as updateCustomerRequest,
  updateQuote as updateQuoteRequest,
  type Quote as ApiQuote,
} from '@workspace/api-client-react';

export type QuoteStatus = 'Taslak' | 'Gönderildi' | 'Onaylandı' | 'Reddedildi';
export type QuoteItem = { id: string; name: string; quantity: number; unit: string; unitPrice: number };
export type Customer = { id: string; name: string; firm: string; phone: string; email: string; address: string; notes: string };
export type Quote = {
  id: string; number: string; customerId?: string | null; customerName: string; phone: string; title: string; type: string; address: string; notes: string;
  photos: string[]; description: string; dimensions: string; materials: string[]; laborHours: number; items: QuoteItem[];
  labor: number; transport: number; other: number; discount: number; profitPercent: number; vatPercent: number; total: number;
  status: QuoteStatus; createdAt: string; validDays: number;
};
export type Company = {
  name: string; phone: string; email: string; address: string; taxInfo: string; logoDataUrl?: string | null;
  vatPercent: number; profitPercent: number; darkMode: boolean;
};

type QuoteContextValue = {
  quotes: Quote[]; customers: Customer[]; company: Company; hydrated: boolean; syncing: boolean; syncError: string | null;
  addQuote: (quote: Quote) => Promise<Quote>; updateQuote: (quote: Quote) => Promise<Quote>; deleteQuote: (quoteId: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id'> & { id?: string }) => Promise<Customer>;
  updateCustomer: (customer: Customer) => Promise<Customer>; deleteCustomer: (customerId: string) => Promise<void>;
  updateCompany: (company: Company) => Promise<void>; nextNumber: () => string; refresh: () => Promise<void>;
};

const defaultCompany: Company = { name: 'UstaCep Atölye', phone: '0532 000 00 00', email: 'merhaba@ustacep.com', address: 'İstanbul', taxInfo: 'Vergi bilgisi ekle', logoDataUrl: null, vatPercent: 20, profitPercent: 25, darkMode: false };
const QuoteContext = createContext<QuoteContextValue | null>(null);
const STORAGE_KEY = '@ustacep/quotes-v2';
const CUSTOMER_KEY = '@ustacep/customers-v1';
const COMPANY_KEY = '@ustacep/company-v2';
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function toApiQuote(quote: Quote): ApiQuote {
  return {
    id: quote.id, number: quote.number, customerId: quote.customerId ?? null, customerName: quote.customerName,
    title: quote.title, status: quote.status, total: quote.total, createdAt: quote.createdAt,
    data: { ...quote }, items: quote.items,
  };
}

function fromApiQuote(raw: ApiQuote): Quote {
  const data = (raw.data ?? {}) as Partial<Quote>;
  return {
    ...data,
    id: raw.id ?? data.id ?? makeId(),
    number: raw.number ?? data.number ?? '',
    customerId: raw.customerId ?? data.customerId ?? null,
    customerName: raw.customerName,
    title: raw.title,
    status: (raw.status as QuoteStatus) ?? 'Taslak',
    total: raw.total,
    createdAt: raw.createdAt ?? data.createdAt ?? new Date().toISOString(),
    phone: data.phone ?? '',
    type: data.type ?? '',
    address: data.address ?? '',
    notes: data.notes ?? '',
    photos: data.photos ?? [],
    description: data.description ?? '',
    dimensions: data.dimensions ?? '',
    materials: data.materials ?? [],
    laborHours: Number(data.laborHours) || 0,
    labor: Number(data.labor) || 0,
    transport: Number(data.transport) || 0,
    other: Number(data.other) || 0,
    discount: Number(data.discount) || 0,
    profitPercent: Number(data.profitPercent) || 0,
    vatPercent: Number(data.vatPercent) || 0,
    validDays: Number(data.validDays) || 15,
    items: (raw.items ?? data.items ?? []).map((item) => ({ id: item.id ?? makeId(), name: item.name, quantity: item.quantity, unit: item.unit, unitPrice: item.unitPrice })),
  } as Quote;
}

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [company, setCompany] = useState<Company>(defaultCompany);
  const [hydrated, setHydrated] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const saveCache = async (nextQuotes: Quote[], nextCustomers: Customer[], nextCompany: Company) => {
    setQuotes(nextQuotes); setCustomers(nextCustomers); setCompany(nextCompany);
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextQuotes)),
      AsyncStorage.setItem(CUSTOMER_KEY, JSON.stringify(nextCustomers)),
      AsyncStorage.setItem(COMPANY_KEY, JSON.stringify(nextCompany)),
    ]);
  };

  const refresh = async () => {
    setSyncing(true); setSyncError(null);
    try {
      const remote = await getDataBootstrap();
      const remoteQuotes = remote.quotes.map(fromApiQuote);
      const remoteCustomers = remote.customers.map((item) => ({ id: item.id ?? makeId(), name: item.name, firm: item.firm, phone: item.phone, email: item.email, address: item.address, notes: item.notes }));
      const remoteCompany = remote.company ? { ...defaultCompany, ...remote.company } : company;
      if (remoteQuotes.length || remoteCustomers.length || remote.company) await saveCache(remoteQuotes, remoteCustomers, remoteCompany);
    } catch {
      setSyncError('Sunucuyla eşitlenemedi. Verileriniz bu cihazda güvende.');
    } finally { setSyncing(false); }
  };

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(CUSTOMER_KEY), AsyncStorage.getItem(COMPANY_KEY)])
      .then(([savedQuotes, savedCustomers, savedCompany]) => {
        if (savedQuotes) setQuotes(JSON.parse(savedQuotes) as Quote[]);
        if (savedCustomers) setCustomers(JSON.parse(savedCustomers) as Customer[]);
        if (savedCompany) setCompany({ ...defaultCompany, ...(JSON.parse(savedCompany) as Company) });
      })
      .finally(() => setHydrated(true));
  }, []);
  useEffect(() => { if (hydrated) void refresh(); }, [hydrated]);

  const addCustomer = async (draft: Omit<Customer, 'id'> & { id?: string }) => {
    const customer: Customer = { ...draft, id: draft.id ?? makeId() };
    const next = [customer, ...customers.filter((item) => item.id !== customer.id)];
    await saveCache(quotes, next, company);
    try {
      const saved = await saveCustomer(customer);
      const finalCustomer: Customer = { ...customer, id: saved.id ?? customer.id };
      await saveCache(quotes, [finalCustomer, ...next.filter((item) => item.id !== customer.id)], company);
      return finalCustomer;
    } catch { setSyncError('Müşteri cihazda kaydedildi; sunucu eşitlemesi bekliyor.'); return customer; }
  };
  const updateCustomer = async (customer: Customer) => {
    const next = customers.map((item) => item.id === customer.id ? customer : item);
    await saveCache(quotes, next, company);
    try { await updateCustomerRequest(customer.id, customer); return customer; }
    catch { setSyncError('Müşteri cihazda güncellendi; sunucu eşitlemesi bekliyor.'); return customer; }
  };
  const deleteCustomer = async (customerId: string) => {
    await saveCache(quotes, customers.filter((item) => item.id !== customerId), company);
    try { await deleteCustomerRequest(customerId); } catch { setSyncError('Müşteri cihazdan silindi; sunucuyla daha sonra eşitlenecek.'); }
  };
  const addQuote = async (quote: Quote) => {
    const next = [quote, ...quotes.filter((item) => item.id !== quote.id)];
    await saveCache(next, customers, company);
    try {
      const saved = fromApiQuote(await saveQuote(toApiQuote(quote)));
      const merged = [saved, ...next.filter((item) => item.id !== quote.id)];
      await saveCache(merged, customers, company);
      return saved;
    } catch { setSyncError('Teklif cihazda kaydedildi; sunucu eşitlemesi bekliyor.'); return quote; }
  };
  const updateQuote = async (quote: Quote) => {
    const next = quotes.map((item) => item.id === quote.id ? quote : item);
    await saveCache(next, customers, company);
    try {
      const saved = fromApiQuote(await updateQuoteRequest(quote.id, toApiQuote(quote)));
      await saveCache(next.map((item) => item.id === quote.id ? saved : item), customers, company);
      return saved;
    } catch { setSyncError('Teklif cihazda güncellendi; sunucu eşitlemesi bekliyor.'); return quote; }
  };
  const deleteQuote = async (quoteId: string) => {
    await saveCache(quotes.filter((item) => item.id !== quoteId), customers, company);
    try { await deleteQuoteRequest(quoteId); } catch { setSyncError('Teklif cihazdan silindi; sunucuyla daha sonra eşitlenecek.'); }
  };
  const updateCompany = async (next: Company) => {
    await saveCache(quotes, customers, next);
    try { await saveCompany(next); } catch { setSyncError('Firma bilgileri cihazda kaydedildi; sunucu eşitlemesi bekliyor.'); }
  };
  const nextNumber = () => {
    const year = new Date().getFullYear();
    const highest = quotes.filter((item) => item.number.startsWith(`UC-${year}-`)).reduce((max, item) => Math.max(max, Number(item.number.split('-').pop()) || 0), 0);
    return `UC-${year}-${String(highest + 1).padStart(4, '0')}`;
  };
  const value = useMemo(() => ({ quotes, customers, company, hydrated, syncing, syncError, addQuote, updateQuote, deleteQuote, addCustomer, updateCustomer, deleteCustomer, updateCompany, nextNumber, refresh }), [quotes, customers, company, hydrated, syncing, syncError]);
  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuotes() {
  const context = useContext(QuoteContext);
  if (!context) throw new Error('useQuotes must be used inside QuoteProvider');
  return context;
}
export function useAppDarkMode() { return useContext(QuoteContext)?.company.darkMode ?? false; }

export function calculateTotals(quote: Pick<Quote, 'items' | 'labor' | 'transport' | 'other' | 'discount' | 'profitPercent' | 'vatPercent'>) {
  const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
  const materials = quote.items.reduce((sum, item) => sum + number(item.quantity) * number(item.unitPrice), 0);
  const expenses = number(quote.labor) + number(quote.transport) + number(quote.other);
  const subtotal = Math.max(0, materials + expenses - number(quote.discount));
  const profit = subtotal * (number(quote.profitPercent) / 100);
  const taxable = subtotal + profit;
  const vat = taxable * (number(quote.vatPercent) / 100);
  return { materials, expenses, subtotal, beforeProfit: subtotal, profit, taxable, vat, total: taxable + vat };
}
export const formatCurrency = (value: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(value))} ₺`;