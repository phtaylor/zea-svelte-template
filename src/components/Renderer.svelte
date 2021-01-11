<script>
  import { onMount } from 'svelte'
  // import { auth, APP_DATA } from '../helpers'
  import '../helpers/fps-display'
  import Sidebar from '../components/Sidebar.svelte'

  import { setupApp } from '../appData'
  import { setupCollab, collabStore } from '../collab'

  const {
    Color,
    GLRenderer,
    Scene,
    resourceLoader,
    SystemDesc,
    EnvMap,
  } = window.zeaEngine
  const {
    SelectionManager,
    UndoRedoManager,
    ToolManager,
    SelectionTool,
  } = window.zeaUx

  const { Session, SessionSync } = window.zeaCollab

  let canvas
  let fpsContainer

  let treeViewItems
  let appData
  let progressBar

  onMount(() => {
    const appData = setupApp()

    treeViewItems = [appData.scene.getRoot()]

    /** PROGRESSBAR START */
    if (progressBar) {
      progressBar.percent = 0
      progressBar.style.visibility = 'hidden'
      let visible = false
      let visibleTimeoutId = 0
      resourceLoader.on('progressIncremented', (event) => {
        if (progressBar) {
          if (!visible) {
            // Display the progress bar if hidden
            progressBar.style.visibility = 'visible'
            visible = true
          } else if (visibleTimeoutId > 0) {
            // Prevent the progress bar from hiding if a timer is running.
            clearTimeout(visibleTimeoutId)
          }
          const { percent } = event
          progressBar.percent = percent
          if (percent >= 100) {
            // Hide the progress bar after one second.
            visibleTimeoutId = setTimeout(() => {
              progressBar.style.visibility = 'hidden'
              visibleTimeoutId = 0
              visible = false
            }, 1000)
          }
        }
      })
    }
    /** PROGRESSBAR END */

    /** FPS DISPLAY START */
    {
      const fpsDisplay = document.createElement('fps-display')
      fpsDisplay.renderer = appData.renderer
      fpsContainer.appendChild(fpsDisplay)
    }
    /** FPS DISPLAY END */
  })
</script>

<style>
  #renderer {
    height: 100%;
    width: 100%;
  }
</style>

<zea-layout add-cells="AB" borders cell-a-size="250" show-resize-handles="A">
  <div slot="A" class="h-full w-full">
    <Sidebar rootItems={treeViewItems} {appData} />
  </div>
  <div slot="B" class="h-full w-full">
    <canvas id="renderer" bind:this={canvas} />
    <div class="relative">
      <zea-progress-bar bind:this={progressBar} />
    </div>
    <div bind:this={fpsContainer} />
  </div>
</zea-layout>
