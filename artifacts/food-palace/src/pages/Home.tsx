import { useGetFeaturedProducts, useListCategories, useGetPublicSettings } from "@workspace/api-client-react";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: featuredProducts, isLoading: loadingFeatured } = useGetFeaturedProducts();
  const { data: categories, isLoading: loadingCategories } = useListCategories();
  const { data: settings } = useGetPublicSettings();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white py-24 px-6 md:px-12 flex flex-col items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90 z-10" />
        <div className="relative z-20 max-w-3xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            Authentic Nigerian Cuisine Delivered to Your Door
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
            Experience the rich flavors of Lagos and Abuja. Warm, vibrant, and always fresh.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="/menu">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-medium px-8 h-12 text-base">
                View Full Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Explore Categories</h2>
            <p className="text-muted-foreground mt-2">Find exactly what you're craving</p>
          </div>
          <Link href="/menu">
            <Button variant="ghost" className="text-primary hover:text-primary/90 hidden sm:flex">
              See All
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loadingCategories ? (
            Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))
          ) : (
            categories?.map(category => (
              <Link key={category.id} href={`/menu?category=${category.id}`}>
                <div className="group cursor-pointer flex flex-col items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    {category.imageUrl ? (
                      <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20" />
                    )}
                  </div>
                  <span className="font-medium text-sm text-center">{category.name}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto w-full bg-slate-50 dark:bg-slate-900/50 rounded-3xl mb-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Featured Delights</h2>
            <p className="text-muted-foreground mt-2">Our chef's top recommendations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingFeatured ? (
            Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-[350px] rounded-xl" />
            ))
          ) : (
            featuredProducts?.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
