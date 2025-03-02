import { FFmpeg } from '@ffmpeg/ffmpeg'
import sharp from 'sharp'
import { generateLayoutImage } from './layoutGenerator'
import { uploadImageToStorage } from './firebaseStorageService'
import path from 'path'

export const processVideo = async (videoFile: File) => {
  try {
    const videoData = await videoFile.arrayBuffer()
    const ffmpeg = new FFmpeg()

    // ログを格納する変数
    let logs: string = ''

    // 'log' イベントを監視
    ffmpeg.on('log', ({ message }) => {
      logs += message + '\n'
    })

    await ffmpeg.load()

    const extractInterval = 5
    const duration = await getVideoDuration(
      ffmpeg,
      videoFile.name,
      videoData,
      logs
    )
    const imagePaths: string[] = []
    const textData: string[] = []

    // videoFile.name を一時ファイルに書き込む
    await ffmpeg.writeFile(videoFile.name, new Uint8Array(videoData))

    for (let i = 0; i < duration; i += extractInterval) {
      const imageFileName = `frame_${i}.jpg`
      // 一時ファイルを読み込み、exec を実行
      await ffmpeg.exec([
        '-ss',
        i.toString(),
        '-i',
        videoFile.name,
        '-vframes',
        '1',
        imageFileName,
      ])

      const imageData = await ffmpeg.readFile(imageFileName)
      // imageData が Uint8Array 型であることを確認
      let imageBuffer: Uint8Array
      if (typeof imageData === 'string') {
        // imageData が string 型の場合、空の Uint8Array を作成
        imageBuffer = new Uint8Array()
      } else {
        // imageData が Uint8Array 型の場合、そのまま使用
        imageBuffer = imageData
      }
      await ffmpeg.deleteFile(imageFileName)

      const imagePath = path.join(process.cwd(), 'tmp', imageFileName) // 一時ファイルのパス
      await sharp(imageBuffer).toFile(imagePath)
      imagePaths.push(imagePath)
      textData.push(`フレーム ${i}秒`)
    }

    await ffmpeg.deleteFile(videoFile.name)

    const layoutImagePath = await generateLayoutImage(imagePaths, textData)

    await uploadImageToStorage(layoutImagePath, 'newspaper.jpg')
  } catch (error) {
    console.error('Video processing error:', error)
    throw error
  }
}

const getVideoDuration = async (
  ffmpeg: FFmpeg,
  filename: string,
  videoData: ArrayBuffer,
  logs: string
): Promise<number> => {
  // filename を一時ファイルに書き込む
  await ffmpeg.writeFile(filename, new Uint8Array(videoData))
  await ffmpeg.exec(['-i', filename, '-f', 'null', '-'])
  await ffmpeg.deleteFile(filename)

  const durationRegex = /Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/
  const match = logs.match(durationRegex)

  if (match) {
    const hours = parseInt(match[1])
    const minutes = parseInt(match[2])
    const seconds = parseFloat(match[3])
    return hours * 3600 + minutes * 60 + seconds
  } else {
    throw new Error('動画の長さを取得できませんでした。')
  }
}
