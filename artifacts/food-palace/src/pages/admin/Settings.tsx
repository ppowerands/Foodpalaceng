import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetRestaurantSettings, 
  useUpdateRestaurantSettings,
  getGetRestaurantSettingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Store, Clock, Banknote, MessageSquare } from "lucide-react";

const settingsSchema = z.object({
  isOpen: z.boolean(),
  openingTime: z.string(),
  closingTime: z.string(),
  estimatedDeliveryMin: z.coerce.number().optional(),
  estimatedDeliveryMax: z.coerce.number().optional(),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  whatsappNumber: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function AdminSettings() {
  const { data: settings, isLoading } = useGetRestaurantSettings();
  const updateMutation = useUpdateRestaurantSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      isOpen: false,
      openingTime: "09:00",
      closingTime: "22:00",
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        isOpen: settings.isOpen,
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
        estimatedDeliveryMin: settings.estimatedDeliveryMin,
        estimatedDeliveryMax: settings.estimatedDeliveryMax,
        bankName: settings.bankName || "",
        accountName: settings.accountName || "",
        accountNumber: settings.accountNumber || "",
        whatsappNumber: settings.whatsappNumber || "",
      });
    }
  }, [settings, form]);

  const onSubmit = (values: SettingsFormValues) => {
    updateMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetRestaurantSettingsQueryKey() });
          toast({ title: "Settings saved successfully" });
        },
        onError: () => {
          toast({ title: "Failed to save settings", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
    return <div className="p-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-3xl font-bold">Store Settings</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" /> General Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="isOpen"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-bold text-primary">Store is Open</FormLabel>
                      <FormDescription>
                        Toggle this to temporarily pause incoming orders
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" /> Operating & Delivery Times
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="openingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Time</FormLabel>
                    <FormControl><Input type="time" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="closingTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closing Time</FormLabel>
                    <FormControl><Input type="time" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimatedDeliveryMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Delivery Time (mins)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimatedDeliveryMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Delivery Time (mins)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="w-5 h-5" /> Bank Details
              </CardTitle>
              <CardDescription>Displayed to customers selecting Bank Transfer</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Moniepoint MFB" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl><Input placeholder="e.g. Food Palace" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Account Number</FormLabel>
                    <FormControl><Input placeholder="10 digit account number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp Number</FormLabel>
                    <FormControl><Input placeholder="2348000000000" {...field} /></FormControl>
                    <FormDescription>Include country code without +, e.g., 234...</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>

        </form>
      </Form>
    </div>
  );
}
