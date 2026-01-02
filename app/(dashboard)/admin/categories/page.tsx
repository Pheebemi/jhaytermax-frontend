"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  getTokens,
  ensureProfileWithRefresh,
  updateCategory,
  type Category,
} from "@/lib/auth"

export default function AdminCategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: "",
  })

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
          const c = await fetchCategories(true) // Use authenticated fetch
          setCategories(c)
        } catch (err: any) {
          console.error("Failed to load categories:", err)
          toast.error("Failed to load categories", { description: err?.message })
        }
      } catch {
        router.replace("/login")
        return
      }
    }
    init()
  }, [router])

  const editingCategory = useMemo(
    () => categories.find((c) => c.id === selectedId) || null,
    [categories, selectedId],
  )

  useEffect(() => {
    if (editingCategory) {
      setForm({
        name: editingCategory.name,
      })
    } else {
      setForm({
        name: "",
      })
    }
  }, [editingCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error("Please enter a category name.")
      return
    }
    setSaving(true)
    try {
      let saved: Category
      if (selectedId) {
        saved = await updateCategory(selectedId, { name: form.name.trim() })
        setCategories((prev) => prev.map((c) => (c.id === saved.id ? saved : c)))
        toast.success("Category updated")
      } else {
        saved = await createCategory({ name: form.name.trim() })
        setCategories((prev) => [saved, ...prev])
        toast.success("Category created")
      }
      setSelectedId(saved.id)
    } catch (err: any) {
      toast.error("Save failed", { description: err?.message || "Check inputs" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category? Products using this category will become uncategorized.")) return
    try {
      await deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
      if (selectedId === id) setSelectedId(null)
      toast.success("Category deleted")
    } catch (err: any) {
      toast.error("Delete failed", { description: err?.message || "Unable to delete" })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5">
          Loading categories...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Catalog</p>
          <h1 className="text-2xl font-semibold text-foreground">Manage categories</h1>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setSelectedId(null)}
        >
          <Plus className="size-4" />
          New category
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl border border-slate-100 bg-white/90 p-5 shadow-sm ring-1 ring-black/5 md:grid-cols-2"
      >
        <div className="space-y-3">
          <div>
            <Label className="text-sm">Category Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g., Vegetables, Fruits, Grains"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The slug will be auto-generated from the category name.
          </p>
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
          <h3 className="text-sm font-semibold text-foreground">Categories</h3>
          <div className="max-h-[520px] space-y-2 overflow-auto rounded-2xl border border-slate-100 bg-white p-3 shadow-inner">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-lime-50 ${
                  selectedId === c.id ? "border border-lime-200 bg-lime-50" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">Slug: {c.slug}</p>
                </div>
              </button>
            ))}
            {categories.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-muted-foreground">
                No categories yet.
              </div>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  )
}

