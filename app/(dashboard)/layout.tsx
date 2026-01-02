"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import {
  BarChart3,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Tags,
  User,
  Users,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { logoutAndRedirect } from "@/lib/auth"

const buyerNav = [
  { href: "/buyer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: ShoppingBag },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/orders", label: "Orders", icon: Package },
]

const adminNav = [
  { href: "/admin", label: "Admin home", icon: LayoutDashboard },
  { href: "/admin/suppliers", label: "Suppliers", icon: ShieldCheck },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/products", label: "Products", icon: ShoppingBag },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/teams", label: "Teams", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isAdmin = pathname?.startsWith("/admin")
  const navItems = isAdmin ? adminNav : buyerNav
  const portalLabel = isAdmin ? "Admin Portal" : "Buyer Portal"
  const [open, setOpen] = useState(false)

  const MobileNav = () => (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-lime-100 bg-white/90 px-4 py-3 shadow-sm ring-1 ring-black/5 lg:hidden">
      <div className="text-sm">
        <p className="font-semibold text-foreground">{portalLabel}</p>
        <p className="text-muted-foreground">Navigation</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
          <Menu className="size-4" />
          Menu
        </Button>
      </div>
    </div>
  )

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-2xl border border-lime-100 bg-lime-50/70 px-3 py-2 text-sm font-semibold text-lime-800">
          <User className="size-4" />
          {portalLabel}
        </div>
        <button
          className="lg:hidden rounded-xl p-2 text-muted-foreground hover:bg-slate-50"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X className="size-4" />
        </button>
      </div>
      <nav className="mt-4 space-y-1 text-sm font-medium text-slate-700">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-lime-50 hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <Icon className="size-4 text-lime-700" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-6 border-t border-slate-100 pt-4 space-y-2 text-sm text-muted-foreground">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-slate-50"
          onClick={() => setOpen(false)}
        >
          <Home className="size-4" />
          Back to home
        </Link>
        <button
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-50"
          onClick={() => {
            logoutAndRedirect(router, "/login")
          }}
        >
          <LogOut className="size-4 text-destructive" />
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 pb-10 pt-6 md:px-6">
        {/* Desktop sidebar */}
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm ring-1 ring-black/5 lg:block">
          <SidebarContent />
        </aside>

        {/* Mobile slide-over */}
        {open ? (
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
            <div
              className="absolute left-0 top-0 h-full w-72 max-w-[80%] rounded-r-3xl border border-slate-100 bg-white p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent />
            </div>
          </div>
        ) : null}

        <div className="flex-1 space-y-4">
          <MobileNav />
          {children}
        </div>
      </div>
    </div>
  )
}

