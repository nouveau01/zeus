"use client";

import { useState, useEffect, useCallback } from "react";
import { usePicklistValues, PicklistOption } from "./usePicklistValues";

interface WorkflowRule {
  fromStatus: string;
  toStatus: string;
  requiresNote: boolean;
  requiresProfile?: string;
}

interface StatusTransition {
  toStatus: string;
  toLabel: string;
  toColor?: string;
  requiresNote: boolean;
  requiresProfile?: string;
}

interface UseStatusWorkflowResult {
  allStatuses: PicklistOption[];
  getTransitions: (fromStatus: string) => StatusTransition[];
  canTransition: (fromStatus: string, toStatus: string) => boolean;
  getInitialStatuses: () => StatusTransition[];
  isLoading: boolean;
}

export function useStatusWorkflow(pageId: string): UseStatusWorkflowResult {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);

  const {
    options: allStatuses,
    getLabel,
    getColor,
    isLoading: statusesLoading,
  } = usePicklistValues(pageId, "status");

  // Fetch workflow transition rules from the API
  const fetchWorkflow = useCallback(async () => {
    if (!pageId) {
      setRules([]);
      setRulesLoading(false);
      return;
    }

    setRulesLoading(true);
    try {
      const response = await fetch(
        `/api/status-workflows?pageId=${encodeURIComponent(pageId)}`
      );

      if (response.ok) {
        const data: WorkflowRule[] = await response.json();
        setRules(data);
      } else {
        console.error(
          `Failed to fetch status workflows for ${pageId}:`,
          response.status
        );
        setRules([]);
      }
    } catch (error) {
      console.error(
        `Error fetching status workflows for ${pageId}:`,
        error
      );
      setRules([]);
    } finally {
      setRulesLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  // Build transitions from matching rules, enriched with labels/colors from picklist
  const buildTransitions = useCallback(
    (matchingRules: WorkflowRule[]): StatusTransition[] => {
      return matchingRules.map((rule) => ({
        toStatus: rule.toStatus,
        toLabel: getLabel(rule.toStatus),
        toColor: getColor(rule.toStatus),
        requiresNote: rule.requiresNote,
        requiresProfile: rule.requiresProfile,
      }));
    },
    [getLabel, getColor]
  );

  // Get valid next statuses from a given current status
  const getTransitions = useCallback(
    (fromStatus: string): StatusTransition[] => {
      const matching = rules.filter((r) => r.fromStatus === fromStatus);
      return buildTransitions(matching);
    },
    [rules, buildTransitions]
  );

  // Check if a specific fromStatus -> toStatus transition is valid
  const canTransition = useCallback(
    (fromStatus: string, toStatus: string): boolean => {
      return rules.some(
        (r) => r.fromStatus === fromStatus && r.toStatus === toStatus
      );
    },
    [rules]
  );

  // Get statuses available from "_initial" (for new records)
  const getInitialStatuses = useCallback((): StatusTransition[] => {
    const matching = rules.filter((r) => r.fromStatus === "_initial");
    return buildTransitions(matching);
  }, [rules, buildTransitions]);

  return {
    allStatuses,
    getTransitions,
    canTransition,
    getInitialStatuses,
    isLoading: rulesLoading || statusesLoading,
  };
}
