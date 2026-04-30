import { configureStore } from "@reduxjs/toolkit";
import workflowReducer from "./workflowSlice";
import editorReducer from "./editorSlice";
import connectorReducer from "./connectorSlice";

export const store = configureStore({
  reducer: {
    workflows: workflowReducer,
    editor: editorReducer,
    connectors: connectorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // optional: avoids warnings for Date, Map, etc.
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;