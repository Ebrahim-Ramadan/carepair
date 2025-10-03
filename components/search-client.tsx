"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Search, X, User, Phone, Mail, Car, Calendar, ExternalLink, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

type Ticket = {
  _id: string
  plateNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  status: string
  createdAt: string
}

type Pagination = {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNext: boolean
  hasPrevious: boolean
}

type SearchResult = {
  tickets: Ticket[]
  pagination: Pagination
  query: string
}

export function SearchClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const initialPage = parseInt(searchParams.get("page") || "1")
  
  const [query, setQuery] = useState(initialQuery)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (searchQuery?: string, page = 1) => {
    const searchTerm = searchQuery || query
    if (!searchTerm.trim()) {
      toast.error("Please enter a search term")
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm.trim())}&page=${page}&limit=10`)
      
      if (!response.ok) {
        throw new Error("Search failed")
      }

      const data: SearchResult = await response.json()
      setResults(data)
      setCurrentPage(page)

      // Update URL with search query and page
      const url = new URL(window.location.href)
      url.searchParams.set("q", searchTerm.trim())
      url.searchParams.set("page", page.toString())
      window.history.replaceState({}, "", url.toString())

    } catch (error) {
      console.error("Search error:", error)
      toast.error("Failed to search. Please try again.")
      setResults(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    if (query.trim()) {
      handleSearch(query, page)
    }
  }

  const handleClear = () => {
    setQuery("")
    setResults(null)
    setHasSearched(false)
    setCurrentPage(1)
    
    // Clear URL params
    const url = new URL(window.location.href)
    url.searchParams.delete("q")
    url.searchParams.delete("page")
    window.history.replaceState({}, "", url.toString())
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setCurrentPage(1) // Reset to first page on new search
      handleSearch(query, 1)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleEmailClick = (email: string) => {
    window.open(`mailto:${email}`, '_blank')
  }

  const handleWhatsAppClick = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    window.open(`https://wa.me/${cleanPhone}`, '_blank')
  }

  const handlePhoneCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self')
  }

  // Perform initial search if query param exists
  useState(() => {
    if (initialQuery) {
      handleSearch(initialQuery, initialPage)
    }
  })

  return (
    <div className="space-y-4  sm:space-y-6">
      {/* Search Input */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-1 md:left-3 top-1/2 h-3 md:h-4 w-3 md:w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by ticket ID, plate number, customer name, phone, or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-5 md:pl-10 pr-4 md:pr-10  text-[10px] sm:text-base"
            disabled={isLoading}
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Button 
          onClick={() => {
            setCurrentPage(1)
            handleSearch(query, 1)
          }} 
          disabled={isLoading || !query.trim()}
          className="w-full sm:w-auto"
        >
          {isLoading ? <Spinner size="sm" /> : <Search className="h-4 w-4" />}
          <span className="ml-2 sm:inline">Search</span>
        </Button>
      </div>

 {/* Start Typing State - Show when no query and hasn't searched */}
      {!query.trim() && !hasSearched && (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <Search className="mx-auto h-12 w-12 text-[#EC653B]" />
          <h3 className="mt-4 text-lg font-semibold">Start typing to search</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Search by ticket ID, plate number, customer name, phone, or email
          </p>
        </div>
      )}
      {/* Search Results */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="text-center">
            <Spinner size="lg" />
          </div>
        </div>
      )}

      {results && !isLoading && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold sm:text-lg">
              Results for &quot;{results.query}&quot;
            </h2>
            <Badge variant="secondary" className="self-start sm:self-auto">
              {results.pagination.totalCount} result{results.pagination.totalCount !== 1 ? "s" : ""}
            </Badge>
          </div>

          {results.tickets.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center sm:p-12">
              <Search className="mx-auto h-8 w-8 text-muted-foreground sm:h-12 sm:w-12" />
              <h3 className="mt-4 text-base font-semibold sm:text-lg">No results found</h3>
              <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                No tickets found matching &quot;{results.query}&quot;. Try a different search term.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 sm:space-y-4">
                {results.tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-secondary/50 sm:p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Car className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                          <span className="font-semibold truncate">{ticket.plateNumber}</span>
                          <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                            {ticket.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-xs text-muted-foreground sm:text-sm">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{ticket.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{ticket.customerPhone}</span>
                            <div className="flex gap-1 ml-auto">
                              <button
                                onClick={() => handleWhatsAppClick(ticket.customerPhone)}
                                className="p-1 rounded hover:bg-green-100 transition-colors"
                                title="WhatsApp"
                              >
                                <MessageCircle className="h-3 w-3 text-green-600 hover:text-green-800" />
                              </button>
                              <button
                                onClick={() => handlePhoneCall(ticket.customerPhone)}
                                className="p-1 rounded hover:bg-blue-100 transition-colors"
                                title="Call"
                              >
                                <Phone className="h-3 w-3 text-blue-600 hover:text-blue-800" />
                              </button>
                            </div>
                          </div>
                          {ticket.customerEmail && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <button
                                onClick={() => handleEmailClick(ticket.customerEmail!)}
                                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors truncate"
                              >
                                {ticket.customerEmail}
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="font-mono">#{ticket._id?.slice(-6)}</span>
                        </div>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/?ticketId=${ticket._id}`)}
                        className="w-full gap-2 sm:w-auto"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {results.pagination.totalPages > 1 && (
                <div className="space-y-3 border-t border-border pt-4 sm:space-y-0">
                  <div className="text-center text-xs text-muted-foreground sm:text-left sm:text-sm">
                    Showing {((results.pagination.currentPage - 1) * results.pagination.limit) + 1} to{' '}
                    {Math.min(results.pagination.currentPage * results.pagination.limit, results.pagination.totalCount)} of{' '}
                    {results.pagination.totalCount} results
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 sm:justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(results.pagination.currentPage - 1)}
                      disabled={!results.pagination.hasPrevious || isLoading}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {/* Show fewer page numbers on mobile */}
                      {Array.from({ 
                        length: Math.min(window.innerWidth < 640 ? 3 : 5, results.pagination.totalPages) 
                      }, (_, i) => {
                        const startPage = Math.max(1, results.pagination.currentPage - Math.floor((window.innerWidth < 640 ? 3 : 5) / 2))
                        const pageNum = startPage + i
                        
                        if (pageNum > results.pagination.totalPages) return null
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === results.pagination.currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            disabled={isLoading}
                            className="h-8 w-8 p-0 text-xs sm:text-sm"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(results.pagination.currentPage + 1)}
                      disabled={!results.pagination.hasNext || isLoading}
                      className="gap-1"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <span className="sm:hidden">Next</span>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {hasSearched && !results && !isLoading && (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center sm:p-12">
          <X className="mx-auto h-8 w-8 text-destructive sm:h-12 sm:w-12" />
          <h3 className="mt-4 text-base font-semibold sm:text-lg">Search failed</h3>
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
            Something went wrong. Please try again.
          </p>
        </div>
      )}
    </div>
  )
}