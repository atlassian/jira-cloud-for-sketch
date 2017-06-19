export function exportLayer(context, layer, dir, duplicateCount) {
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

function nameForSlice(slice, layer, duplicateCount) {
    var filename = slice.name()
    if (duplicateCount) {
        filename = layer.name() + " (" + duplicateCount + ")"
        // coerce to strings to avoid cocoascript shenanigins
        var layerName = layer.name() + ""
        var sliceName = slice.name() + ""
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
    filename = normalizeFilename(filename)
    filename += "." + slice.format()
    return filename
}

function normalizeFilename(filename) {
    return filename.replace(/\//g, "_")
}

export function exportSelected(context, dir) {
    var exportedNames = {};
    var exportedPaths = [];
    for (var i = 0; i < context.selection.count(); i++) {
        var layer = context.selection[i];
        var key = layer.name().toLowerCase()
        var count = exportedNames[key] || 0
        exportedPaths = exportedPaths.concat(exportLayer(context, layer, dir, count))
        exportedNames[key] = count + 1
    }
    return exportedPaths
}
