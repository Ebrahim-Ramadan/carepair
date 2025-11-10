import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise
    const db = client.db("car_repair")
    
    const body = await request.json()
    const { year, month, workingDays, absenceDays } = body

    // Fetch the employee to get their base salary
    const employee = await db.collection("employees").findOne({
      _id: new ObjectId(params.id)
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Calculate final salary
    const dailyRate = Number(employee.salary) / 30
    const finalSalary = dailyRate * (Number(workingDays) - Number(absenceDays))

    // Check if record already exists for this month/year
    const existingRecord = employee.monthlyRecords?.find(
      (r: any) => r.year === year && r.month === month
    )

    if (existingRecord) {
      // Update existing record
      const result = await db.collection("employees").updateOne(
        { _id: new ObjectId(params.id), "monthlyRecords.year": year, "monthlyRecords.month": month },
        { 
          $set: { 
            "monthlyRecords.$.workingDays": Number(workingDays),
            "monthlyRecords.$.absenceDays": Number(absenceDays),
            "monthlyRecords.$.finalSalary": finalSalary,
            updatedAt: new Date().toISOString()
          } 
        }
      )
    } else {
      // Add new record
      const result = await db.collection("employees").updateOne(
        { _id: new ObjectId(params.id) },
        { 
          $push: { 
            monthlyRecords: {
              year: Number(year),
              month: Number(month),
              workingDays: Number(workingDays),
              absenceDays: Number(absenceDays),
              finalSalary
            } as any
          },
          $set: {
            updatedAt: new Date().toISOString()
          }
        }
      )
    }

    // Fetch and return updated employee
    const updatedEmployee = await db.collection("employees").findOne({
      _id: new ObjectId(params.id)
    })

    return NextResponse.json(updatedEmployee)
  } catch (error) {
    console.error('Error adding monthly record:', error)
    return NextResponse.json(
      { error: 'Failed to add monthly record' },
      { status: 500 }
    )
  }
}
