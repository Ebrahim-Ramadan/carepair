import { DashboardClient } from "@/components/dashboard-client"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export default async function Home({ searchParams }: { searchParams?: { page?: string } }) {
  const client = await clientPromise
  const db = client.db("car_repair")

  const pageSize = 10
  const page = Math.max(1, Number(searchParams?.page ?? 1) || 1)
  const skip = (page - 1) * pageSize

  const [tickets, total] = await Promise.all([
    db
      .collection("tickets")
      .find({}, { projection: { _id: 1, plateNumber: 1, customerName: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .toArray(),
    db.collection("tickets").countDocuments({}),
  ])
console.log('total', total);

  const plainTickets = tickets.map((t: any) => ({
    _id: t._id?.toString(),
    plateNumber: t.plateNumber,
    customerName: t.customerName,
    createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date(0).toISOString(),
  }))

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return <DashboardClient initialTickets={plainTickets} page={page} totalPages={totalPages} total={total} />
}
