import {
  useListFavorites,
  useRemoveFavorite,
  getListFavoritesQueryKey,
  useAddToCart,
  getGetCartQueryKey,
} from "@workspace/api-client-react";

import { ProductCard } from "@/components/ProductCard";

import { Skeleton } from "@/components/ui/skeleton";

import { Heart } from "lucide-react";

import { Link, useLocation } from "wouter";

import { Button } from "@/components/ui/button";

import { useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/hooks/use-toast";

export default function Favorites() {
  const { data: favorites, isLoading } =
    useListFavorites();

  const removeFavoriteMutation =
    useRemoveFavorite();

  const addToCartMutation = useAddToCart();

  const queryClient = useQueryClient();

  const { toast } = useToast();

  const [, setLocation] = useLocation();

  const handleToggleFavorite = (
    productId: number
  ) => {
    removeFavoriteMutation.mutate(
      {
        productId: productId,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey:
              getListFavoritesQueryKey(),
          });

          toast({
            title: "Removed from favorites",
          });
        },
      }
    );
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
            queryKey:
              getGetCartQueryKey(),
          });

          toast({
            title: "Added to cart",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">
          My Favorites
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton
                key={i}
                className="h-[350px] rounded-xl"
              />
            ))}
        </div>
      </div>
    );
  }

  if (!favorites || favorites.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mb-6">
          <Heart className="w-12 h-12 text-red-500" />
        </div>

        <h2 className="text-3xl font-bold mb-4">
          No favorites yet
        </h2>

        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          Save your favorite meals to easily
          order them again later.
        </p>

        <Link href="/menu">
          <Button size="lg">
            Browse Menu
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8 text-foreground flex items-center gap-3">
        My Favorites

        <span className="text-lg font-normal text-muted-foreground bg-secondary px-3 py-1 rounded-full">
          {favorites.length}
        </span>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favorites.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              ...product,
              isFavorited: true,
            }}
            onToggleFavorite={
              handleToggleFavorite
            }
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  );
}