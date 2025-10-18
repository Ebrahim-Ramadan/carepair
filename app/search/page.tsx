import { Suspense } from "react"
import { SearchClient } from "@/components/search-client"
import { Metadata } from "next"
import LoadingDots from "@/components/ui/loading-spinner"

export const metadata: Metadata = {
  title: "Search | NintyNine",
  description: "Search and manage tickets with ease using NintyNine",
}
export default function SearchPage() {
  return (
    <div className="min-h-screen mx-auto px-4">
             <h1 className="text-xl md:text-2xl font-semibold py-2">Search Tickets</h1>

      
      <Suspense fallback={<div className="flex items-center justify-center h-48"><LoadingDots /></div>}>
        <SearchClient />
      </Suspense>
    </div>
  )
}