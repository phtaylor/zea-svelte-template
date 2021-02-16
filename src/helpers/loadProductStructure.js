const { Color, Vec3, Xfo, Mat4, TreeItem, resourceLoader } = window.zeaEngine
const { CADAsset } = window.zeaCad

function checkStatus(response) {
  if (!response.ok) {
    return false
  }

  return response
}

export function loadProductStructure(url) {
  const folder = url.lastIndexOf('/') > -1 ? url.substring(0, url.lastIndexOf('/')) + '/' : ''
  const filename = url.lastIndexOf('/') > -1 ? url.substring(url.lastIndexOf('/') + 1) : ''
  const stem = filename.substring(0, filename.lastIndexOf('.'))

  const productStructure = new TreeItem('ProductStructure')
  const xfo = new Xfo()
  xfo.sc.set(1 / 1000, 1 / 1000, 1 / 1000)
  productStructure.getParameter('LocalXfo').setValue(xfo)

  const references = {}

  resourceLoader.incrementWorkload(2) // load and parse
  fetch(url)
    .then((response) => {
      resourceLoader.incrementWorkDone(1) // load complete
      if (!checkStatus(response))
        throw new Error(`Unable to load Product Structure: ${url}. ${response.status} - ${response.statusText}`)
      return response.json()
    })
    .then((json) => {
      parseExportInfo(json['Export_Info'])
      console.log(references)
      parseTreeItem(productStructure, json['Root'])

      resourceLoader.incrementWorkDone(1) // parse complete
      productStructure.emit('loaded')
    })

  const parseExportInfo = (json) => {
    parseReferenceList(json['Reference List'])
  }
  const parseReferenceList = (json) => {
    json.forEach((refJson) => parseReference(refJson))
  }

  const parseReference = (json) => {
    if (!references[json.Name]) {
      references[json.Name] = {}
    }
    references[json.Name][json.V_version] = json
    //   asset: asset,
    //   refs: 0, // Now many times this asset has been referenced in the tree.
    // }
  }

  const loadCADAsset = (url) => {
    const asset = new CADAsset()
    asset.getParameter('FilePath').setValue(url)
    asset.on('loaded', () => {
      const materials = asset.getMaterialLibrary().getMaterials()
      materials.forEach((material) => {
        const baseColorParam = material.getParameter('BaseColor')
        if (baseColorParam) {
          const color = baseColorParam.getValue()
          baseColorParam.setValue(color.toGamma())
        }
        const emissiveStrengthParam = material.getParameter('EmissiveStrength')
        if (emissiveStrengthParam) {
          emissiveStrengthParam.setValue(0.5)
        }
        if (material.getShaderName() == 'LinesShader') {
          const opacityParam = material.getParameter('Opacity')
          if (opacityParam) {
            opacityParam.setValue(0.2)
          }
        }
      })
    })
    return asset
  }

  const parseTreeItem = (parentItem, json) => {
    return new Promise((resolve, reject) => {
      const name = json.Instance ? json.Instance.instanceName : json.referenceName

      const loadTreeItem = () => {
        return new Promise((resolve, reject) => {
          // If this item references an asset we loaded earlier, then we use/clone the asset
          let treeItem
          if (json.Reference && json.Reference.referenceName in references) {
            const referenceVersions = references[json.Reference.referenceName]
            let reference = references[json.Reference.referenceName][json.Reference.V_version]
            if (!reference) {
              console.log(json.Reference.referenceName, ' - Version not found: ', json.Reference.V_version)
              /// grab the first version.
              reference = referenceVersions[Object.keys(referenceVersions)[0]]
            }

            if (!reference.asset) {
              // const url = folder + 'Sample/Part_3_Rep.zcad'
              const url = folder + reference.url
              reference.asset = loadCADAsset(url)
              treeItem = reference.asset
            } else {
              treeItem = reference.asset.clone()
            }

            // const url = folder + json.url
            // const asset = reference.asset
            // if (reference.refs == 0) {
            //   treeItem = asset
            // } else {
            //   // After the first reference, we clone.
            //   // Note: this is a shallow clone and all the geometry data will be shared(instanced)
            //   treeItem = asset.clone()
            // }
            // reference.refs++
            treeItem.setName(json.Instance.instanceName)

            treeItem.getGeometryLibrary().once('loaded', () => {
              console.log('Loaded:', json.Instance.instanceName)
              setTimeout(() => {
                resolve(treeItem)
              }, 300)
            })
          } else {
            treeItem = new TreeItem(name)
            resolve(treeItem)
          }
        })
      }

      loadTreeItem().then(async (treeItem) => {
        parentItem.addChild(treeItem, false)
        if (json.matrix) {
          const mat4 = new Mat4()
          const d = json.matrix
          // mat4.set(d[0], d[1], d[2], 1, d[3], d[4], d[5], 1, d[6], d[7], d[8], 1, d[9], d[10], d[11], 1)
          mat4.set(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10], d[11], 0, 0, 0, 0)
          mat4.transposeInPlace()
          const xfo = new Xfo()
          xfo.setFromMat4(mat4)
          // xfo.sc.set(1 / 1000, 1 / 1000, 1 / 1000)
          // xfo.tr.scaleInPlace(1 / 1000) // convert from millimeters to meters (optional)
          treeItem.getParameter('LocalXfo').setValue(xfo)
        }
        if (json.children) {
          for (let i = 0; i < json.children.length; i++) {
            const childJson = json.children[i]
            await parseTreeItem(treeItem, childJson)
          }
        }
        resolve()
      })
    })
  }

  return productStructure
}
