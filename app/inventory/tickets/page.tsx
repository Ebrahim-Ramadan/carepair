import { DashboardClient } from "@/components/dashboard-client"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export default async function Home({ searchParams }: { searchParams?: { page?: string } }) {
  try {
    const client = await clientPromise
    const db = client.db("car_repair")

    const pageSize = 10
    const page = Math.max(1, Number(searchParams?.page ?? 1) || 1)
    const skip = (page - 1) * pageSize

    const [tickets, total] = await Promise.all([
      db
        .collection("tickets")
        .find({}, { projection: { _id: 1, plateNumber: 1, customerName: 1, createdAt: 1, isCheckup: 1 } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .toArray(),
      db.collection("tickets").countDocuments({}),
    ])

    const plainTickets = tickets.map((t: any) => ({
      _id: t._id?.toString(),
      plateNumber: t.plateNumber,
      customerName: t.customerName,
      createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date(0).toISOString(),
      isCheckup: t.isCheckup || false,
    }))

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return <DashboardClient initialTickets={plainTickets} page={page} totalPages={totalPages} total={total} />
  } catch (error) {
    console.error("Database connection error:", error)
    // You might want to create an error component to show a better error message
    throw new Error("Failed to load tickets. Please try again later.")
  }
}