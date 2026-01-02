"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { verifyPayment } from "@/lib/auth"

export default function PaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const verify = async () => {
      try {
        const txRef = searchParams.get("tx_ref")
        const status = searchParams.get("status")

        if (!txRef) {
          setStatus("failed")
          setMessage("Transaction reference not found")
          return
        }

        if (status === "cancelled") {
          setStatus("failed")
          setMessage("Payment was cancelled")
          return
        }

        // Verify payment
        const payment = await verifyPayment(txRef)

        if (payment.status === "successful") {
          setStatus("success")
          setMessage("Payment successful!")
          toast.success("Payment verified successfully")
          // Redirect to buyer dashboard after a short delay
          setTimeout(() => {
            router.push("/buyer")
          }, 2000)
        } else {
          setStatus("failed")
          setMessage(payment.failure_reason || "Payment verification failed")
          toast.error("Payment verification failed", { description: payment.failure_reason })
        }
      } catch (err: any) {
        setStatus("failed")
        setMessage(err?.message || "Failed to verify payment")
        toast.error("Payment verification error", { description: err?.message })
      }
    }

    verify()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-amber-50">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white/90 p-8 shadow-lg ring-1 ring-black/5">
        {status === "loading" && (
          <div className="text-center">
            <Loader2 className="mx-auto size-12 animate-spin text-lime-600" />
            <p className="mt-4 text-sm font-medium text-foreground">Verifying payment...</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-12 text-green-600" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">Payment Successful!</h2>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <p className="mt-4 text-xs text-muted-foreground">Redirecting to dashboard...</p>
            <Button asChild className="mt-6">
              <Link href="/buyer">Go to Dashboard</Link>
            </Button>
          </div>
        )}

        {status === "failed" && (
          <div className="text-center">
            <XCircle className="mx-auto size-12 text-red-600" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">Payment Failed</h2>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/cart">Back to Cart</Link>
              </Button>
              <Button asChild>
                <Link href="/buyer">Go to Dashboard</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

