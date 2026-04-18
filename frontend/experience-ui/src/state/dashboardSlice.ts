import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { fetchDashboardMetrics } from '../services/dashboardApi'
import { DashboardMetrics } from '@shared/types'

interface DashboardState {
  metrics: DashboardMetrics | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

const initialState: DashboardState = {
  metrics: null,
  loading: false,
  error: null,
  lastUpdated: null,
}

export const loadDashboardMetrics = createAsyncThunk(
  'dashboard/loadMetrics',
  async () => {
    return await fetchDashboardMetrics()
  }
)

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    updateMetrics: (state, action: PayloadAction<Partial<DashboardMetrics>>) => {
      if (state.metrics) {
        state.metrics = { ...state.metrics, ...action.payload }
        state.lastUpdated = new Date()
      }
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadDashboardMetrics.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loadDashboardMetrics.fulfilled, (state, action) => {
        state.loading = false
        state.metrics = action.payload
        state.lastUpdated = new Date()
      })
      .addCase(loadDashboardMetrics.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to load dashboard metrics'
      })
  },
})

export const { updateMetrics, clearError } = dashboardSlice.actions

export default dashboardSlice.reducer