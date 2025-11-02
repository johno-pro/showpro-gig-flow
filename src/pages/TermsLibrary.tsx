import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

interface TermsTemplate {
  id: string;
  template_name: string;
  category: string | null;
  body_html: string | null;
  active: boolean | null;
  last_updated: string | null;
}

export default function TermsLibrary() {
  const [templates, setTemplates] = useState<TermsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    category: "",
    active: ""
  });

  useEffect(() => {
    fetchTemplates();
  }, [filters]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("terms_templates")
        .select("*")
        .order("last_updated", { ascending: false });

      if (filters.category) {
        query = query.ilike("category", `%${filters.category}%`);
      }
      if (filters.active !== "") {
        query = query.eq("active", filters.active === "true");
      }

      const { data, error } = await query;

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch templates: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, field: string, value: any) => {
    try {
      const updates: any = { [field]: value };
      
      // Update last_updated timestamp
      if (field !== "last_updated") {
        updates.last_updated = new Date().toISOString();
      }

      const { error } = await supabase
        .from("terms_templates")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      toast.success("Updated successfully");
      fetchTemplates();
    } catch (error: any) {
      toast.error("Update failed: " + error.message);
    }
  };

  const handleBulkSetActive = async () => {
    if (selectedIds.length === 0) {
      toast.error("No templates selected");
      return;
    }

    try {
      const { error } = await supabase
        .from("terms_templates")
        .update({ active: true, last_updated: new Date().toISOString() })
        .in("id", selectedIds);

      if (error) throw error;
      
      toast.success(`${selectedIds.length} template(s) set as active`);
      setSelectedIds([]);
      fetchTemplates();
    } catch (error: any) {
      toast.error("Bulk action failed: " + error.message);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === templates.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(templates.map(t => t.id));
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Terms & Conditions Library</h1>
        
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Filter by category"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="w-64"
          />
          
          <Select
            value={filters.active}
            onValueChange={(value) => setFilters({ ...filters, active: value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Active status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex gap-2 mb-4">
            <Button onClick={handleBulkSetActive}>
              Set Default for Category ({selectedIds.length})
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length === templates.length && templates.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Body</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Last Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.includes(template.id)}
                    onCheckedChange={() => toggleSelection(template.id)}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={template.template_name || ""}
                    onChange={(e) => handleUpdate(template.id, "template_name", e.target.value)}
                    onBlur={(e) => handleUpdate(template.id, "template_name", e.target.value)}
                    className="min-w-[200px]"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={template.category || ""}
                    onChange={(e) => handleUpdate(template.id, "category", e.target.value)}
                    onBlur={(e) => handleUpdate(template.id, "category", e.target.value)}
                    className="min-w-[150px]"
                  />
                </TableCell>
                <TableCell>
                  <Textarea
                    value={template.body_html || ""}
                    onChange={(e) => handleUpdate(template.id, "body_html", e.target.value)}
                    onBlur={(e) => handleUpdate(template.id, "body_html", e.target.value)}
                    className="min-w-[400px] min-h-[100px] font-mono text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={template.active || false}
                    onCheckedChange={(checked) => handleUpdate(template.id, "active", checked)}
                  />
                </TableCell>
                <TableCell>
                  {template.last_updated ? format(new Date(template.last_updated), "PPp") : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
