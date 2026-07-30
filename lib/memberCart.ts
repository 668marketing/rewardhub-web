"use client";

export const MEMBER_CART_STORAGE_KEY = "rewardhub_member_cart";
export const MEMBER_CART_UPDATED_EVENT = "rewardhub-cart-updated";

export type MemberCartItem = {
  productId: string;
  merchantId: string;
  merchantName: string;
  productName: string;
  imageUrl: string;
  price: number;
  originalPrice: number;
  quantity: number;
  stock: number | null;
  pointsEarned: number;
  category: string;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeItem(item: MemberCartItem): MemberCartItem {
  const stockNumber = Number(item.stock);

  return {
    productId: String(item.productId || "").trim(),
    merchantId: String(item.merchantId || "").trim(),
    merchantName: String(item.merchantName || "").trim(),
    productName: String(item.productName || "").trim(),
    imageUrl: String(item.imageUrl || "").trim(),
    price: Math.max(0, Number(item.price || 0)),
    originalPrice: Math.max(0, Number(item.originalPrice || 0)),
    quantity: Math.max(1, Math.floor(Number(item.quantity || 1))),
    stock:
      item.stock === null ||
      item.stock === undefined ||
      item.stock === ("" as unknown)
        ? null
        : Number.isFinite(stockNumber)
          ? Math.max(0, Math.floor(stockNumber))
          : null,
    pointsEarned: Math.max(
      0,
      Math.floor(Number(item.pointsEarned || 0))
    ),
    category: String(item.category || "").trim(),
  };
}

export function readMemberCart(): MemberCartItem[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(
      MEMBER_CART_STORAGE_KEY
    );

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normalizeItem(item))
      .filter(
        (item) =>
          Boolean(item.productId) &&
          Boolean(item.merchantId) &&
          item.quantity > 0
      );
  } catch {
    return [];
  }
}

export function writeMemberCart(
  items: MemberCartItem[]
): MemberCartItem[] {
  if (!isBrowser()) {
    return [];
  }

  const normalized = items
    .map((item) => normalizeItem(item))
    .filter(
      (item) =>
        Boolean(item.productId) &&
        Boolean(item.merchantId) &&
        item.quantity > 0
    );

  window.localStorage.setItem(
    MEMBER_CART_STORAGE_KEY,
    JSON.stringify(normalized)
  );

  window.dispatchEvent(
    new CustomEvent(MEMBER_CART_UPDATED_EVENT, {
      detail: {
        items: normalized,
      },
    })
  );

  return normalized;
}

export function getMemberCartCount(): number {
  return readMemberCart().reduce(
    (total, item) => total + item.quantity,
    0
  );
}

export type AddMemberCartResult =
  | {
      ok: true;
      items: MemberCartItem[];
    }
  | {
      ok: false;
      reason: "DIFFERENT_MERCHANT";
      existingMerchantName: string;
    };

export function addMemberCartItem(
  newItem: MemberCartItem
): AddMemberCartResult {
  const item = normalizeItem(newItem);
  const current = readMemberCart();

  const differentMerchant = current.find(
    (cartItem) =>
      cartItem.merchantId !== item.merchantId
  );

  if (differentMerchant) {
    return {
      ok: false,
      reason: "DIFFERENT_MERCHANT",
      existingMerchantName:
        differentMerchant.merchantName,
    };
  }

  const existingIndex = current.findIndex(
    (cartItem) =>
      cartItem.productId === item.productId
  );

  if (existingIndex >= 0) {
    const existing = current[existingIndex];
    const requestedQuantity =
      existing.quantity + item.quantity;

    current[existingIndex] = {
      ...existing,
      ...item,
      quantity:
        item.stock !== null
          ? Math.min(requestedQuantity, item.stock)
          : requestedQuantity,
    };
  } else {
    current.push({
      ...item,
      quantity:
        item.stock !== null
          ? Math.min(item.quantity, item.stock)
          : item.quantity,
    });
  }

  return {
    ok: true,
    items: writeMemberCart(current),
  };
}

export function updateMemberCartQuantity(
  productId: string,
  quantity: number
): MemberCartItem[] {
  const current = readMemberCart();
  const nextQuantity = Math.floor(Number(quantity));

  const next = current
    .map((item) => {
      if (item.productId !== productId) {
        return item;
      }

      const limitedQuantity =
        item.stock !== null
          ? Math.min(nextQuantity, item.stock)
          : nextQuantity;

      return {
        ...item,
        quantity: Math.max(0, limitedQuantity),
      };
    })
    .filter((item) => item.quantity > 0);

  return writeMemberCart(next);
}

export function removeMemberCartItem(
  productId: string
): MemberCartItem[] {
  return writeMemberCart(
    readMemberCart().filter(
      (item) => item.productId !== productId
    )
  );
}

export function clearMemberCart(): MemberCartItem[] {
  return writeMemberCart([]);
}