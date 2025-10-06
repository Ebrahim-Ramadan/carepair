import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import nodemailer from "nodemailer"

// Create transporter for nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_ACC,
    pass: process.env.apppassword,
  },
})

// Define the status type
type AppointmentStatus = "pending" | "confirmed" | "completed" | "canceled"

const getStatusEmailTemplate = (status: AppointmentStatus, customerName: string, vehicleInfo: string, serviceType: string, serviceDate?: string, serviceTime?: string) => {
  const statusMessages: Record<AppointmentStatus, string> = {
    pending: "Your appointment is now pending review.",
    confirmed: "Great news! Your appointment has been confirmed.",
    completed: "Your service has been completed successfully.",
    canceled: "Unfortunately, your appointment has been canceled."
  }

  const statusColors: Record<AppointmentStatus, string> = {
    pending: "#f59e0b",
    confirmed: "#10b981", 
    completed: "#6366f1",
    canceled: "#ef4444"
  }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <div style="margin-bottom: 20px;">
          <img src="https://carepair-kw.vercel.app/logo.jpg" alt="CarePair Logo" style="height: 60px; width: auto; max-width: 200px;" />
        </div>
        <h1 style="margin: 0; font-size: 28px;">CarePair Auto Service</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Appointment Status Update</p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: ${statusColors[status]}; color: white; padding: 15px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
          <h2 style="margin: 0; font-size: 20px; text-transform: uppercase;">${status}</h2>
        </div>
        
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
          Hello ${customerName},
        </p>
        
        <p style="font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 25px;">
        ${statusMessages[status]}
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">Appointment Details</h3>
          <div style="display: grid; gap: 10px;">
            <div><strong>Vehicle:</strong> ${vehicleInfo}</div>
            <div><strong>Service:</strong> ${serviceType}</div>
            ${serviceDate ? `<div><strong>Date:</strong> ${new Date(serviceDate).toLocaleDateString()}</div>` : ''}
            ${serviceTime ? `<div><strong>Time:</strong> ${serviceTime}</div>` : ''}
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #666; margin-bottom: 15px;">
            If you have any questions, please don't hesitate to contact us.
          </p>
          <p style="color: #333; font-weight: bold;">
            Thank you for choosing CarePair Auto Service!
          </p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">
        <div style="text-align: center;">
          <img src="https://carepair-kw.vercel.app/logo.jpg" alt="CarePair Logo" style="height: 30px; width: auto; opacity: 0.6; margin-bottom: 10px;" />
          <p style="color: #999; font-size: 12px; margin: 0;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </div>
  `
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { 
      status, 
      sendEmail, 
      customerEmail, 
      customerName, 
      vehicleInfo, 
      serviceType,
      serviceDate,
      serviceTime 
    } = body

    const client = await clientPromise
    const db = client.db("car_repair")
    
    // Update appointment status
    const result = await db.collection("appointments").updateOne(
      { _id: new ObjectId(params.id) },
      { 
        $set: { 
          status,
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      )
    }

    // Send email if requested
    // if (sendEmail && customerEmail) {
    //   try {
    //     await transporter.sendMail({
    //       from: `"CarePair Auto Service" <${process.env.GMAIL_ACC}>`,
    //       to: customerEmail,
    //       subject: `CarePair - Appointment Status Update: ${status.toUpperCase()}`,
    //       html: getStatusEmailTemplate(
    //         status as AppointmentStatus, 
    //         customerName, 
    //         vehicleInfo, 
    //         serviceType,
    //         serviceDate,
    //         serviceTime
    //       )
    //     })
    //     console.log(`Email sent successfully to ${customerEmail}`)
    //   } catch (emailError) {
    //     console.error("Failed to send email:", emailError)
    //     // Don't fail the request if email fails
    //   }
    // }

    return NextResponse.json({ 
      success: true,
      message: "Appointment updated successfully"
    })
  } catch (error) {
    console.error("Error updating appointment:", error)
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    )
  }
}