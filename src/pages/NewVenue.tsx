import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { VenueForm } from "@/components/VenueForm";

export default function NewVenue() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/venues")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Venue</h1>
          <p className="text-muted-foreground">Add a new venue</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Venue Details</CardTitle>
        </CardHeader>
        <CardContent>
          <VenueForm
            onSuccess={() => navigate("/venues")}
            onCancel={() => navigate("/venues")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
