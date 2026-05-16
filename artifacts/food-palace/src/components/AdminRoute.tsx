import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { LoadingScreen } from "@/components/ui/loading-screen";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAdmin) {
    setLocation("/admin/login");
    return null;
  }

  return <>{children}</>;
}
