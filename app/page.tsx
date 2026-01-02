"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowRight,
  BarChart3,
  Droplets,
  Leaf,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  Truck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-context"
import { formatNaira } from "@/lib/currency"
import { fetchProducts, type Product } from "@/lib/auth"
import { toast } from "sonner"

const proofPoints = [
  {
    title: "Farmer-first sourcing",
    description: "Work directly with regional growers and co-ops for fresher, fairly priced produce.",
    icon: Leaf,
  },
  {
    title: "Cold-chain & QA",
    description: "Temperature-monitored pickups, sealed crates, and moisture control on every shipment.",
    icon: ShieldCheck,
  },
  {
    title: "Reliable fulfillment",
    description: "48–72 hour delivery windows with live tracking and proactive schedule updates.",
    icon: Truck,
  },
]

const workflow = [
  {
    title: "Browse live inventory",
    description: "View freshness notes, farm origin, and verified grading before you buy.",
    icon: BarChart3,
  },
  {
    title: "Place & reserve",
    description: "Lock in your quantities with instant confirmations and delivery slots.",
    icon: ShoppingBasket,
  },
  {
    title: "Deliver cold & fresh",
    description: "We co-ordinate pickup, cooling, and doorstep delivery that keeps produce crisp.",
    icon: Droplets,
  },
]

