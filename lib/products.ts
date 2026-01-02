export type Product = {
  id: string
  name: string
  category: string
  price: number
  unit: string
  freshness: string
  badge: string
  description: string
  image: string
  metric?: string
  note?: string
}

export const products: Product[] = [
  {
    id: "baby-spinach",
    name: "Baby Spinach",
    category: "Leafy greens",
    price: 9200,
    unit: "Case • 4 x 1kg",
    freshness: "<24h harvest",
    badge: "Hydroponic",
    description: "Tender leaves, triple-washed and sealed in breathable liners.",
    image:
      "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1200&q=80",
    metric: "per case (4 x 1kg)",
    note: "Hydroponic",
  },
  {
    id: "heirloom-tomatoes",
    name: "Heirloom Tomatoes",
    category: "Vegetables",
    price: 18500,
    unit: "Crate • 15kg",
    freshness: "<36h harvest",
    badge: "Premium",
    description: "Mixed varieties with uniform sizing for retail displays.",
    image:
      "https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=1200&q=80",
    metric: "per crate (15kg)",
    note: "48hr delivery",
  },
  {
    id: "yellow-maize",
    name: "Yellow Maize",
    category: "Grains",
    price: 12000,
    unit: "Bag • 25kg",
    freshness: "Lab tested",
    badge: "Bulk",
    description: "Moisture-controlled kernels direct from cooperative silos.",
    image:
      "https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&w=1200&q=80",
    metric: "per 25kg bag",
    note: "Bulk",
  },
  {
    id: "hass-avocado",
    name: "Hass Avocados",
    category: "Fruits",
    price: 24000,
    unit: "Tray • 20ct",
    freshness: "Firm-ripe",
    badge: "Traceable",
    description: "Graded for size consistency with full lot traceability.",
    image:
      "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=80",
    metric: "per tray (20ct)",
    note: "Premium",
  },
  {
    id: "roma-lettuce",
    name: "Roma Lettuce",
    category: "Leafy greens",
    price: 10400,
    unit: "Case • 12 heads",
    freshness: "<30h harvest",
    badge: "Field cooled",
    description: "Crisp hearts, vacuum cooled and packed with ice sleeves.",
    image:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
    metric: "per case (12 heads)",
    note: "Field cooled",
  },
  {
    id: "red-onions",
    name: "Red Onions",
    category: "Vegetables",
    price: 8600,
    unit: "Sack • 20kg",
    freshness: "Graded",
    badge: "Long shelf",
    description: "Uniform sizing, cured for longer shelf-life and low shrink.",
    image:
      "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=1200&q=80",
    metric: "per sack (20kg)",
    note: "Long shelf",
  },
]

export const featuredProducts = products.slice(0, 4)

