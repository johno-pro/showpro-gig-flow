import { useState, useCallback, useEffect, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { DraftStatus } from "@/components/ui/draft-indicator";

interface UseFormDraftOptions<T> {
  table: string;
  formId?: string;
  form: UseFormReturn<T>;
}

function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function useFormDraft<T extends Record<string, any>>({
  table,
  formId,
  form,
}: UseFormDraftOptions<T>) {
  const [draftId, setDraftId] = useState<string | undefined>(formId);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("idle");

  const saveDraft = useCallback(
    async (data?: T) => {
      const formData = data || form.getValues();
      
      setDraftStatus("saving");
      
      try {
        const draftData = { ...formData, status: "draft" };

        if (draftId) {
          const { error } = await supabase
            .from(table as any)
            .update(draftData)
            .eq("id", draftId);

          if (error) throw error;
        } else {
          const { data: newDraft, error } = await supabase
            .from(table as any)
            .insert(draftData)
            .select()
            .single();

          if (error) throw error;
          setDraftId(newDraft.id);
        }

        setDraftStatus("saved");
      } catch (error: any) {
        console.error("Error saving draft:", error);
        setDraftStatus("error");
      }
    },
    [table, draftId, form]
  );

  const debouncedSave = useMemo(
    () => debounce((data: T) => saveDraft(data), 2000),
    [saveDraft]
  );

  const loadDraft = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(table as any)
        .select("*")
        .eq("status", "draft")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        form.reset(data as any);
        setDraftId(data.id);
        return data.id;
      }
    } catch (error: any) {
      console.error("Error loading draft:", error);
    }
  }, [table, form]);

  const completeSave = useCallback(
    async (data: T) => {
      const completeData = { ...data, status: "active" };

      try {
        if (draftId) {
          const { error } = await supabase
            .from(table as any)
            .update(completeData)
            .eq("id", draftId);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from(table as any)
            .insert(completeData);

          if (error) throw error;
        }

        setDraftId(undefined);
        setDraftStatus("idle");
      } catch (error: any) {
        throw error;
      }
    },
    [table, draftId]
  );

  // Watch form changes for auto-save
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (draftId || formId) {
        debouncedSave(data as T);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, debouncedSave, draftId, formId]);

  return {
    saveDraft,
    debouncedSave,
    loadDraft,
    completeSave,
    draftStatus,
    draftId,
  };
}
