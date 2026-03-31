import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  id: 'user-001',
  name: 'Hunter Doe',
  email: 'hunter@example.com',
  avatarUrl: 'https://i.pravatar.cc/200?img=11',
  rating: 4.5,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    updateUser(state, action) {
      return { ...state, ...action.payload }
    },
  },
})

export const { updateUser } = userSlice.actions
export default userSlice.reducer
