import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetCart, 
  useListDeliveryZones,
  useGetPublicSettings,
  useCreateOrder,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, CreditCard, Banknote, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const checkoutSchema = z.object({
  deliveryZoneId: z.coerce.number().min(1, "Please select a delivery zone"),
  deliveryAddress: z.string().min(5, "Delivery address is required"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
  deliveryNotes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cart, isLoading: loadingCart } = useGetCart();
  const { data: deliveryZones, isLoading: loadingZones } = useListDeliveryZones();
  const { data: settings } = useGetPublicSettings();

  const createOrderMutation = useCreateOrder();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryAddress: "",
      paymentMethod: "cash_on_delivery",
      deliveryNotes: "",
    },
  });

  const selectedZoneId = form.watch("deliveryZoneId");
  const selectedZone = deliveryZones?.find((z) => z.id === selectedZoneId);
  const deliveryFee = selectedZone?.fee || 0;
  
  const paymentMethod = form.watch("paymentMethod");

  useEffect(() => {
    if (!loadingCart && (!cart || cart.items.length === 0)) {
      setLocation("/cart");
    }
  }, [cart, loadingCart, setLocation]);

  if (loadingCart || loadingZones) {
    return <div className="p-8 text-center">Loading checkout...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return <div className="p-8 text-center">Redirecting...</div>;
  }

  const onSubmit = (values: CheckoutFormValues) => {
    createOrderMutation.mutate(
      { data: values },
      {
        onSuccess: (order) => {
          queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
          toast({ title: "Order placed successfully!" });
          setLocation(`/order/${order.id}`);
        },
        onError: (err: any) => {
          toast({ 
            title: "Failed to place order", 
            description: err?.message || "An error occurred",
            variant: "destructive" 
          });
        }
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Checkout</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Details
                </CardTitle>
                <CardDescription>Where should we deliver your order?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="deliveryZoneId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Zone</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(Number(val))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your area" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {deliveryZones?.map((zone) => (
                            <SelectItem key={zone.id} value={zone.id.toString()}>
                              {zone.name} - {formatCurrency(zone.fee)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedZone && selectedZone.areas && (
                        <FormDescription>
                          Covers: {selectedZone.areas.join(", ")}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Address</FormLabel>
                      <FormControl>
                        <Input placeholder="House number, street name, landmark" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="E.g. Call when you arrive, leave at gate..." 
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                            <FormControl>
                              <RadioGroupItem value="cash_on_delivery" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex items-center gap-2 w-full">
                              <Banknote className="w-5 h-5 text-primary" />
                              Cash on Delivery
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                            <FormControl>
                              <RadioGroupItem value="bank_transfer" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex items-center gap-2 w-full">
                              <CreditCard className="w-5 h-5 text-primary" />
                              Bank Transfer
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {paymentMethod === "bank_transfer" && settings?.bankName && (
                  <div className="mt-6 p-6 bg-primary/10 border border-primary/20 rounded-xl">
                    <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                      <Banknote className="w-5 h-5" />
                      Bank Transfer Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Bank Name:</span>
                        <span className="font-bold">{settings.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Name:</span>
                        <span className="font-bold">{settings.accountName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account Number:</span>
                        <span className="font-bold text-lg">{settings.accountNumber}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-primary/20">
                      Please make the transfer of {formatCurrency(cart.subtotal + deliveryFee)} and submit your order. You'll be able to confirm your payment on the next screen.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate pr-2">
                        {item.quantity}x {item.productName}
                      </span>
                      <span className="font-medium shrink-0">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-medium">
                      {selectedZone ? formatCurrency(deliveryFee) : "Select area"}
                    </span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-2xl text-primary">
                    {formatCurrency(cart.subtotal + deliveryFee)}
                  </span>
                </div>
                
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-14 text-lg mt-6"
                  disabled={createOrderMutation.isPending}
                >
                  {createOrderMutation.isPending ? "Processing..." : (
                    <>Place Order <ArrowRight className="w-5 h-5 ml-2" /></>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

        </form>
      </Form>
    </div>
  );
}
