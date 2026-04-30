import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  WorkflowDefinition,
  NewWorkflowDefinition,
  ExecutionStatus,
} from "@shared/types";
import {
  createWorkflow as createWorkflowApi,
  deleteWorkflow as deleteWorkflowApi,
  fetchWorkflowById,
  fetchWorkflows,
  updateWorkflow as updateWorkflowApi,
} from "../services/workflowsApi";
import type { RootState } from "./store";

interface WorkflowState {
  workflows: WorkflowDefinition[];
  currentWorkflow: WorkflowDefinition | null;
  loading: boolean;
  saving: boolean;
  deleting: boolean;
  error: string | null;
  filter: {
    search: string;
    status: ExecutionStatus | "ALL";
  };
}

const initialState: WorkflowState = {
  workflows: [],
  currentWorkflow: null,
  loading: false,
  saving: false,
  deleting: false,
  error: null,
  filter: {
    search: "",
    status: "ALL",
  },
};

// ------------------------------
// MOCK DATA (fixed to match types)
// ------------------------------
const mockWorkflows: WorkflowDefinition[] = [
  {
    id: "wf-001",
    workflow_id: "wf-001",
    name: "Document Approval Workflow",
    description: "Automated document review and approval process",
    version: 1,
    steps: [],
    trigger_events: ["document_upload"],
    enabled: true,
    guardrails: [],
    requires_approval: true,
    approval_roles: ["legal", "compliance"],
    created_by: "system",
    created_at: "2024-01-15T10:30:00Z",
    modified_at: "2024-01-20T14:45:00Z",
    published: true,
  },
  {
    id: "wf-002",
    workflow_id: "wf-002",
    name: "Customer Onboarding",
    description: "Customer onboarding with KYC verification",
    version: 2,
    steps: [],
    trigger_events: ["customer_registration"],
    enabled: true,
    guardrails: [],
    requires_approval: false,
    approval_roles: [],
    created_by: "admin",
    created_at: "2024-02-01T09:15:00Z",
    modified_at: "2024-02-10T16:20:00Z",
    published: true,
  },
];

// ------------------------------
// THUNKS
// ------------------------------

export const loadWorkflows = createAsyncThunk<
  WorkflowDefinition[],
  void,
  { state: RootState; rejectValue: string }
>("workflows/load", async (_, thunkAPI) => {
  try {
    return await fetchWorkflows();
  } catch {
    const existing = thunkAPI.getState().workflows.workflows;
    if (existing.length > 0) return existing;

    console.warn("Backend unavailable — using mock workflows");
    return mockWorkflows;
  }
});

export const loadWorkflowById = createAsyncThunk<
  WorkflowDefinition,
  string,
  { state: RootState; rejectValue: string }
>("workflows/loadById", async (workflowId, thunkAPI) => {
  try {
    return await fetchWorkflowById(workflowId);
  } catch {
    const fallback = thunkAPI
      .getState()
      .workflows.workflows.find((w) => w.workflow_id === workflowId);

    if (fallback) return fallback;

    return thunkAPI.rejectWithValue("Unable to load workflow.");
  }
});

export const createWorkflow = createAsyncThunk<
  WorkflowDefinition,
  NewWorkflowDefinition,
  { rejectValue: string }
>("workflows/create", async (workflow) => {
  try {
    return await createWorkflowApi(workflow);
  } catch {
    console.warn("Backend unavailable — creating workflow locally");

    return {
      id: `wf-${Date.now()}`,
      workflow_id: `wf-${Date.now()}`,
      name: workflow.name,
      description: workflow.description ?? "",
      version: 1,
      steps: [],
      trigger_events: workflow.trigger_events,
      enabled: workflow.enabled ?? true,
      guardrails: workflow.guardrails ?? [],
      requires_approval: workflow.requires_approval ?? false,
      approval_roles: workflow.approval_roles ?? [],
      created_by: "local",
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
      published: false,
    };
  }
});

export const updateWorkflow = createAsyncThunk<
  WorkflowDefinition,
  WorkflowDefinition,
  { rejectValue: string }
>("workflows/update", async (workflow) => {
  try {
    return await updateWorkflowApi(workflow.workflow_id, workflow);
  } catch {
    console.warn("Backend unavailable — updating locally");

    return {
      ...workflow,
      modified_at: new Date().toISOString(),
    };
  }
});

export const deleteWorkflow = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("workflows/delete", async (workflowId) => {
  try {
    await deleteWorkflowApi(workflowId);
    return workflowId;
  } catch {
    console.warn("Backend unavailable — deleting locally");
    return workflowId;
  }
});

// ------------------------------
// SLICE
// ------------------------------

const workflowSlice = createSlice({
  name: "workflows",
  initialState,
  reducers: {
    clearCurrentWorkflow: (state) => {
      state.currentWorkflow = null;
      state.error = null;
    },
    updateFilter: (
      state,
      action: PayloadAction<{
        search?: string;
        status?: ExecutionStatus | "ALL";
      }>
    ) => {
      if (action.payload.search !== undefined) {
        state.filter.search = action.payload.search;
      }
      if (action.payload.status !== undefined) {
        state.filter.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadWorkflows.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadWorkflows.fulfilled, (state, action) => {
        state.workflows = action.payload;
        state.loading = false;
      })
      .addCase(loadWorkflows.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to load workflows.";
        state.loading = false;
      })
      .addCase(loadWorkflowById.fulfilled, (state, action) => {
        state.currentWorkflow = action.payload;
        state.loading = false;
      })
      .addCase(createWorkflow.fulfilled, (state, action) => {
        state.workflows.unshift(action.payload);
        state.currentWorkflow = action.payload;
        state.saving = false;
      })
      .addCase(updateWorkflow.fulfilled, (state, action) => {
        state.currentWorkflow = action.payload;
        state.workflows = state.workflows.map((w) =>
          w.workflow_id === action.payload.workflow_id ? action.payload : w
        );
        state.saving = false;
      })
      .addCase(deleteWorkflow.fulfilled, (state, action) => {
        state.workflows = state.workflows.filter(
          (w) => w.workflow_id !== action.payload
        );
        if (state.currentWorkflow?.workflow_id === action.payload) {
          state.currentWorkflow = null;
        }
        state.deleting = false;
      });
  },
});

export const { clearCurrentWorkflow, updateFilter } = workflowSlice.actions;
export default workflowSlice.reducer;