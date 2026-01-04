import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Save, X } from "lucide-react";

interface PdfViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string | null;
  title?: string;
  onSave?: () => void;
  onDownload?: () => void;
  saving?: boolean;
  canSave?: boolean;
}

export function PdfViewerModal({
  open,
  onOpenChange,
  pdfUrl,
  title = "PDF Preview",
  onSave,
  onDownload,
  saving = false,
  canSave = true,
}: PdfViewerModalProps) {
  if (!pdfUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b">
          <DialogTitle>{title}</DialogTitle>
          <div className="flex items-center gap-2">
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            {onSave && canSave && (
              <Button variant="default" size="sm" onClick={onSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save to System"}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 p-4 pt-2">
          <iframe
            src={pdfUrl}
            className="w-full h-full border rounded"
            title="PDF Preview"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
