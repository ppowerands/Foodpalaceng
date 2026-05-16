import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { LoadingScreen } from "@/components/ui/loading-screen";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isLoggedIn) {
    setLocation("/login");
    return null;
  }

  return <>{children}</>;
}
