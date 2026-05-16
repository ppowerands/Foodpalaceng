import { ReactNode, useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetAnalytics } from "@workspace/api-client-react";
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Settings, MapPin, Tags, LogOut, Menu, X, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useQueryClient } from "@tanstack/react-query";
import { getGetAnalyticsQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { logout, user } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const prevPendingRef = useRef<number | null>(null);

  const { data: analytics } = useGetAnalytics({
    query: { refetchInterval: 30000 }
  });

  const pendingOrders = analytics?.pendingOrders || 0;

  useEffect(() => {
    if (prevPendingRef.current !== null && pendingOrders > prevPendingRef.current) {
      const newCount = pendingOrders - prevPendingRef.current;
      toast({
        title: `🔔 ${newCount} New Order${newCount > 1 ? "s" : ""}!`,
        description: "New order(s) have arrived and need attention.",
      });
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Food Palace — New Order!", {
          body: `You have ${pendingOrders} pending order${pendingOrders > 1 ? "s" : ""}.`,
        });
      }
    }
    prevPendingRef.current = pendingOrders;
  }, [pendingOrders]);

  useEffect(() => {
    if (pendingOrders > 0) {
      document.title = `(${pendingOrders}) Admin — Food Palace`;
    } else {
      document.title = "Admin — Food Palace";
    }
    return () => { document.title = "Food Palace Restaurant"; };
  }, [pendingOrders]);

  const handleLogout = () => {
    logout();
    setLocation("/admin");
  };

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, badge: 0 },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: pendingOrders },
    { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed, badge: 0 },
    { href: "/admin/categories", label: "Categories", icon: Tags, badge: 0 },
    { href: "/admin/delivery", label: "Delivery Zones", icon: MapPin, badge: 0 },
    { href: "/admin/settings", label: "Settings", icon: Settings, badge: 0 },
  ];

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-blue-800 bg-blue-900">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-blue-200" />
          <span className="font-bold text-lg text-white">Admin Panel</span>
        </div>
        {pendingOrders > 0 && (
          <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
            {pendingOrders}
          </span>
        )}
        <button
          className="ml-auto md:hidden text-blue-200 hover:text-white"
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-4 bg-blue-900">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-white/15 text-white font-medium"
                      : "text-blue-200 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-blue-800 bg-blue-900">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-blue-100 truncate max-w-[140px]">{user?.name}</span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-red-300 hover:text-red-200 transition-colors font-medium w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Desktop sidebar */}
      <aside className="w-64 flex-col bg-blue-900 hidden md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col bg-blue-900 shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
        <header className="h-16 border-b flex items-center justify-between px-4 bg-blue-900 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-blue-200 hover:text-white transition-colors"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-bold text-white">
              {navItems.find(n => n.href === location)?.label || "Admin Panel"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {pendingOrders > 0 && (
              <Link href="/admin/orders">
                <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-400/30 text-red-200 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:bg-red-500/30 transition-colors">
                  <Bell className="w-3.5 h-3.5 animate-bounce" />
                  {pendingOrders} pending
                </div>
              </Link>
            )}
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-muted/20">
          {children}
        </div>
      </main>
    </div>
  );
}
