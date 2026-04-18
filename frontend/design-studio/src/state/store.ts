import { configureStore } from '@reduxjs/toolkit'
import thunk from 'redux-thunk'
import workflowReducer from './workflowSlice'
import editorReducer from './editorSlice'
import connectorReducer from './connectorSlice'

export const store = configureStore({
  reducer: {
    workflows: workflowReducer,
    editor: editorReducer,
    connectors: connectorReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
