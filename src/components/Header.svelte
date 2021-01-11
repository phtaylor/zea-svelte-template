<script>
  import { redirect } from '@roxi/routify'
  import { onMount } from 'svelte'

  import { auth } from '../helpers'
  import { appDataStore } from '../stores/appData'
  import { collabStore } from '../stores/collab'

  let userChipSet
  let userChip
  let vrToggleMenuItem
  let vrSpectatorMenuItem
  
  let { renderer, undoRedoManager, toolManager } = $appDataStore
  let { sessionSync } = $collabStore

  onMount(() => {
    vrToggleMenuItem.textContent = 'VR Device Not Detected'
    vrToggleMenuItem.disabled = true

    collabStore.subscribe((collabData) => {
      const { session, sessionSync } = collabData

      userChip.userData = userData
      userChipSet.session = session

      {
        // SessionSync interactions.
        window.addEventListener('zeaUserClicked', (event) => {
          const userData = sessionSync.userDatas[event.detail.id]
          if (userData) {
            const avatar = userData.avatar
            const viewXfo = avatar.viewXfo
            const focalDistance = avatar.focalDistance || 1.0
            const target = viewXfo.tr.add(
              viewXfo.ori.getZaxis().scale(-focalDistance)
            )

            const viewport = renderer.getViewport()
            const cameraManipulator = viewport.getManipulator()
            cameraManipulator.orientPointOfView(
              viewport.getCamera(),
              viewXfo.tr,
              target,
              1.0,
              1000
            )
          }
        })
      }
    })

    appDataStore.subscribe((appData) => {
      const { renderer } = appData
      renderer
        .getXRViewport()
        .then((xrViewport) => {
          xrViewport.spectatorMode = false // disable by default.
          if (vrToggleMenuItem) vrToggleMenuItem.textContent = 'Launch VR'
          xrViewport.on('presentingChanged', (event) => {
            const { state } = event
            if (state) {
              vrToggleMenuItem.textContent = 'Exit VR'
            } else {
              vrToggleMenuItem.textContent = 'Launch VR'
            }
          })
        })
        .catch((reason) => {
          console.warn('Unable to setup XR:' + reason)
        })
    })
  })

  function handleFrameAll() {
    renderer.frameAll()
  }
  
  function handleUndo() {
    undoRedoManager.undo()
  }

  function handleRedo() {
    undoRedoManager.redo()
  }

  let selectionEnabled = false
  function toggleSelectMode() {
    if (!selectionEnabled) {
      toolManager.pushTool('SelectionTool')
      selectionEnabled = true
    } else {
      toolManager.popTool()
      selectionEnabled = false
    }
  }

  function handleDA() {
    // auth.getUserData().then((userData) => {
    
    // appDataStore.subscribe((appData) => {
      if (!userData) {
        return
      }
      {
        // SessionSync interactions.
        const camera = renderer.getViewport().getCamera()
        const xfo = camera.getParameter('GlobalXfo').getValue()
        const target = camera.getTargetPosition()
        sessionSync.directAttention(xfo.tr, target, 1, 1000)
      }
    })
  }

  
  function handleLaunchVR() {

    renderer
      .getXRViewport()
      .then((xrViewport) => {
        xrViewport.togglePresenting()
      })
      .catch((reason) => {
        console.warn('Unable to setup XR:' + reason)
      })
  }

  function handleToggleVRSpatatorMode() {
    renderer.getXRViewport().then((xrViewport) => {
      xrViewport.spectatorMode = !xrViewport.spectatorMode
    })
  }

  const handleSignOut = async () => {
    await auth.signOut()
    $redirect('/login')
  }
</script>

<style>
  .logo {
    width: 5em;
  }

  .divider {
    border-right: 2px solid var(--color-grey-1);
    height: calc(100% - 2px);
  }

  .user-container {
    height: 100%;
    width: 50px;
    display: flex;
    align-items: center;
  }

  .user-set-container {
    display: flex;
    align-items: center;
    width: 250px;
  }

  .menu-item {
    display: flex;
    align-items: center;
  }
</style>

<div class="flex items-center w-full h-full px-2">
  <div class="logo flex items-center h-full mr-4">
    <img src="/images/logo-zea.svg" alt="logo" />
  </div>
  <div class="flex-grow">
    <zea-menu type="dropdown" show-anchor="true">
      <zea-menu-item>
        View
        <zea-menu-subitems>
          <zea-menu-item class="menu-item" hotkey="f" onclick={handleFrameAll}>
            Frame All
          </zea-menu-item>
        </zea-menu-subitems>
      </zea-menu-item>
      <zea-menu-item>
        Edit
        <zea-menu-subitems>
          <zea-menu-item class="menu-item" hotkey="ctrl+Z" onclick={handleUndo}>
            <zea-icon icon="arrow-undo" size="16" />
            Undo
          </zea-menu-item>
          <zea-menu-item class="menu-item" hotkey="ctrl+Y" onclick={handleRedo}>
            <zea-icon icon="arrow-redo" size="16" />
            Redo
          </zea-menu-item>
          <zea-menu-item class="menu-item" onclick={toggleSelectMode}>
            <zea-icon size="16" />
            Toggle Selection
          </zea-menu-item>
        </zea-menu-subitems>
      </zea-menu-item>
      <zea-menu-item>
        Collab
        <zea-menu-subitems>
          <zea-menu-item class="menu-item" hotkey="ctrl+N" onclick={handleDA}>
            Direct Attention
          </zea-menu-item>
        </zea-menu-subitems>
      </zea-menu-item>
      <zea-menu-item>
        VR
        <zea-menu-subitems>
          <zea-menu-item
            class="menu-item"
            bind:this={vrToggleMenuItem}
            onclick={handleLaunchVR}
            switch="true">
            <zea-icon icon="recording-outline" size="16" />
            Launch VR
          </zea-menu-item>
          <zea-menu-item
            switch="true"
            onclick={handleToggleVRSpatatorMode}
            bind:this={vrSpectatorMenuItem}>
            Spectator Mode
          </zea-menu-item>
        </zea-menu-subitems>
      </zea-menu-item>
    </zea-menu>
  </div>
  <div class="panel-container mx-2 user-set-container">
    <zea-user-chip-set bind:this={userChipSet} showImages />
  </div>
  <div class="mr-2">
    <zea-button on:click={handleSignOut}>Sign out</zea-button>
  </div>
  <div class="divider ml-2" />
  <div class="user-container pl-2">
    <zea-user-chip bind:this={userChip} profile-card-align="right" />
  </div>
</div>
