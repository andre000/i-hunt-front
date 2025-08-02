import { createSlice } from '@reduxjs/toolkit'
import _missionDemo from './_mission-demo'

/**
 * @typedef Mission
 * @property {string} id - Unique identifier for the mission.
 * @property {string} name - Name of the mission.
 * @property {string} description - Description of the mission.
 * @property {boolean} assigned - Indicates if the mission is assigned.
 * @property {string} location - Location of the mission.
 * @property {number} value - Value of the mission.
 * @property {Array<string>} tags - Tags associated with the mission.
 * @property {number} createdDate - Creation date of the mission.
 * @property {number} updatedDate - Last updated date of the mission.
 * @property {number} expiresDate - Expiration date of the mission.
 * @property {string} createdBy - User who created the mission.
 * @property {string} status - Status of the mission (e.g., 'active', 'completed').
 * @property {string} risk - Risk level of the mission (e.g., 'baixo', 'médio', 'alto').
 * @property {boolean} isFeatured - Indicates if the mission is featured.
 * @property {boolean} isNearUser - Indicates if the mission is near the user.
 */

/**
 * Missions slice for managing missions state.
 * @property {Array<Mission>} missions - List of missions.
 */
const initialState = {
  list: [
    ..._missionDemo
  ]
}

const missionsSlice = createSlice({
  name: 'missions',
  initialState,
  reducers: {
    addMission: (state, action) => {
      state.list.push(action.payload)
    },
    removeMission: (state, action) => {
      state.list = state.list.filter(mission => mission.id !== action.payload.id)
    },
    updateMission: (state, action) => {
      const index = state.list.findIndex(mission => mission.id === action.payload.id)
      if (index !== -1) {
        state.list[index] = { ...state.list[index], ...action.payload }
      }
    },
  },
})

export const { addMission, removeMission, updateMission } = missionsSlice.actions
export default missionsSlice.reducer
