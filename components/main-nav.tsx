"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type MainNavProps = {
  isAdmin: boolean
}

export function MainNav({ isAdmin }: MainNavProps) {
  const pathname = usePathname()

  const routes = [
    { href: "/analytics", label: "Analytics" },
    { href: "/", label: "Tickets" },
    { href: "/customers", label: "Customers" },
    { href: "/search", label: "Search" },
    { href: "/appointments", label: "Appointments" },
    ...(isAdmin ? [
      { href: "/users", label: "Management" },
      { href: "/inventory/services", label: "Services" }
    ] : [])
  ]

  return (
    <nav
      className="flex w-full overflow-x-auto gap-1 sm:w-auto sm:overflow-visible scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent text-white"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {routes.map(route => (
        <Button
          key={route.href}
          asChild
          variant="ghost"
          size="default"
          className={`min-w-max ${
            pathname === route.href ? 
            "bg-white/10 text-white" : 
            "text-white/90 hover:text-white hover:bg-white/10"
          }`}
        >
          <Link href={route.href} prefetch={false}>
            {route.label}
          </Link>
        </Button>
      ))}
    </nav>
  )
}