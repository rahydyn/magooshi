import { storage } from '@/lib/firebaseClient'
import { ref, uploadBytes } from 'firebase/storage'
import fs from 'fs/promises'

export const uploadImageToStorage = async (
  imagePath: string,
  fileName: string
): Promise<string> => {
  try {
    const fileBuffer = await fs.readFile(imagePath)
    const storageRef = ref(storage, `newspaper/${fileName}`)
    await uploadBytes(storageRef, fileBuffer)
    return `newspaper/${fileName}`
  } catch (error) {
    console.error('Firebase Storage upload error:', error)
    throw error
  }
}
