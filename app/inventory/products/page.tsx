import { Suspense } from "react"
import { Metadata } from "next"
import clientPromise from "@/lib/mongodb"
import { ProductsClient } from "@/components/products-client"
import { Spinner } from "@/components/ui/spinner"

export const metadata: Metadata = {
  title: "Products | Inventory",
  description: "Manage products - add, edit, delete and paginate",
}

type PageProps = {
  searchParams?: { page?: string }
}

async function fetchProductsPage(page: number, limit: number) {
  const client = await clientPromise
  const db = client.db("car_repair")
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    db
      .collection("products")
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection("products").countDocuments(),
  ])

  return {
    items: JSON.parse(JSON.stringify(items)),
    total,
  }
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const page = Number(searchParams?.page) || 1
  const limit = 10

  const { items, total } = await fetchProductsPage(page, limit)
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="w-full mx-auto p-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        }
      >
        <ProductsClient
          initialProducts={items}
          initialPage={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
        />
      </Suspense>
    </div>
  )
}