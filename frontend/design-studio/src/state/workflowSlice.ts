import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { WorkflowDefinition, ExecutionStatus } from '@shared/types'
import {
  createWorkflow as createWorkflowApi,
  deleteWorkflow as deleteWorkflowApi,
  fetchWorkflowById,
  fetchWorkflows,
  updateWorkflow as updateWorkflowApi,
  NewWorkflowDefinition,
} from '../services/workflowsApi'
import type { RootState } from './store'

interface WorkflowState {
  workflows: WorkflowDefinition[]
  currentWorkflow: WorkflowDefinition | null
  loading: boolean
  saving: boolean
  deleting: boolean
  error: string | null
  filter: {
    search: string
    status: ExecutionStatus | 'ALL'
  }
}

const initialState: WorkflowState = {
  workflows: [],
  currentWorkflow: null,
  loading: false,
  saving: false,
  deleting: false,
  error: null,
  filter: {
    search: '',
    status: 'ALL',
  },
}

// Mock data for development when backend is unavailable
const mockWorkflows: WorkflowDefinition[] = [
  {
    workflow_id: 'wf-001',
    name: 'Document Approval Workflow',
    description: 'Automated document review and approval process for legal documents',
    version: 1,
    steps: [],
    trigger_events: ['document_upload'],
    schedule: '',
    enabled: true,
    guardrails: [],
    requires_approval: true,
    approval_roles: ['legal', 'compliance'],
    tags: ['legal', 'approval', 'documents'],
    created_by: 'system',
    created_at: new Date('2024-01-15T10:30:00Z'),
    modified_at: new Date('2024-01-20T14:45:00Z'),
    published: true,
  },
  {
    workflow_id: 'wf-002',
    name: 'Customer Onboarding',
    description: 'Complete customer onboarding process with KYC verification',
    version: 2,
    steps: [],
    trigger_events: ['customer_registration'],
    schedule: '',
    enabled: true,
    guardrails: [],
    requires_approval: false,
    approval_roles: [],
    tags: ['customer', 'onboarding', 'kyc'],
    created_by: 'admin',
    created_at: new Date('2024-02-01T09:15:00Z'),
    modified_at: new Date('2024-02-10T16:20:00Z'),
    published: true,
  },
  {
    workflow_id: 'wf-003',
    name: 'Invoice Processing',
    description: 'Automated invoice validation and payment processing',
    version: 1,
    steps: [],
    trigger_events: ['invoice_received'],
    schedule: '0 9 * * 1-5', // Monday-Friday at 9 AM
    enabled: false,
    guardrails: [],
    requires_approval: true,
    approval_roles: ['finance', 'manager'],
    tags: ['finance', 'invoice', 'payment'],
    created_by: 'finance_team',
    created_at: new Date('2024-02-15T11:00:00Z'),
    modified_at: new Date('2024-02-15T11:00:00Z'),
    published: false,
  },
  {
    workflow_id: 'wf-004',
    name: 'Compliance Monitoring',
    description: 'Continuous monitoring of regulatory compliance requirements',
    version: 3,
    steps: [],
    trigger_events: ['scheduled'],
    schedule: '0 6 * * *', // Daily at 6 AM
    enabled: true,
    guardrails: [],
    requires_approval: false,
    approval_roles: [],
    tags: ['compliance', 'monitoring', 'regulatory'],
    created_by: 'compliance_officer',
    created_at: new Date('2024-01-01T08:00:00Z'),
    modified_at: new Date('2024-03-01T12:30:00Z'),
    published: true,
  },
]

export const loadWorkflows = createAsyncThunk<WorkflowDefinition[], void, { state: RootState; rejectValue: string }>(
  'workflows/load',
  async (_, thunkAPI) => {
    try {
      return await fetchWorkflows()
    } catch (error) {
      const existingWorkflows = thunkAPI.getState().workflows.workflows
      if (existingWorkflows.length > 0) {
        return existingWorkflows
      }
      console.warn('Backend API unavailable, using mock workflows data for development')
      return mockWorkflows
    }
  }
)

export const loadWorkflowById = createAsyncThunk<WorkflowDefinition, string, { state: RootState; rejectValue: string }>(
  'workflows/loadById',
  async (workflowId, thunkAPI) => {
    try {
      return await fetchWorkflowById(workflowId)
    } catch (error) {
      const fallbackWorkflow = thunkAPI.getState().workflows.workflows.find(
        (workflow) => workflow.workflow_id === workflowId
      )
      if (fallbackWorkflow) {
        return fallbackWorkflow
      }
      return thunkAPI.rejectWithValue('Unable to load workflow details from the API.')
    }
  }
)

