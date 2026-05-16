import { useState } from "react";
import { 
  useListProducts, 
  useListCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getListProductsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// For brevity, we're doing a simplified view.
// In a full implementation, you'd have a dialog form to create/edit products.

export default function AdminMenu() {
  const { data: products, isLoading } = useListProducts();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useUpdateProduct(0);
  const deleteMutation = useDeleteProduct(0);

  const handleToggleStock = (productId: number, inStock: boolean) => {
    updateMutation.mutate(
      { id: productId, data: { inStock } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: "Stock status updated" });
        }
      }
    );
  };

  const handleDelete = (productId: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(
        { id: productId },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            toast({ title: "Product deleted" });
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Menu Management</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>In Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading products...</TableCell>
                </TableRow>
              ) : !products || products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No products found</TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="w-10 h-10 rounded-md bg-muted overflow-hidden">
                        {product.imageUrl && <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      {product.hasVariants && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Has Variants</Badge>}
                    </TableCell>
                    <TableCell>{product.categoryName}</TableCell>
                    <TableCell>{formatCurrency(product.basePrice)}</TableCell>
                    <TableCell>
                      <Switch 
                        checked={product.inStock} 
                        onCheckedChange={(checked) => handleToggleStock(product.id, checked)}
                        disabled={updateMutation.isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 text-destructive"
                        onClick={() => handleDelete(product.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
