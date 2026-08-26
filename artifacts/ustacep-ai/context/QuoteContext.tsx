import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type QuoteStatus = 'Taslak' | 'Gönderildi' | 'Onaylandı' | 'Reddedildi';
export type QuoteItem = { id: string; name: string; quantity: number; unit: string; unitPrice: number };
export type Quote = {
  id: string;
  number: string;
  customerName: string;
  phone: string;
  title: string;
  type: string;
  address: string;
  notes: string;
  photos: string[];
  description: string;
  dimensions: string;
  materials: string[];
  laborHours: number;
  items: QuoteItem[];
  labor: number;
  transport: number;
  other: number;
  discount: number;
  profitPercent: number;
  vatPercent: number;
  total: number;
  status: QuoteStatus;
  createdAt: string;
  validDays: number;
};

export type Company = {
  name: string;
  phone: string;
  email: string;
  address: string;
  taxInfo: string;
  vatPercent: number;
  profitPercent: number;
  darkMode: boolean;
};

type QuoteContextValue = {
  quotes: Quote[];
  company: Company;
  hydrated: boolean;
  addQuote: (quote: Quote) => Promise<void>;
  updateQuote: (quote: Quote) => Promise<void>;
  updateCompany: (company: Company) => Promise<void>;
  nextNumber: () => string;
};

const defaultCompany: Company = {
  name: 'UstaCep Atölye',
  phone: '0532 000 00 00',
  email: 'merhaba@ustacep.com',
  address: 'İstanbul',
  taxInfo: 'Vergi bilgisi ekle',
  vatPercent: 20,
  profitPercent: 25,
  darkMode: false,
};

const QuoteContext = createContext<QuoteContextValue | null>(null);
const STORAGE_KEY = '@ustacep/quotes';
const COMPANY_KEY = '@ustacep/company';

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [company, setCompany] = useState<Company>(defaultCompany);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(COMPANY_KEY)])
      .then(([savedQuotes, savedCompany]) => {
        if (savedQuotes) setQuotes(JSON.parse(savedQuotes) as Quote[]);
        if (savedCompany) setCompany({ ...defaultCompany, ...(JSON.parse(savedCompany) as Company) });
      })
      .finally(() => setHydrated(true));
  }, []);

  const persistQuotes = async (next: Quote[]) => {
    setQuotes(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addQuote = async (quote: Quote) => persistQuotes([quote, ...quotes]);
  const updateQuote = async (quote: Quote) =>
    persistQuotes(quotes.map((item) => (item.id === quote.id ? quote : item)));
  const updateCompany = async (next: Company) => {
    setCompany(next);
    await AsyncStorage.setItem(COMPANY_KEY, JSON.stringify(next));
  };
  const nextNumber = () => {
    const year = new Date().getFullYear();
    const highest = quotes.reduce((max, item) => {
      const value = Number(item.number.split('-').pop());
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `UC-${year}-${String(highest + 1).padStart(4, '0')}`;
  };

  const value = useMemo(
    () => ({ quotes, company, hydrated, addQuote, updateQuote, updateCompany, nextNumber }),
    [quotes, company, hydrated],
  );
  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>;
}

export function useQuotes() {
  const context = useContext(QuoteContext);
  if (!context) throw new Error('useQuotes must be used inside QuoteProvider');
  return context;
}

export function calculateTotals(quote: Pick<Quote, 'items' | 'labor' | 'transport' | 'other' | 'discount' | 'profitPercent' | 'vatPercent'>) {
  const materials = quote.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const beforeProfit = Math.max(0, materials + quote.labor + quote.transport + quote.other - quote.discount);
  const profit = beforeProfit * (quote.profitPercent / 100);
  const taxable = beforeProfit + profit;
  const vat = taxable * (quote.vatPercent / 100);
  return { materials, beforeProfit, profit, taxable, vat, total: taxable + vat };
}

export const formatCurrency = (value: number) =>
  `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(value))} ₺`;