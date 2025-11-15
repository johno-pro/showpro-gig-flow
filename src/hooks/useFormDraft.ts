import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseFormDraftOptions<FormValues> {
  table: string;
  form: any; // react-hook-form
}

export function useFormDraft<FormValues>({ table, form }: UseFormDraftOptions<FormValues>) {
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const draftIdRef = useRef<string | null>(null);
  const initDone = useRef(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const loadLatestDraft = async () => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("status", "draft")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return;

      if (data) {
        draftIdRef.current = data.id;
        form.reset(data);
        return;
      }

      // Create new empty draft
      const { data: newDraft } = await supabase
        .from(table)
        .insert([{ status: "draft" }])
        .select()
        .single();

      if (newDraft) draftIdRef.current = newDraft.id;
    } catch {}
  };

  const saveDraft = async (values?: FormValues) => {
    if (!initDone.current) return;

    setDraftStatus("saving");
    try {
      const payload = { ...(values || form.getValues()), status: "draft" };

      if (draftIdRef.current) {
        await supabase.from(table).update(payload).eq("id", draftIdRef.current);
      } else {
        const { data } = await supabase.from(table).insert(payload).select().single();
        if (data) draftIdRef.current = data.id;
      }

      setDraftStatus("saved");
      setTimeout(() => setDraftStatus("idle"), 1200);
    } catch {
      setDraftStatus("error");
    }
  };

  const completeSave = async (values: FormValues) => {
    setDraftStatus("saving");
    try {
      const payload = { ...values, status: "active" };

      if (draftIdRef.current) {
        await supabase.from(table).update(payload).eq("id", draftIdRef.current);
      } else {
        await supabase.from(table).insert(payload);
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
    const sub = form.watch((data: FormValues) => {
      if (!initDone.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveDraft(data), 2000);
    });
    return () => sub.unsubscribe();
  }, [form.watch()]);

  return { draftStatus, saveDraft, completeSave, loadLatestDraft };
}
