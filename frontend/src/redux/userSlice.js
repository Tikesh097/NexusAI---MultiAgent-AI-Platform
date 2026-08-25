import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",

  initialState: {
    userData: null,
  },

  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload;
    },

    clearUserData: (state) => {
      state.userData = null;
    },

    updateCredits: (state, action) => {
      if (state.userData) {
        state.userData.credits = action.payload;
      }
    },
  },
});

export const {
  setUserData,
  clearUserData,
  updateCredits,
} = userSlice.actions;

export default userSlice.reducer;