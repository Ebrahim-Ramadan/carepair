import { cookies } from "next/headers"
import { UsersClient } from "./UsersClient"
import { AccountMenu } from "./AccountMenu"

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