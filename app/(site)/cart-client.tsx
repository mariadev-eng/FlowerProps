"use client";

import Cart from "../components/Cart";
import { useCart } from "../contexts/CartContext";

export function CartClient() {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  return (
    <Cart
      items={cartItems}
      isOpen={isCartOpen}
      onClose={closeCart}
      onRemove={removeFromCart}
      onIncrease={increaseQuantity}
      onDecrease={decreaseQuantity}
    />
  );
}