import { Loader2 } from "lucide-react";

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground font-body text-sm">Loading...</p>
      </div>
    </div>
  );
}
