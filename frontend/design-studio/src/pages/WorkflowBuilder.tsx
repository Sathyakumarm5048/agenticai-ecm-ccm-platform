import { useEffect, useState, useMemo } from "react";
import { Box, Button, Card, TextField, Typography, Checkbox, FormControlLabel } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../state/hooks";
import {
  createWorkflow,
  updateWorkflow,
  loadWorkflowById,
  clearCurrentWorkflow,
} from "../state/workflowSlice";
import { WorkflowDefinition, WorkflowStep, StepType } from "@shared/types";

const emptyStep = (): WorkflowStep => ({
  step_id: crypto.randomUUID(),
  name: "",
  description: "",
  step_type: "connector",
  order: 0,
  config: {},
});

export default function WorkflowBuilder(): JSX.Element {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { currentWorkflow, loading, saving } = useAppSelector((s) => s.workflows);

  const [workflowName, setWorkflowName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [published, setPublished] = useState(false);

  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<WorkflowStep>(emptyStep());

  // -----------------------------
  // LOAD WORKFLOW IF EDITING
  // -----------------------------
  useEffect(() => {
    if (workflowId && workflowId !== "new") {
      dispatch(loadWorkflowById(workflowId));
    } else {
      dispatch(clearCurrentWorkflow());
    }
  }, [workflowId]);

  // -----------------------------
  // POPULATE UI WHEN WORKFLOW LOADED
  // -----------------------------
  useEffect(() => {
    if (currentWorkflow) {
      setWorkflowName(currentWorkflow.name);
      setDescription(currentWorkflow.description ?? "");
      setEnabled(currentWorkflow.enabled);
      setPublished(currentWorkflow.published);
      setSteps(currentWorkflow.steps);
    }
  }, [currentWorkflow]);

  // -----------------------------
  // STEP EDITOR LOGIC
  // -----------------------------
  useEffect(() => {
    if (!selectedStepId) {
      setEditingStep(emptyStep());
      return;
    }
    const found = steps.find((s) => s.step_id === selectedStepId);
    if (found) setEditingStep({ ...found });
  }, [selectedStepId, steps]);

  const isEditingExisting = !!selectedStepId;

  const handleChangeStepField = <K extends keyof WorkflowStep>(
    key: K,
    value: WorkflowStep[K]
  ) => {
    setEditingStep((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddStep = () => {
    setSelectedStepId(null);
    setEditingStep(emptyStep());
  };

  const handleSaveStep = () => {
    const stepToSave: WorkflowStep = {
      ...editingStep,
      name: editingStep.name.trim() || "Untitled Step",
      order: steps.length,
    };

    if (isEditingExisting) {
      setSteps((prev) =>
        prev.map((s) => (s.step_id === stepToSave.step_id ? stepToSave : s))
      );
    } else {
      setSteps((prev) => [...prev, stepToSave]);
    }

    setSelectedStepId(stepToSave.step_id);
  };

  const handleClearSelection = () => {
    setSelectedStepId(null);
    setEditingStep(emptyStep());
  };

  // -----------------------------
  // SAVE WORKFLOW
  // -----------------------------
  const handleSaveWorkflow = async () => {
    const payload: WorkflowDefinition = {
      id: currentWorkflow?.id ?? crypto.randomUUID(),
      workflow_id: currentWorkflow?.workflow_id ?? crypto.randomUUID(),
      name: workflowName.trim(),
      description,
      version: currentWorkflow?.version ?? 1,
      steps,
      trigger_events: currentWorkflow?.trigger_events ?? ["manual"],
      enabled,
      guardrails: [],
      requires_approval: false,
      approval_roles: [],
      created_by: currentWorkflow?.created_by ?? "local",
      created_at: currentWorkflow?.created_at ?? new Date().toISOString(),
      modified_at: new Date().toISOString(),
      published,
    };

    if (currentWorkflow) {
      await dispatch(updateWorkflow(payload));
    } else {
      await dispatch(createWorkflow(payload));
    }

    navigate("/");
  };

  const isSaveStepDisabled =
    !editingStep.name.trim() && !editingStep.description?.trim();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 3 }}>
      {/* HEADER */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4">Workflow Builder</Typography>
          <Typography variant="body2" color="text.secondary">
            Create and orchestrate workflow steps
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate("/")}>
            Back to Workflows
          </Button>
          <Button variant="contained" color="success" onClick={handleSaveWorkflow} disabled={saving}>
            Save Workflow
          </Button>
        </Box>
      </Box>

      {/* MAIN LAYOUT */}
      <Box sx={{ display: "flex", gap: 3, flex: 1 }}>
        {/* LEFT SIDE */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Workflow Details */}
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Workflow Details
            </Typography>

            <TextField
              label="Workflow Name"
              fullWidth
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={<Checkbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
              label="Enabled"
            />

            <FormControlLabel
              control={<Checkbox checked={published} onChange={(e) => setPublished(e.target.checked)} />}
              label="Published"
            />
          </Card>

          {/* STEP EDITOR */}
          <Card sx={{ p: 3, flex: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography variant="h6">Step Editor</Typography>
              <Button variant="contained" onClick={handleAddStep}>
                Add Step
              </Button>
            </Box>

            <TextField
              label="Step Name"
              fullWidth
              value={editingStep.name}
              onChange={(e) => handleChangeStepField("name", e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={2}
              value={editingStep.description}
              onChange={(e) => handleChangeStepField("description", e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              label="Step Type"
              select
              fullWidth
              SelectProps={{ native: true }}
              value={editingStep.step_type}
              onChange={(e) =>
                handleChangeStepField("step_type", e.target.value as StepType)
              }
              sx={{ mb: 2 }}
            >
              <option value="connector">Connector</option>
              <option value="agent">Agent</option>
              <option value="branch">Branch</option>
            </TextField>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="contained"
                color="success"
                onClick={handleSaveStep}
                disabled={isSaveStepDisabled}
              >
                Save Step
              </Button>

              <Button variant="outlined" onClick={handleClearSelection}>
                Clear Selection
              </Button>
            </Box>

            {isEditingExisting && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Editing: {steps.find((s) => s.step_id === selectedStepId)?.name}
              </Typography>
            )}
          </Card>
        </Box>

        {/* RIGHT SIDE — Step List */}
        <Box sx={{ flex: 1 }}>
          <Card sx={{ p: 3, height: "100%", overflowY: "auto" }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Workflow Steps
            </Typography>

            {steps.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No steps yet. Add one to begin.
              </Typography>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {steps.map((step) => (
                <Box
                  key={step.step_id}
                  onClick={() => setSelectedStepId(step.step_id)}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor:
                      step.step_id === selectedStepId ? "primary.main" : "grey.300",
                    backgroundColor:
                      step.step_id === selectedStepId ? "primary.light" : "white",
                    cursor: "pointer",
                  }}
                >
                  <Typography variant="subtitle2">{step.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {step.step_type}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}