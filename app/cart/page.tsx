"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-context"
import { formatNaira } from "@/lib/currency"

export default function CartPage() {
  const { state, setQuantity, removeItem, subtotal, clear } = useCart()
  const hasItems = state.items.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
      <div className="mx-auto max-w-5xl px-6 pb-20 pt-12 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-lime-700">Cart</p>
            <h1 className="text-3xl font-semibold text-foreground">Your basket</h1>
            <p className="text-muted-foreground">
              {hasItems
                ? "Review quantities, then proceed to checkout."
                : "Your cart is empty. Add fresh produce to get started."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/products">Continue shopping</Link>
            </Button>
            {hasItems && (
              <Button variant="ghost" onClick={clear}>
                Clear cart
              </Button>
            )}
          </div>
        </div>

        {hasItems ? (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              {state.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center"
                >
                  <div className="relative h-28 w-full overflow-hidden rounded-xl bg-lime-50 sm:h-24 sm:w-32">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="150px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-lime-800">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                        {item.metric ? (
                          <p className="text-xs text-muted-foreground">{item.metric}</p>
                        ) : null}
                        {item.note ? (
                          <span className="mt-2 inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                            {item.note}
                          </span>
                        ) : null}
                      </div>
                      <button
                        className="text-muted-foreground transition hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 rounded-full border border-lime-100 bg-lime-50/60 px-3 py-1">
                        <button
                          className="rounded-full p-1 hover:bg-white"
                          onClick={() => setQuantity(item.id, Math.max(0, item.quantity - 1))}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="min-w-[2ch] text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          className="rounded-full p-1 hover:bg-white"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatNaira(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
              <h2 className="text-lg font-semibold text-foreground">Order summary</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Items</span>
                  <span>{state.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatNaira(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Estimated logistics</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatNaira(subtotal)}</span>
                </div>
                <Button className="mt-4 w-full gap-2">
                  <ShoppingBasket className="size-4" />
                  Proceed to checkout
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-lime-200 bg-white/80 p-10 text-center text-lime-900">
            <ShoppingBasket className="size-10 text-lime-600" />
            <p className="mt-3 text-lg font-semibold">Your cart is empty</p>
            <p className="text-sm text-lime-800/90">
              Add fresh produce from our catalog to see it here.
            </p>
            <Button asChild className="mt-4">
              <Link href="/products">Browse products</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

