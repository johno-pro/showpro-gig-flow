import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ArtistForm } from "@/components/ArtistForm";

export default function NewArtist() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/artists")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Artist</h1>
          <p className="text-muted-foreground">Add a new artist or act to your roster</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Artist Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ArtistForm
            onSuccess={() => navigate("/artists")}
            onCancel={() => navigate("/artists")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
