import { useState, useEffect } from "react";

/**
 * Hook to manage tab state with localStorage persistence
 * @param storageKey - Unique key for localStorage
 * @param defaultTab - Default tab value
 * @returns [activeTab, setActiveTab]
 */
export function usePersistentTab(storageKey: string, defaultTab: string) {
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored || defaultTab;
    } catch {
      return defaultTab;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, activeTab);
    } catch (error) {
      console.error("Failed to save tab state:", error);
    }
  }, [activeTab, storageKey]);

  return [activeTab, setActiveTab] as const;
}
