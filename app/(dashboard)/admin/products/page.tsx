"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchProducts,
  getTokens,
  ensureProfileWithRefresh,
  updateProduct,
  type Category,
  type Product,
} from "@/lib/auth"
import { formatNaira } from "@/lib/currency"

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    categoryId: "",
    imageFile: null as File | null,
  })

  useEffect(() => {
    const init = async () => {
      const tokens = getTokens()
      if (!tokens) {
        router.replace("/admin/login")
        return
      }
      try {
        const me = await ensureProfileWithRefresh()
        const isAdmin = me.role === "admin" || me.is_staff || me.is_superuser
        if (!isAdmin) {
          router.replace("/admin/login")
          return
        }
        const [p, c] = await Promise.all([fetchProducts(), fetchCategories()])
        setProducts(p)
        setCategories(c)
      } catch {
        router.replace("/login")
        return
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [router])

  const editingProduct = useMemo(
    () => products.find((p) => p.id === selectedId) || null,
    [products, selectedId],
  )

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        description: editingProduct.description || "",
        price: String(editingProduct.price),
        quantity: String(editingProduct.quantity),
        categoryId: editingProduct.category?.id ? String(editingProduct.category.id) : "",
        imageFile: null,
      })
    } else {
      setForm({
        name: "",
        description: "",
        price: "",
        quantity: "",
        categoryId: "",
        imageFile: null,
      })
    }
  }, [editingProduct])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.quantity) {
      toast.error("Please fill name, price, and quantity.")
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        quantity: Number(form.quantity),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        imageFile: form.imageFile,
      }
      let saved: Product
      if (selectedId) {
        saved = await updateProduct(selectedId, payload)
        setProducts((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
        toast.success("Product updated")
      } else {
        saved = await createProduct(payload)
        setProducts((prev) => [saved, ...prev])
        toast.success("Product created")
      }
      setSelectedId(saved.id)
    } catch (err: any) {
      toast.error("Save failed", { description: err?.message || "Check inputs" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return
    try {
      await deleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      if (selectedId === id) setSelectedId(null)
      toast.success("Product deleted")
    } catch (err: any) {
      toast.error("Delete failed", { description: err?.message || "Unable to delete" })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
          Loading products...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Catalog</p>
          <h1 className="text-2xl font-semibold text-foreground">Manage products</h1>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setSelectedId(null)}
        >
          <Plus className="size-4" />
          New product
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5 md:grid-cols-2"
      >
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label className="text-sm">Description</Label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Price (₦)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label className="text-sm">Quantity</Label>
              <Input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <Label className="text-sm">Category</Label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-sm">Image</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setForm((f) => ({ ...f, imageFile: e.target.files?.[0] || null }))}
            />
            <p className="mt-1 text-xs text-muted-foreground">Leave empty to keep existing image.</p>
          </div>
          <div className="flex gap-3">
            <Button type="submit" className="gap-2" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {selectedId ? "Update" : "Create"}
            </Button>
            {selectedId ? (
              <Button
                type="button"
                variant="destructive"
                className="gap-2"
                onClick={() => handleDelete(selectedId)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Products</h3>
          <div className="max-h-[520px] space-y-2 overflow-auto rounded-2xl border border-slate-100 bg-white p-3 shadow-inner">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-lime-50 ${
                  selectedId === p.id ? "border border-lime-200 bg-lime-50" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.category?.name ?? "Uncategorized"} • Stock {p.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">{formatNaira(Number(p.price))}</p>
              </button>
            ))}
            {products.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-muted-foreground">
                No products yet.
              </div>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  )
}

