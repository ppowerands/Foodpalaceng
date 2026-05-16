import { Link } from "wouter";
import { useListMyOrders } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Package, ChevronRight, Clock, Clock3, Truck, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500 hover:bg-yellow-200';
    case 'preparing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500 hover:bg-blue-200';
    case 'out_for_delivery': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-500 hover:bg-orange-200';
    case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500 hover:bg-green-200';
    case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500 hover:bg-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
}

export function getStatusLabel(status: string) {
  return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function getStatusIcon(status: string) {
  switch (status) {
    case 'pending': return <Clock className="w-4 h-4 mr-1" />;
    case 'preparing': return <Clock3 className="w-4 h-4 mr-1" />;
    case 'out_for_delivery': return <Truck className="w-4 h-4 mr-1" />;
    case 'delivered': return <CheckCircle2 className="w-4 h-4 mr-1" />;
    case 'cancelled': return <XCircle className="w-4 h-4 mr-1" />;
    default: return <Package className="w-4 h-4 mr-1" />;
  }
}

export default function Orders() {
  const { data: orders, isLoading } = useListMyOrders();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Package className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold mb-4">No orders yet</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          You haven't placed any orders. Browse our menu and treat yourself to something delicious!
        </p>
        <Link href="/menu">
          <Button size="lg">Browse Menu</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-foreground">My Orders</h1>
      
      <div className="space-y-6">
        {orders.map((order) => (
          <Link key={order.id} href={`/order/${order.id}`}>
            <Card className="hover-elevate cursor-pointer transition-all border border-border group overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-lg">Order #{order.id}</span>
                      <Badge className={`${getStatusColor(order.status)} border-none shadow-none`}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-xl text-primary">{formatCurrency(order.total)}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.items?.length || 0} items
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-border/50">
                  <div className="flex -space-x-3 overflow-hidden">
                    {order.items?.slice(0, 4).map((item, i) => (
                      <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-background bg-muted overflow-hidden">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {item.productName.charAt(0)}
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items && order.items.length > 4 && (
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full ring-2 ring-background bg-secondary text-xs font-medium">
                        +{order.items.length - 4}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm font-medium text-primary group-hover:underline">
                    View Details
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
