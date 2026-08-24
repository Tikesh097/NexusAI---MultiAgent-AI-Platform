import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
  name: "message",

  initialState: {
    messages: [],
    artifacts: [],
    isLoading:false,
    loadingAgent:"chat"
  },

  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },

    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },

    setArtifacts: (state, action) => {
      state.artifacts = action.payload;
    },

     setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },

    setloadingAgent: (state, action) => {
      state.loadingAgent = action.payload;
    },

    clearMessages: (state) => {
      state.messages = [];
    },

    clearArtifacts: (state) => {
      state.artifacts = [];
    },

    clearMessagesAndArtifacts: (state) => {
      state.messages = [];
      state.artifacts = [];
    },
  },
});

export const {
  setMessages,
  addMessage,
  setArtifacts,
  setIsLoading,
  setloadingAgent,
  clearMessages,
  clearArtifacts,
  clearMessagesAndArtifacts,
} = messageSlice.actions;

export default messageSlice.reducer;