import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, Download, Eye, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getDocumentSignedUrl, deleteDocument, type Document } from "@/lib/documents";
import { PdfViewerModal } from "./PdfViewerModal";

interface DocumentsListProps {
  documents: Document[];
  onRefresh: () => void;
  loading?: boolean;
}

export function DocumentsList({ documents, onRefresh, loading }: DocumentsListProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handlePreview = async (doc: Document) => {
    const url = await getDocumentSignedUrl(doc.storage_path);
    if (url) {
      setPreviewUrl(url);
      setPreviewTitle(doc.filename);
      setPreviewOpen(true);
    } else {
      toast.error("Failed to load document preview");
    }
  };

  const handleDownload = async (doc: Document) => {
    const url = await getDocumentSignedUrl(doc.storage_path);
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.error("Failed to download document");
    }
  };

  const handleDelete = async (doc: Document) => {
    setDeleting(doc.id);
    const result = await deleteDocument(doc.id, doc.storage_path);
    setDeleting(null);
    
    if (result.success) {
      toast.success("Document deleted");
      onRefresh();
    } else {
      toast.error(result.error || "Failed to delete document");
    }
  };

  const formatDocType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No documents saved yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Filename</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Job No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.filename}</TableCell>
                  <TableCell>{formatDocType(doc.doc_type)}</TableCell>
                  <TableCell className="font-mono text-sm">{doc.job_number}</TableCell>
                  <TableCell>
                    {new Date(doc.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handlePreview(doc)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(doc)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deleting === doc.id}
                            title="Delete"
                          >
                            {deleting === doc.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{doc.filename}" from the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(doc)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PdfViewerModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        pdfUrl={previewUrl}
        title={previewTitle}
        canSave={false}
      />
    </>
  );
}
