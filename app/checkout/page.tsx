"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart } from "@/components/cart-context"
import { formatNaira } from "@/lib/currency"
import { createOrder, fetchStates, fetchLocations, type State, type Location } from "@/lib/auth"

export default function CheckoutPage() {
  const router = useRouter()
  const { state, subtotal, clear } = useCart()
  const [loading, setLoading] = useState(false)
  const [states, setStates] = useState<State[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null)
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  const [detailedAddress, setDetailedAddress] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const s = await fetchStates()
        setStates(s)
      } catch (err: any) {
        toast.error("Failed to load states", { description: err?.message })
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (selectedStateId) {
      const load = async () => {
        try {
          const l = await fetchLocations(selectedStateId)
          setLocations(l)
          setSelectedLocationId(null) // Reset location when state changes
        } catch (err: any) {
          toast.error("Failed to load locations", { description: err?.message })
        }
      }
      load()
    } else {
      setLocations([])
      setSelectedLocationId(null)
    }
  }, [selectedStateId])

  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === selectedLocationId) || null,
    [locations, selectedLocationId]
  )

  const totalAmount = useMemo(() => {
    return subtotal + Number(selectedLocation?.delivery_fee || 0)
  }, [subtotal, selectedLocation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (state.items.length === 0) {
      toast.error("Your cart is empty")
      return
    }

    if (!selectedStateId || !selectedLocationId) {
      toast.error("Please select a state and location")
      return
    }

    setLoading(true)
    try {
      const order = await createOrder({
        items: state.items.map((item) => ({
          product_id: Number(item.id),
          quantity: item.quantity,
        })),
        location_id: selectedLocationId,
        detailed_address: detailedAddress,
        notes: notes,
      })

      clear()
      toast.success("Order created successfully")
      console.log("Order created:", order, "Order ID:", order.id)
      router.push(`/payment?order_id=${order.id}`)
    } catch (err: any) {
      toast.error("Failed to create order", { description: err?.message })
    } finally {
      setLoading(false)
    }
  }

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="rounded-2xl border border-dashed border-lime-200 bg-white/80 p-10 text-center">
            <p className="text-lg font-semibold text-lime-900">Your cart is empty</p>
            <p className="mt-2 text-sm text-lime-800/90">Add items to your cart before checkout.</p>
            <Button asChild className="mt-4">
              <Link href="/products">Browse products</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to cart
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="text-lg font-semibold text-foreground">Delivery Information</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="state">State *</Label>
                  <select
                    id="state"
                    value={selectedStateId || ""}
                    onChange={(e) => setSelectedStateId(e.target.value ? Number(e.target.value) : null)}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Select a state</option>
                    {states.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="location">Location *</Label>
                  <select
                    id="location"
                    value={selectedLocationId || ""}
                    onChange={(e) => setSelectedLocationId(e.target.value ? Number(e.target.value) : null)}
                    className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    required
                    disabled={!selectedStateId || locations.length === 0}
                  >
                    <option value="">Select a location</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} - {formatNaira(Number(location.delivery_fee))}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="detailed_address">Detailed Address (Optional)</Label>
                  <textarea
                    id="detailed_address"
                    value={detailedAddress}
                    onChange={(e) => setDetailedAddress(e.target.value)}
                    rows={3}
                    className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Street address, building, apartment, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Special instructions or notes for this order"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Proceed to payment"
              )}
            </Button>
          </form>

          <div className="rounded-2xl border border-slate-100 bg-white/90 p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Items</span>
                <span>{state.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatNaira(subtotal)}</span>
              </div>
              {selectedLocation ? (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span>{formatNaira(Number(selectedLocation.delivery_fee))}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span>Select location</span>
                </div>
              )}
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatNaira(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

