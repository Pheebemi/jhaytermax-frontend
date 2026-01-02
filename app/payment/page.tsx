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

        // Parse and validate order ID
        const parsedOrderId = Number(orderId)
        console.log("Order ID from URL:", orderId, "Type:", typeof orderId, "Parsed:", parsedOrderId)
        
        if (!orderId || orderId === "null" || orderId === "undefined" || isNaN(parsedOrderId)) {
          console.error("Invalid order ID - orderId:", orderId, "parsedOrderId:", parsedOrderId)
          toast.error("Invalid order ID", { description: `Received: ${orderId}. Please try again.` })
          router.push("/checkout")
          return
        }
        
        if (parsedOrderId <= 0) {
          console.error("Order ID is not positive:", parsedOrderId)
          toast.error("Invalid order ID", { description: `Order ID must be positive. Received: ${parsedOrderId}` })
          router.push("/checkout")
          return
        }

        // Ensure user is authenticated
        const profile = await ensureProfileWithRefresh()

        // Initiate payment
        const paymentData = {
          order_id: parsedOrderId,
          customer_email: profile.email,
          customer_name: profile.username,
        }
        
        console.log("Initiating payment with data:", paymentData)
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

