import { Platform } from 'react-native';
import type * as RC from 'react-native-purchases';
import { PRODUCTS, type Entitlements, type ProductId } from '@nexus/shared';
import type { PurchaseProvider, StoreProduct } from './purchases';

/**
 * The real purchase provider (RevenueCat over StoreKit and Play Billing), only for development and
 * store builds: Expo Go keeps the mock (D1), so the module is required lazily. RevenueCat checks
 * the receipts on its server; what a product grants stays a rule in shared (`shop.ts`).
 *
 * Store setup (docs/MONETIZATION.md §3): the product ids of `PRODUCTS` in App Store Connect and
 * the Play Console, both Plus subscriptions and `plus_life` attached to the entitlement `plus`.
 */
const ENTITLEMENT = 'plus';

/** Public SDK keys per platform from EAS environment variables (not secret). */
function apiKey(): string | undefined {
  return Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
}

/** Play reports subscriptions as "plus_month:monthly" (product:base plan). */
function productId(identifier: string): ProductId | null {
  const id = identifier.split(':')[0];
  return PRODUCTS.some((p) => p.id === id) ? (id as ProductId) : null;
}

function entitlements(info: RC.CustomerInfo): Entitlements {
  const e = info.entitlements.active[ENTITLEMENT];
  if (!e) return { plusUntil: null, plusLifetime: false };
  // a lifetime purchase is an active entitlement without an end
  return { plusUntil: e.expirationDateMillis, plusLifetime: e.expirationDateMillis === null };
}

/** Null without a key or the native module: the caller keeps the store build without purchases. */
export function createRevenueCatProvider(): PurchaseProvider | null {
  const key = apiKey();
  if (!key) return null;
  let m: typeof RC;
  try {
    m = require('react-native-purchases') as typeof RC;
  } catch {
    return null;
  }
  const Purchases = m.default;
  Purchases.configure({ apiKey: key });

  const cache = new Map<ProductId, RC.PurchasesStoreProduct>();
  const load = async (): Promise<void> => {
    if (cache.size) return;
    const subs = PRODUCTS.filter((p) => p.kind === 'subscription').map((p) => p.id);
    const others = PRODUCTS.filter((p) => p.kind !== 'subscription').map((p) => p.id);
    const [a, b] = await Promise.all([
      Purchases.getProducts(subs, m.PRODUCT_CATEGORY.SUBSCRIPTION),
      Purchases.getProducts(others, m.PRODUCT_CATEGORY.NON_SUBSCRIPTION),
    ]);
    for (const p of [...a, ...b]) {
      const id = productId(p.identifier);
      if (id && !cache.has(id)) cache.set(id, p);
    }
  };

  return {
    async products() {
      await load();
      return [...cache].map(([id, p]): StoreProduct => ({ id, price: p.priceString, amount: p.price }));
    },
    async purchase(id) {
      await load();
      const product = cache.get(id);
      if (!product) return null;
      try {
        const r = await Purchases.purchaseStoreProduct(product);
        return {
          productId: id,
          transactionId: r.transaction.transactionIdentifier,
          expiresAt: entitlements(r.customerInfo).plusUntil,
        };
      } catch {
        // cancelled or failed
        return null;
      }
    },
    async restore() {
      return entitlements(await Purchases.restorePurchases());
    },
    async entitlements() {
      return entitlements(await Purchases.getCustomerInfo());
    },
  };
}
