import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userId: Number(localStorage.getItem('userId')) || null,
    username: localStorage.getItem('username') || ''
  }),
  actions: {
    setLogin({ token, userId, username }) {
      this.token = token
      this.userId = userId
      this.username = username
      localStorage.setItem('token', token)
      localStorage.setItem('userId', userId)
      localStorage.setItem('username', username)
    },
    logout() {
      this.token = ''
      this.userId = null
      this.username = ''
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('username')
      localStorage.removeItem('device')
    }
  }
})
