import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import type { CreateTicketInput } from "@/lib/types"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
    const pageSize = 10
    const skip = (page - 1) * pageSize
    const listOnly = url.searchParams.get('list') === 'true'
    const salesMode = url.searchParams.get('sales') === 'true'
    const period = url.searchParams.get('period') || 'month'
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    const client = await clientPromise
    const db = client.db("car_repair")

    // Build date filter for sales mode
    let dateFilter = {}
    if (salesMode) {
      const now = new Date()
      let start = new Date()

      switch (period) {
        case 'month':
          start.setDate(now.getDate() - 30)
          break
        case 'quarter':
          start.setDate(now.getDate() - 90)
          break
        case 'year':
          start.setFullYear(now.getFullYear() - 1)
          break
          case 'custom':
            if (startDate && endDate) {
              start = new Date(startDate)
              const end = new Date(endDate)
              end.setHours(23, 59, 59, 999)

              // invoiceDate range (Date and ISO-string) and fallback to createdAt when invoiceDate missing
              const invoiceRangeDate = { invoiceDate: { $gte: start, $lte: end } }
              const invoiceRangeString = { invoiceDate: { $gte: start.toISOString(), $lte: end.toISOString() } }
              const createdRangeDate = { createdAt: { $gte: start, $lte: end } }
              const createdRangeString = { createdAt: { $gte: start.toISOString(), $lte: end.toISOString() } }

              dateFilter = {
                $or: [
                  invoiceRangeDate,
                  invoiceRangeString,
                  { $and: [ { $or: [ { invoiceDate: { $exists: false } }, { invoiceDate: null }, { invoiceDate: "" } ] }, { $or: [ createdRangeDate, createdRangeString ] } ] }
                ]
              }
              break
            }
            break
        case 'all':
        default:
          dateFilter = {}
          break
      }

      if (!dateFilter) {
        // For predefined ranges, include tickets whose invoiceDate is above threshold, otherwise use createdAt
        const invoiceGteDate = { invoiceDate: { $gte: start } }
        const invoiceGteString = { invoiceDate: { $gte: start.toISOString() } }
        const createdGteDate = { createdAt: { $gte: start, $lte: now } }
        const createdGteString = { createdAt: { $gte: start.toISOString(), $lte: now.toISOString() } }

        dateFilter = {
          $or: [
            invoiceGteDate,
            invoiceGteString,
            { $and: [ { $or: [ { invoiceDate: { $exists: false } }, { invoiceDate: null }, { invoiceDate: "" } ] }, { $or: [ createdGteDate, createdGteString ] } ] }
          ]
        }
      }
    }

    const projection = listOnly && !salesMode
      ? { _id: 1, invoiceNo: 1, customerName: 1, createdAt: 1, isCheckup: 1 }
      : undefined

    const pipeline: any[] = [
      { $match: dateFilter },
      { $addFields: { _invoiceNum: { $convert: { input: "$invoiceNo", to: "int", onError: -1, onNull: -1 } } } },
      { $sort: { _invoiceNum: -1, createdAt: -1 } },
    ]

    if (!salesMode) {
      pipeline.push({ $skip: skip })
      pipeline.push({ $limit: pageSize })
    }

    if (projection) {
      pipeline.push({ $project: projection })
    }

    const tickets = await db.collection("tickets").aggregate(pipeline).toArray()
    
    let total = 0
    if (!salesMode) {
      total = await db.collection("tickets").countDocuments(dateFilter)
    }

    const plainTickets = listOnly && !salesMode
      ? tickets.map((t: any) => ({
          _id: t._id?.toString(),
          plateNumber: t.plateNumber,
          customerName: t.customerName,
          createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date(0).toISOString(),
          isCheckup: t.isCheckup || false,
        }))
      : tickets.map((t: any) => ({
          _id: t._id?.toString(),
          invoiceNo: t.invoiceNo || '',
          plateNumber: t.plateNumber,
          customerName: t.customerName,
          customerPhone: t.customerPhone || '',
          customerEmail: t.customerEmail || '',
          invoiceDate: t.invoiceDate ? new Date(t.invoiceDate).toISOString() : null,
          createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date(0).toISOString(),
          paymentMethod: t.paymentMethod || '',
          totalAmount: t.totalAmount || 0,
          payments: Array.isArray(t.payments) ? t.payments.map((p: any) => ({
            amount: typeof p.amount === 'number' ? p.amount : 0,
            date: p.date ? new Date(p.date).toISOString() : new Date(0).toISOString(),
            paymentMethod: p.paymentMethod || ''
          })) : [],
          services: Array.isArray(t.services) ? t.services : [],
          notes: t.notes || '',
          isCheckup: t.isCheckup || false
        }))

    // Return format depends on mode
    let response
    if (salesMode) {
      // Sales mode returns array directly
      response = NextResponse.json(plainTickets)
    } else {
      // List/dashboard mode returns paginated object
      const totalPages = Math.max(1, Math.ceil(total / pageSize))
      response = NextResponse.json({
        tickets: plainTickets,
        page,
        totalPages,
        total
      })
    }

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')

    return response
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json(
      { message: "Failed to fetch tickets" },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
        }
      }
    )
  }
}

export async function POST(request: NextRequest) {
  try {

    const session = request.cookies.get("session")?.value
    let role = ""
    if (session) {
      try {
        const parsed = JSON.parse(session)
        role = parsed.role
      } catch {}
    }
    if ( role === "readonly") {
      return NextResponse.json({ error: "Forbidden for this role" }, { status: 403 })
    }

    const body: CreateTicketInput = await request.json()

    // Validate required fields
    if (!body.plateNumber || !body.customerName || !body.customerPhone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("car_repair")

    const ticket = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("tickets").insertOne(ticket)

    return NextResponse.json({ ...ticket, _id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error creating ticket:", error)
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  }
}
