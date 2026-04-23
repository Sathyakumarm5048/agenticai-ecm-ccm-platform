import { useState, useCallback } from "react";
import { Workflow } from "../types/workflow.js";
import { WorkflowStep } from "../types/step.js";

export function useWorkflow(initial?: Workflow) {
  const [workflow, setWorkflow] = useState<Workflow>(
    initial || { id: "", name: "", steps: [] }
  );

  const addStep = useCallback((step: WorkflowStep) => {
    setWorkflow((prev: Workflow) => ({
      ...prev,
      steps: [...prev.steps, step],
    }));
  }, []);

  const updateStep = useCallback(
    (id: string, updates: Partial<WorkflowStep>) => {
      setWorkflow((prev: Workflow) => ({
        ...prev,
        steps: prev.steps.map((s: WorkflowStep) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      }));
    },
    []
  );

  const removeStep = useCallback((id: string) => {
    setWorkflow((prev: Workflow) => ({
      ...prev,
      steps: prev.steps.filter((s: WorkflowStep) => s.id !== id),
    }));
  }, []);

  const reset = useCallback(() => {
    setWorkflow(initial || { id: "", name: "", steps: [] });
  }, [initial]);

  return {
    workflow,
    addStep,
    updateStep,
    removeStep,
    reset,
  };
}