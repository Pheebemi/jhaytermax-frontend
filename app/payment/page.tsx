"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { ensureProfileWithRefresh } from "@/lib/auth"
import { initiatePayment } from "@/lib/auth"

export default function PaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const processPayment = async () => {
      try {
        const orderId = searchParams.get("order_id")
        if (!orderId) {
          toast.error("Order ID is required")
          router.push("/cart")
          return
        }

        // Ensure user is authenticated
        const profile = await ensureProfileWithRefresh()

        // Initiate payment
        const paymentData: {
          order_id: number
          customer_email: string
          customer_name: string
          customer_phone?: string
          payment_method?: string
        } = {
          order_id: Number.parseInt(orderId, 10),
          customer_email: profile.email,
          customer_name: profile.username,
        }
        const result = await initiatePayment(paymentData)

        // Redirect to Flutterwave payment page
        window.location.href = result.payment_link
      } catch (err: any) {
        toast.error("Failed to initiate payment", { description: err?.message })
        router.push("/cart")
      } finally {
        setLoading(false)
      }
    }

    processPayment()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-amber-50">
      <div className="text-center">
        <Loader2 className="mx-auto size-8 animate-spin text-lime-600" />
        <p className="mt-4 text-sm font-medium text-foreground">Redirecting to payment...</p>
      </div>
    </div>
  )
}

