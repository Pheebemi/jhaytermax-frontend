"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Package } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"

import { Button } from "@/components/ui/button"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatNaira } from "@/lib/currency"
import {
  fetchProducts,
  fetchCategories,
  fetchOrders,
  getTokens,
  ensureProfileWithRefresh,
  type Product,
  type Category,
  type Order,
} from "@/lib/auth"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
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
        const isAdmin = me.role === "admin" || me.is_staff || me.is_superuser
        if (!isAdmin) {
          router.replace("/login")
          return
        }
        setAuthChecked(true)
        // Load data after auth check passes
        try {
          const [p, c, o] = await Promise.all([fetchProducts(), fetchCategories(), fetchOrders()])
          setProducts(p)
          setCategories(c)
          setOrders(o)
        } catch (err: any) {
          console.error("Failed to load data:", err)
          // Don't redirect on data fetch errors, just log them
        }
      } catch {
        router.replace("/login")
        return
      }
    }
    init()
  }, [router])

  // Calculate real statistics
  const productCount = products.length
  const categoryCount = categories.length
  const lowStock = products.filter((p) => p.quantity <= 5).length
  const totalValue = products.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0)
  const totalOrders = orders.length
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0)
  const pendingOrders = orders.filter((o) => o.status === "pending").length
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length

  // Prepare chart data - orders over last 30 days
  const ordersChartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date.toISOString().split("T")[0]
    })

    return last30Days.map((date) => {
      const dayOrders = orders.filter((o) => o.created_at.startsWith(date))
      const revenue = dayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)
      return {
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        orders: dayOrders.length,
        revenue: revenue,
      }
    })
  }, [orders])

  // Prepare revenue chart data
  const revenueChartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date.toISOString().split("T")[0]
    })

    return last30Days.map((date) => {
      const dayOrders = orders.filter((o) => o.created_at.startsWith(date))
      const revenue = dayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)
      return {
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: revenue,
      }
    })
  }, [orders])

  const topProducts = useMemo(() => products.slice(0, 4), [products])
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders])

  if (!authChecked) {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
          Loading admin dashboard...
        </div>
      </div>
    )
  }

  const kpis = [
    { label: "Products", value: productCount, change: `${lowStock} low stock` },
    { label: "Categories", value: categoryCount, change: "Active categories" },
    { label: "Total Orders", value: totalOrders, change: `${pendingOrders} pending` },
    { label: "Total Revenue", value: formatNaira(totalRevenue), change: `${deliveredOrders} delivered` },
  ]

  const chartConfig = {
    orders: {
      label: "Orders",
      color: "hsl(var(--chart-1))",
    },
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
        <div>
          <p className="text-sm font-semibold text-slate-700">Admin dashboard</p>
          <h1 className="text-3xl font-semibold text-foreground">Operations overview</h1>
          <p className="text-sm text-muted-foreground">
            Monitor catalog health, fulfillment performance, and financials at a glance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/products">Manage products</Link>
          </Button>
          <Button className="gap-2" asChild>
            <Link href="/admin/orders">
              Manage orders
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm ring-1 ring-black/5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{kpi.label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.change}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Orders</p>
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
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Revenue</p>
              <h2 className="text-lg font-semibold text-foreground">Revenue over time (30 days)</h2>
            </div>
          </div>
          <div className="mt-4">
            <ChartContainer config={chartConfig}>
              <LineChart data={revenueChartData}>
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
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Recent orders</p>
              <h2 className="text-lg font-semibold text-foreground">Latest activity</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/orders">View all</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-2xl border border-lime-100 bg-lime-50/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{order.order_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.buyer_username} • {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatNaira(Number(order.total_amount))}</p>
                    <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-muted-foreground">
                No orders yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Top products</p>
              <h2 className="text-lg font-semibold text-foreground">Recent additions</h2>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/products">Manage</Link>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {topProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-2xl border border-lime-100 bg-lime-50/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.category?.name ?? "Uncategorized"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{formatNaira(Number(product.price))}</p>
                  <p className="text-xs text-muted-foreground">Stock: {product.quantity}</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-muted-foreground">
                No products yet. Add items in admin to see them here.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  )
}
