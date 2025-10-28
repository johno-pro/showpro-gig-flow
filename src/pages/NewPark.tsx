import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ParkForm } from "@/components/ParkForm";

export default function NewPark() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/parks")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Park</h1>
          <p className="text-muted-foreground">Add a new holiday park</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Park Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ParkForm
            onSuccess={() => navigate("/parks")}
            onCancel={() => navigate("/parks")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
