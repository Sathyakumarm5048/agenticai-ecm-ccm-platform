import React, { useEffect, useState } from "react";

type StepType = "trigger" | "connector" | "agent" | "decision" | "complete";

type WorkflowStep = {
  id: string;
  name: string;
  description?: string;
  type: StepType;
  connectorType?: string;
};

const createEmptyStep = (): WorkflowStep => ({
  id: crypto.randomUUID(),
  name: "",
  description: "",
  type: "connector",
  connectorType: "",
});

const WorkflowBuilder: React.FC = () => {
  const [workflowName, setWorkflowName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [published, setPublished] = useState(false);

  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<WorkflowStep>(createEmptyStep());

  useEffect(() => {
    if (!selectedStepId) {
      setEditingStep(createEmptyStep());
      return;
    }
    const found = steps.find((s) => s.id === selectedStepId);
    if (found) setEditingStep({ ...found });
  }, [selectedStepId, steps]);

  const isEditingExisting = !!selectedStepId;

  function handleChangeStepField<K extends keyof WorkflowStep>(
    key: K,
    value: WorkflowStep[K]
  ) {
    setEditingStep((prev) => ({ ...prev, [key]: value }));
  }

  function handleAddStepClick() {
    setSelectedStepId(null);
    setEditingStep(createEmptyStep());
  }

  function handleSaveStep() {
    const stepToSave: WorkflowStep = {
      ...editingStep,
      name: editingStep.name.trim() || "Untitled Step",
    };

    if (isEditingExisting) {
      setSteps((prev) =>
        prev.map((s) => (s.id === stepToSave.id ? stepToSave : s))
      );
    } else {
      setSteps((prev) => [...prev, stepToSave]);
    }

    setSelectedStepId(stepToSave.id);
  }

  function handleClearSelection() {
    setSelectedStepId(null);
    setEditingStep(createEmptyStep());
  }

  function handleSelectStepFromCanvas(id: string) {
    setSelectedStepId(id);
  }

  function handleSaveWorkflow() {
    console.log("Saving workflow:", {
      workflowName,
      description,
      enabled,
      published,
      steps,
    });
  }

  const isSaveStepDisabled =
    !editingStep.name.trim() && !editingStep.description?.trim();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* HEADER */}
      <div className="flex justify-between items-center px-6 py-4 border-b bg-white shadow-sm">
        <div>
          <h2 className="text-2xl font-bold">AgenticAI Design Studio</h2>
          <p className="text-sm text-gray-500">
            Workflow authoring and orchestration
          </p>
        </div>

        <div className="flex gap-3">
          <button className="ds-btn-secondary">Back to Workflows</button>
          <button className="ds-btn-primary">Test Workflow</button>
          <button onClick={handleSaveWorkflow} className="ds-btn-success">
            Save Workflow
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 p-6 gap-6 overflow-hidden">
        {/* LEFT CARD — Workflow + Step Editor */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Workflow Details */}
          <div className="ds-card flex flex-col gap-4">
            <h3 className="text-xl font-semibold">New Workflow</h3>

            <label className="ds-label">
              Workflow Name
              <input
                type="text"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Enter workflow name"
                className="ds-input"
              />
            </label>

            <label className="ds-label">
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this workflow"
                className="ds-textarea"
              />
            </label>

            <div className="flex gap-6 mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                Enabled
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                />
                Published
              </label>
            </div>
          </div>

          {/* STEP EDITOR */}
          <div className="ds-card flex flex-col gap-4 flex-1">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-semibold">Step Editor</h4>
              <button
                type="button"
                onClick={handleAddStepClick}
                className="ds-btn-primary"
              >
                Add Step
              </button>
            </div>

            <label className="ds-label">
              Step Name
              <input
                type="text"
                value={editingStep.name}
                onChange={(e) => handleChangeStepField("name", e.target.value)}
                placeholder="Enter step name"
                className="ds-input"
              />
            </label>

            <label className="ds-label">
              Description
              <textarea
                value={editingStep.description}
                onChange={(e) =>
                  handleChangeStepField("description", e.target.value)
                }
                placeholder="Describe this step"
                className="ds-textarea"
              />
            </label>

            <label className="ds-label">
              Step Type
              <select
                value={editingStep.type}
                onChange={(e) =>
                  handleChangeStepField("type", e.target.value as StepType)
                }
                className="ds-select"
              >
                <option value="trigger">Trigger</option>
                <option value="connector">Connector</option>
                <option value="agent">Agent</option>
                <option value="decision">Decision</option>
                <option value="complete">Complete</option>
              </select>
            </label>

            {editingStep.type === "connector" && (
              <label className="ds-label">
                Connector Type
                <input
                  type="text"
                  value={editingStep.connectorType || ""}
                  onChange={(e) =>
                    handleChangeStepField("connectorType", e.target.value)
                  }
                  placeholder="e.g., SharePoint, Exstream"
                  className="ds-input"
                />
              </label>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={handleSaveStep}
                disabled={isSaveStepDisabled}
                className={
                  isSaveStepDisabled ? "ds-btn-disabled" : "ds-btn-success"
                }
              >
                Save Step
              </button>

              <button
                type="button"
                onClick={handleClearSelection}
                className="ds-btn-secondary"
              >
                Clear Selection
              </button>
            </div>

            {isEditingExisting && (
              <div className="mt-1 text-xs text-gray-500">
                Editing existing step:{" "}
                <b>{steps.find((s) => s.id === selectedStepId)?.name}</b>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CARD — Workflow Steps */}
        <div className="flex-1">
          <div className="ds-card h-full flex flex-col">
            <h3 className="text-xl font-semibold mb-2">Workflow Steps</h3>
            <p className="text-sm text-gray-500 mb-4">
              Click a step to edit it in the Step Editor.
            </p>

            <div className="flex-1 overflow-y-auto">
              {steps.length === 0 && (
                <div className="text-sm text-gray-400">
                  No steps yet. Use &quot;Add Step&quot; to create one.
                </div>
              )}

              <ul className="space-y-2">
                {steps.map((step) => (
                  <li
                    key={step.id}
                    onClick={() => handleSelectStepFromCanvas(step.id)}
                    className={`cursor-pointer px-4 py-2 rounded-lg border 
                      ${
                        step.id === selectedStepId
                          ? "bg-blue-50 border-blue-300"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    <b>{step.name}</b>{" "}
                    <span className="text-xs text-gray-500">({step.type})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilder;