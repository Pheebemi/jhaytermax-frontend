"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowLeft, Loader2, Lock, Mail } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { loginApi, meApi, storeTokens } from "@/lib/auth"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    const identifier = (formData.get("identifier") as string) || ""
    const password = (formData.get("password") as string) || ""

    try {
      const tokens = await loginApi(identifier, password)
      storeTokens(tokens)
      const profile = await meApi(tokens.access)
      const isAdmin = profile.role === "admin" || profile.is_staff || profile.is_superuser
      toast.success("Signed in", { description: `Welcome back, ${profile.username}` })
      router.push(isAdmin ? "/admin" : "/buyer")
    } catch (err: any) {
      toast.error("Login failed", { description: err?.message || "Please check credentials" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-lime-50 via-white to-amber-50">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
        <div className="hidden flex-1 rounded-3xl bg-white/80 p-10 shadow-lg ring-1 ring-black/5 lg:block">
          <p className="text-sm font-semibold text-lime-700">Jhytermax Buyers</p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground">Reliable sourcing, simple access.</h1>
          <p className="mt-3 text-base text-muted-foreground">
            Sign in to manage your orders, reserve lots, and track cold-chain delivery in real time.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-lime-100 bg-lime-50/60 p-4">
              <p className="font-semibold text-lime-800">Verified suppliers</p>
              <p className="mt-2">Farm and packhouse vetted with QA reports.</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
              <p className="font-semibold text-amber-800">Fast fulfillment</p>
              <p className="mt-2">48–72h windows with proactive updates.</p>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="mx-auto w-full max-w-md rounded-3xl bg-white/90 p-8 shadow-lg ring-1 ring-black/5">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
              Back home
            </Link>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-lime-700">Sign in</p>
              <h2 className="text-2xl font-semibold text-foreground">Welcome back, buyer</h2>
              <p className="text-sm text-muted-foreground">
                Access your cart, saved lots, and invoices.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block space-y-2 text-sm font-medium text-foreground">
                Email or Username
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-lime-300 focus-within:ring-2 focus-within:ring-lime-200">
                  <Mail className="size-4 text-muted-foreground" />
                  <input
                    required
                    name="identifier"
                    placeholder="email or username"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="block space-y-2 text-sm font-medium text-foreground">
                Password
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-lime-300 focus-within:ring-2 focus-within:ring-lime-200">
                  <Lock className="size-4 text-muted-foreground" />
                  <input
                    required
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-muted-foreground">
                  <input type="checkbox" name="remember" className="rounded border-slate-300 text-lime-600" />
                  Remember me
                </label>
                <Link href="#" className="text-lime-700 hover:text-lime-800">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <div className="space-y-2">
                <p>
                  New to Jhytermax?{" "}
                  <Link href="/signup" className="font-semibold text-lime-700 hover:text-lime-800">
                    Create a buyer account
                  </Link>
                </p>
                <p>
                  Buyer dashboard:{" "}
                  <Link href="/buyer" className="font-semibold text-lime-700 hover:text-lime-800">
                    Go to dashboard
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

