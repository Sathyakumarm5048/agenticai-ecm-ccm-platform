import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface EditorState {
  selectedStepId: string | null;
  isDirty: boolean;
  zoom: number;
  panX: number;
  panY: number;
  showStepLibrary: boolean;
  showPreview: boolean;
}

const initialState: EditorState = {
  selectedStepId: null,
  isDirty: false,
  zoom: 1,
  panX: 0,
  panY: 0,
  showStepLibrary: true,
  showPreview: false,
};

const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    selectStep: (state, action: PayloadAction<string | null>) => {
      state.selectedStepId = action.payload;
    },

    markDirty: (state) => {
      state.isDirty = true;
    },

    markClean: (state) => {
      state.isDirty = false;
    },

    setZoom: (state, action: PayloadAction<number>) => {
      // Clamp zoom between 0.5 and 2.0
      const value = action.payload;
      state.zoom = Math.min(2, Math.max(0.5, value));
    },

    setPan: (state, action: PayloadAction<{ x: number; y: number }>) => {
      state.panX = action.payload.x;
      state.panY = action.payload.y;
    },

    toggleStepLibrary: (state) => {
      state.showStepLibrary = !state.showStepLibrary;
    },

    togglePreview: (state) => {
      state.showPreview = !state.showPreview;
    },

    resetEditor: () => initialState,
  },
});

export const {
  selectStep,
  markDirty,
  markClean,
  setZoom,
  setPan,
  toggleStepLibrary,
  togglePreview,
  resetEditor,
} = editorSlice.actions;

export default editorSlice.reducer;