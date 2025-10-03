export interface DamagePoint {
  id: string
  x: number
  y: number
  number: number
  description: string
}

export interface Photo {
  url: string
  name: string
}



export interface CreateTicketInput {
  plateNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string
  mileage: number
  repairParts: string[]
}

export interface UpdateTicketInput {
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  mileage?: number
  repairParts?: string[]
  vehicleConditionPoints?: DamagePoint[]
  beforePhotos?: Photo[]
  afterPhotos?: Photo[]
}

// Appointments
export interface AppointmentCustomer {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface AppointmentVehicle {
  make: string
  model: string
  year: string
  licensePlate: string
}

export interface AppointmentService {
  type: string
  date: Date
  time: string
  notes: string
}

export interface Appointment {
  _id?: string
  customer: AppointmentCustomer
  vehicle: AppointmentVehicle
  service: AppointmentService
  status: "pending" | "confirmed" | "completed" | "cancelled"
  createdAt: Date
  updatedAt: Date
}

// Services
export type Service = {
  id: string
  nameEn: string
  nameAr: string
  descriptionEn: string
  descriptionAr: string
  price: number | string
  category: string
  estimatedHours: number
}

export type TicketService = {
  serviceId: string
  serviceName: string
  serviceNameAr: string
  price: number | string
  category: string
  addedAt: string
}

export type Ticket = {
  _id?: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  plateNumber: string
  make?: string
  model?: string
  year?: string
  color?: string
  mileage: number  // Add this line
  repairParts: string[]  // Add this line
  services?: TicketService[]
  notes?: string
  status?: "pending" | "in-progress" | "completed" | "canceled"
  totalAmount?: number
  createdAt: string
  updatedAt?: string
}

export type TicketSummary = {
  _id: string
  customerName: string
  plateNumber: string
  createdAt: string
}
