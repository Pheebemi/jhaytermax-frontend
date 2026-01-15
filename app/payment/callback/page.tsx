"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { verifyPayment } from "@/lib/auth"

export default function PaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
  const [message, setMessage] = useState("Processing payment...")
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hasRetriedRef = useRef(false)

  const handleVerify = async (isRetry: boolean = false) => {
    try {
      const txRef = searchParams.get("tx_ref")
      const callbackStatus = searchParams.get("status")

      if (!txRef) {
        setStatus("failed")
        setMessage("Transaction reference not found")
        return
      }

      if (callbackStatus === "cancelled") {
        setStatus("failed")
        setMessage("Payment was cancelled")
        return
      }

      setStatus("loading")
      setMessage(isRetry ? "Verifying payment again..." : "Verifying payment...")

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
      const errorMsg = err?.message || "Failed to verify payment"
      
      // If it's a processing error and we haven't retried yet, retry automatically
      const isProcessingError = errorMsg.toLowerCase().includes("not yet available") || 
          errorMsg.toLowerCase().includes("being processed") ||
          errorMsg.toLowerCase().includes("transaction not found")
      
      if (isProcessingError && !hasRetriedRef.current && !isRetry) {
        // Auto-retry once after 3 seconds
        hasRetriedRef.current = true
        setMessage("Payment is being processed. Checking again in a moment...")
        
        retryTimeoutRef.current = setTimeout(() => {
          handleVerify(true)
        }, 3000)
        return
      }
      
      // If retry also failed or it's a different error, show failure
      setStatus("failed")
      if (isProcessingError) {
        setMessage("Payment is still being processed by Flutterwave. Please wait a moment and try again, or check your orders page. The payment will be updated automatically via webhook.")
      } else {
        setMessage(errorMsg)
      }
      
      toast.error("Payment verification error", { description: errorMsg })
    }
  }

  useEffect(() => {
    // Wait 2 seconds before first verification to give Flutterwave time to process
    setMessage("Processing payment...")
    const initialTimeout = setTimeout(() => {
      handleVerify(false)
    }, 2000)

    // Cleanup
    return () => {
      clearTimeout(initialTimeout)
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white to-amber-50">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white/90 p-8 shadow-lg ring-1 ring-black/5">
        {status === "loading" && (
          <div className="text-center">
            <Loader2 className="mx-auto size-12 animate-spin text-lime-600" />
            <p className="mt-4 text-sm font-medium text-foreground">{message || "Verifying payment..."}</p>
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
            <h2 className="mt-4 text-xl font-semibold text-foreground">Payment Verification</h2>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <div className="mt-6 flex flex-col gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleVerify}
                disabled={status === "loading"}
              >
                <RefreshCw className="size-4" />
                {status === "loading" ? "Verifying..." : "Retry Verification"}
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" asChild className="flex-1">
                  <Link href="/orders">View Orders</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/buyer">Go to Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

