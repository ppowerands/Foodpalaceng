import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useGetPublicSettings, useGetCart } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShoppingCart, Menu, Heart, LogIn, User as UserIcon, LogOut, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MainLayout({ children }: { children: ReactNode }) {
  const { isLoggedIn, user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: settings } = useGetPublicSettings();
  const { data: cart } = useGetCart({ query: { enabled: isLoggedIn } });

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-primary">FOOD PALACE</span>
            </Link>
            
            {settings && (
              <Badge variant={settings.isOpen ? "default" : "destructive"} className="hidden sm:inline-flex">
                {settings.isOpen ? "Open Now" : "Closed"}
              </Badge>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
            <Link href="/menu" className="text-sm font-medium hover:text-primary transition-colors">Menu</Link>
            <Link href="/favorites" className="text-sm font-medium hover:text-primary transition-colors">Favorites</Link>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {isLoggedIn ? (
              <>
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cart && cart.itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {cart.itemCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/orders">
                    <Button variant="ghost" size="sm">Orders</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleLogout}>Log out</Button>
                </div>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>

      {settings?.whatsappNumber && (
        <a 
          href={`https://wa.me/${settings.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors z-50"
        >
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.334.101.154.453.725.969 1.18.636.561 1.196.736 1.353.822.159.086.253.072.347-.029.094-.101.405-.471.514-.633.11-.163.22-.136.362-.087.144.051.91.43 1.069.508.159.078.266.116.304.18.038.064.038.369-.106.774z"/>
          </svg>
        </a>
      )}
    </div>
  );
}
