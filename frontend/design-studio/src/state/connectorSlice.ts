import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ConnectorMetadata, ConnectorConnection } from "@shared/types";

interface ConnectorState {
  availableConnectors: ConnectorMetadata[];
  connections: Map<string, ConnectorConnection>;
  selectedConnectionId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ConnectorState = {
  availableConnectors: [],
  connections: new Map(),
  selectedConnectionId: null,
  loading: false,
  error: null,
};

const connectorSlice = createSlice({
  name: "connectors",
  initialState,
  reducers: {
    setAvailableConnectors: (
      state,
      action: PayloadAction<ConnectorMetadata[]>
    ) => {
      state.availableConnectors = action.payload;
      state.error = null;
    },

    addConnection: (state, action: PayloadAction<ConnectorConnection>) => {
      // FIX: use conn.id instead of conn.connection_id
      state.connections.set(action.payload.id, action.payload);
    },

    setConnections: (state, action: PayloadAction<ConnectorConnection[]>) => {
      state.connections.clear();
      action.payload.forEach((conn) => {
        // FIX: use conn.id
        state.connections.set(conn.id, conn);
      });
    },

    selectConnection: (state, action: PayloadAction<string | null>) => {
      state.selectedConnectionId = action.payload;
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setAvailableConnectors,
  addConnection,
  setConnections,
  selectConnection,
  setLoading,
  setError,
} = connectorSlice.actions;

export default connectorSlice.reducer;