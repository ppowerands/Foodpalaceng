import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Settings, MapPin, Tags, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { logout, user } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/admin");
  };

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
    { href: "/admin/categories", label: "Categories", icon: Tags },
    { href: "/admin/delivery", label: "Delivery Zones", icon: MapPin },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      <aside className="w-full md:w-64 bg-card border-r flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b">
          <span className="font-bold text-lg text-primary">Admin Panel</span>
        </div>
        
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isActive 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">{user?.name}</span>
            <ThemeToggle />
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-destructive hover:text-destructive/80 transition-colors font-medium w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
        <header className="md:hidden h-16 border-b flex items-center justify-between px-4 bg-card">
          <span className="font-bold text-primary">Admin Panel</span>
          {/* Mobile nav could go here */}
        </header>
        
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-muted/20">
          {children}
        </div>
      </main>
    </div>
  );
}
