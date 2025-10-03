import { Suspense } from "react"
import { SearchClient } from "@/components/search-client"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Search | CarePair",
  description: "Search and manage tickets with ease using CarePair",
}
export default function SearchPage() {
  return (
    <div className="min-h-screen mx-auto px-4">
             <h1 className="text-xl md:text-2xl font-semibold py-2">Search Tickets</h1>

      
      <Suspense fallback={null}>
        <SearchClient />
      </Suspense>
    </div>
  )
}