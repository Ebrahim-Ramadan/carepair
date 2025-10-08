import { Suspense } from "react"
import { HRDepartmentClient } from "@/components/hr-department-client"
import { Spinner } from "@/components/ui/spinner"
import clientPromise from "@/lib/mongodb"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "HR Department | NintyNine",
  description: "Manage HR operations and employee data with NintyNine",
}

interface PageProps {
  searchParams: { page?: string }
}

async function getEmployeeData(page: number, limit: number) {
  const client = await clientPromise
  const db = client.db("car_repair")
  const skip = (page - 1) * limit

  const [employees, totalEmployees] = await Promise.all([
    db.collection("employees")
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection("employees").countDocuments({})
  ])

  return {
    employees: JSON.parse(JSON.stringify(employees)), // Serialize ObjectIds
    totalEmployees,
    totalPages: Math.ceil(totalEmployees / limit)
  }
}

export default async function HRDepartmentPage({ searchParams }: PageProps) {
  const page = Number(searchParams.page) || 1
  const limit = 10

  const { employees, totalEmployees, totalPages } = await getEmployeeData(page, limit)

  return (
    <Suspense fallback={
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    }>
      <HRDepartmentClient 
        initialEmployees={employees}
        page={page}
        totalPages={totalPages}
        total={totalEmployees}
      />
    </Suspense>
  )
}