import type { Entitlements, ProductId, Receipt } from '@nexus/shared';
import { IS_PROTOTYPE } from '../config';

/**
 * Purchase provider interface. Expo Go cannot load StoreKit/RevenueCat, so there the default is a
 * mock that confirms every purchase; store builds start without purchases until RevenueCat is
 * configured (`revenuecat.ts`), so nothing is ever granted for free. What a product grants is a rule in shared (`shop.ts`); crediting
 * goes through `applyPurchase`, which never credits a transaction twice.
 */
export interface StoreProduct {
  id: ProductId;
  /** Localised price from the store, e.g. "4,99 €". */
  price: string;
  /** The same as a number in the store's currency, for comparisons (yearly saving). */
  amount: number;
  /** Introductory offer as the store words it, e.g. "7 Tage gratis". */
  intro?: string;
}

export interface PurchaseProvider {
  /** Localised prices; products the store does not know are missing. */
  products(): Promise<StoreProduct[]>;
  /** Resolves with the confirmed transaction, or null if cancelled or failed. */
  purchase(productId: ProductId): Promise<Receipt | null>;
  /**
   * Restores Plus (subscription or lifetime, App Store rule 3.1.1). Gems are consumable and are
   * not restored. Null = the store knows nothing (mock): keep the local state.
   */
  restore(): Promise<Entitlements | null>;
  /** What the store knows right now, without asking the player to sign in (at start). */
  entitlements(): Promise<Entitlements | null>;
}

/**
 * Fallback prices until the store answers. They are placeholders, the store's own win (see
 * docs/MONETIZATION.md). Product names are UI text (`shop.products` in the UI strings).
 */
export const PRODUCT_TEXT: Record<ProductId, { price: string; amount: number }> = {
  gems_50: { price: '0,99 €', amount: 0.99 },
  gems_150: { price: '2,49 €', amount: 2.49 },
  gems_400: { price: '5,99 €', amount: 5.99 },
  starter: { price: '1,99 €', amount: 1.99 },
  plus_month: { price: '4,99 €', amount: 4.99 },
  plus_year: { price: '29,99 €', amount: 29.99 },
  plus_life: { price: '59,99 €', amount: 59.99 },
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const mockPurchases: PurchaseProvider = {
  async products() {
    return (Object.keys(PRODUCT_TEXT) as ProductId[]).map((id) => ({
      id,
      price: PRODUCT_TEXT[id].price,
      amount: PRODUCT_TEXT[id].amount,
    }));
  },
  async purchase(productId) {
    const days = productId === 'plus_month' ? 30 : productId === 'plus_year' ? 365 : null;
    return {
      productId,
      transactionId: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      expiresAt: days ? Date.now() + days * DAY_MS : null,
    };
  },
  async restore() {
    return null;
  },
  async entitlements() {
    return null;
  },
};

/** A store build without RevenueCat (no key yet): nothing to buy, the shop hides its prices. */
const noPurchases: PurchaseProvider = {
  async products() {
    return [];
  },
  async purchase() {
    return null;
  },
  async restore() {
    return null;
  },
  async entitlements() {
    return null;
  },
};

export let purchases: PurchaseProvider = IS_PROTOTYPE ? mockPurchases : noPurchases;
export function setPurchaseProvider(p: PurchaseProvider): void {
  purchases = p;
}

/** False in a store build without a store: the shop shows no buy buttons. */
export function canPurchase(): boolean {
  return purchases !== noPurchases;
}
