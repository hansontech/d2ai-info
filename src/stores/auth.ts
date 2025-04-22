
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isLoggedIn: false,
    user: null
  }),
  getters: {
    userObject: (state): any | null => state.user  // common field
  },
  actions: {
    getUser(): any | null {
      return this.user
    },
    getLoggedIn(): boolean {
      return this.isLoggedIn
    },
    setUser(user: any) {
      this.user = user
      this.isLoggedIn = true
    },
    clearUser() {
      this.user = null
      this.isLoggedIn = false
    }
  },
  persist: true
});