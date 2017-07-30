import bridgedFunctionCall from '../../../bridge/client'

const _getThumbnail = bridgedFunctionCall('getThumbnail')

// TODO -> LRU cache?
const thumbnails = {}

export default async function getThumbnail (attachment) {
  let thumbnail = thumbnails[attachment.id]
  if (!thumbnail && attachment.thumbnail && attachment.mimeType) {
    thumbnails[attachment.id] = thumbnail = await _getThumbnail(
      attachment.thumbnail,
      attachment.mimeType
    )
  }
  return thumbnail
}
