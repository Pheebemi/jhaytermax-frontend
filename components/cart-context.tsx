"use client"

import React, { createContext, useContext, useMemo, useReducer } from "react"

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  metric?: string
  image?: string
  note?: string
}

type CartState = {
  items: CartItem[]
}

type CartAction =
  | { type: "ADD"; item: Omit<CartItem, "quantity"> }
  | { type: "REMOVE"; id: string }
  | { type: "SET_QTY"; id: string; quantity: number }
  | { type: "CLEAR" }

const CartContext = createContext<{
  state: CartState
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (id: string) => void
  setQuantity: (id: string, quantity: number) => void
  clear: () => void
  subtotal: number
}>({
  state: { items: [] },
  addItem: () => {},
  removeItem: () => {},
  setQuantity: () => {},
  clear: () => {},
  subtotal: 0,
})

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD": {
      const existing = state.items.find((i) => i.id === action.item.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }
      }
      return {
        ...state,
        items: [...state.items, { ...action.item, quantity: 1 }],
      }
    }
    case "REMOVE": {
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    }
    case "SET_QTY": {
      return {
        ...state,
        items: state.items
          .map((i) => (i.id === action.id ? { ...i, quantity: action.quantity } : i))
          .filter((i) => i.quantity > 0),
      }
    }
    case "CLEAR": {
      return { items: [] }
    }
    default:
      return state
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] })

  const subtotal = useMemo(
    () => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [state.items]
  )

  const value = useMemo(
    () => ({
      state,
      addItem: (item: Omit<CartItem, "quantity">) => dispatch({ type: "ADD", item }),
      removeItem: (id: string) => dispatch({ type: "REMOVE", id }),
      setQuantity: (id: string, quantity: number) =>
        dispatch({ type: "SET_QTY", id, quantity }),
      clear: () => dispatch({ type: "CLEAR" }),
      subtotal,
    }),
    [state, subtotal]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider")
  }
  return ctx
}

