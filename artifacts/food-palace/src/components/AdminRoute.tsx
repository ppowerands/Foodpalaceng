import { ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { LoadingScreen } from "@/components/ui/loading-screen";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      setLocation("/admin/login");
    }
  }, [isAdmin, isLoading, setLocation]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAdmin) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
