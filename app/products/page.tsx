"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { BadgeCheck, CheckCircle2, Leaf, Search, ShoppingBasket, Truck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-context"
import { formatNaira } from "@/lib/currency"
import { fetchProducts, type Product } from "@/lib/auth"

const categories = ["All", "Leafy greens", "Vegetables", "Fruits", "Grains"]

export default function ProductsPage() {
  const { addItem } = useCart()
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProducts()
        setItems(data)
      } catch (err: any) {
        setError(err?.message || "Failed to load products")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-12">
        <div className="flex flex-col gap-4 pb-10 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full bg-lime-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-lime-700 ring-1 ring-lime-100">
              <Leaf className="size-3.5" />
              Live inventory
            </p>
            <h1 className="text-3xl font-semibold text-foreground md:text-4xl">Shop fresh produce</h1>
            <p className="max-w-2xl text-base text-muted-foreground">
              Browse verified lots, reserve stock, and add items to your cart. Prices shown include quality checks and chilled pickup.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/buyer">Dashboard</Link>
            </Button>
            <Button variant="outline" className="gap-2">
              <Search className="size-4" />
              Quick search
            </Button>
            <Button asChild>
              <Link href="/cart">View cart</Link>
            </Button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {categories.map((category) => (
            <button
              key={category}
              className="rounded-full border border-lime-100 bg-white px-4 py-2 text-sm font-medium text-lime-800 transition hover:-translate-y-0.5 hover:shadow-sm"
            >
              {category}
            </button>
          ))}
        </div>

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          {(loading ? [] : items).map((product) => (
            <div
              key={product.id}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white/90 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <Link href={`/products/${product.id}`} className="relative block aspect-[4/3] w-full overflow-hidden bg-lime-50">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover transition duration-300 hover:scale-105"
                  priority={product.name === "Baby Spinach"}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent" />
                {product.category ? (
                  <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-white/60">
                    {product.category.name}
                  </span>
                ) : null}
              </Link>

              <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Link href={`/products/${product.id}`} className="text-sm font-semibold text-foreground hover:underline">
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {product.category?.name ?? "Uncategorized"}
                    </p>
                  </div>
                  <span className="rounded-full bg-lime-50 px-3 py-1 text-xs font-medium text-lime-800 ring-1 ring-lime-100">
                    {product.category?.name ?? "Uncategorized"}
                  </span>
                </div>
                  <p className="mt-3 flex-1 text-sm text-muted-foreground">{product.description}</p>
                  <p className="text-xs text-muted-foreground">In stock: {product.quantity}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-lime-800">
                  <span className="inline-flex items-center gap-1 rounded-full bg-lime-50 px-3 py-1 ring-1 ring-lime-100">
                    <CheckCircle2 className="size-3.5" />
                    QA passed
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-800 ring-1 ring-blue-100">
                    <Truck className="size-3.5" />
                    {product.freshness}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-foreground">{formatNaira(product.price)}</p>
                    <p className="text-xs text-muted-foreground">Excluding freight & duties</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/products/${product.id}`}>Details</Link>
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                      {
                        addItem({
                          id: product.id,
                          name: product.name,
                          price: Number(product.price),
                          metric: product.category?.name ?? "Uncategorized",
                          image: product.image,
                          note: product.category?.name,
                        })
                        toast.success("Added to cart", {
                          description: `${product.name} added to your cart`,
                        })
                      }
                      }
                    >
                      <ShoppingBasket className="size-4" />
                      Add to cart
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {loading ? (
            <div className="col-span-full rounded-2xl border border-slate-100 bg-white/90 p-6 text-center text-muted-foreground">
              Loading products...
            </div>
          ) : null}
          {!loading && items.length === 0 && !error ? (
            <div className="col-span-full rounded-2xl border border-slate-100 bg-white/90 p-6 text-center text-muted-foreground">
              No products available yet.
            </div>
          ) : null}
        </div>

        <div className="mt-10 rounded-2xl border border-lime-100 bg-lime-50/70 p-5 text-lime-900 ring-1 ring-lime-200">
          <div className="flex flex-wrap items-center gap-3">
            <BadgeCheck className="size-5 text-lime-700" />
            <p className="font-semibold">Need a standing order?</p>
            <p className="text-sm text-lime-800/90">
              Tell us your weekly volumes and we will lock recurring slots with price protection.
            </p>
            <Button variant="outline" size="sm" className="ml-auto border-lime-300 text-lime-800 hover:bg-lime-100">
              Talk to supply team
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}