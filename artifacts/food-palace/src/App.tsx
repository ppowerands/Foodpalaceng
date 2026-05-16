import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";

// Pages
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Menu from "@/pages/Menu";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import OrderTracking from "@/pages/OrderTracking";
import Favorites from "@/pages/Favorites";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminLogin from "@/pages/AdminLogin";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminOrders from "@/pages/admin/Orders";
import AdminMenu from "@/pages/admin/Menu";
import AdminCategories from "@/pages/admin/Categories";
import AdminDelivery from "@/pages/admin/Delivery";
import AdminSettings from "@/pages/admin/Settings";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <MainLayout><Home /></MainLayout>} />
      <Route path="/menu" component={() => <MainLayout><Menu /></MainLayout>} />
      <Route path="/product/:id" component={() => <MainLayout><ProductDetail /></MainLayout>} />
      <Route path="/cart" component={() => <MainLayout><ProtectedRoute><Cart /></ProtectedRoute></MainLayout>} />
      <Route path="/checkout" component={() => <MainLayout><ProtectedRoute><Checkout /></ProtectedRoute></MainLayout>} />
      <Route path="/orders" component={() => <MainLayout><ProtectedRoute><Orders /></ProtectedRoute></MainLayout>} />
      <Route path="/order/:id" component={() => <MainLayout><ProtectedRoute><OrderTracking /></ProtectedRoute></MainLayout>} />
      <Route path="/favorites" component={() => <MainLayout><ProtectedRoute><Favorites /></ProtectedRoute></MainLayout>} />
      <Route path="/login" component={() => <MainLayout><Login /></MainLayout>} />
      <Route path="/register" component={() => <MainLayout><Register /></MainLayout>} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminLogin} />
      <Route path="/admin/dashboard" component={() => <AdminLayout><AdminRoute><AdminDashboard /></AdminRoute></AdminLayout>} />
      <Route path="/admin/orders" component={() => <AdminLayout><AdminRoute><AdminOrders /></AdminRoute></AdminLayout>} />
      <Route path="/admin/menu" component={() => <AdminLayout><AdminRoute><AdminMenu /></AdminRoute></AdminLayout>} />
      <Route path="/admin/categories" component={() => <AdminLayout><AdminRoute><AdminCategories /></AdminRoute></AdminLayout>} />
      <Route path="/admin/delivery" component={() => <AdminLayout><AdminRoute><AdminDelivery /></AdminRoute></AdminLayout>} />
      <Route path="/admin/settings" component={() => <AdminLayout><AdminRoute><AdminSettings /></AdminRoute></AdminLayout>} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="food-palace-theme">
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
