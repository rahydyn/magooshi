import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '@/lib/firebaseClient'

export const uploadImageToStorage = async (
  imageBuffer: Buffer, // Buffer を受け取る
  imageName: string
) => {
  try {
    const storageRef = ref(storage, imageName)

    // バッファデータをアップロード
    await uploadBytes(storageRef, imageBuffer)

    // ダウンロードURLを取得
    // console.log('Uploaded image to:', imageUrl)
  } catch (error) {
    console.error('Error uploading image to storage:', error)
    throw error
  }
}

export const uploadTempImageToStorage = async (
  imageBuffer: Buffer,
  imageName: string
): Promise<string> => {
  try {
    const tempImageName = `/tmp/${Date.now()}_${imageName}` // /tmp ディレクトリに保存
    const storageRef = ref(storage, tempImageName)

    // バッファデータをアップロード
    await uploadBytes(storageRef, imageBuffer)

    // ダウンロードURLを取得
    const imageUrl = await getDownloadURL(storageRef)
    // console.log('Uploaded temp image to:', imageUrl)
    return imageUrl
  } catch (error) {
    console.error('Error uploading temp image to storage:', error)
    throw error
  }
}
