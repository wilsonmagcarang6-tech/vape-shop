import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Store } from "lucide-react";

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Cashier Header */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Hipak Vape Shop</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Cashier Mode
          </span>
        </div>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm" className="gap-1">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </form>
      </header>
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
