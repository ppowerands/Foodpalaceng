import { useState } from "react";
import { useLocation } from "wouter";
import {
  useListProducts,
  useListCategories,
  useAddToCart,
  getGetCartQueryKey,
  useAddFavorite,
  useRemoveFavorite,
  getListFavoritesQueryKey,
  getListProductsQueryKey,
} from "@workspace/api-client-react";

import { useQueryClient } from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function Menu() {
  const [searchParams] = useState(
    new URLSearchParams(window.location.search)
  );

  const initialCategoryId = searchParams.get("category")
    ? Number(searchParams.get("category"))
    : undefined;

  const [activeCategory, setActiveCategory] = useState<number | undefined>(
    initialCategoryId
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: categories, isLoading: loadingCategories } =
    useListCategories();

  const { data: products, isLoading: loadingProducts } = useListProducts({
    categoryId: activeCategory,
    search: debouncedSearch || undefined,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const addToCartMutation = useAddToCart();
  const addFavoriteMutation = useAddFavorite();
  const removeFavoriteMutation = useRemoveFavorite();

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    setSearchQuery(value);

    setTimeout(() => {
      setDebouncedSearch(value);
    }, 500);
  };

  const handleAddToCart = (product: any) => {
    if (product.hasVariants) {
      setLocation(`/product/${product.id}`);
      return;
    }

    addToCartMutation.mutate(
      {
        data: {
          productId: product.id,
          quantity: 1,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetCartQueryKey(),
          });

          toast({
            title: "Added to cart",
            description: `${product.name} has been added to your cart.`,
          });
        },

        onError: () => {
          toast({
            title: "Please login",
            description:
              "You need to be logged in to add items to cart.",
            variant: "destructive",
          });

          setLocation("/login");
        },
      }
    );
  };

  const handleToggleFavorite = (
    productId: number,
    isFavorited: boolean
  ) => {
    const mutation = isFavorited
      ? removeFavoriteMutation
      : addFavoriteMutation;

    mutation.mutate(
      { productId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getListProductsQueryKey({
              categoryId: activeCategory,
              search: debouncedSearch || undefined,
            }),
          });

          queryClient.invalidateQueries({
            queryKey: getListFavoritesQueryKey(),
          });

          toast({
            title: isFavorited
              ? "Removed from favorites"
              : "Added to favorites",
          });
        },

        onError: () => {
          toast({
            title: "Please login",
            description:
              "You need to be logged in to save favorites.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-slate-900 pt-10 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-6">
            Our Menu
          </h1>

          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />

            <Input
              placeholder="Search for Jollof, Shawarma, Drinks..."
              className="pl-10 h-14 bg-white/10 border-white/20 text-white placeholder:text-slate-400 text-lg rounded-xl focus-visible:ring-primary"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 -mt-10 mb-12">
        <div className="bg-card border border-border rounded-xl shadow-sm p-2 flex items-center gap-2">
          <Button
            variant={
              activeCategory === undefined ? "default" : "ghost"
            }
            className="rounded-lg whitespace-nowrap"
            onClick={() => setActiveCategory(undefined)}
          >
            All Menu
          </Button>

          <div className="w-px h-6 bg-border mx-2" />

          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-2 p-1">
              {loadingCategories ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-10 w-24 rounded-lg"
                    />
                  ))
              ) : (
                categories?.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={
                      activeCategory === cat.id
                        ? "default"
                        : "ghost"
                    }
                    className="rounded-lg"
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))
              )}
            </div>

            <ScrollBar
              orientation="horizontal"
              className="invisible"
            />
          </ScrollArea>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 pb-24">
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-[350px] rounded-xl"
                />
              ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
            <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />

            <h3 className="text-xl font-bold text-foreground">
              No dishes found
            </h3>

            <p className="text-muted-foreground mt-2">
              Try adjusting your search or category filter.
            </p>

            {(activeCategory !== undefined ||
              debouncedSearch) && (
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => {
                  setActiveCategory(undefined);
                  setSearchQuery("");
                  setDebouncedSearch("");
                }}
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products?.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UtensilsCrossed(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
      <path d="M15 15 3.3 2.8a2 2 0 0 0-2.8 0 2 2 0 0 0 0 2.8L12 17" />
      <path d="m20 18-8-8" />
      <path d="m6 8-4-4" />
      <path d="m14.5 9.5 3 3" />
    </svg>
  );
}