export default function Home() {
  const { addItem, state } = useCart()
  const [featured, setFeatured] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const itemCount = state.items.length

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProducts()
        setFeatured(data.slice(0, 4))
      } catch {
        setFeatured([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-lime-50 via-white to-amber-50 text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 top-10 h-56 w-56 rounded-full bg-lime-200/60 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-64 w-64 rounded-full bg-amber-200/70 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.08),_transparent_45%)]" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="flex size-9 items-center justify-center rounded-xl bg-lime-100 text-lime-700 ring-1 ring-lime-200">
            <Sprout className="size-4" />
          </span>
          Jhytermax
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/products" className="hover:text-foreground">
            Products
          </Link>
          <Link href="/buyer" className="hover:text-foreground">
            Dashboard
          </Link>
          <Link href="#" className="hover:text-foreground">
            For farmers
          </Link>
          <Link href="#" className="hover:text-foreground">
            Logistics
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Link href="/cart" className="relative flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-foreground ring-1 ring-slate-100 transition hover:bg-slate-50">
              <ShoppingBasket className="size-4" />
              Cart
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-lime-600 text-xs font-bold text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/products">View catalog</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/products">
              Start ordering
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-20 px-6 pb-24">
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-lime-800 ring-1 ring-lime-200">
              <span className="flex size-6 items-center justify-center rounded-full bg-lime-100 text-lime-700 ring-1 ring-lime-200">
                <Leaf className="size-3.5" />
              </span>
              Fresh produce from verified growers
            </div>
            <div className="space-y-5">
              <h1 className="text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
                Source farm-fresh produce with cold-chain delivery and clear traceability.
          </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Jhytermax connects you directly to regional farms, so you get consistent quality, fair pricing, and reliable fulfillment for every order.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/products">
                  Shop produce
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                Talk to supply team
              </Button>
              <span className="text-sm text-muted-foreground">
                Trusted by wholesalers, grocers, and cloud kitchens.
              </span>
            </div>
            <div className="grid max-w-2xl grid-cols-2 gap-4 rounded-2xl bg-white/80 p-4 ring-1 ring-black/5 backdrop-blur">
              {[
                { label: "Partner farms", value: "120+" },
                { label: "Avg. freshness", value: "<48h" },
                { label: "Delivery regions", value: "22" },
                { label: "Avg. savings", value: "15%" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-lime-100 bg-lime-50/60 px-4 py-3 text-sm text-lime-900"
                >
                  <p className="text-xs uppercase tracking-wide text-lime-700/90">
                    {item.label}
                  </p>
                  <p className="text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 top-6 h-24 w-24 rounded-full bg-lime-200/50 blur-2xl" />
            <div className="absolute -right-4 -top-8 h-28 w-28 rounded-full bg-amber-200/60 blur-2xl" />
            <div className="relative rounded-3xl bg-white/80 p-6 shadow-xl ring-1 ring-black/5 backdrop-blur">
              <div className="flex items-center justify-between rounded-2xl border border-lime-100 bg-lime-50/60 px-4 py-3 text-lime-900">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-white text-lime-700 ring-1 ring-lime-100">
                    <Sprout className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-lime-700/80">Supply route</p>
                    <p className="text-base font-semibold">Field → Packhouse → You</p>
                  </div>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-lime-700 ring-1 ring-lime-100">
                  Chilled
                </span>
              </div>
              <div className="mt-6 space-y-3">
              {(loading ? [] : featured.slice(0, 3)).map((item) => (
                  <div
                  key={item.id}
                    className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.metric}</p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                      {item.note}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                    <p>{item.description}</p>
                    <span className="font-semibold text-foreground">{formatNaira(Number(item.price))}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-900 px-5 py-4 text-slate-50 shadow-lg">
                <div>
                  <p className="text-sm font-semibold">Quality & moisture checks</p>
                  <p className="text-xs text-slate-200/80">
                    Each lot is graded, sealed, and logged before dispatch.
          </p>
        </div>
                <ShieldCheck className="size-8 text-emerald-200" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-lime-700">Why partners choose us</p>
              <h2 className="text-2xl font-semibold">Consistent supply, transparent sourcing.</h2>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/products">
                View full catalog
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {proofPoints.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-lime-100 bg-white/80 p-6 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-lime-50 text-lime-700 ring-1 ring-lime-100 transition group-hover:scale-105">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-lime-700">Featured this week</p>
              <h2 className="text-2xl font-semibold">Ready-to-ship produce lots</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/products">See all products</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/products">
                  View catalog
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {(loading ? [] : featured).map((item, idx) => (
              <div
                key={item.id}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white/90 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md"
              >
                <Link
                  href={`/products/${item.id}`}
                  className="relative block aspect-[4/3] w-full overflow-hidden bg-lime-50"
          >
            <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 350px"
                    className="object-cover transition duration-300 hover:scale-105"
                    priority={idx === 0}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent" />
                  {item.category ? (
                    <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-white/60">
                      {item.category.name}
                    </span>
                  ) : null}
                </Link>
                <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/products/${item.id}`}
                        className="text-sm font-semibold text-foreground hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.category?.name ?? "Uncategorized"}</p>
                    </div>
                    <span className="rounded-full bg-lime-50 px-3 py-1 text-xs font-medium text-lime-800 ring-1 ring-lime-100">
                      Fresh
                    </span>
                  </div>
                  <p className="mt-3 flex-1 text-sm text-muted-foreground">{item.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-lg font-semibold text-foreground">
                      {formatNaira(Number(item.price))}
                    </p>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        addItem({
                          id: item.id,
                          name: item.name,
                          price: Number(item.price),
                          metric: item.category?.name ?? "Uncategorized",
                          image: item.image,
                          note: item.category?.name,
                        })
                        toast.success("Added to cart", {
                          description: `${item.name} added to your cart`,
                        })
                      }}
                    >
                      <ShoppingBasket className="size-4" />
                      Add to cart
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-slate-900 px-8 py-10 text-slate-50 shadow-xl">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold text-emerald-200">How it works</p>
              <h2 className="text-3xl font-semibold leading-tight">From farm to cart in three simple steps.</h2>
              <p className="text-base text-slate-200/80">
                We orchestrate sourcing, grading, cold-chain logistics, and delivery so you can focus on running your business.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/products">Start ordering</Link>
              </Button>
              <Button variant="outline" className="border-slate-700 text-slate-50 hover:bg-slate-800">
                Download brochure
              </Button>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {workflow.map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-800 bg-slate-800/60 p-5 shadow-inner"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-200 ring-1 ring-emerald-200/30">
                      <Icon className="size-4" />
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">
                      Step {index + 1}
                    </p>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-200/80">{item.description}</p>
                </div>
              )
            })}
        </div>
        </section>
      </main>
    </div>
  )
}
