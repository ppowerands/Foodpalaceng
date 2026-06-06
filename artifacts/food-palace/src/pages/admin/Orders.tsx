import { useState } from "react";
import {
  useAdminListOrders,
  useUpdateOrderStatus,
  useUpdatePaymentStatus,
  getAdminListOrdersQueryKey,
} from "@workspace/api-client-react";

import { useQueryClient } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

import { format } from "date-fns";

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";

    case "preparing":
      return "bg-blue-100 text-blue-800";

    case "out_for_delivery":
      return "bg-purple-100 text-purple-800";

    case "delivered":
      return "bg-green-100 text-green-800";

    case "cancelled":
      return "bg-red-100 text-red-800";

    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { toast } = useToast();

  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useAdminListOrders({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const updateStatusMutation = useUpdateOrderStatus();

  const updatePaymentMutation = useUpdatePaymentStatus();

  const handleStatusChange = (
    orderId: number,
    status: string
  ) => {
    updateStatusMutation.mutate(
      {
        id: orderId,
        data: { status },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getAdminListOrdersQueryKey(),
          });

          toast({
            title: "Order status updated",
          });
        },
      }
    );
  };

  const handlePaymentChange = (
    orderId: number,
    paymentStatus: string
  ) => {
    updatePaymentMutation.mutate(
      {
        id: orderId,
        data: { paymentStatus },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getAdminListOrdersQueryKey(),
          });

          toast({
            title: "Payment status updated",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">
          Orders
        </h1>

        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">
              All Orders
            </SelectItem>

            <SelectItem value="pending">
              Pending
            </SelectItem>

            <SelectItem value="preparing">
              Preparing
            </SelectItem>

            <SelectItem value="out_for_delivery">
              Out for Delivery
            </SelectItem>

            <SelectItem value="delivered">
              Delivered
            </SelectItem>

            <SelectItem value="cancelled">
              Cancelled
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  Order ID
                </TableHead>

                <TableHead>
                  Date
                </TableHead>

                <TableHead>
                  Customer
                </TableHead>

                <TableHead>
                  Total
                </TableHead>

                <TableHead>
                  Status
                </TableHead>

                <TableHead>
                  Payment
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : !orders || orders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.id}
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {format(
                        new Date(order.createdAt),
                        "MMM d, yyyy h:mm a"
                      )}
                    </TableCell>

                    <TableCell>
                      {order.customerName}
                    </TableCell>

                    <TableCell className="font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>

                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) =>
                          handleStatusChange(
                            order.id,
                            value
                          )
                        }
                        disabled={
                          updateStatusMutation.isPending
                        }
                      >
                        <SelectTrigger
                          className={`w-[170px] h-8 text-xs ${getStatusColor(
                            order.status
                          )}`}
                        >
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="pending">
                            Pending
                          </SelectItem>

                          <SelectItem value="preparing">
                            Preparing
                          </SelectItem>

                          <SelectItem value="out_for_delivery">
                            Out for Delivery
                          </SelectItem>

                          <SelectItem value="delivered">
                            Delivered
                          </SelectItem>

                          <SelectItem value="cancelled">
                            Cancelled
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      <Select
                        value={order.paymentStatus}
                        onValueChange={(value) =>
                          handlePaymentChange(
                            order.id,
                            value
                          )
                        }
                        disabled={
                          updatePaymentMutation.isPending
                        }
                      >
                        <SelectTrigger
                          className={`w-[190px] h-8 text-xs ${
                            order.paymentStatus ===
                            "confirmed"
                              ? "bg-green-100 text-green-800"
                              : order.paymentStatus ===
                                "awaiting_confirmation"
                              ? "bg-yellow-100 text-yellow-800"
                              : order.paymentStatus ===
                                "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="pending">
                            Pending
                          </SelectItem>

                          <SelectItem value="awaiting_confirmation">
                            Awaiting Confirmation
                          </SelectItem>

                          <SelectItem value="confirmed">
                            Confirmed
                          </SelectItem>

                          <SelectItem value="rejected">
                            Rejected
                          </SelectItem>
                        </SelectContent>
                      </Select>
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
