"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { roundMoney } from "@/lib/products";
import { policy } from "@/lib/shipping";

/** Pièces commandables, fournies par le serveur (prix et tailles à jour). */
export type CartCatalogEntry = { slug: string; name: string; price: number; sizes: string[] };

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  open: boolean;
  setOpen: (open: boolean) => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  changeQuantity: (slug: string, size: string, delta: number) => void;
  removeItem: (slug: string, size: string) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "triplex-cart";

export function CartProvider({
  catalog,
  children,
}: {
  catalog: CartCatalogEntry[];
  children: React.ReactNode;
}) {
  const catalogRef = useRef(catalog);
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as CartItem[];
        // Ignore les pièces/tailles qui n'existent plus et recale les prix.
        setItems(
          stored.flatMap((item) => {
            const product = catalogRef.current.find((entry) => entry.slug === item.slug);
            if (!product || !product.sizes.includes(item.size)) return [];
            return [
              {
                ...item,
                name: product.name,
                price: product.price,
                quantity: Math.min(Math.max(1, item.quantity), policy.maxQuantity),
              },
            ];
          }),
        );
      }
    } catch {
      setItems([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((current) => {
      const index = current.findIndex(
        (entry) => entry.slug === item.slug && entry.size === item.size,
      );
      if (index === -1) return [...current, { ...item, quantity: 1 }];
      return current.map((entry, i) =>
        i === index
          ? { ...entry, quantity: Math.min(entry.quantity + 1, policy.maxQuantity) }
          : entry,
      );
    });
    setOpen(true);
  }, []);

  const changeQuantity = useCallback((slug: string, size: string, delta: number) => {
    setItems((current) =>
      current.map((entry) =>
        entry.slug === slug && entry.size === size
          ? {
              ...entry,
              quantity: Math.min(Math.max(1, entry.quantity + delta), policy.maxQuantity),
            }
          : entry,
      ),
    );
  }, []);

  const removeItem = useCallback((slug: string, size: string) => {
    setItems((current) =>
      current.filter((entry) => !(entry.slug === slug && entry.size === size)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const total = roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
    return { items, open, setOpen, addItem, changeQuantity, removeItem, clear, count, total };
  }, [items, open, addItem, changeQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
