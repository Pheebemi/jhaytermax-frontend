"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Clock, Eye, Package, Truck, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  fetchOrders,
  fetchOrder,
  getTokens,
  ensureProfileWithRefresh,
  type Order,
} from "@/lib/auth"
import { formatNaira } from "@/lib/currency"

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
]

export default function BuyerOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    const init = async () => {
      const tokens = getTokens()
      if (!tokens) {
        router.replace("/login")
        return
      }
      try {
        const me = await ensureProfileWithRefresh()
        if (me.role !== "buyer") {
          router.replace("/login")
          return
        }
        setLoading(false)
        // Load data after auth check passes
        try {
          const o = await fetchOrders()
          setOrders(o)
        } catch (err: any) {
          console.error("Failed to load orders:", err)
          toast.error("Failed to load orders", { description: err?.message })
        }
      } catch {
        router.replace("/login")
        return
      }
    }
    init()
  }, [router])

  const filteredOrders = orders.filter((o) => statusFilter === "all" || o.status === statusFilter)

  const getStatusColor = (status: string) => {
    if (status === "delivered") return "bg-green-100 text-green-800 ring-green-100"
    if (status === "cancelled") return "bg-red-100 text-red-800 ring-red-100"
    if (status === "shipped") return "bg-blue-100 text-blue-800 ring-blue-100"
    return "bg-amber-100 text-amber-800 ring-amber-100"
  }

  const getStatusIcon = (status: string) => {
    if (status === "delivered") return Package
    if (status === "shipped") return Truck
    return Clock
  }

  const handleViewOrder = async (orderId: number) => {
    try {
      const order = await fetchOrder(orderId)
      setSelectedOrder(order)
    } catch (err: any) {
      toast.error("Failed to load order details", { description: err?.message })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-white/90 p-8 text-center shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-lime-700">Orders</p>
          <h1 className="text-2xl font-semibold text-foreground">My Orders</h1>
          <p className="text-sm text-muted-foreground">Track and manage your orders</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Button variant="outline" asChild>
            <Link href="/products">New Order</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white/90 p-8 text-center shadow-sm ring-1 ring-black/5">
              <Package className="mx-auto size-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm font-semibold text-foreground">No orders found</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {statusFilter === "all"
                  ? "You haven't placed any orders yet."
                  : `No orders with status "${statusFilter}".`}
              </p>
              {statusFilter === "all" && (
                <Button asChild className="mt-4">
                  <Link href="/products">Browse Products</Link>
                </Button>
              )}
            </div>
          ) : (
            filteredOrders.map((order) => {
              const StatusIcon = getStatusIcon(order.status)
              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{order.order_id}</p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ring-1 ${getStatusColor(order.status)}`}
                        >
                          <StatusIcon className="size-3" />
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {formatNaira(Number(order.total_amount))}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""} •{" "}
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      {order.delivery_location_name && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          📍 {order.delivery_location_state} - {order.delivery_location_name}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleViewOrder(order.id)}
                    >
                      <Eye className="size-4" />
                      View
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {selectedOrder && (
          <div className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5 sticky top-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Order Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Order ID</p>
                <p className="text-sm font-semibold text-foreground">{selectedOrder.order_id}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <span
                  className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ring-1 ${getStatusColor(selectedOrder.status)}`}
                >
                  {selectedOrder.status}
                </span>
              </div>

              {selectedOrder.delivery_location_name && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Delivery Location</p>
                  <p className="text-sm text-foreground">
                    {selectedOrder.delivery_location_state} - {selectedOrder.delivery_location_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Delivery Fee: {formatNaira(Number(selectedOrder.delivery_fee))}
                  </p>
                </div>
              )}

              {selectedOrder.shipping_address && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Address</p>
                  <p className="text-sm text-foreground">{selectedOrder.shipping_address}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground">Items</p>
                <div className="mt-2 space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} x {formatNaira(Number(item.price))}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatNaira(Number(item.subtotal))}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm text-foreground">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">
                    {formatNaira(
                      selectedOrder.items.reduce((sum, item) => sum + Number(item.subtotal), 0) -
                        Number(selectedOrder.delivery_fee)
                    )}
                  </span>
                </div>
                {Number(selectedOrder.delivery_fee) > 0 && (
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-semibold text-foreground">
                      {formatNaira(Number(selectedOrder.delivery_fee))}
                    </span>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-base font-semibold">
                  <span>Total</span>
                  <span>{formatNaira(Number(selectedOrder.total_amount))}</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs font-medium text-muted-foreground">Order Date</p>
                <p className="text-sm text-foreground">
                  {new Date(selectedOrder.created_at).toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

