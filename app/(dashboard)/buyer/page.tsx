"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Clock, Package, ShoppingBasket, Truck } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"

import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatNaira } from "@/lib/currency"
import { fetchProducts, fetchOrders, getTokens, ensureProfileWithRefresh, type Product, type Order } from "@/lib/auth"

export default function BuyerDashboardPage() {
  const router = useRouter()
  const [staples, setStaples] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [user, setUser] = useState<{ username: string; email: string; role: string } | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

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
        setUser(me)
        setAuthChecked(true)
        // Load data after auth check passes
        try {
          const [data, o] = await Promise.all([fetchProducts(), fetchOrders()])
          setStaples(data.slice(0, 3))
          setOrders(o)
        } catch (err: any) {
          console.error("Failed to load data:", err)
        }
      } catch {
        router.replace("/login")
        return
      }
    }
    init()
  }, [router])

  // Calculate real statistics
  const totalOrders = orders.length
  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "processing").length
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount), 0)
  const last30DaysSpent = orders
    .filter((o) => {
      const orderDate = new Date(o.created_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return orderDate >= thirtyDaysAgo
    })
    .reduce((sum, o) => sum + Number(o.total_amount), 0)

  // Prepare chart data - orders over last 30 days
  const ordersChartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date.toISOString().split("T")[0]
    })

    return last30Days.map((date) => {
      const dayOrders = orders.filter((o) => o.created_at.startsWith(date))
      return {
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        orders: dayOrders.length,
      }
    })
  }, [orders])

  // Prepare spending chart data
  const spendingChartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date.toISOString().split("T")[0]
    })

    return last30Days.map((date) => {
      const dayOrders = orders.filter((o) => o.created_at.startsWith(date))
      const spending = dayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)
      return {
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        spending: spending,
      }
    })
  }, [orders])

  const recentOrders = useMemo(() => orders.slice(0, 4), [orders])

  const chartConfig = {
    orders: {
      label: "Orders",
      color: "hsl(var(--chart-1))",
    },
    spending: {
      label: "Spending",
      color: "hsl(var(--chart-2))",
    },
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
        <div className="mx-auto max-w-6xl px-6 py-16 text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  const stats = [
    { label: "Total Orders", value: totalOrders.toString(), change: `${pendingOrders} pending` },
    { label: "Total Spent", value: formatNaira(totalSpent), change: `${deliveredOrders} delivered` },
    { label: "Spend (30d)", value: formatNaira(last30DaysSpent), change: "Last 30 days" },
    { label: "Delivered", value: deliveredOrders.toString(), change: "Completed orders" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-lime-700">Buyer dashboard</p>
            <h1 className="text-3xl font-semibold text-foreground">
              Welcome back
              {user ? `, ${user.username || user.email?.split("@")?.[0] || "buyer"}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground">
              Track your orders, reorder fast, and monitor fulfillment performance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/cart">View cart</Link>
            </Button>
            <Button className="gap-2" asChild>
              <Link href="/products">
                Place new order
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-lime-100 bg-white/90 p-4 shadow-sm ring-1 ring-black/5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">{stat.label}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-lime-700">Orders</p>
                <h2 className="text-lg font-semibold text-foreground">Orders over time (30 days)</h2>
              </div>
            </div>
            <div className="mt-4">
              <ChartContainer config={chartConfig}>
                <LineChart data={ordersChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="var(--color-orders)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-orders)", r: 4, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-lime-700">Spending</p>
                <h2 className="text-lg font-semibold text-foreground">Spending over time (30 days)</h2>
              </div>
            </div>
            <div className="mt-4">
              <ChartContainer config={chartConfig}>
                <LineChart data={spendingChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `₦${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => formatNaira(Number(value))} />}
                  />
                  <Line
                    type="monotone"
                    dataKey="spending"
                    stroke="var(--color-spending)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-spending)", r: 4, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-lime-700">Recent orders</p>
                <h2 className="text-lg font-semibold text-foreground">Live status</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/orders">View all</Link>
              </Button>
            </div>
            <div className="mt-4 divide-y divide-slate-100">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => {
                  const getStatusColor = (status: string) => {
                    if (status === "delivered") return "bg-green-50 text-green-800 ring-green-100"
                    if (status === "pending" || status === "processing")
                      return "bg-amber-50 text-amber-800 ring-amber-100"
                    if (status === "shipped") return "bg-blue-50 text-blue-800 ring-blue-100"
                    return "bg-slate-50 text-slate-800 ring-slate-100"
                  }

                  const getEta = (status: string, createdAt: string) => {
                    if (status === "delivered") return "Delivered"
                    if (status === "pending") return "Processing"
                    const orderDate = new Date(createdAt)
                    const daysAgo = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
                    if (status === "shipped") return `Shipped ${daysAgo}d ago`
                    return `In ${daysAgo}d`
                  }

                  return (
                    <div
                      key={order.id}
                      className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{order.order_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items.length} item{order.items.length !== 1 ? "s" : ""} •{" "}
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ring-1 ${getStatusColor(order.status)}`}
                        >
                          <Truck className="size-3.5" />
                          {order.status}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-800 ring-1 ring-amber-100">
                          <Clock className="size-3.5" />
                          {getEta(order.status, order.created_at)}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{formatNaira(Number(order.total_amount))}</p>
                    </div>
                  )
                })
              ) : (
                <div className="py-4 text-sm text-muted-foreground">No orders yet. Place your first order to get started.</div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-lime-700">Quick reorder</p>
                <h2 className="text-lg font-semibold text-foreground">Your staples</h2>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/products">Browse catalog</Link>
              </Button>
            </div>
            <div className="mt-4 space-y-3">
              {staples.length > 0 ? (
                staples.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-2xl border border-lime-100 bg-lime-50/60 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category?.name ?? "Uncategorized"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-foreground">{formatNaira(Number(product.price))}</p>
                      <Button size="sm" className="gap-2" asChild>
                        <Link href={`/products/${product.id}`}>
                          Reorder
                          <ShoppingBasket className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-muted-foreground">
                  No products yet. Browse the catalog to add items.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
