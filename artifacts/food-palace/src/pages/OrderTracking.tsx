import { useRoute, Link } from "wouter";
import {
  useGetOrder,
  useConfirmPayment,
  getGetOrderQueryKey,
} from "@workspace/api-client-react";

import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

import {
  ChevronLeft,
  MapPin,
  Receipt,
  CheckCircle,
  Clock,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { getStatusColor, getStatusLabel } from "./Orders";

export default function OrderTracking() {
  const [, params] = useRoute("/order/:id");

  const id = params?.id ? Number(params.id) : undefined;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useGetOrder(id as number);

  const confirmPaymentMutation = useConfirmPayment();

  if (!id) {
    return (
      <div className="p-8 text-center">
        Invalid order
      </div>
    );
  }

  const handleConfirmPayment = () => {
    confirmPaymentMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({
            title: "Payment confirmation sent!",
          });

          queryClient.invalidateQueries({
            queryKey: getGetOrderQueryKey(id),
          });
        },

        onError: () => {
          toast({
            title: "Failed to confirm payment",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center">
        Order not found
      </div>
    );
  }

  const timelineSteps = [
    { status: "pending", label: "Order Placed" },
    { status: "preparing", label: "Preparing" },
    {
      status: "out_for_delivery",
      label: "Out for Delivery",
    },
    { status: "delivered", label: "Delivered" },
  ];

  const currentStepIndex = timelineSteps.findIndex(
    (s) => s.status === order.status
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
      <Link
        href="/orders"
        className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back to Orders
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            Order #{order.id}

            <Badge
              className={`${getStatusColor(
                order.status
              )} border-none text-sm`}
            >
              {getStatusLabel(order.status)}
            </Badge>
          </h1>

          <p className="text-muted-foreground mt-1">
            Placed on{" "}
            {format(
              new Date(order.createdAt),
              "MMM d, yyyy 'at' h:mm a"
            )}
          </p>
        </div>

        {order.status !== "cancelled" &&
          order.status !== "delivered" &&
          order.estimatedDeliveryMinutes && (
            <div className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl flex items-center gap-2">
              <Clock className="w-5 h-5" />

              <span className="font-medium">
                Estimated Delivery:{" "}
                {order.estimatedDeliveryMinutes} mins
              </span>
            </div>
          )}
      </div>

      {order.status !== "cancelled" && (
        <Card className="mb-8 overflow-hidden">
          <div className="p-8">
            <div className="relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -translate-y-1/2" />

              <div
                className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 transition-all duration-500"
                style={{
                  width: `${Math.max(
                    0,
                    (currentStepIndex /
                      (timelineSteps.length - 1)) *
                      100
                  )}%`,
                }}
              />

              <div className="relative flex justify-between">
                {timelineSteps.map((step, index) => {
                  const isCompleted =
                    index <= currentStepIndex;

                  const isCurrent =
                    index === currentStepIndex;

                  return (
                    <div
                      key={step.status}
                      className="flex flex-col items-center"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors ${
                          isCompleted
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        } ${
                          isCurrent
                            ? "ring-4 ring-primary/20"
                            : ""
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-current" />
                        )}
                      </div>

                      <span
                        className={`mt-3 text-sm font-medium ${
                          isCompleted
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4"
                >
                  <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden shrink-0">
                    {item.productImage && (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {item.quantity}x{" "}
                        {item.productName}
                      </span>

                      <span className="font-bold">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>

                    {item.variantName && (
                      <p className="text-sm text-muted-foreground">
                        Size: {item.variantName}
                      </p>
                    )}

                    {item.addonNames &&
                      item.addonNames.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Add-ons:{" "}
                          {item.addonNames.join(", ")}
                        </p>
                      )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {order.paymentMethod ===
            "bank_transfer" &&
            order.paymentStatus === "pending" && (
              <Card className="border-primary/50 shadow-md">
                <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Payment Required
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-6">
                  <p className="mb-6 text-muted-foreground">
                    You selected Bank Transfer.
                    Please make your payment to
                    the account details provided
                    during checkout, then click
                    the button below to notify us.
                  </p>

                  <Button
                    className="w-full h-12 text-lg"
                    onClick={handleConfirmPayment}
                    disabled={
                      confirmPaymentMutation.isPending
                    }
                  >
                    {confirmPaymentMutation.isPending
                      ? "Confirming..."
                      : "I Have Made Payment"}
                  </Button>
                </CardContent>
              </Card>
            )}
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Subtotal
                  </span>

                  <span>
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Delivery Fee
                  </span>

                  <span>
                    {formatCurrency(order.deliveryFee)}
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>

                <span className="text-primary">
                  {formatCurrency(order.total)}
                </span>
              </div>

              <div className="mt-6 pt-4 border-t border-border space-y-3">
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                    Payment Method
                  </span>

                  <p className="font-medium mt-1">
                    {order.paymentMethod ===
                    "cash_on_delivery"
                      ? "Cash on Delivery"
                      : "Bank Transfer"}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                    Payment Status
                  </span>

                  <div>
                    <Badge
                      variant={
                        order.paymentStatus ===
                        "confirmed"
                          ? "default"
                          : "secondary"
                      }
                      className="mt-1"
                    >
                      {getStatusLabel(
                        order.paymentStatus
                      )}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Delivery Info
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                  Address
                </span>

                <p className="font-medium mt-1 text-sm leading-relaxed">
                  {order.deliveryAddress}
                </p>

                <p className="text-sm text-muted-foreground mt-1">
                  Zone: {order.deliveryZoneName}
                </p>
              </div>

              {order.deliveryNotes && (
                <div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                    Notes
                  </span>

                  <p className="font-medium mt-1 text-sm">
                    {order.deliveryNotes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}