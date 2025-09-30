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
