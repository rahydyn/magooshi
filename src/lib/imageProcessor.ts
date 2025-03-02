import { generateLayoutImage } from './layoutGenerator'
import {
  uploadImageToStorage,
  uploadTempImageToStorage,
} from './firebaseStorageService'
import sharp from 'sharp'

export const processImage = async (
  imageFiles: File[],
  texts: string[],
  timestamp: string
) => {
  try {
    const imageUrls: string[] = [] // 処理後の画像のURLを格納する配列

    // 画像ファイルをループ処理
    for (const imageFile of imageFiles) {
      // 画像ファイルをsharpで処理し、一時ファイルとしてFirebase Storageにアップロード
      const buffer = await imageFile.arrayBuffer()
      const processedImageBuffer = await sharp(Buffer.from(buffer)).toBuffer()
      const tempImageUrl = await uploadTempImageToStorage(
        processedImageBuffer,
        imageFile.name
      )

      // 処理後の画像のURLを imageUrls に格納
      imageUrls.push(tempImageUrl)
    }

    // レイアウト生成
    const layoutImageBuffer = await generateLayoutImage(
      imageUrls, // 画像URLの配列を渡す
      texts
      //   timestamp
    )

    // ストレージにアップロード
    await uploadImageToStorage(
      layoutImageBuffer, // Buffer を渡す
      `newspaper/${timestamp}_newspaper.jpg`
    )

    // TODO: Firebase Storage の /tmp ディレクトリをクリーンアップする処理を追加
  } catch (error) {
    console.error('Image processing error:', error)
    throw error
  }
}
