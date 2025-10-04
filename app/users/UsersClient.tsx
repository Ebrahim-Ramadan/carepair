"use client"
import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddUserForm } from "./AddUserForm"
import { Button } from "@/components/ui/button"

const roleLabels: Record<string, string> = {
  manager: "Manager",
  viewer: "Viewer",
  readonly: "Read Only",
}

const roleOptions = ["manager", "viewer", "readonly"]

type User = { _id: string, email: string, role: string }

export function UsersClient({ currentUser }: { currentUser: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function fetchUsers() {
    const res = await fetch("/api/users/list?currentUser=" + encodeURIComponent(currentUser))
    if (res.ok) {
      setUsers(await res.json())
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line
  }, [currentUser])

  async function handleChangeRole(userId: string, newRole: string) {
    setLoadingId(userId)
    const res = await fetch("/api/users/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, newRole, currentUser }),
    })
    setLoadingId(null)
    if (res.ok) {
      fetchUsers()
    }
  }

  return (
    <div>
      <AddUserForm currentUser={currentUser} onUserAdded={fetchUsers} />
      <div className="w-full max-w-4xl mt-8">
        <div className="mb-2">
          <p className="font-semibold text-lg">Manage Users &amp; Roles</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => (
              <TableRow key={u._id}>
                <TableCell>{u.email}</TableCell>
                <TableCell className="text-muted-foreground">{roleLabels[u.role] || u.role}</TableCell>
                <TableCell>
                  {roleOptions
                    .filter(r => r !== u.role)
                    .map(r => (
                      <Button
                        key={r}
                        size="sm"
                        variant="outline"
                        className="mr-2"
                        disabled={loadingId === u._id}
                        onClick={() => handleChangeRole(u._id, r)}
                      >
                        Make {roleLabels[r]}
                      </Button>
                    ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}