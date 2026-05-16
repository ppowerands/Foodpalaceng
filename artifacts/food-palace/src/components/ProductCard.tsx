import { Link } from "wouter";
import { Product } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onToggleFavorite?: (productId: number, isFavorited: boolean) => void;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onToggleFavorite, onAddToCart }: ProductCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col hover-elevate transition-all group border-border/50">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary/50">
            <UtensilsCrossed className="w-10 h-10 opacity-20" />
          </div>
        )}
        
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10">
            <Badge variant="destructive" className="px-3 py-1 text-sm shadow-md">Out of Stock</Badge>
          </div>
        )}

        <div className="absolute top-2 right-2 z-20">
          <Button 
            variant="secondary" 
            size="icon" 
            className="w-8 h-8 rounded-full bg-background/80 backdrop-blur shadow-sm hover:bg-background"
            onClick={(e) => {
              e.preventDefault();
              onToggleFavorite?.(product.id, !!product.isFavorited);
            }}
          >
            <Heart className={`w-4 h-4 ${product.isFavorited ? 'fill-red-500 text-red-500' : 'text-foreground/70'}`} />
          </Button>
        </div>

        {product.categoryName && (
          <div className="absolute top-2 left-2 z-20">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur shadow-sm font-medium">
              {product.categoryName}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h3 className="font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <span className="font-bold text-primary shrink-0">
            {formatCurrency(product.basePrice)}
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
          {product.description || "A delicious meal prepared with authentic ingredients."}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {product.hasVariants ? (
          <Link href={`/product/${product.id}`} className="w-full">
            <Button variant="outline" className="w-full font-medium" disabled={!product.inStock || !product.isAvailable}>
              Select Options
            </Button>
          </Link>
        ) : (
          <Button 
            className="w-full font-medium" 
            disabled={!product.inStock || !product.isAvailable}
            onClick={() => onAddToCart?.(product)}
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Temporary icon component if lucide isn't available
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
