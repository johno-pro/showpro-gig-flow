import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Edit2, Save, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Artist {
  id: string;
  name: string;
  act_code: string | null;
}

interface BulkActCodeEditorProps {
  artists: Artist[];
  onSave: () => void;
}

export function BulkActCodeEditor({ artists, onSave }: BulkActCodeEditorProps) {
  const [open, setOpen] = useState(false);
  const [editedCodes, setEditedCodes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleOpen = () => {
    // Initialize with current values
    const initial: Record<string, string> = {};
    artists.forEach((a) => {
      initial[a.id] = a.act_code || "";
    });
    setEditedCodes(initial);
    setOpen(true);
  };

  const handleCodeChange = (artistId: string, value: string) => {
    // Force uppercase and limit to 3 chars
    const formatted = value.toUpperCase().slice(0, 3);
    setEditedCodes((prev) => ({ ...prev, [artistId]: formatted }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Find changed codes
      const changes = artists.filter(
        (a) => (editedCodes[a.id] || "") !== (a.act_code || "")
      );

      if (changes.length === 0) {
        toast.info("No changes to save");
        setOpen(false);
        return;
      }

      // Update each changed artist
      for (const artist of changes) {
        const newCode = editedCodes[artist.id] || null;
        const { error } = await supabase
          .from("artists")
          .update({ act_code: newCode || null })
          .eq("id", artist.id);

        if (error) throw error;
      }

      toast.success(`Updated ${changes.length} artist code(s)`);
      onSave();
      setOpen(false);
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const changedCount = artists.filter(
    (a) => (editedCodes[a.id] || "") !== (a.act_code || "")
  ).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" onClick={handleOpen}>
          <Edit2 className="h-4 w-4" />
          Bulk Edit Act Codes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Edit Artist Act Codes</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Enter 2-3 uppercase letters for each artist. These codes are used for job numbers (e.g., WAW/5001).
        </p>
        <ScrollArea className="h-[400px] pr-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artist Name</TableHead>
                <TableHead className="w-32">Act Code</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {artists.map((artist) => (
                <TableRow key={artist.id}>
                  <TableCell className="font-medium">{artist.name}</TableCell>
                  <TableCell>
                    <Input
                      value={editedCodes[artist.id] || ""}
                      onChange={(e) => handleCodeChange(artist.id, e.target.value)}
                      placeholder="e.g. WAW"
                      className="w-20 uppercase font-mono"
                      maxLength={3}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-muted-foreground">
            {changedCount} change(s) pending
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSaveAll} disabled={saving || changedCount === 0}>
              <Save className="h-4 w-4 mr-1" />
              {saving ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
