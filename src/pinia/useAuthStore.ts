import { defineStore } from 'pinia'

interface UserInfo {
  username: string
  roles: string[]
}

interface AuthState {
  token: string | null
  user: UserInfo | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
  },
  actions: {
    setToken(token: string | null) {
      this.token = token
    },
    setUser(user: UserInfo | null) {
      this.user = user
    },
    logout() {
      this.token = null
      this.user = null
    },
  },
})





