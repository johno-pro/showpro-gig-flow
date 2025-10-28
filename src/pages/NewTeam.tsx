import { TeamForm } from "@/components/TeamForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function NewTeam() {
  const navigate = useNavigate();

  const createTeam = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("teams").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Team created successfully");
      navigate("/teams");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">New Team</h1>

      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TeamForm
            onSubmit={(data) => createTeam.mutate(data)}
            isSubmitting={createTeam.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
