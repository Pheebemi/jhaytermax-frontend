"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowRight, BarChart3, CheckCircle2, Package, ShieldCheck, Truck, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatNaira } from "@/lib/currency"
import {
  fetchProducts,
  fetchCategories,
  getTokens,
  ensureProfileWithRefresh,
  type Product,
  type Category,
} from "@/lib/auth"

export default function AdminDashboardPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
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
          const [p, c] = await Promise.all([fetchProducts(), fetchCategories()])
          setProducts(p)
          setCategories(c)
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

  const productCount = products.length
  const categoryCount = categories.length
  const lowStock = products.filter((p) => p.quantity <= 5).length
  const totalValue = products.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0)

  const topProducts = useMemo(() => products.slice(0, 4), [products])

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
    { label: "Categories", value: categoryCount, change: "Managed in admin" },
    { label: "Inventory value", value: formatNaira(totalValue), change: "Calculated live" },
    { label: "Low stock", value: lowStock, change: "Qty ≤ 5" },
  ]

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
            <Link href="/orders">
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

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Fulfillment</p>
              <h2 className="text-lg font-semibold text-foreground">Performance snapshot</h2>
            </div>
            <Button variant="ghost" size="sm">
              Export
            </Button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              { label: "On-time dispatch", value: "93%", icon: Truck },
              { label: "QA pass rate", value: "97%", icon: CheckCircle2 },
              { label: "Fill rate", value: "96%", icon: Package },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 shadow-inner"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Icon className="size-4 text-lime-700" />
                    {item.label}
                  </div>
                  <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">Past 30 days</p>
                </div>
              )
            })}
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

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Supplier approvals</p>
              <h2 className="text-lg font-semibold text-foreground">Pending reviews</h2>
            </div>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { id: "SUP-208", name: "Green Fields Co-op", region: "Kaduna", status: "Pending QA docs" },
              { id: "SUP-207", name: "Coastal Fresh Farms", region: "Rivers", status: "Awaiting contract" },
              { id: "SUP-206", name: "Savanna Agro", region: "Kano", status: "Verification call" },
            ].map((supplier) => (
              <div
                key={supplier.id}
                className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{supplier.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {supplier.id} • {supplier.region}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-700">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-amber-800 ring-1 ring-amber-100">
                    <ShieldCheck className="size-3.5" />
                    {supplier.status}
                  </span>
                  <Button size="sm" variant="outline">
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">Teams</p>
              <h2 className="text-lg font-semibold text-foreground">Ops & QA</h2>
            </div>
            <Button variant="ghost" size="sm">Manage roles</Button>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { label: "Ops managers", count: 6 },
              { label: "QA inspectors", count: 14 },
              { label: "Support agents", count: 9 },
            ].map((team) => (
              <div
                key={team.label}
                className="flex items-center justify-between rounded-2xl border border-lime-100 bg-lime-50/60 px-4 py-3"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="size-4 text-lime-700" />
                  {team.label}
                </div>
                <span className="text-sm font-semibold text-foreground">{team.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

