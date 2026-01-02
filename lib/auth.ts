"use client"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000"

export type Tokens = { access: string; refresh: string }
export type Category = { id: number; name: string; slug: string }
export type Product = {
  id: number
  name: string
  description: string
  price: number
  quantity: number
  image: string
  category: Category | null
}

export async function apiPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let detail = "Request failed"
    try {
      const data = await res.json()
      detail = data.detail || JSON.stringify(data)
    } catch (e) {
      /* ignore */
    }
    throw new Error(detail)
  }
  return res.json()
}

export async function loginApi(identifier: string, password: string) {
  // backend expects "username"; we accept username or email from the caller
  return apiPost<Tokens>("/api/auth/login/", { username: identifier, password })
}

export async function registerApi({
  username,
  email,
  password,
  role,
}: {
  username: string
  email: string
  password: string
  role: "buyer" | "admin"
}) {
  return apiPost("/api/auth/register/", { username, email, password, role })
}

export type UserProfile = {
  id: number
  username: string
  email: string
  role: "buyer" | "admin"
  is_staff?: boolean
  is_superuser?: boolean
}

export async function meApi(access: string) {
  const res = await fetch(`${API_BASE}/api/auth/me/`, {
    headers: { Authorization: `Bearer ${access}` },
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error("Failed to load profile")
  }
  return res.json() as Promise<UserProfile>
}

export function storeTokens(tokens: Tokens) {
  if (typeof window === "undefined") return
  localStorage.setItem("access", tokens.access)
  localStorage.setItem("refresh", tokens.refresh)
}

export function getTokens(): Tokens | null {
  if (typeof window === "undefined") return null
  const access = localStorage.getItem("access")
  const refresh = localStorage.getItem("refresh")
  if (!access || !refresh) return null
  return { access, refresh }
}

export function clearTokens() {
  if (typeof window === "undefined") return
  localStorage.removeItem("access")
  localStorage.removeItem("refresh")
}

export function logoutAndRedirect(router: { replace: (path: string) => void }, path: string = "/login") {
  clearTokens()
  router.replace(path)
}

export async function refreshTokens(refresh: string) {
  return apiPost<Tokens>("/api/auth/refresh/", { refresh })
}

// Helper that tries the request, and on 401 attempts refresh once.
export async function fetchWithAuth(input: string, init: RequestInit = {}) {
  const tokens = getTokens()
  const headers = new Headers(init.headers)
  if (tokens?.access) headers.set("Authorization", `Bearer ${tokens.access}`)

  const doFetch = async (access?: string) => {
    const h = new Headers(init.headers)
    if (access) h.set("Authorization", `Bearer ${access}`)
    return fetch(input, { ...init, headers: h })
  }

  let res = await doFetch(tokens?.access)
  if (res.status === 401 && tokens?.refresh) {
    try {
      const refreshed = await refreshTokens(tokens.refresh)
      storeTokens(refreshed)
      res = await doFetch(refreshed.access)
    } catch {
      clearTokens()
    }
  }
  return res
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/api/products/`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load products")
  return res.json()
}

export async function fetchProduct(id: string | number): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/products/${id}/`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load product")
  return res.json()
}

export async function ensureProfileWithRefresh(): Promise<UserProfile> {
  const tokens = getTokens()
  if (!tokens) throw new Error("Not authenticated")
  try {
    return await meApi(tokens.access)
  } catch (err) {
    if (!tokens.refresh) throw err
    const refreshed = await refreshTokens(tokens.refresh)
    storeTokens(refreshed)
    return meApi(refreshed.access)
  }
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/api/products/categories/`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load categories")
  return res.json()
}

export async function createProduct(data: {
  name: string
  description?: string
  price: number
  quantity: number
  categoryId?: number | null
  imageFile?: File | null
}) {
  const tokens = getTokens()
  if (!tokens?.access) throw new Error("Not authenticated")
  const form = new FormData()
  form.append("name", data.name)
  form.append("price", String(data.price))
  form.append("quantity", String(data.quantity))
  if (data.description) form.append("description", data.description)
  if (data.categoryId) form.append("category_id", String(data.categoryId))
  if (data.imageFile) form.append("image", data.imageFile)

  const res = await fetch(`${API_BASE}/api/products/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.access}`,
    },
    body: form,
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || "Failed to create product")
  }
  return res.json() as Promise<Product>
}

export async function updateProduct(
  id: number,
  data: {
    name?: string
    description?: string
    price?: number
    quantity?: number
    categoryId?: number | null
    imageFile?: File | null
  },
) {
  const tokens = getTokens()
  if (!tokens?.access) throw new Error("Not authenticated")
  const form = new FormData()
  if (data.name !== undefined) form.append("name", data.name)
  if (data.price !== undefined) form.append("price", String(data.price))
  if (data.quantity !== undefined) form.append("quantity", String(data.quantity))
  if (data.description !== undefined) form.append("description", data.description)
  if (data.categoryId !== undefined)
    form.append("category_id", data.categoryId === null ? "" : String(data.categoryId))
  if (data.imageFile) form.append("image", data.imageFile)

  const res = await fetch(`${API_BASE}/api/products/${id}/`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${tokens.access}`,
    },
    body: form,
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || "Failed to update product")
  }
  return res.json() as Promise<Product>
}

export async function deleteProduct(id: number) {
  const tokens = getTokens()
  if (!tokens?.access) throw new Error("Not authenticated")
  const res = await fetch(`${API_BASE}/api/products/${id}/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tokens.access}` },
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || "Failed to delete product")
  }
  return true
}

