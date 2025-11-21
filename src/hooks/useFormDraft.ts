import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseFormDraftOptions {
  table: string;
  form: any; // react-hook-form
}

export function useFormDraft({ table, form }: UseFormDraftOptions) {
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const draftIdRef = useRef<string | null>(null);
  const initDone = useRef(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const loadLatestDraft = async () => {
    try {
      const { data, error } = await supabase
        .from(table as any)
        .select("*")
        .eq("status", "draft")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return;

      if (data) {
        draftIdRef.current = (data as any).id;
        form.reset(data);
        return;
      }

      // Create new empty draft - skip for now to avoid errors
      // User can save manually to create first draft
    } catch {}
  };

  const saveDraft = async (values?: any) => {
    if (!initDone.current) return;

    setDraftStatus("saving");
    try {
      const payload = { ...(values || form.getValues()), status: "draft" } as any;

      if (draftIdRef.current) {
        await supabase.from(table as any).update(payload).eq("id", draftIdRef.current);
      } else {
        const { data } = await supabase.from(table as any).insert([payload]).select().single();
        if (data) draftIdRef.current = (data as any).id;
      }

      setDraftStatus("saved");
      setTimeout(() => setDraftStatus("idle"), 1200);
    } catch {
      setDraftStatus("error");
    }
  };

  const completeSave = async (values: any) => {
    setDraftStatus("saving");
    try {
      const payload = { ...values, status: "active" } as any;

      if (draftIdRef.current) {
        await supabase.from(table as any).update(payload).eq("id", draftIdRef.current);
      } else {
        await supabase.from(table as any).insert([payload]);
      }

      setDraftStatus("saved");
      setTimeout(() => setDraftStatus("idle"), 1200);
    } catch {
      setDraftStatus("error");
    }
  };

  useEffect(() => {
    loadLatestDraft().then(() => {
      initDone.current = true;
    });
  }, []);

  useEffect(() => {
    const sub = form.watch((data: any) => {
      if (!initDone.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveDraft(data), 2000);
    });
    return () => sub.unsubscribe();
  }, [form.watch]);

  return { draftStatus, saveDraft, completeSave, loadLatestDraft };
}
