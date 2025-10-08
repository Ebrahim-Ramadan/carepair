import { cookies } from "next/headers"
import { UsersClient } from "./UsersClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "User Management | NintyNine",
  description: "Search and manage users with ease using NintyNine",
}
const ADMIN_EMAIL = process.env.ADMIN_EMAIL

export default function UsersPage() {
  const cookieStore = cookies()
  const session = cookieStore.get("session")?.value
  let currentUser = ""
  if (session) {
    try {
      const parsed = JSON.parse(session)
      currentUser = parsed.email
    } catch {}
  }

  // Only allow admin (from .env) to view this page
  if (currentUser !== ADMIN_EMAIL) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold text-red-500">
          Unauthorized: Only admin can access this page.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-2">
      {/* <header className="w-full flex justify-end items-center mb-8">
        {currentUser && <AccountMenu email={currentUser} />}
      </header> */}
      <div className="w-full max-w-4xl mb-8">
        <div className="mb-4">
          <p className="font-semibold text-lg">Add New User</p>
        </div>
        <UsersClient currentUser={currentUser} />
      </div>
    </div>
  )
}