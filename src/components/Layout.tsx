import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Calendar, Users, MapPin, Briefcase, DollarSign, FileText, LogOut, LayoutDashboard, Upload, Building2, UserCircle, Truck, UsersRound, FileStack, Repeat, Receipt, Mail, ScrollText, FileSpreadsheet, CalendarDays, Database, Search, Shield, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Diary", href: "/diary", icon: CalendarDays },
  { name: "Job Explorer", href: "/job-explorer", icon: Search },
  { name: "Bookings", href: "/bookings", icon: Calendar },
  { name: "Booking Series", href: "/booking-series", icon: Repeat },
  { name: "Artists", href: "/artists", icon: Users },
  { name: "Teams", href: "/teams", icon: UsersRound },
  { name: "Clients", href: "/clients", icon: Briefcase },
  { name: "Locations", href: "/locations", icon: MapPin },
  { name: "Venues", href: "/venues", icon: Building2 },
  { name: "Contacts", href: "/contacts", icon: UserCircle },
  { name: "Suppliers", href: "/suppliers", icon: Truck },
  { name: "Departments", href: "/departments", icon: Briefcase },
  { name: "Payments", href: "/payments", icon: DollarSign },
  { name: "Remittance", href: "/remittance", icon: Receipt },
  { name: "Invoices", href: "/invoices", icon: FileSpreadsheet },
  { name: "Emails Queue", href: "/emails-queue", icon: Mail },
  { name: "Terms Library", href: "/terms-library", icon: ScrollText },
  { name: "Invoice Batches", href: "/invoice-batches", icon: FileStack },
  { name: "Import Data", href: "/import", icon: Upload },
  { name: "Data Management", href: "/data-management", icon: Database },
  { name: "User Management", href: "/admin/users", icon: Shield },
  { name: "Profile Settings", href: "/profile-settings", icon: Settings },
];

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { signOut, user } = useAuth();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-border px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">ShowPro</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-border p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Admin</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
