import { Metadata } from "next"
import { ServicesClient } from "@/components/inventory/services-client"
import clientPromise from "@/lib/mongodb"

export const metadata: Metadata = {
  title: "Services Management | CarePair",
  description: "Manage workshop services and pricing",
}

async function getServices() {
  const client = await clientPromise
  const db = client.db("car_repair")
  
  const services = await db.collection("services")
    .find({}, {
      projection: {
        _id: 1,        // Always include _id for unique identification
        nameEn: 1,     // Name (EN)
        nameAr: 1,     // Name (AR)
        category: 1,   // Category
        price: 1       // Price
      }
    })
    .sort({ category: 1, nameEn: 1 })
    .toArray()

  return services
}

export default async function ServicesPage() {
  const services = await getServices()

  return (
        <ServicesClient initialServices={services} />

  )
}