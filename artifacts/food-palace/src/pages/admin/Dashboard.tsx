import { useGetAnalytics, useGetDailyRevenue, useGetBestSellers } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, ShoppingBag, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { data: analytics, isLoading: loadingAnalytics } = useGetAnalytics();
  const { data: dailyRevenue, isLoading: loadingRevenue } = useGetDailyRevenue();
  const { data: bestSellers, isLoading: loadingBestSellers } = useGetBestSellers();

  if (loadingAnalytics || loadingRevenue || loadingBestSellers) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics?.totalRevenue || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Revenue</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(analytics?.todayRevenue || 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{analytics?.pendingOrders || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {dailyRevenue && dailyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyRevenue} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => format(new Date(val), 'MMM d')}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tickFormatter={(val) => `₦${val/1000}k`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best Sellers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {bestSellers && bestSellers.length > 0 ? (
                bestSellers.map((product) => (
                  <div key={product.productId} className="flex items-center">
                    <div className="w-12 h-12 rounded-md bg-muted overflow-hidden mr-4">
                      {product.productImage && (
                        <img src={product.productImage} alt={product.productName} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{product.productName}</p>
                      <p className="text-xs text-muted-foreground">{product.orderCount} orders</p>
                    </div>
                    <div className="font-medium text-sm">
                      {formatCurrency(product.revenue)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">No sales data yet</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
