const formatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 0,
})

export function formatNaira(amount: number) {
  return formatter.format(amount)
}

