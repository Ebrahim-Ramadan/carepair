"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff } from "lucide-react"

const roleDescriptions = {
  manager: "Can do everything except add users",
  viewer: "Can view, edit and add tickets",
  readonly: "Can only view data, cannot add or edit tickets",
}
const roleLabels = {
  manager: "Manager",
  viewer: "Viewer",
  readonly: "Read Only",
}

export function AddUserForm({ currentUser, onUserAdded }: { currentUser: string, onUserAdded?: () => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState("manager")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role, currentUser }),
    })
    setLoading(false)
    if (res.ok) {
      setEmail("")
      setPassword("")
      setRole("manager")
      if (onUserAdded) onUserAdded()
    } else {
      const data = await res.json()
      setError(data.error || "Failed to add user")
    }
  }

  return (
   <div className="flex flex-col gap-4">
     <form onSubmit={handleSubmit} className="flex flex-col gap-2 md:flex-row md:items-end w-full">
      <div className="flex-1">
        <Label htmlFor="email" className="sr-only">Email</Label>
        <Input name="email" id="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="flex-1 relative">
        <Label htmlFor="password" className="sr-only">Password</Label>
        <Input
          name="password"
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full pr-10"
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          onClick={() => setShowPassword(v => !v)}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <div className="flex-1">
        <Label htmlFor="role" className="sr-only">Role</Label>
        <Select name="role" value={role} onValueChange={setRole}>
          <SelectTrigger id="role" className="w-full">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
            <SelectItem value="readonly">Read Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full md:w-auto" disabled={loading}>
        {loading ? "Adding..." : "Add User"}
      </Button>
     
    </form>
     <div className="w-full mt-2 md:mt-0 md:ml-4 text-xs text-muted-foreground bg-yellow-100 border border-yellow-300 rounded px-2 py-1">
        <b>Note:</b> You <b>will not be able to view or copy the password later</b>. Please copy it before submitting.<br />
        <b>Role access:</b> {roleLabels[role]}: {roleDescriptions[role]}
        {error && <div className="text-red-500">{error}</div>}
      </div>
    </div>
  )
}