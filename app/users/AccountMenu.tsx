"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"

export function AccountMenu({ email }: { email: string }) {
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    await fetch("/api/logout", { method: "POST" })
    setLoading(false)
    window.location.href = "/login"
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center text-base gap-2 text-white">
          <User size={20} />
          <span className="font-medium">{email =="admin@carepair.com"?"Admin Fahd":email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleLogout} disabled={loading} className="text-red-500">
          <LogOut size={16} className="mr-2 text-red-500 " />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}