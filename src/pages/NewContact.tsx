import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";

export default function NewContact() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/contacts")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">New Contact</h1>
          <p className="text-muted-foreground">Add a new contact to your directory</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactForm
            onSuccess={() => navigate("/contacts")}
            onCancel={() => navigate("/contacts")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
