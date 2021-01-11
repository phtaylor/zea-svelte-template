import { writable } from 'svelte/store'

export const appDataStore = writable(0)

export const setupApp = (canvas) => {
  const renderer = new GLRenderer(canvas)
  const scene = new Scene()

  // Assigning an Environment Map enables PBR lighting for niceer shiny surfaces.
  // if (!SystemDesc.isMobileDevice) {
  //   const envMap = new EnvMap('envMap')
  //   envMap
  //     .getParameter('FilePath')
  //     .setValue(`/assets/HDR_029_Sky_Cloudy_Ref.vlenv`)
  //   envMap.getParameter('HeadLightMode').setValue(true)
  //   scene.getSettings().getParameter('EnvMap').setValue(envMap)
  // }

  scene.setupGrid(10, 10)
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
  const toolManager = new ToolManager(appData)
  const selectionManager = new SelectionManager(appData)
  selectionManager.showHandles()
  appData.selectionManager = selectionManager
  const selectionTool = new SelectionTool(appData)
  toolManager.registerTool('SelectionTool', selectionTool)
  toolManager.registerTool('CameraManipulator', cameraManipulator)

  renderer.getViewport().setManipulator(toolManager)
  toolManager.pushTool('CameraManipulator')
  // toolManager.pushTool('SelectionTool')
  appData.toolManager = toolManager

  // // Note: the alpha value determines  the fill of the highlight.
  // const selectionColor = new Color('#00436D')
  // selectionColor.a = 0.1
  // const subtreeColor = selectionColor.lerp(new Color(1, 1, 1, 0), 0.5)
  // selectionManager.selectionGroup
  //   .getParameter('HighlightColor')
  //   .setValue(selectionColor)
  // selectionManager.selectionGroup
  //   .getParameter('SubtreeHighlightColor')
  //   .setValue(subtreeColor)

  /** SELECTION END */

  /** COLLAB START*/
  setupCollab()
  /** COLLAB END */

  /** CAD START */
  const { GLCADPass, CADAsset } = window.zeaCad

  const url = '/assets/Fidget-Spinner-2.zcad'
  renderer.addPass(new GLCADPass())

  const asset = new CADAsset()
  asset.on('loaded', () => {
    const materials = asset.getMaterialLibrary().getMaterials()
    materials.forEach((material) => {
      if (material.getShaderName() == 'SimpleSurfaceShader') {
        material.setShaderName('StandardSurfaceShader')
      }
    })
    renderer.frameAll()
  })
  asset.getGeometryLibrary().on('loaded', () => {
    renderer.frameAll()
  })
  scene.getRoot().addChild(asset)
  asset.getParameter('FilePath').setValue(url)
  /** CAD END */

  appDataStore.set(appData)

  return appData
}
