import { create } from 'zustand';
import type { Location, Package, PublicConsultant, Quote } from '@/types/api';

// §11.1 — booking wizard store
type WizardState = {
  packageSlug: string;
  pkg: Package | null;
  consultant: PublicConsultant | null;
  date: string | null;              // YYYY-MM-DD
  time: string | null;              // HH:MM
  location: Location | null;
  paymentMethodId: number | null;   // saved card
  cardToken: string | null;         // new card token (§11.5)
  saveCard: boolean;
  clientNotes: string;
  quote: Quote | null;              // CLI-BKG-01 result
  setPackage: (slug: string, pkg: Package | null) => void;
  setConsultant: (consultant: PublicConsultant | null) => void;
  setDate: (date: string | null) => void;
  setTime: (time: string | null) => void;
  setLocation: (location: Location | null) => void;
  setPaymentMethod: (id: number | null) => void;
  setCardToken: (token: string | null) => void;
  setSaveCard: (save: boolean) => void;
  setClientNotes: (notes: string) => void;
  setQuote: (quote: Quote | null) => void;
  reset: () => void;
};

const initial = {
  packageSlug: '',
  pkg: null,
  consultant: null,
  date: null,
  time: null,
  location: null,
  paymentMethodId: null,
  cardToken: null,
  saveCard: false,
  clientNotes: '',
  quote: null,
};

export const useWizard = create<WizardState>()((set) => ({
  ...initial,
  setPackage: (packageSlug, pkg) => set({ packageSlug, pkg }),
  // changing consultant or date resets the chosen time (§11.3)
  setConsultant: (consultant) => set({ consultant, date: null, time: null }),
  setDate: (date) => set({ date, time: null }),
  setTime: (time) => set({ time }),
  setLocation: (location) => set({ location }),
  setPaymentMethod: (paymentMethodId) => set({ paymentMethodId, cardToken: null }),
  setCardToken: (cardToken) => set({ cardToken, paymentMethodId: null }),
  setSaveCard: (saveCard) => set({ saveCard }),
  setClientNotes: (clientNotes) => set({ clientNotes }),
  setQuote: (quote) => set({ quote }),
  reset: () => set(initial),
}));