export const createWorkflow = createAsyncThunk<WorkflowDefinition, NewWorkflowDefinition, { rejectValue: string }>(
  'workflows/create',
  async (workflow) => {
    try {
      return await createWorkflowApi(workflow)
    } catch (error) {
      const fallbackWorkflow: WorkflowDefinition = {
        workflow_id: `wf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: workflow.name,
        description: workflow.description,
        version: workflow.version,
        steps: workflow.steps,
        trigger_events: workflow.trigger_events,
        schedule: workflow.schedule,
        enabled: workflow.enabled,
        guardrails: workflow.guardrails,
        requires_approval: workflow.requires_approval,
        approval_roles: workflow.approval_roles,
        tags: workflow.tags,
        created_by: workflow.created_by,
        created_at: new Date(),
        modified_at: new Date(),
        published: workflow.published,
      }
      console.warn('Backend unavailable, creating workflow locally as fallback')
      return fallbackWorkflow
    }
  }
)

export const updateWorkflow = createAsyncThunk<WorkflowDefinition, WorkflowDefinition, { rejectValue: string }>(
  'workflows/update',
  async (workflow) => {
    try {
      return await updateWorkflowApi(workflow.workflow_id, workflow)
    } catch (error) {
      console.warn('Backend unavailable, updating workflow locally as fallback')
      return {
        ...workflow,
        modified_at: new Date(),
      }
    }
  }
)

export const deleteWorkflow = createAsyncThunk<string, string, { rejectValue: string }>(
  'workflows/delete',
  async (workflowId) => {
    try {
      await deleteWorkflowApi(workflowId)
      return workflowId
    } catch (error) {
      console.warn('Backend unavailable, deleting workflow locally as fallback')
      return workflowId
    }
  }
)

const workflowSlice = createSlice({
  name: 'workflows',
  initialState,
  reducers: {
    clearCurrentWorkflow: (state) => {
      state.currentWorkflow = null
      state.error = null
    },
    updateFilter: (
      state,
      action: PayloadAction<{
        search?: string
        status?: ExecutionStatus | 'ALL'
      }>
    ) => {
      if (action.payload.search !== undefined) {
        state.filter.search = action.payload.search
      }
      if (action.payload.status !== undefined) {
        state.filter.status = action.payload.status
      }
    },
  },
  extraReducers: (builder: import('@reduxjs/toolkit').ActionReducerMapBuilder<WorkflowState>) => {
    builder
      .addCase(loadWorkflows.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadWorkflows.fulfilled, (state, action) => {
        state.workflows = action.payload
        state.loading = false
      })
      .addCase(loadWorkflows.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to load workflows.'
        state.loading = false
      })
      .addCase(loadWorkflowById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadWorkflowById.fulfilled, (state, action) => {
        state.currentWorkflow = action.payload
        state.loading = false
      })
      .addCase(loadWorkflowById.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to load workflow details.'
        state.loading = false
      })
      .addCase(createWorkflow.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(createWorkflow.fulfilled, (state, action) => {
        state.workflows.unshift(action.payload)
        state.currentWorkflow = action.payload
        state.saving = false
      })
      .addCase(createWorkflow.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to create workflow.'
        state.saving = false
      })
      .addCase(updateWorkflow.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(updateWorkflow.fulfilled, (state, action) => {
        state.currentWorkflow = action.payload
        state.workflows = state.workflows.map((workflow) =>
          workflow.workflow_id === action.payload.workflow_id ? action.payload : workflow
        )
        state.saving = false
      })
      .addCase(updateWorkflow.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to update workflow.'
        state.saving = false
      })
      .addCase(deleteWorkflow.pending, (state) => {
        state.deleting = true
        state.error = null
      })
      .addCase(deleteWorkflow.fulfilled, (state, action) => {
        state.workflows = state.workflows.filter((workflow) => workflow.workflow_id !== action.payload)
        if (state.currentWorkflow?.workflow_id === action.payload) {
          state.currentWorkflow = null
        }
        state.deleting = false
      })
      .addCase(deleteWorkflow.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to delete workflow.'
        state.deleting = false
      })
  },
})

export const { clearCurrentWorkflow, updateFilter } = workflowSlice.actions
export default workflowSlice.reducer
