"use client"

import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, CheckCircle2, ShoppingBasket, Truck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useCart } from "@/components/cart-context"
import { formatNaira } from "@/lib/currency"
import { fetchProduct, type Product } from "@/lib/auth"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProduct(params.id as string)
        setProduct(data)
      } catch (err: any) {
        setError(err?.message || "Failed to load product")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center text-muted-foreground">
          Loading product...
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
        <div className="mx-auto max-w-5xl px-6 py-16 space-y-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
            {error || "Product not found"}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
      <div className="mx-auto max-w-5xl px-6 py-12 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="text-sm text-muted-foreground">
            {product.category?.name ?? "Uncategorized"}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-[1.05fr_0.95fr]">
          <div className="relative h-80 w-full overflow-hidden rounded-3xl bg-lime-50 md:h-full">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-black/5 to-transparent" />
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm ring-1 ring-black/5">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-lime-700">
                {product.category?.name ?? "Uncategorized"}
              </p>
              <h1 className="text-3xl font-semibold text-foreground">{product.name}</h1>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-lime-800">
              <span className="inline-flex items-center gap-1 rounded-full bg-lime-50 px-3 py-1 ring-1 ring-lime-100">
                <CheckCircle2 className="size-3.5" />
                QA passed
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-800 ring-1 ring-blue-100">
                <Truck className="size-3.5" />
                Dispatch-ready
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800 ring-1 ring-amber-100">
                Stock: {product.quantity}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-semibold text-foreground">{formatNaira(Number(product.price))}</p>
                <p className="text-xs text-muted-foreground">Excluding freight & duties</p>
              </div>
              <Button
                className="gap-2"
                onClick={() => {
                  addItem({
                    id: product.id,
                    name: product.name,
                    price: Number(product.price),
                    metric: product.category?.name ?? "Uncategorized",
                    image: product.image,
                    note: product.category?.name,
                  })
                  toast.success("Added to cart", { description: `${product.name} added to your cart` })
                }}
              >
                <ShoppingBasket className="size-4" />
                Add to cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



