import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { SupplierForm } from "@/components/SupplierForm";

export default function NewSupplier() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/suppliers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Supplier</h1>
          <p className="text-muted-foreground">Add a new supplier to your network</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Details</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierForm
            onSuccess={() => navigate("/suppliers")}
            onCancel={() => navigate("/suppliers")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
