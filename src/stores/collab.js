import { writable } from 'svelte/store'
import { auth } from '../helpers/auth'

export const collabStore = writable(0)

export const setupCollab = () => {
  const SOCKET_URL = 'https://websocket-staging.zea.live'
  const ROOM_ID = 'zea-template-collab'
  auth.getUserData().then((userData) => {
    if (!userData) return
    const session = new Session(userData, SOCKET_URL)
    session.joinRoom(ROOM_ID)
    const sessionSync = new SessionSync(session, appData, userData, {})
    appData.userData = userData
    appData.session = session
    appData.sessionSync = sessionSync
    collabStore.set({
      userData,
      session,
      sessionSync,
    })
  })
}
