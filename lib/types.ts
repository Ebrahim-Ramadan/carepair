export interface DamagePoint {
  id: string
  x: number
  y: number
  number: number
  description: string
}

export interface Photo {
  id: string
  url: string
  name: string
  public_id?: string // Cloudinary public_id for potential deletion/management
}

export interface Ticket {
  _id?: string
  plateNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string
  mileage: number
  repairParts: string[]
  vehicleConditionPoints: DamagePoint[]
  beforePhotos: Photo[]
  afterPhotos: Photo[]
  createdAt: Date
  updatedAt: Date
}

export interface TicketSummary {
  _id: string
  plateNumber: string
  customerName: string
  createdAt: string
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
