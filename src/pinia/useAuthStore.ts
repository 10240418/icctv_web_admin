import { defineStore } from 'pinia'

interface UserInfo {
  username: string
  roles: string[]
}

interface AuthState {
  token: string | null
  user: UserInfo | null
  expiresAt: string | null
}

const TOKEN_STORAGE_KEY = 'icctv-token'
const TOKEN_EXPIRES_AT_STORAGE_KEY = 'icctv-token-expires-at'
const USER_STORAGE_KEY = 'icctv-user'

function getStorageItem(key: string): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(key)
}

function setStorageItem(key: string, value: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, value)
}

function removeStorageItem(key: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(key)
}

function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) {
    return false
  }

  const expiresAtMs = Date.parse(expiresAt)

  if (Number.isNaN(expiresAtMs)) {
    return false
  }

  return expiresAtMs <= Date.now()
}

function getPersistedUser(): UserInfo | null {
  const rawUser = getStorageItem(USER_STORAGE_KEY)

  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser) as UserInfo
  } catch {
    removeStorageItem(USER_STORAGE_KEY)
    return null
  }
}

function getPersistedAuthState(): AuthState {
  const token = getStorageItem(TOKEN_STORAGE_KEY)
  const expiresAt = getStorageItem(TOKEN_EXPIRES_AT_STORAGE_KEY)

  if (!token || isTokenExpired(expiresAt)) {
    removeStorageItem(TOKEN_STORAGE_KEY)
    removeStorageItem(TOKEN_EXPIRES_AT_STORAGE_KEY)
    removeStorageItem(USER_STORAGE_KEY)

    return {
      token: null,
      user: null,
      expiresAt: null,
    }
  }

  return {
    token,
    user: getPersistedUser(),
    expiresAt,
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => getPersistedAuthState(),
  getters: {
    isAuthenticated: (state) => Boolean(state.token) && !isTokenExpired(state.expiresAt),
  },
  actions: {
    initializeAuth() {
      const persistedState = getPersistedAuthState()

      this.token = persistedState.token
      this.user = persistedState.user
      this.expiresAt = persistedState.expiresAt
    },
    setToken(token: string | null, expiresAt?: string | null) {
      const nextExpiresAt = expiresAt === undefined ? this.expiresAt : expiresAt

      this.token = token
      this.expiresAt = token ? nextExpiresAt : null

      if (token) {
        setStorageItem(TOKEN_STORAGE_KEY, token)

        if (nextExpiresAt) {
          setStorageItem(TOKEN_EXPIRES_AT_STORAGE_KEY, nextExpiresAt)
        } else {
          removeStorageItem(TOKEN_EXPIRES_AT_STORAGE_KEY)
        }

        return
      }

      removeStorageItem(TOKEN_STORAGE_KEY)
      removeStorageItem(TOKEN_EXPIRES_AT_STORAGE_KEY)
    },
    setUser(user: UserInfo | null) {
      this.user = user

      if (user) {
        setStorageItem(USER_STORAGE_KEY, JSON.stringify(user))
        return
      }

      removeStorageItem(USER_STORAGE_KEY)
    },
    logout() {
      this.token = null
      this.user = null
      this.expiresAt = null

      removeStorageItem(TOKEN_STORAGE_KEY)
      removeStorageItem(TOKEN_EXPIRES_AT_STORAGE_KEY)
      removeStorageItem(USER_STORAGE_KEY)
    },
  },
})





