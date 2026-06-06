import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Addon,
  Product,
  ProductDetail,
  ProductVariant,
  getGetProductQueryKey,
  getListProductsQueryKey,
  useCreateProduct,
  useCreateProductAddon,
  useCreateProductVariant,
  useDeleteProduct,
  useGetProduct,
  useListCategories,
  useListProducts,
  useUpdateProduct,
} from "@workspace/api-client-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Edit2,
  ListPlus,
  PackageOpen,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";

type ProductFormState = {
  name: string;
  description: string;
  categoryId: string;
  basePrice: string;
  imageUrl: string;
  inStock: boolean;
  isAvailable: boolean;
  hasVariants: boolean;
};

type VariantFormState = {
  id?: number;
  name: string;
  price: string;
  description: string;
};

type AddonFormState = {
  id?: number;
  name: string;
  price: string;
};

const emptyProductForm: ProductFormState = {
  name: "",
  description: "",
  categoryId: "",
  basePrice: "",
  imageUrl: "",
  inStock: true,
  isAvailable: true,
  hasVariants: false,
};

const emptyVariantForm: VariantFormState = {
  name: "",
  price: "",
  description: "",
};

const emptyAddonForm: AddonFormState = {
  name: "",
  price: "",
};

function adminRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("food_palace_token");
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(path, { ...options, headers }).then(async (response) => {
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || response.statusText);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  });
}

function productToForm(product: Product): ProductFormState {
  return {
    name: product.name,
    description: product.description ?? "",
    categoryId: String(product.categoryId),
    basePrice: String(product.basePrice),
    imageUrl: product.imageUrl ?? "",
    inStock: product.inStock,
    isAvailable: product.isAvailable,
    hasVariants: product.hasVariants ?? false,
  };
}

function toProductPayload(form: ProductFormState) {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    categoryId: Number(form.categoryId),
    basePrice: Number(form.basePrice),
    imageUrl: form.imageUrl.trim() || undefined,
    inStock: form.inStock,
    isAvailable: form.isAvailable,
    hasVariants: form.hasVariants,
  };
}

