import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground text-sm font-medium animate-pulse">Loading Food Palace...</p>
    </div>
  );
}
