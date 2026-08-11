import { createSlice } from "@reduxjs/toolkit";

const conversationSlice = createSlice({
  name: "conversation",

  initialState: {
    conversation: [],
    selectedConversation: null,
  },

  reducers: {
    // Set all conversations
    setConversation: (state, action) => {
      state.conversation = action.payload;
    },

    // Add newly created conversation
    addConversation: (state, action) => {
      state.conversation.unshift(action.payload);
    },

    // Select active conversation
    setSelectedConversation: (state, action) => {
      state.selectedConversation = action.payload;
    },

    // Update conversation title
    setConvTitle: (state, action) => {
      const { title, conversationId } = action.payload;

      state.conversation = state.conversation.map(
        (conv) =>
          conv._id === conversationId
            ? {
                ...conv,
                title,
              }
            : conv
      );

      // Also update currently selected conversation
      if (
        state.selectedConversation?._id ===
        conversationId
      ) {
        state.selectedConversation = {
          ...state.selectedConversation,
          title,
        };
      }
    },

    // Clear all conversations
    clearConversation: (state) => {
      state.conversation = [];
      state.selectedConversation = null;
    },
  },
});

export const {
  setConversation,
  addConversation,
  setSelectedConversation,
  setConvTitle,
  clearConversation,
} = conversationSlice.actions;

export default conversationSlice.reducer;