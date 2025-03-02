import { generateLayoutImage } from './layoutGenerator'
import { uploadImageToStorage } from './firebaseStorageService'
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

export const processImage = async (
  imageFiles: File[],
  texts: string[],
  timestamp: string
) => {
  const timestamps: number[] = []
  try {
    const imagePaths: string[] = [] // 処理後の画像パスを格納する配列

    // 画像ファイルをループ処理
    for (const imageFile of imageFiles) {
      const timestamp = Date.now()
      timestamps.push(timestamp)
      // アップロードされた画像を一時ファイルに保存
      const buffer = await imageFile.arrayBuffer()
      const tempFilePath = path.join(
        process.cwd(),
        'tmp',
        `tmp_${timestamp}_${imageFile.name}` // ユニークな一時ファイルパス
      )
      await fs.writeFile(tempFilePath, Buffer.from(buffer))

      // 画像ファイルをsharpで処理し、一時ファイルに保存
      const processedImagePath = path.join(
        process.cwd(),
        'tmp',
        `processed_${timestamp}_${imageFile.name}` // ユニークな処理後のファイルパス
      )
      await sharp(tempFilePath).toFile(processedImagePath)

      // 処理後の画像のパスを imagePaths に格納
      imagePaths.push(processedImagePath)
    }

    // レイアウト生成
    const layoutImagePath = await generateLayoutImage(
      imagePaths,
      texts,
      timestamp
    )

    // ストレージにアップロード
    await uploadImageToStorage(layoutImagePath, `${timestamp}_newspaper.jpg`)

    // ループ内で生成された一時ファイルを削除
    imageFiles.forEach(async (imageFile, index) => {
      const tempFilePath = path.join(
        process.cwd(),
        'tmp',
        `tmp_${timestamps[index]}_${imageFile.name}`
      )
      const processedImagePath = path.join(
        process.cwd(),
        'tmp',
        `processed_${timestamps[index]}_${imageFile.name}`
      )
      await fs.unlink(tempFilePath)
      await fs.unlink(processedImagePath)
    })
  } catch (error) {
    console.error('Image processing error:', error)
    throw error
  }
}
