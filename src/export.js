import { tempDir, localPathToNSURLString } from './util'
import { trace } from './logger'

const badFilenameChars = new RegExp('/', 'g')

export async function exportSelection (document) {
  const dir = tempDir('export-' + Date.now())
  const selectedLayers = document.selectedLayers().layers()
  trace('Exporting ' + selectedLayers.count() + ' assets to ' + dir)
  let exportedPaths = []
  for (let i = 0; i < selectedLayers.count(); i++) {
    exportedPaths.push(...exportLayer(document, selectedLayers[i], dir))
  }
  return exportedPaths
}

function exportLayer (document, layer, dir) {
  const exportedPaths = []
  const slices = MSExportRequest.exportRequestsFromExportableLayer(layer)
  for (let i = 0; i < slices.count(); i++) {
    const slice = slices[i]
    const filepath = dir + nameForSlice(slice)
    document.saveArtboardOrSlice_toFile(slice, filepath)
    exportedPaths.push(localPathToNSURLString(filepath))
  }
  return exportedPaths
}

function nameForSlice (slice) {
  return `${encodeLayerNameAsFilename(slice.name())}.${slice.format()}`
}

function encodeLayerNameAsFilename (layerName) {
  return layerName.replace(badFilenameChars, '_')
}
