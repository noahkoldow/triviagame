/** Purchase provider interface; mock grants instantly (RevenueCat/StoreKit later). */
export interface Product {
  id: string;
  title: string;
  price: string;
  gems?: number;
  adFree?: boolean;
}

export const PRODUCTS: Product[] = [
  { id: 'gems_50', title: '50 Gems', price: '0,99 €', gems: 50 },
  { id: 'gems_150', title: '150 Gems', price: '2,49 €', gems: 150 },
  { id: 'gems_400', title: '400 Gems', price: '5,99 €', gems: 400 },
  { id: 'adfree', title: 'Werbefrei', price: '3,99 €', adFree: true },
];

export interface PurchaseProvider {
  purchase(productId: string): Promise<boolean>;
}

export const mockPurchases: PurchaseProvider = {
  async purchase() {
    return true;
  },
};

export let purchases: PurchaseProvider = mockPurchases;
export function setPurchaseProvider(p: PurchaseProvider): void {
  purchases = p;
}
