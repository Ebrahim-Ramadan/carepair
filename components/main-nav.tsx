"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { ChevronDown, Search } from "lucide-react"

type MainNavProps = {
  isAdmin: boolean
}

export function MainNav({ isAdmin }: MainNavProps) {
  const pathname = usePathname()

  const routes = [
    { href: "/inventory/services", label: "Services" },
    { href: "/inventory/tickets", label: "Tickets" },
    { href: "/customers", label: "Customers" },
    { href: "/appointments", label: "Appointments" },
    ...(isAdmin ? [
      { href: "/users", label: "Management" },
      {
        label: "Financial",
        children: [
          { href: "/inventory/expenses", label: "Expenses" },
          { href: "/", label: "Sales" },
          { href: "/inventory/products", label: "Products" }
        ]
      },
      { href: "/HRDepartment", label: "HR" },
    { href: "/search", label: <Search/> },

    ] : [])
  ]

  return (
    <nav
      className="flex w-full overflow-x-auto gap-1 lg:justify-center scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent text-white"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {routes.map(route => {
        if ('children' in route) {
          // Highlight parent if any child matches
          const isActive = route.children.some(child => pathname.startsWith(child.href));
          return (
            <DropdownMenu.Root key={route.label}>
              <DropdownMenu.Trigger asChild>
                <Button
                  variant="ghost"
                  size="default"
                  className={`min-w-max ${isActive ? "bg-white/10 text-white" : "text-white/90 hover:text-white hover:bg-white/10"}`}
                >
                  {route.label}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="start"
                  className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 shadow-md"
                >
                  {route.children.map(child => (
                    <DropdownMenu.Item
                      key={child.href}
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Link 
                        href={child.href}
                        className="w-full"
                        prefetch={false}
                      >
                        {child.label}
                      </Link>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )
        }

        return (
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
        )
      })}
    </nav>
  )
}