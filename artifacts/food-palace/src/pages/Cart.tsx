import { Link } from "wouter";

import {
  useGetCart,
  useUpdateCartItem,
  useRemoveCartItem,
  getGetCartQueryKey,
} from "@workspace/api-client-react";

import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

import { formatCurrency } from "@/lib/utils";

import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";

export default function Cart() {
  const { data: cart, isLoading } = useGetCart();

  const queryClient = useQueryClient();

  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();

  const handleUpdateQuantity = (
    itemId: number,
    newQuantity: number
  ) => {
    if (newQuantity < 1) return;

    queryClient.setQueryData(
      getGetCartQueryKey(),
      (old: any) => {
        if (!old) return old;

        return {
          ...old,
          items: old.items.map((item: any) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity: newQuantity,
                }
              : item
          ),
        };
      }
    );

    updateMutation.mutate(
      {
        itemId: itemId,
        data: {
          quantity: newQuantity,
        },
      },
      {
        onSettled: () => {
          queryClient.invalidateQueries({
            queryKey: getGetCartQueryKey(),
          });
        },
      }
    );
  };

  const handleRemove = (itemId: number) => {
    removeMutation.mutate(
      {
        itemId: itemId,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetCartQueryKey(),
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        Loading cart...
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-12 h-12 text-primary" />
        </div>

        <h2 className="text-3xl font-bold mb-4">
          Your cart is empty
        </h2>

        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          Looks like you haven't added anything to your
          cart yet. Browse our menu to find something
          delicious!
        </p>

        <Link href="/menu">
          <Button
            size="lg"
            className="h-14 px-8 text-lg rounded-xl"
          >
            Browse Menu
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-foreground">
        Your Cart ({cart.itemCount} items)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row gap-6 p-6 bg-card border rounded-2xl shadow-sm"
            >
              <div className="w-full sm:w-32 h-32 bg-muted rounded-xl flex-shrink-0 overflow-hidden">
                {item.productImage ? (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-xl">
                      {item.productName}
                    </h3>

                    <span className="font-bold text-lg text-primary">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>

                  {item.variantName && (
                    <p className="text-sm text-muted-foreground mb-1">
                      Size: {item.variantName}
                    </p>
                  )}

                  {item.addonNames &&
                    item.addonNames.length > 0 && (
                      <p className="text-sm text-muted-foreground mb-1">
                        Add-ons:{" "}
                        {item.addonNames.join(", ")}
                      </p>
                    )}

                  {item.specialInstructions && (
                    <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md mt-2 inline-block">
                      Note:{" "}
                      {item.specialInstructions}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center bg-secondary/50 rounded-lg p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        handleUpdateQuantity(
                          item.id,
                          item.quantity - 1
                        )
                      }
                      disabled={
                        item.quantity <= 1 ||
                        updateMutation.isPending
                      }
                    >
                      <Minus className="w-4 h-4" />
                    </Button>

                    <span className="font-medium w-10 text-center">
                      {item.quantity}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        handleUpdateQuantity(
                          item.id,
                          item.quantity + 1
                        )
                      }
                      disabled={updateMutation.isPending}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() =>
                      handleRemove(item.id)
                    }
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card border rounded-2xl shadow-sm p-6 sticky top-24">
            <h3 className="font-bold text-xl mb-6">
              Order Summary
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>

                <span>
                  {formatCurrency(cart.subtotal)}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Fee</span>

                <span>
                  Calculated at checkout
                </span>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-lg">
                Total
              </span>

              <span className="font-bold text-2xl text-primary">
                {formatCurrency(cart.subtotal)}
              </span>
            </div>

            <Link href="/checkout">
              <Button
                size="lg"
                className="w-full h-14 text-lg rounded-xl shadow-md"
              >
                Proceed to Checkout

                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            <Link href="/menu">
              <Button
                variant="ghost"
                className="w-full mt-4 text-muted-foreground"
              >
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
