
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '',
    email: '',
    isLoggedIn: false,
  }),
  actions: {
    login(name: string, email: string) {
      this.name = name;
      this.email = email;
      this.isLoggedIn = true;
    },
    logout() {
      this.name = '';
      this.email = '';
      this.isLoggedIn = false;
    }
  }
});