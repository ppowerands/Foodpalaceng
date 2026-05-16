import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { 
  useGetProduct, 
  useAddToCart,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import { Textarea } from "@/components/ui/textarea";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useGetProduct(id, { 
    query: { enabled: !!id, queryKey: ['product', id] } 
  });

  const addToCartMutation = useAddToCart();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>();
  const [selectedAddonIds, setSelectedAddonIds] = useState<number[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Update selected variant when product loads if it has variants
  if (product?.variants?.length && !selectedVariantId && !isLoading) {
    setSelectedVariantId(product.variants[0].id);
  }

  const handleIncrement = () => setQuantity(prev => prev + 1);
  const handleDecrement = () => setQuantity(prev => Math.max(1, prev - 1));

  const toggleAddon = (addonId: number) => {
    setSelectedAddonIds(prev => 
      prev.includes(addonId) 
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  const calculateTotal = () => {
    if (!product) return 0;
    
    let base = product.basePrice;
    
    if (selectedVariantId && product.variants) {
      const variant = product.variants.find(v => v.id === selectedVariantId);
      if (variant) base = variant.price;
    }
    
    let addonsTotal = 0;
    if (selectedAddonIds.length > 0 && product.addons) {
      addonsTotal = product.addons
        .filter(a => selectedAddonIds.includes(a.id))
        .reduce((sum, a) => sum + a.price, 0);
    }
    
    return (base + addonsTotal) * quantity;
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (product.hasVariants && !selectedVariantId) {
      toast({ title: "Please select an option", variant: "destructive" });
      return;
    }

    addToCartMutation.mutate(
      { 
        data: { 
          productId: product.id, 
          variantId: selectedVariantId,
          addonIds: selectedAddonIds.length > 0 ? selectedAddonIds : undefined,
          quantity,
          specialInstructions: specialInstructions || undefined
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({ title: "Added to cart", description: `${quantity}x ${product.name} added to your cart.` });
          setLocation("/cart");
        },
        onError: () => {
          toast({ title: "Please login", description: "You need to be logged in to add items to cart.", variant: "destructive" });
          setLocation("/login");
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-12">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <Link href="/menu">
          <Button>Back to Menu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-32">
      <Link href="/menu" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Menu
      </Link>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image Side */}
          <div className="relative aspect-square md:aspect-auto bg-muted">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/30">
                <span>No image available</span>
              </div>
            )}
            {!product.inStock && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                <Badge variant="destructive" className="px-4 py-2 text-lg">Out of Stock</Badge>
              </div>
            )}
          </div>

          {/* Details Side */}
          <div className="p-8 md:p-10 flex flex-col h-full">
            <div className="mb-2">
              <Badge variant="outline" className="mb-4">{product.categoryName}</Badge>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">{product.name}</h1>
              <p className="text-2xl font-bold text-primary mb-6">
                {formatCurrency(calculateTotal() / quantity)}
              </p>
              {product.description && (
                <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                  {product.description}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-8">
              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-4 flex items-center">
                    Select Size <span className="text-destructive ml-1">*</span>
                  </h3>
                  <RadioGroup 
                    value={selectedVariantId?.toString()} 
                    onValueChange={(val) => setSelectedVariantId(Number(val))}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {product.variants.map((variant) => (
                      <Label
                        key={variant.id}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedVariantId === variant.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={variant.id.toString()} id={`variant-${variant.id}`} />
                          <span className="font-medium text-base">{variant.name}</span>
                        </div>
                        <span className="font-bold">{formatCurrency(variant.price)}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {/* Addons */}
              {product.addons && product.addons.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-4">Add Extras</h3>
                  <div className="space-y-3">
                    {product.addons.map((addon) => (
                      <Label
                        key={addon.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                          selectedAddonIds.includes(addon.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            id={`addon-${addon.id}`}
                            checked={selectedAddonIds.includes(addon.id)}
                            onCheckedChange={() => toggleAddon(addon.id)}
                            className="rounded-sm"
                          />
                          <span className="font-medium">{addon.name}</span>
                        </div>
                        <span className="text-muted-foreground font-medium">+{formatCurrency(addon.price)}</span>
                      </Label>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <h3 className="font-bold text-lg mb-3">Special Instructions</h3>
                <Textarea 
                  placeholder="Any allergies or specific prep instructions?"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="resize-none h-24 rounded-xl"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-8 mt-auto border-t border-border flex flex-col sm:flex-row gap-4">
              <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-2 sm:w-1/3">
                <Button variant="ghost" size="icon" onClick={handleDecrement} disabled={quantity <= 1} className="h-12 w-12 rounded-lg">
                  <Minus className="w-5 h-5" />
                </Button>
                <span className="font-bold text-xl w-12 text-center">{quantity}</span>
                <Button variant="ghost" size="icon" onClick={handleIncrement} className="h-12 w-12 rounded-lg">
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
              
              <Button 
                size="lg" 
                className="flex-1 h-16 text-lg rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                disabled={!product.inStock || !product.isAvailable || addToCartMutation.isPending}
                onClick={handleAddToCart}
              >
                {addToCartMutation.isPending ? (
                  "Adding..."
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Add to Cart • {formatCurrency(calculateTotal())}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