export default function AdminMenu() {
  const [categoryId, setCategoryId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] =
    useState<ProductFormState>(emptyProductForm);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [variantForm, setVariantForm] =
    useState<VariantFormState>(emptyVariantForm);
  const [addonForm, setAddonForm] = useState<AddonFormState>(emptyAddonForm);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const productParams = useMemo(
    () => ({
      categoryId: categoryId === "all" ? undefined : Number(categoryId),
      search: search.trim() || undefined,
    }),
    [categoryId, search]
  );

  const { data: categories } = useListCategories();
  const { data: products, isLoading } = useListProducts(productParams);

  const detailProductId = selectedProductId ?? 0;
  const { data: productDetail, isLoading: loadingDetail } = useGetProduct(
    detailProductId,
    {
      query: {
        queryKey: getGetProductQueryKey(detailProductId),
        enabled: selectedProductId !== null,
      },
    }
  );

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const createVariantMutation = useCreateProductVariant();
  const createAddonMutation = useCreateProductAddon();

  const updateVariantMutation = useMutation({
    mutationFn: ({
      productId,
      variantId,
      data,
    }: {
      productId: number;
      variantId: number;
      data: Omit<VariantFormState, "id">;
    }) =>
      adminRequest<ProductVariant>(
        `/api/products/${productId}/variants/${variantId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: data.name,
            price: Number(data.price),
            description: data.description || undefined,
          }),
        }
      ),
  });

  const deleteVariantMutation = useMutation({
    mutationFn: ({
      productId,
      variantId,
    }: {
      productId: number;
      variantId: number;
    }) =>
      adminRequest<void>(`/api/products/${productId}/variants/${variantId}`, {
        method: "DELETE",
      }),
  });

  const updateAddonMutation = useMutation({
    mutationFn: ({
      productId,
      addonId,
      data,
    }: {
      productId: number;
      addonId: number;
      data: Omit<AddonFormState, "id">;
    }) =>
      adminRequest<Addon>(`/api/products/${productId}/addons/${addonId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: data.name,
          price: Number(data.price),
        }),
      }),
  });

  const deleteAddonMutation = useMutation({
    mutationFn: ({
      productId,
      addonId,
    }: {
      productId: number;
      addonId: number;
    }) =>
      adminRequest<void>(`/api/products/${productId}/addons/${addonId}`, {
        method: "DELETE",
      }),
  });

  const refreshProducts = () => {
    queryClient.invalidateQueries({
      queryKey: getListProductsQueryKey(productParams),
    });
  };

  const refreshDetail = (productId: number) => {
    queryClient.invalidateQueries({
      queryKey: getGetProductQueryKey(productId),
    });
    refreshProducts();
  };

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      ...emptyProductForm,
      categoryId: categories?.[0]?.id ? String(categories[0].id) : "",
    });
    setProductDialogOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm(productToForm(product));
    setProductDialogOpen(true);
  };

  const handleProductSubmit = (event: FormEvent) => {
    event.preventDefault();

    const payload = toProductPayload(productForm);

    if (editingProduct) {
      updateProductMutation.mutate(
        { id: editingProduct.id, data: payload },
        {
          onSuccess: () => {
            setProductDialogOpen(false);
            refreshProducts();
            toast({ title: "Product updated" });
          },
        }
      );
      return;
    }

    createProductMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          setProductDialogOpen(false);
          refreshProducts();
          toast({ title: "Product created" });
        },
      }
    );
  };

  const handleDeleteProduct = (product: Product) => {
    if (!confirm(`Delete ${product.name}?`)) return;

    deleteProductMutation.mutate(
      { id: product.id },
      {
        onSuccess: () => {
          refreshProducts();
          toast({ title: "Product deleted" });
        },
      }
    );
  };

  const handleToggleProduct = (
    product: Product,
    field: "inStock" | "isAvailable"
  ) => {
    updateProductMutation.mutate(
      {
        id: product.id,
        data: {
          [field]: !product[field],
        },
      },
      {
        onSuccess: () => {
          refreshProducts();
          toast({ title: "Product status updated" });
        },
      }
    );
  };

  const openOptions = (product: Product) => {
    setSelectedProductId(product.id);
    setVariantForm(emptyVariantForm);
    setAddonForm(emptyAddonForm);
  };

  const handleVariantSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProductId) return;

    const payload = {
      name: variantForm.name.trim(),
      price: variantForm.price,
      description: variantForm.description.trim(),
    };

    if (variantForm.id) {
      updateVariantMutation.mutate(
        {
          productId: selectedProductId,
          variantId: variantForm.id,
          data: payload,
        },
        {
          onSuccess: () => {
            setVariantForm(emptyVariantForm);
            refreshDetail(selectedProductId);
            toast({ title: "Variant updated" });
          },
        }
      );
      return;
    }

    createVariantMutation.mutate(
      {
        id: selectedProductId,
        data: {
          name: payload.name,
          price: Number(payload.price),
          description: payload.description || undefined,
        },
      },
      {
        onSuccess: () => {
          setVariantForm(emptyVariantForm);
          refreshDetail(selectedProductId);
          toast({ title: "Variant added" });
        },
      }
    );
  };

  const handleAddonSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProductId) return;

    const payload = {
      name: addonForm.name.trim(),
      price: addonForm.price,
    };

    if (addonForm.id) {
      updateAddonMutation.mutate(
        {
          productId: selectedProductId,
          addonId: addonForm.id,
          data: payload,
        },
        {
          onSuccess: () => {
            setAddonForm(emptyAddonForm);
            refreshDetail(selectedProductId);
            toast({ title: "Addon updated" });
          },
        }
      );
      return;
    }

    createAddonMutation.mutate(
      {
        id: selectedProductId,
        data: {
          name: payload.name,
          price: Number(payload.price),
        },
      },
      {
        onSuccess: () => {
          setAddonForm(emptyAddonForm);
          refreshDetail(selectedProductId);
          toast({ title: "Addon added" });
        },
      }
    );
  };

  useEffect(() => {
    if (!productDialogOpen) {
      setEditingProduct(null);
    }
  }, [productDialogOpen]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit customer menu items, availability, variants, and addons.
          </p>
        </div>

        <Button onClick={openCreateProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products"
            className="pl-9"
          />
        </div>

        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-12 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : !products?.length ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-muted-foreground"
                >
                  <PackageOpen className="mx-auto mb-3 h-8 w-8 opacity-50" />
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="h-12 w-12 overflow-hidden rounded-md bg-muted">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    <div className="line-clamp-1 max-w-md text-xs text-muted-foreground">
                      {product.description || "No description"}
                    </div>
                  </TableCell>
                  <TableCell>{product.categoryName}</TableCell>
                  <TableCell>{formatCurrency(product.basePrice)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={product.isAvailable ? "default" : "outline"}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() =>
                          handleToggleProduct(product, "isAvailable")
                        }
                      >
                        {product.isAvailable ? "Visible" : "Hidden"}
                      </Button>
                      <Button
                        variant={product.inStock ? "secondary" : "outline"}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleToggleProduct(product, "inStock")}
                      >
                        {product.inStock ? "In stock" : "Out"}
                      </Button>
                      {product.hasVariants ? (
                        <Badge variant="outline">Variants</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openOptions(product)}
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditProduct(product)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteProduct(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add Product"}
            </DialogTitle>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleProductSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <Input
                  required
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Category">
                <Select
                  required
                  value={productForm.categoryId}
                  onValueChange={(value) =>
                    setProductForm((current) => ({
                      ...current,
                      categoryId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={String(category.id)}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Description">
              <Textarea
                value={productForm.description}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Base price">
                <Input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={productForm.basePrice}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      basePrice: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Image URL">
                <Input
                  value={productForm.imageUrl}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      imageUrl: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>

            <div className="grid gap-3 rounded-md border p-3 md:grid-cols-3">
              <CheckField
                label="Visible to customers"
                checked={productForm.isAvailable}
                onCheckedChange={(checked) =>
                  setProductForm((current) => ({
                    ...current,
                    isAvailable: checked,
                  }))
                }
              />
              <CheckField
                label="In stock"
                checked={productForm.inStock}
                onCheckedChange={(checked) =>
                  setProductForm((current) => ({
                    ...current,
                    inStock: checked,
                  }))
                }
              />
              <CheckField
                label="Has variants"
                checked={productForm.hasVariants}
                onCheckedChange={(checked) =>
                  setProductForm((current) => ({
                    ...current,
                    hasVariants: checked,
                  }))
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProductDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createProductMutation.isPending ||
                  updateProductMutation.isPending
                }
              >
                {editingProduct ? "Save Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={selectedProductId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedProductId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {productDetail?.name ?? "Product Options"}
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <Skeleton className="h-80 w-full" />
          ) : productDetail ? (
            <ProductOptions
              product={productDetail}
              variantForm={variantForm}
              addonForm={addonForm}
              setVariantForm={setVariantForm}
              setAddonForm={setAddonForm}
              onVariantSubmit={handleVariantSubmit}
              onAddonSubmit={handleAddonSubmit}
              onDeleteVariant={(variantId) => {
                if (!confirm("Delete this variant?")) return;
                deleteVariantMutation.mutate(
                  { productId: productDetail.id, variantId },
                  {
                    onSuccess: () => {
                      refreshDetail(productDetail.id);
                      toast({ title: "Variant deleted" });
                    },
                  }
                );
              }}
              onDeleteAddon={(addonId) => {
                if (!confirm("Delete this addon?")) return;
                deleteAddonMutation.mutate(
                  { productId: productDetail.id, addonId },
                  {
                    onSuccess: () => {
                      refreshDetail(productDetail.id);
                      toast({ title: "Addon deleted" });
                    },
                  }
                );
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductOptions({
  product,
  variantForm,
  addonForm,
  setVariantForm,
  setAddonForm,
  onVariantSubmit,
  onAddonSubmit,
  onDeleteVariant,
  onDeleteAddon,
}: {
  product: ProductDetail;
  variantForm: VariantFormState;
  addonForm: AddonFormState;
  setVariantForm: (form: VariantFormState) => void;
  setAddonForm: (form: AddonFormState) => void;
  onVariantSubmit: (event: FormEvent) => void;
  onAddonSubmit: (event: FormEvent) => void;
  onDeleteVariant: (id: number) => void;
  onDeleteAddon: (id: number) => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Variants</h3>
          <Badge variant="secondary">{product.variants?.length ?? 0}</Badge>
        </div>

        <form className="grid gap-3" onSubmit={onVariantSubmit}>
          <Input
            required
            placeholder="Variant name"
            value={variantForm.name}
            onChange={(event) =>
              setVariantForm({ ...variantForm, name: event.target.value })
            }
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              required
              min="0"
              step="0.01"
              type="number"
              placeholder="Price"
              value={variantForm.price}
              onChange={(event) =>
                setVariantForm({ ...variantForm, price: event.target.value })
              }
            />
            <Input
              placeholder="Short description"
              value={variantForm.description}
              onChange={(event) =>
                setVariantForm({
                  ...variantForm,
                  description: event.target.value,
                })
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            {variantForm.id ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setVariantForm(emptyVariantForm)}
              >
                Cancel
              </Button>
            ) : null}
            <Button type="submit">
              <ListPlus className="mr-2 h-4 w-4" />
              {variantForm.id ? "Save Variant" : "Add Variant"}
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          {product.variants?.map((variant) => (
            <OptionRow
              key={variant.id}
              name={variant.name}
              detail={variant.description ?? ""}
              price={variant.price}
              onEdit={() =>
                setVariantForm({
                  id: variant.id,
                  name: variant.name,
                  price: String(variant.price),
                  description: variant.description ?? "",
                })
              }
              onDelete={() => onDeleteVariant(variant.id)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Addons</h3>
          <Badge variant="secondary">{product.addons?.length ?? 0}</Badge>
        </div>

        <form className="grid gap-3" onSubmit={onAddonSubmit}>
          <Input
            required
            placeholder="Addon name"
            value={addonForm.name}
            onChange={(event) =>
              setAddonForm({ ...addonForm, name: event.target.value })
            }
          />
          <Input
            required
            min="0"
            step="0.01"
            type="number"
            placeholder="Price"
            value={addonForm.price}
            onChange={(event) =>
              setAddonForm({ ...addonForm, price: event.target.value })
            }
          />
          <div className="flex justify-end gap-2">
            {addonForm.id ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddonForm(emptyAddonForm)}
              >
                Cancel
              </Button>
            ) : null}
            <Button type="submit">
              <ListPlus className="mr-2 h-4 w-4" />
              {addonForm.id ? "Save Addon" : "Add Addon"}
            </Button>
          </div>
        </form>

        <div className="space-y-2">
          {product.addons?.map((addon) => (
            <OptionRow
              key={addon.id}
              name={addon.name}
              price={addon.price}
              onEdit={() =>
                setAddonForm({
                  id: addon.id,
                  name: addon.name,
                  price: String(addon.price),
                })
              }
              onDelete={() => onDeleteAddon(addon.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function OptionRow({
  name,
  detail,
  price,
  onEdit,
  onDelete,
}: {
  name: string;
  detail?: string;
  price: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background p-3">
      <div>
        <div className="font-medium">{name}</div>
        {detail ? (
          <div className="text-xs text-muted-foreground">{detail}</div>
        ) : null}
        <div className="text-sm text-muted-foreground">
          {formatCurrency(price)}
        </div>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function CheckField({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      {label}
    </label>
  );
}
