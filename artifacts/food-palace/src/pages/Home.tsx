import { useGetFeaturedProducts, useListCategories, useGetPublicSettings, useAddToCart, getGetCartQueryKey } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Clock, ChevronRight, UtensilsCrossed } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { data: featuredProducts, isLoading: loadingFeatured } = useGetFeaturedProducts();
  const { data: categories, isLoading: loadingCategories } = useListCategories();
  const { data: settings } = useGetPublicSettings();
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const addToCartMutation = useAddToCart();

  const handleAddToCart = (product: any) => {
    if (product.hasVariants) {
      setLocation(`/product/${product.id}`);
      return;
    }
    addToCartMutation.mutate(
      { data: { productId: product.id, quantity: 1 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({ title: "Added to cart", description: `${product.name} added to your cart.` });
        },
        onError: () => {
          toast({ title: "Please sign in", description: "You need to be logged in to add items.", variant: "destructive" });
          setLocation("/login");
        },
      }
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-blue-900 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "60px 60px"}} />
        </div>
        <div className="relative z-10 py-16 md:py-24 px-6 flex flex-col items-center text-center max-w-4xl mx-auto">
          <Badge className="mb-4 bg-white/20 hover:bg-white/20 text-white border-white/30 text-sm px-4 py-1">
            📍 Along 44 Junction, Old Ronchess Site, Kaduna
          </Badge>
          <h1 className="text-3xl md:text-6xl font-bold tracking-tight text-white mb-4 leading-tight">
            Authentic Nigerian Cuisine,<br className="hidden md:block" /> Delivered in Kaduna
          </h1>
          <p className="text-base md:text-xl text-blue-100 max-w-2xl mb-4">
            Jollof Rice, Shawarma, Soups &amp; Swallow — made fresh and delivered hot to your door.
          </p>

          {/* Open/closed + delivery time */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {settings && (
              <>
                <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium ${
                  settings.isOpen ? "bg-green-500/20 text-green-200 border border-green-400/30" : "bg-red-500/20 text-red-200 border border-red-400/30"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${settings.isOpen ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                  {settings.isOpen ? "Open Now" : "Currently Closed"}
                </span>
                {settings.estimatedDeliveryMin && settings.estimatedDeliveryMax && (
                  <span className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-white/10 text-blue-100 border border-white/20">
                    <Clock className="w-3.5 h-3.5" />
                    {settings.estimatedDeliveryMin}–{settings.estimatedDeliveryMax} min delivery
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/menu">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-8 h-12 text-base shadow-lg">
                Order Now
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <a href="https://wa.me/2348125079052" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 h-12 px-6 text-base">
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2 fill-current text-green-400">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.334.101.154.453.725.969 1.18.636.561 1.196.736 1.353.822.159.086.253.072.347-.029.094-.101.405-.471.514-.633.11-.163.22-.136.362-.087.144.051.91.43 1.069.508.159.078.266.116.304.18.038.064.038.369-.106.774z"/>
                </svg>
                WhatsApp Order
              </Button>
            </a>
          </div>
        </div>

        {/* Info bar */}
        <div className="relative z-10 bg-blue-800/60 border-t border-blue-700/50 py-3 px-4">
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-1 text-sm text-blue-100">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Along 44 Junction, Old Ronchess Site, Kaduna
            </span>
            <a href="tel:08125089052" className="flex items-center gap-1.5 hover:text-white">
              <Phone className="w-3.5 h-3.5" />
              08125089052
            </a>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {settings ? `${settings.openingTime} – ${settings.closingTime}` : "9:00am – 10:00pm"}
            </span>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-10 md:py-16 px-4 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Browse Categories</h2>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Find exactly what you're craving</p>
          </div>
          <Link href="/menu">
            <Button variant="ghost" className="text-primary hover:text-primary/90 text-sm">
              See All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4">
          {loadingCategories ? (
            Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 md:h-32 rounded-xl" />
            ))
          ) : (
            categories?.map(category => (
              <Link key={category.id} href={`/menu?category=${category.id}`}>
                <div className="group cursor-pointer flex flex-col items-center gap-2 md:gap-3 p-3 md:p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-primary/30 transition-all">
                    {category.imageUrl ? (
                      <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <UtensilsCrossed className="w-6 h-6 text-primary/60" />
                    )}
                  </div>
                  <span className="font-medium text-xs md:text-sm text-center leading-tight">{category.name}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-10 md:py-16 px-4 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Featured Dishes</h2>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Our most loved meals</p>
          </div>
          <Link href="/menu">
            <Button variant="ghost" className="text-primary hover:text-primary/90 text-sm">
              Full Menu <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {loadingFeatured ? (
            Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-[280px] md:h-[350px] rounded-xl" />
            ))
          ) : featuredProducts && featuredProducts.length > 0 ? (
            featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Menu coming soon — check back!</p>
            </div>
          )}
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-10 md:py-16 bg-blue-50 dark:bg-blue-900/10">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Why Kaduna Loves Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "🍲", title: "Authentic Recipes", desc: "Traditional Nigerian flavours made with fresh, quality ingredients every day." },
              { icon: "⚡", title: "Fast Delivery", desc: `${settings?.estimatedDeliveryMin || 30}–${settings?.estimatedDeliveryMax || 60} min delivery across Kaduna zones.` },
              { icon: "💳", title: "Easy Payment", desc: "Pay cash on delivery or via bank transfer. WhatsApp order backup available." },
            ].map((item) => (
              <div key={item.title} className="bg-white dark:bg-card border border-border rounded-2xl p-6 shadow-sm">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
