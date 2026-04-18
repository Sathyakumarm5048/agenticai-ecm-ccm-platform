import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ExecutionStatus, StepExecution, WorkflowExecution } from '@shared/types'
import {
  fetchExecutions,
  fetchExecutionById,
  startExecution,
  stopExecution,
  retryWorkflowExecution,
  bulkRetryExecutions,
  bulkStopExecutions,
  ExecutionFilters,
} from '../services/executionsApi'

interface ExecutionState {
  executions: WorkflowExecution[]
  currentExecution: WorkflowExecution | null
  stepExecutions: StepExecution[]
  loading: boolean
  saving: boolean
  error: string | null
  filters: ExecutionFilters
  realTimeUpdates: boolean
  selectedExecutionIds: Set<string>
  bulkOperationInProgress: boolean
}

const initialState: ExecutionState = {
  executions: [],
  currentExecution: null,
  stepExecutions: [],
  loading: false,
  saving: false,
  error: null,
  filters: {
    status: null,
    workflowId: null,
    dateRange: null,
  },
  realTimeUpdates: true,
  selectedExecutionIds: new Set(),
  bulkOperationInProgress: false,
}

export const loadExecutions = createAsyncThunk(
  'executions/loadExecutions',
  async (filters?: ExecutionFilters) => {
    return await fetchExecutions(filters)
  }
)

export const loadExecutionById = createAsyncThunk(
  'executions/loadExecutionById',
  async (executionId: string) => {
    return await fetchExecutionById(executionId)
  }
)

export const retryExecution = createAsyncThunk(
  'executions/retryExecution',
  async ({ executionId, stepId }: { executionId: string; stepId?: string }) => {
    return await retryWorkflowExecution(executionId, stepId)
  }
)

export const startWorkflowExecution = createAsyncThunk(
  'executions/startExecution',
  async (workflowId: string) => {
    return await startExecution(workflowId)
  }
)

export const stopWorkflowExecution = createAsyncThunk(
  'executions/stopExecution',
  async (executionId: string) => {
    return await stopExecution(executionId)
  }
)

export const bulkRetry = createAsyncThunk(
  'executions/bulkRetry',
  async (executionIds: string[]) => {
    return await bulkRetryExecutions(executionIds)
  }
)

export const bulkStop = createAsyncThunk(
  'executions/bulkStop',
  async (executionIds: string[]) => {
    return await bulkStopExecutions(executionIds)
  }
)

const executionSlice = createSlice({
  name: 'executions',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<ExecutionFilters>) => {
      state.filters = action.payload
    },
    updateExecutionStatus: (state, action: PayloadAction<{ executionId: string; status: ExecutionStatus }>) => {
      const { executionId, status } = action.payload
      const execution = state.executions.find(e => e.execution_id === executionId)
      if (execution) {
        execution.status = status
      }
      if (state.currentExecution?.execution_id === executionId) {
        state.currentExecution.status = status
      }
    },
    updateStepExecution: (state, action: PayloadAction<StepExecution>) => {
      const stepExecution = action.payload
      const index = state.stepExecutions.findIndex(s => s.execution_id === stepExecution.execution_id && s.step_id === stepExecution.step_id)
      if (index >= 0) {
        state.stepExecutions[index] = stepExecution
      } else {
        state.stepExecutions.push(stepExecution)
      }
    },
    setRealTimeUpdates: (state, action: PayloadAction<boolean>) => {
      state.realTimeUpdates = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    toggleExecutionSelection: (state, action: PayloadAction<string>) => {
      const executionId = action.payload
      if (state.selectedExecutionIds.has(executionId)) {
        state.selectedExecutionIds.delete(executionId)
      } else {
        state.selectedExecutionIds.add(executionId)
      }
    },
    selectAllExecutions: (state) => {
      state.executions.forEach(exec => state.selectedExecutionIds.add(exec.execution_id))
    },
    deselectAllExecutions: (state) => {
      state.selectedExecutionIds.clear()
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadExecutions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadExecutions.fulfilled, (state, action) => {
        state.loading = false
        state.executions = action.payload
      })
      .addCase(loadExecutions.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to load executions'
      })
      .addCase(loadExecutionById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadExecutionById.fulfilled, (state, action) => {
        state.loading = false
        state.currentExecution = action.payload.execution
        state.stepExecutions = action.payload.stepExecutions
      })
      .addCase(loadExecutionById.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to load execution'
      })
      .addCase(retryExecution.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(retryExecution.fulfilled, (state) => {
        state.saving = false
        // The execution will be updated via WebSocket or reload
      })
      .addCase(retryExecution.rejected, (state, action) => {
        state.saving = false
        state.error = action.error.message || 'Failed to retry execution'
      })
      .addCase(startWorkflowExecution.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(startWorkflowExecution.fulfilled, (state, action) => {
        state.saving = false
        state.executions.unshift(action.payload)
      })
      .addCase(startWorkflowExecution.rejected, (state, action) => {
        state.saving = false
        state.error = action.error.message || 'Failed to start execution'
      })
      .addCase(stopWorkflowExecution.pending, (state) => {
        state.saving = true
        state.error = null
      })
      .addCase(stopWorkflowExecution.fulfilled, (state, action) => {
        state.saving = false
        const execution = state.executions.find(e => e.execution_id === action.payload.execution_id)
        if (execution) {
          execution.status = action.payload.status
        }
      })
      .addCase(stopWorkflowExecution.rejected, (state, action) => {
        state.saving = false
        state.error = action.error.message || 'Failed to stop execution'
      })
      .addCase(bulkRetry.pending, (state) => {
        state.bulkOperationInProgress = true
        state.error = null
      })
      .addCase(bulkRetry.fulfilled, (state, action) => {
        state.bulkOperationInProgress = false
        state.selectedExecutionIds.clear()
        // Update execution statuses from response
        action.payload.forEach(exec => {
          const idx = state.executions.findIndex(e => e.execution_id === exec.execution_id)
          if (idx >= 0) {
            state.executions[idx] = exec
          }
        })
      })
      .addCase(bulkRetry.rejected, (state, action) => {
        state.bulkOperationInProgress = false
        state.error = action.error.message || 'Failed to retry executions'
      })
      .addCase(bulkStop.pending, (state) => {
        state.bulkOperationInProgress = true
        state.error = null
      })
      .addCase(bulkStop.fulfilled, (state, action) => {
        state.bulkOperationInProgress = false
        state.selectedExecutionIds.clear()
        // Update execution statuses from response
        action.payload.forEach(exec => {
          const idx = state.executions.findIndex(e => e.execution_id === exec.execution_id)
          if (idx >= 0) {
            state.executions[idx] = exec
          }
        })
      })
      .addCase(bulkStop.rejected, (state, action) => {
        state.bulkOperationInProgress = false
        state.error = action.error.message || 'Failed to stop executions'
      })
  },
})

export const {
  setFilters,
  updateExecutionStatus,
  updateStepExecution,
  setRealTimeUpdates,
  clearError,
  toggleExecutionSelection,
  selectAllExecutions,
  deselectAllExecutions,
} = executionSlice.actions

export default executionSlice.reducer