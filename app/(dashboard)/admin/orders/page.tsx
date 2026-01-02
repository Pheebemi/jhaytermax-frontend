"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Eye, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  fetchOrders,
  updateOrderStatus,
  getTokens,
  ensureProfileWithRefresh,
  type Order,
} from "@/lib/auth"
import { formatNaira } from "@/lib/currency"

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
]

export default function AdminOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    const init = async () => {
      const tokens = getTokens()
      if (!tokens) {
        router.replace("/login")
        return
      }
      try {
        const me = await ensureProfileWithRefresh()
        const isAdmin = me.role === "admin" || me.is_staff || me.is_superuser
        if (!isAdmin) {
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

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    setUpdating(orderId)
    try {
      const updated = await updateOrderStatus(orderId, newStatus)
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated)
      }
      toast.success("Order status updated")
    } catch (err: any) {
      toast.error("Failed to update status", { description: err?.message })
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
          Loading orders...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Orders</p>
          <h1 className="text-2xl font-semibold text-foreground">Manage orders</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-white/90 p-8 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-muted-foreground">No orders found</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{order.order_id}</p>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {order.buyer_username} ({order.buyer_email})
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {formatNaira(Number(order.total_amount))}
                    </p>
                    {order.delivery_location_name && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {order.delivery_location_state} - {order.delivery_location_name}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="size-4" />
                    View
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedOrder && (
          <div className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Order Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
                Close
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Order ID</p>
                <p className="text-sm font-semibold text-foreground">{selectedOrder.order_id}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">Customer</p>
                <p className="text-sm text-foreground">{selectedOrder.buyer_username}</p>
                <p className="text-xs text-muted-foreground">{selectedOrder.buyer_email}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground">Status</p>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                  disabled={updating === selectedOrder.id}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {updating === selectedOrder.id && (
                  <Loader2 className="mt-2 size-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {selectedOrder.delivery_location_name && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Delivery Location</p>
                  <p className="text-sm text-foreground">
                    {selectedOrder.delivery_location_state} - {selectedOrder.delivery_location_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fee: {formatNaira(Number(selectedOrder.delivery_fee))}
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

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">
                    {formatNaira(
                      selectedOrder.items.reduce(
                        (sum, item) => sum + Number(item.subtotal),
                        0
                      ) - Number(selectedOrder.delivery_fee)
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

