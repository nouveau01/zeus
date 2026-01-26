"use client";

import { useState, useCallback, useEffect } from "react";

interface UseUnsavedChangesOptions {
  onSave?: () => Promise<void> | void;
  initialDirty?: boolean;
}

interface UseUnsavedChangesReturn {
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  markDirty: () => void;
  markClean: () => void;
  confirmNavigation: (callback: () => void) => void;
  showDialog: boolean;
  pendingAction: (() => void) | null;
  handleDialogSave: () => Promise<void>;
  handleDialogDiscard: () => void;
  handleDialogCancel: () => void;
}

export function useUnsavedChanges(options: UseUnsavedChangesOptions = {}): UseUnsavedChangesReturn {
  const { onSave, initialDirty = false } = options;

  const [isDirty, setIsDirty] = useState(initialDirty);
  const [showDialog, setShowDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const markClean = useCallback(() => {
    setIsDirty(false);
  }, []);

  // Confirm navigation - shows dialog if dirty, otherwise executes immediately
  const confirmNavigation = useCallback((callback: () => void) => {
    if (isDirty) {
      setPendingAction(() => callback);
      setShowDialog(true);
    } else {
      callback();
    }
  }, [isDirty]);

  // Handle "Save" in dialog
  const handleDialogSave = useCallback(async () => {
    if (onSave) {
      try {
        await onSave();
        setIsDirty(false);
        setShowDialog(false);
        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
      } catch (error) {
        console.error("Error saving:", error);
        // Keep dialog open on error
      }
    }
  }, [onSave, pendingAction]);

  // Handle "Don't Save" / "Discard" in dialog
  const handleDialogDiscard = useCallback(() => {
    setIsDirty(false);
    setShowDialog(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  // Handle "Cancel" in dialog
  const handleDialogCancel = useCallback(() => {
    setShowDialog(false);
    setPendingAction(null);
  }, []);

  // Warn on browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  return {
    isDirty,
    setIsDirty,
    markDirty,
    markClean,
    confirmNavigation,
    showDialog,
    pendingAction,
    handleDialogSave,
    handleDialogDiscard,
    handleDialogCancel,
  };
}
