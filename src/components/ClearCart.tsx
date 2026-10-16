"use client";

import { useEffect } from "react";
import { useCart } from "@/components/CartProvider";

/** Vide la sélection locale une fois la commande passée. */
export function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    // Retire aussi la valeur stockée : le provider (parent) relit le stockage
    // après cet effet et restaurerait sinon l'ancienne sélection.
    window.localStorage.removeItem("triplex-cart");
    clear();
  }, [clear]);
  return null;
}
