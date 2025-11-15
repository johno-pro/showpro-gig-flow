import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export type DraftStatus = "idle" | "saving" | "saved" | "error";

interface DraftIndicatorProps {
  status: DraftStatus;
}

export function DraftIndicator({ status }: DraftIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status === "saving" || status === "saved" || status === "error") {
      setVisible(true);

      if (status === "saved") {
        const timer = setTimeout(() => setVisible(false), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [status]);

  if (!visible || status === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 text-sm">
      {status === "saving" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-green-600">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-destructive">Error</span>
        </>
      )}
    </div>
  );
}
import { Badge } from "@/components/ui/badge";

interface DraftIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
}

export function DraftIndicator({ status }: DraftIndicatorProps) {
  switch (status) {
    case "saving":
      return <Badge variant="secondary">Saving...</Badge>;
    case "saved":
      return <Badge variant="default">Saved!</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
    default:
      return null;
  }
}
