import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export function LoadingSpinner({ text = "Loading...", className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export function FullPageSpinner({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
