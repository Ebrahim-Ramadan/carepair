# Car Service Dashboard

A production-ready car repair and laundering management system built with Next.js, MongoDB, and TypeScript.

## Features

- **Ticket Management**: Create, view, update, and delete service tickets
- **Customer Information**: Track customer details and vehicle mileage
- **Vehicle Condition Record**: Interactive 5-view car diagram for marking damage points
- **Photo Documentation**: Upload before/after repair photos
- **Real-time Updates**: Changes saved to MongoDB database

## Setup

1. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Set up MongoDB**:
   - Create a MongoDB database (Atlas or local)
   - Copy `.env.local.example` to `.env.local`
   - Add your MongoDB connection string to `.env.local`

3. **Create uploads directory**:
   \`\`\`bash
   mkdir -p public/uploads
   \`\`\`

4. **Run development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

- `MONGODB_URI`: Your MongoDB connection string

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: MongoDB with native driver
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **TypeScript**: Full type safety
- **Architecture**: React Server Components with client component separation

## Project Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── tickets/          # Ticket CRUD endpoints
│   │   └── upload/           # File upload endpoint
│   └── page.tsx              # Main page (RSC)
├── components/
│   ├── dashboard-client.tsx  # Client-side dashboard logic
│   ├── ticket-form.tsx       # Create ticket form
│   ├── ticket-list.tsx       # Ticket sidebar list
│   ├── ticket-view.tsx       # Ticket detail view
│   ├── vehicle-condition-record.tsx  # Interactive car diagram
│   └── photo-upload.tsx      # Photo upload component
├── lib/
│   ├── mongodb.ts            # MongoDB connection
│   ├── types.ts              # TypeScript types
│   └── db/
│       └── tickets.ts        # Database operations
└── public/
    ├── car-diagram.png       # 5-view car diagram
    └── uploads/              # Uploaded photos
