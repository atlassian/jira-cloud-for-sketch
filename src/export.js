import { tempDir } from './util'

export function exportLayer (context, layer, dir, duplicateCount) {
  var exportedPaths = []
  var slices = MSExportRequest.exportRequestsFromExportableLayer(layer)
  for (var i = 0; i < slices.count(); i++) {
    var slice = slices[i]
    var filepath = dir + nameForSlice(slice, layer, duplicateCount)
    context.document.saveArtboardOrSlice_toFile(slice, filepath)
    exportedPaths.push(filepath)
  }
  return exportedPaths
}

export function exportSelected (context, dir) {
  dir = dir || tempDir(`export-${Date.now()}`)
  console.log(`Exporting ${context.selection.count()} assets to ${dir}`)
  var exportedPaths = []
  var exportedFilenames = {}
  for (var i = 0; i < context.selection.count(); i++) {
    var layer = context.selection[i]
    var key = encodeLayerNameAsFilename(layer.name().toLowerCase())
    var count = exportedFilenames[key] || 0
    exportedPaths = exportedPaths.concat(
      exportLayer(context, layer, dir, count)
    )
    exportedFilenames[key] = count + 1
  }
  return exportedPaths
}

function nameForSlice (slice, layer, duplicateCount) {
  var filename = slice.name()
  if (duplicateCount) {
    filename = `${layer.name()} (${duplicateCount})`
    // coerce to strings to avoid CocoaScript shenanigins
    var layerName = layer.name() + ''
    var sliceName = slice.name() + ''
    if (sliceName.length > layerName.length) {
      var layerIndexInSliceName = sliceName.indexOf(layerName)
      if (layerIndexInSliceName > 0) {
        var prefix = sliceName.substring(0, layerIndexInSliceName)
        filename = prefix + filename
      } else {
        var suffix = sliceName.substring(layerName.length)
        filename = filename + suffix
      }
    }
  }
  filename = encodeLayerNameAsFilename(filename)
  filename += '.' + slice.format()
  return filename
}

function encodeLayerNameAsFilename (layerName) {
  var badFilenameChars = new RegExp('/', 'g')
  return layerName.replace(badFilenameChars, '_')
}
