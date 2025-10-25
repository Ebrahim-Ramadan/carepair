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
  customerEmail?: string
  mileage?: number
}

export interface UpdateTicketInput {
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  mileage?: number
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
  isCustom?: boolean
} 

export type DiscountType = 'percentage' | 'amount'

export type ServiceWithDiscount = Service & {
  discountType?: DiscountType
  discountValue?: number
  finalPrice?: number
}

export type TicketService = {
  serviceId: string
  serviceName: string
  serviceNameAr: string
  price: number
  category: string
  descriptionEn?: string
  descriptionAr?: string
  estimatedHours?: number
  addedAt: string
  discountType?: DiscountType
  discountValue?: number
  finalPrice?: number
}

export type Ticket = {
  _id?: string
  invoiceNo: string
  plateNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  mileage?: number
  services: TicketService[]
  notes?: string
  totalAmount?: number
  amountPaid?: number // NEW: partial payment
  createdAt: string
  updatedAt?: string
  paymentTime?: string
  paymentMethod?: string
}

export type TicketSummary = {
  _id: string
  customerName: string
  plateNumber: string
  createdAt: string
}

export type Employee = {
  _id?: string
  name: string
  jobTitle: string
  salary: number
  createdAt: string
}
