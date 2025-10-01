import { Suspense } from "react"
import { SearchClient } from "@/components/search-client"

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