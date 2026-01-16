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
  const data = await res.json()
  if (!Array.isArray(data)) {
    console.error("Expected array from products API, got:", data)
    return []
  }
  return data
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

export async function fetchCategories(useAuth = false): Promise<Category[]> {
  const url = `${API_BASE}/api/products/categories/`
  const res = useAuth
    ? await fetchWithAuth(url, { cache: "no-store" })
    : await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    const errorText = await res.text()
    console.error("Failed to fetch categories:", res.status, errorText)
    throw new Error("Failed to load categories")
  }
  const data = await res.json()
  if (!Array.isArray(data)) {
    console.error("Expected array from categories API, got:", data)
    return []
  }
  return data
}

export async function createCategory(data: { name: string }): Promise<Category> {
  const tokens = getTokens()
  if (!tokens?.access) throw new Error("Not authenticated")
  const res = await fetchWithAuth(`${API_BASE}/api/products/categories/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || "Failed to create category")
  }
  return res.json()
}

export async function updateCategory(id: number, data: { name: string }): Promise<Category> {
  const tokens = getTokens()
  if (!tokens?.access) throw new Error("Not authenticated")
  const res = await fetchWithAuth(`${API_BASE}/api/products/categories/${id}/`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || "Failed to update category")
  }
  return res.json()
}

export async function deleteCategory(id: number): Promise<void> {
  const tokens = getTokens()
  if (!tokens?.access) throw new Error("Not authenticated")
  const res = await fetchWithAuth(`${API_BASE}/api/products/categories/${id}/`, {
    method: "DELETE",
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || "Failed to delete category")
  }
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

// Orders
export type OrderItem = {
  id: number
  product: number
  product_name: string
  product_image: string
  quantity: number
  price: string
  subtotal: string
}

export type Order = {
  id: number
  order_id: string
  buyer: number
  buyer_username: string
  buyer_email: string
  status: string
  total_amount: string
  shipping_address: string
  delivery_location: number | null
  delivery_location_name: string | null
  delivery_location_state: string | null
  delivery_fee: string
  notes: string
  items: OrderItem[]
  created_at: string
  updated_at: string
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetchWithAuth(`${API_BASE}/api/orders/orders/`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load orders")
  const data = await res.json()
  if (!Array.isArray(data)) {
    console.error("Expected array from orders API, got:", data)
    return []
  }
  return data
}export async function fetchOrder(id: number): Promise<Order> {
  const res = await fetchWithAuth(`${API_BASE}/api/orders/orders/${id}/`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load order")
  return res.json()
}

export async function createOrder(data: {
  items: Array<{ product_id: number; quantity: number }>
  location_id?: number | null
  detailed_address?: string
  notes?: string
}): Promise<Order> {
  const res = await fetchWithAuth(`${API_BASE}/api/orders/orders/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Failed to create order" }))
    throw new Error(errorData.detail || JSON.stringify(errorData))
  }
  return res.json()
}export async function updateOrderStatus(orderId: number, status: string): Promise<Order> {
  const res = await fetchWithAuth(`${API_BASE}/api/orders/orders/${orderId}/update_status/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(msg || "Failed to update order status")
  }
  return res.json()
}

// States and Locations
export type State = {
  id: number
  name: string
  code: string
  is_active: boolean
}

export type Location = {
  id: number
  state: State
  state_id: number
  name: string
  delivery_fee: string
  is_active: boolean
}

export async function fetchStates(): Promise<State[]> {
  const res = await fetch(`${API_BASE}/api/orders/states/`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load states")
  const data = await res.json()
  if (!Array.isArray(data)) {
    console.error("Expected array from states API, got:", data)
    return []
  }
  return data
}

export async function fetchLocations(stateId?: number): Promise<Location[]> {
  const url = stateId
    ? `${API_BASE}/api/orders/locations/?state_id=${stateId}`
    : `${API_BASE}/api/orders/locations/`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load locations")
  const data = await res.json()
  if (!Array.isArray(data)) {
    console.error("Expected array from locations API, got:", data)
    return []
  }
  return data
}

// Payments
export type Payment = {
  id: number
  order: number
  order_id: string
  user: number
  user_username: string
  amount: string
  currency: string
  status: string
  payment_method: string | null
  tx_ref: string | null
  flw_ref: string | null
  transaction_id: string | null
  customer_email: string
  customer_name: string
  customer_phone: string
  metadata: Record<string, unknown>
  failure_reason: string | null
  created_at: string
  updated_at: string
  paid_at: string | null
}

export async function initiatePayment(data: {
  order_id: number
  customer_email: string
  customer_name: string
  customer_phone?: string
  payment_method?: string
}): Promise<{ payment_id: number; payment_link: string; tx_ref: string }> {
  const res = await fetchWithAuth(`${API_BASE}/api/payments/payments/initiate/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Failed to initiate payment" }))
    throw new Error(errorData.error || errorData.detail || JSON.stringify(errorData))
  }
  return res.json()
}

export async function verifyPayment(txRef: string): Promise<Payment> {
  const res = await fetchWithAuth(`${API_BASE}/api/payments/payments/verify/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tx_ref: txRef }),
  })
  
  // Handle 202 Accepted - transaction is still being processed
  if (res.status === 202) {
    const data = await res.json().catch(() => ({ error: "Transaction is being processed" }))
    throw new Error(data.error || data.message || "Transaction not yet available. Please wait a moment and try again.")
  }
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Failed to verify payment" }))
    throw new Error(errorData.error || errorData.detail || JSON.stringify(errorData))
  }
  return res.json()
}

export async function fetchPayments(): Promise<Payment[]> {
  const res = await fetchWithAuth(`${API_BASE}/api/payments/payments/`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load payments")
  return res.json()
}
