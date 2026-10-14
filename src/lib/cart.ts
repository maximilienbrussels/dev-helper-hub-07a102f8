// Shopping cart persisted in localStorage. Deep type parsing to survive
// schema drift (per SCOS §8 Stability rules).

export type CartItem = {
  productId: number;
  quantity: number;
  /** Chosen packaging option id (see src/data/products.ts). */
  packagingId?: string;
};

const KEY = "scos_cart_v1";

function isCartItem(v: unknown): v is CartItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.productId === "number" &&
    typeof o.quantity === "number" &&
    o.quantity > 0 &&
    (o.packagingId === undefined || typeof o.packagingId === "string")
  );
}

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("scos:cart-updated"));
  } catch {
    /* ignore quota errors */
  }
}

export function addToCart(productId: number, quantity = 1, packagingId?: string): void {
  const cart = readCart();
  const existing = cart.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += quantity;
    if (packagingId) existing.packagingId = packagingId;
  } else {
    cart.push({ productId, quantity, packagingId });
  }
  writeCart(cart);
}

/**
 * Adds a product and opens the cart drawer with a confirmation for that item.
 * Used by both the shop grid and the product page.
 */
export function addToCartAndOpen(productId: number, quantity = 1, packagingId?: string): void {
  addToCart(productId, quantity, packagingId);
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("scos:cart-open", { detail: { addedProductId: productId } }),
  );
}

export function openCart(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("scos:cart-open"));
}

export function setPackaging(productId: number, packagingId: string): void {
  const cart = readCart();
  const it = cart.find((i) => i.productId === productId);
  if (!it) return;
  it.packagingId = packagingId;
  writeCart(cart);
}

export function removeFromCart(productId: number): void {
  writeCart(readCart().filter((i) => i.productId !== productId));
}

export function updateQuantity(productId: number, quantity: number): void {
  if (quantity <= 0) return removeFromCart(productId);
  const cart = readCart();
  const it = cart.find((i) => i.productId === productId);
  if (it) it.quantity = quantity;
  writeCart(cart);
}

export function clearCart(): void {
  writeCart([]);
}
