import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Briefcase, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DepartmentForm } from "@/components/DepartmentForm";

export default function Departments() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<string | undefined>();
  const [deletingDepartment, setDeletingDepartment] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredDepartments(departments);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredDepartments(
        departments.filter(
          (dept) =>
            dept.name.toLowerCase().includes(query) ||
            dept.clients?.name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, departments]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select(`
          *,
          clients:clients(name),
          contacts:contacts(count)
        `)
        .order("name");

      if (error) throw error;
      setDepartments(data || []);
      setFilteredDepartments(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch departments");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("departments").delete().eq("id", id);

      if (error) throw error;
      toast.success("Department deleted successfully");
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete department");
      console.error("Error:", error);
    } finally {
      setDeletingDepartment(null);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setShowDialog(false);
      setEditingDepartment(undefined);
    }
  };

  const handleSuccess = () => {
    setShowDialog(false);
    setEditingDepartment(undefined);
    fetchDepartments();
  };

  if (loading) {
    return <div className="text-center">Loading departments...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-muted-foreground">Manage client departments</p>
        </div>
        <Button className="gap-2" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4" />
          New Department
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Departments ({filteredDepartments.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDepartments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">
                {searchQuery ? "No departments found" : "No departments yet"}
              </h3>
              <p className="mb-4 text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Get started by adding your first department"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setShowDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Add Department
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDepartments.map((dept) => (
                <div
                  key={dept.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{dept.name}</p>
                      {dept.clients && (
                        <span className="rounded-md bg-secondary px-2 py-1 text-sm text-muted-foreground">
                          {dept.clients.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {dept.contacts?.[0]?.count || 0} contacts
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingDepartment(dept.id);
                        setShowDialog(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingDepartment(dept.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDepartment ? "Edit Department" : "New Department"}
            </DialogTitle>
          </DialogHeader>
          <DepartmentForm
            departmentId={editingDepartment}
            onSuccess={handleSuccess}
            onCancel={() => handleDialogClose(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deletingDepartment !== null}
        onOpenChange={(open) => !open && setDeletingDepartment(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this department. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingDepartment && handleDelete(deletingDepartment)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
