import { configureStore } from '@reduxjs/toolkit'
import thunk from 'redux-thunk'
import executionReducer from './executionSlice'
import dashboardReducer from './dashboardSlice'

export const store = configureStore({
  reducer: {
    executions: executionReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch