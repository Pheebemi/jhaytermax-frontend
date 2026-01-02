"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Package,
  ShoppingBasket,
  Truck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatNaira } from "@/lib/currency"
import { fetchProducts, getTokens, meApi, type Product } from "@/lib/auth"

const stats = [
  { label: "Open orders", value: "12", change: "+2 this week" },
  { label: "Avg. fulfillment", value: "52h", change: "-6h vs last week" },
  { label: "Spend (30d)", value: formatNaira(742000), change: "+8.2%" },
  { label: "Fill rate", value: "96%", change: "+1.4%" },
]

const recentOrders = [
  { id: "ORD-1042", item: "Heirloom Tomatoes", status: "In transit", eta: "Tomorrow", amount: 18500 },
  { id: "ORD-1041", item: "Baby Spinach", status: "Delivered", eta: "Delivered", amount: 9200 },
  { id: "ORD-1039", item: "Yellow Maize", status: "Packing", eta: "In 12h", amount: 24000 },
  { id: "ORD-1037", item: "Red Onions", status: "Delivered", eta: "Delivered", amount: 8600 },
]

export default function BuyerDashboardPage() {
  const router = useRouter()
  const [staples, setStaples] = useState<Product[]>([])
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
        const me = await meApi(tokens.access)
        if (me.role !== "buyer") {
          router.replace("/login")
          return
        }
        setUser(me)
        const data = await fetchProducts()
        setStaples(data.slice(0, 3))
      } catch {
        router.replace("/login")
        return
      } finally {
        setAuthChecked(true)
      }
    }
    init()
  }, [router])

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
        <div className="mx-auto max-w-6xl px-6 py-16 text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-lime-700">Buyer dashboard</p>
            <h1 className="text-3xl font-semibold text-foreground">
              Welcome back
              {user
                ? `, ${user.username || user.email?.split("@")?.[0] || "buyer"}`
                : ""}
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
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{order.item}</p>
                    <p className="text-xs text-muted-foreground">{order.id}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                    <span className="inline-flex items-center gap-1 rounded-full bg-lime-50 px-3 py-1 text-lime-800 ring-1 ring-lime-100">
                      <Truck className="size-3.5" />
                      {order.status}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-800 ring-1 ring-amber-100">
                      <Clock className="size-3.5" />
                      {order.eta}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{formatNaira(order.amount)}</p>
                </div>
              ))}
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
              {(staples.length ? staples : []).map((product) => (
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
              ))}
              {staples.length === 0 ? (
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-muted-foreground">
                  No products yet. Add items in admin to see them here.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-lime-700">Operations</p>
              <h2 className="text-lg font-semibold text-foreground">Fulfillment snapshot</h2>
            </div>
            <Button variant="outline" size="sm">
              Export report
            </Button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <BarChart3 className="size-4 text-lime-700" />
                SLA health
              </div>
              <p className="mt-2 text-2xl font-semibold">92%</p>
              <p className="text-xs text-muted-foreground">On-time dispatch past 30d</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Package className="size-4 text-lime-700" />
                Lots graded
              </div>
              <p className="mt-2 text-2xl font-semibold">148</p>
              <p className="text-xs text-muted-foreground">QA checks completed</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckCircle2 className="size-4 text-lime-700" />
                Accept rate
              </div>
              <p className="mt-2 text-2xl font-semibold">98%</p>
              <p className="text-xs text-muted-foreground">Deliveries accepted on first attempt</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

