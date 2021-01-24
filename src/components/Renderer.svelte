<script>
  import { onMount } from 'svelte'
  import { auth, APP_DATA } from '../helpers'
  import '../helpers/fps-display'
  import { loadProductStructure } from '../helpers/loadProductStructure'
  import Sidebar from '../components/Sidebar.svelte'
  // import { get } from 'http'

  const {
    Color,
    Vec3,
    Xfo,
    GLRenderer,
    Scene,
    resourceLoader,
    SystemDesc,
    EnvMap,
  } = window.zeaEngine
  const { GLCADPass, CADAsset } = window.zeaCad
  const {
    SelectionManager,
    UndoRedoManager,
    ToolManager,
    SelectionTool,
  } = window.zeaUx

  const { Session, SessionSync } = window.zeaCollab

  let canvas
  let fpsContainer
  let progressBar

  onMount(() => {
    const renderer = new GLRenderer(canvas)
    const scene = new Scene()

    // Assigning an Environment Map enables PBR lighting for niceer shiny surfaces.
    if (!SystemDesc.isMobileDevice) {
      const envMap = new EnvMap('envMap')
      envMap
        .getParameter('FilePath')
        .setValue(`/assets/HDR_029_Sky_Cloudy_Ref.vlenv`)
      envMap.getParameter('HeadLightMode').setValue(true)
      scene.getSettings().getParameter('EnvMap').setValue(envMap)
    }

    scene.setupGrid(10, 10)
    scene
      .getSettings()
      .getParameter('BackgroundColor')
      .setValue(new Color(0.35, 0.35, 0.35, 1))
    renderer.setScene(scene)

    const appData = {}

    appData.renderer = renderer
    appData.scene = scene

    /** UNDO START */
    const undoRedoManager = UndoRedoManager.getInstance()
    appData.undoRedoManager = undoRedoManager
    /** UNDO END */

    /** SELECTION START */
    const cameraManipulator = renderer.getViewport().getManipulator()
    appData.cameraManipulator = cameraManipulator
    const toolManager = new ToolManager(appData)
    const selectionManager = new SelectionManager(appData, {
      enableXfoHandles: true,
    })
    selectionManager.showHandles()
    appData.selectionManager = selectionManager
    const selectionTool = new SelectionTool(appData)
    toolManager.registerTool('SelectionTool', selectionTool)
    toolManager.registerTool('CameraManipulator', cameraManipulator)

    renderer.getViewport().setManipulator(toolManager)
    toolManager.pushTool('CameraManipulator')
    appData.toolManager = toolManager

    // Note: the alpha value determines  the fill of the highlight.
    const selectionColor = new Color('#F9CE03')

    selectionColor.a = 0.1
    const subtreeColor = selectionColor.lerp(new Color(1, 1, 1, 0), 0.5)
    appData.selectionManager.selectionGroup
      .getParameter('HighlightColor')
      .setValue(selectionColor)
    appData.selectionManager.selectionGroup
      .getParameter('SubtreeHighlightColor')
      .setValue(subtreeColor)

    // Color the selection rect.
    const selectionRectColor = selectionColor.clone()
    selectionRectColor.a = 1
    selectionTool.rectItem
      .getParameter('Material')
      .getValue()
      .getParameter('BaseColor')
      .setValue(selectionRectColor)

    /** SELECTION END */

    /** UX START */
    renderer.getViewport().on('pointerDownOnGeom', (event) => {
      // Detect a right click
      if (event.button == 2) {
        console.log(event)
        // stop propagation to prevent the camera manipulator from handling the event.
        // event.stopPropagation()
      }
    })
    renderer.getViewport().on('pointerDoublePressed', (event) => {
      console.log(event)
    })
    /** UX END */

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
      fpsDisplay.renderer = renderer
      fpsContainer.appendChild(fpsDisplay)
    }
    /** FPS DISPLAY END */

    /** COLLAB START*/
    const SOCKET_URL = 'https://websocket-staging.zea.live'
    let ROOM_ID = 'none'
    auth.getUserData().then((userData) => {
      if (!userData) return
      const session = new Session(userData, SOCKET_URL)
      session.joinRoom(ROOM_ID)
      const sessionSync = new SessionSync(session, appData, userData, {})
      appData.userData = userData
      appData.session = session
      appData.sessionSync = sessionSync
      APP_DATA.update(() => appData)
    })
    /** COLLAB END */

    /** CAD START */
    renderer.addPass(new GLCADPass())
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('ps')) {
      const psUrl = urlParams.get('ps')
      ROOM_ID = psUrl
      const productStructure = loadProductStructure(psUrl)
      scene.getRoot().addChild(productStructure)
    }
    /** CAD END */

    APP_DATA.set(appData)
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
    <Sidebar />
  </div>
  <div slot="B" class="h-full w-full">
    <canvas id="renderer" bind:this={canvas} />
    <div class="relative">
      <zea-progress-bar bind:this={progressBar} />
    </div>
    <div bind:this={fpsContainer} />
  </div>
</zea-layout>
