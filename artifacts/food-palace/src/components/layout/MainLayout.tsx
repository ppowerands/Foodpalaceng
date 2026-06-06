import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetPublicSettings,
  useGetCart,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ShoppingCart,
  Heart,
  Home,
  UtensilsCrossed,
  Package,
  User,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isLoggedIn, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const { data: settings } = useGetPublicSettings();

  const { data: cart } = useGetCart({
    query: {
      queryKey: getGetCartQueryKey(),
      enabled: isLoggedIn,
    },
  });

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const cartCount = cart?.itemCount || 0;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/menu", label: "Menu" },
    { href: "/favorites", label: "Favorites" },
    ...(isLoggedIn
      ? [{ href: "/orders", label: "Orders" }]
      : []),
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Top navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-blue-900 shadow-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-white" />
                </div>

                <span className="font-bold text-xl tracking-tight text-white">
                  FOOD PALACE
                </span>
              </div>
            </Link>

            {settings && (
              <Badge
                variant={
                  settings.isOpen
                    ? "default"
                    : "destructive"
                }
                className={`hidden sm:inline-flex text-xs ${
                  settings.isOpen
                    ? "bg-green-500 hover:bg-green-500 text-white"
                    : ""
                }`}
              >
                {settings.isOpen ? "Open Now" : "Closed"}
              </Badge>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    location === item.href
                      ? "bg-white/20 text-white"
                      : "text-blue-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </div>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            {isLoggedIn ? (
              <>
                <Link href="/cart">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-white hover:bg-white/10 hover:text-white"
                  >
                    <ShoppingCart className="h-5 w-5" />

                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-white text-blue-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex text-blue-100 hover:bg-white/10 hover:text-white"
                  onClick={handleLogout}
                >
                  Log out
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button
                  size="sm"
                  className="bg-white text-blue-900 hover:bg-blue-50 font-semibold"
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* Footer */}
      <footer className="hidden md:block bg-blue-900 text-blue-100 py-10 mt-auto">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>

              <span className="font-bold text-xl text-white">
                FOOD PALACE
              </span>
            </div>

            <p className="text-sm text-blue-200 leading-relaxed">
              Authentic Nigerian cuisine in the heart of Kaduna.
              Made fresh, delivered fast.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">
              Contact Us
            </h4>

            <ul className="space-y-2 text-sm text-blue-200">
              <li>
                📍 Along 44 Junction, Old Ronchess Site,
                Kaduna
              </li>

              <li>
                📞{" "}
                <a
                  href="tel:08125089052"
                  className="hover:text-white transition-colors"
                >
                  08125089052
                </a>
              </li>

              <li>
                💬{" "}
                <a
                  href="https://wa.me/2348125079052"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  WhatsApp: 08125079052
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">
              Opening Hours
            </h4>

            {settings ? (
              <div className="text-sm text-blue-200 space-y-1">
                <p>
                  {settings.openingTime} –{" "}
                  {settings.closingTime} daily
                </p>

                {settings.estimatedDeliveryMin &&
                  settings.estimatedDeliveryMax && (
                    <p className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />

                      {settings.estimatedDeliveryMin}–
                      {settings.estimatedDeliveryMax} min
                      delivery
                    </p>
                  )}

                <div className="mt-2">
                  <Badge
                    className={
                      settings.isOpen
                        ? "bg-green-500 hover:bg-green-500"
                        : "bg-red-600 hover:bg-red-600"
                    }
                  >
                    {settings.isOpen
                      ? "Open Now"
                      : "Currently Closed"}
                  </Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-blue-200">
                Mon–Sun, 9:00am – 10:00pm
              </p>
            )}
          </div>
        </div>

        <div className="container mx-auto px-6 mt-8 pt-6 border-t border-blue-800 text-center text-xs text-blue-300">
          ©️ {new Date().getFullYear()} Food Palace
          Restaurant, Kaduna. All rights reserved.
        </div>
      </footer>

      {/* WhatsApp floating button */}
      {settings?.whatsappNumber && (
        <a
          href={`https://wa.me/${settings.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-8 right-6 w-14 h-14 bg-green-500 text-white rounded-full hidden md:flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors z-50"
          title="Chat on WhatsApp"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-8 h-8 fill-current"
          >
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771z" />
          </svg>
        </a>
      )}

      {/* Mobile nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-blue-900 border-t border-blue-800">
        <div className="grid grid-cols-5 h-16">
          <MobileNavItem
            href="/"
            icon={Home}
            label="Home"
            active={location === "/"}
          />

          <MobileNavItem
            href="/menu"
            icon={UtensilsCrossed}
            label="Menu"
            active={location === "/menu"}
          />

          <MobileNavItem
            href="/cart"
            icon={ShoppingCart}
            label="Cart"
            active={location === "/cart"}
            badge={cartCount}
          />

          <MobileNavItem
            href="/orders"
            icon={Package}
            label="Orders"
            active={location === "/orders"}
          />

          <MobileNavItem
            href={isLoggedIn ? "#" : "/login"}
            icon={User}
            label={isLoggedIn ? "Account" : "Login"}
            active={false}
            onTap={
              isLoggedIn
                ? handleLogout
                : undefined
            }
          />
        </div>
      </nav>
    </div>
  );
}

function MobileNavItem({
  href,
  icon: Icon,
  label,
  active,
  badge,
  onTap,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  badge?: number;
  onTap?: () => void;
}) {
  return (
    <Link href={href}>
      <div
        onClick={onTap}
        className={`flex flex-col items-center justify-center h-full gap-0.5 relative cursor-pointer transition-colors ${
          active
            ? "text-white"
            : "text-blue-300 hover:text-blue-100"
        }`}
      >
        <div className="relative">
          <Icon className="w-5 h-5" />

          {badge != null && badge > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-blue-900 text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </div>

        <span className="text-[10px] font-medium leading-none">
          {label}
        </span>

        {active && (
          <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white rounded-full" />
        )}
      </div>
    </Link>
  );
}
