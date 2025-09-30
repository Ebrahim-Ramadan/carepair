import { DashboardClient } from "@/components/dashboard-client"
import clientPromise from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export default async function Home() {
  const client = await clientPromise
  const db = client.db("car_repair")
  const tickets = await db.collection("tickets").find({}).sort({ createdAt: -1 }).toArray()

  return <DashboardClient initialTickets={tickets} />
}
