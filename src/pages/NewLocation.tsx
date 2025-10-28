import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { LocationForm } from "@/components/LocationForm";

export default function NewLocation() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/locations")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Location</h1>
          <p className="text-muted-foreground">Add a new holiday location</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Location Details</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationForm
            onSuccess={() => navigate("/locations")}
            onCancel={() => navigate("/locations")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
