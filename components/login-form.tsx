"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { login } from "@/lib/actions/auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ShieldCheck, UserCircle, Store, Lock, Loader2, Sparkles } from "lucide-react"

export function LoginForm({
  className,
  defaultRole = "admin",
  ...props
}: React.ComponentProps<"div"> & { defaultRole?: "admin" | "cashier" }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<"admin" | "cashier">(defaultRole)
  const router = useRouter()

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    formData.append("role", role)
    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      toast.error(result.error)
      setIsLoading(false)
    } else {
      toast.success("Welcome back! Login successful.")
      if (result?.role === "cashier") {
        router.push("/cashier")
      } else {
        router.push("/dashboard")
      }
      router.refresh()
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500",
        className
      )}
      {...props}
    >
      {/* Glassmorphism Card */}
      <Card className="backdrop-blur-xl bg-white/80 dark:bg-card/80 border-white/20 shadow-2xl relative overflow-hidden">
        {/* Subtle gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400" />
        
        <CardHeader className="items-center text-center justify-center pt-8 pb-4">
          {/* Logo Icon */}
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-30 animate-pulse" />
            <div className="relative h-16 w-16 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Store className="h-8 w-8 text-white" />
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold tracking-tight">
            Hipak Vape Shop
          </CardTitle>
          <CardDescription className="flex items-center gap-1.5 justify-center">
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            AI-Integrated Management System
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pb-8">
          <form onSubmit={onSubmit}>
            <FieldGroup className="gap-5">
              {/* Role Selector */}
              <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                    role === "admin"
                      ? "bg-white dark:bg-card shadow-md text-purple-600 ring-1 ring-purple-200 dark:ring-purple-800"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => setRole("cashier")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                    role === "cashier"
                      ? "bg-white dark:bg-card shadow-md text-emerald-600 ring-1 ring-emerald-200 dark:ring-emerald-800"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  )}
                >
                  <UserCircle className="h-4 w-4" />
                  Cashier
                </button>
              </div>

              {/* Username */}
              <Field>
                <FieldLabel htmlFor="username" className="text-sm font-medium flex items-center gap-1.5">
                  <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  Username
                </FieldLabel>
                <Input
                  id="username"
                  name="username"
                  placeholder={role === "cashier" ? "cashier" : "admin"}
                  required
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
                />
              </Field>
              
              {/* Password */}
              <Field>
                <FieldLabel htmlFor="password" className="text-sm font-medium flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  Password
                </FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="h-11 transition-all duration-200 focus:ring-2 focus:ring-purple-500/20"
                />
              </Field>
              
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400 text-center">
                    {error}
                  </p>
                </div>
              )}
              
              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/25 transition-all duration-200 hover:shadow-purple-500/40 hover:-translate-y-0.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Login as {role.charAt(0).toUpperCase() + role.slice(1)}
                  </>
                )}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      
      {/* Footer text */}
      <p className="text-center text-xs text-white/60 dark:text-muted-foreground/60">
        Secure AI-powered inventory & sales management
      </p>
    </div>
  )
}
