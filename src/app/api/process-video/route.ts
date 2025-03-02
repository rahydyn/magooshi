import { NextResponse } from 'next/server'
import { processVideo } from '@/lib/videoProcessor'
import { processImage } from '@/lib/imageProcessor'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    // TODO: 
    const timestamp = new Date().toISOString()

    if (videoFile) {
      await processVideo(videoFile)
      return NextResponse.json(
        { message: 'Video processed successfully' },
        { status: 200 }
      )
    } else {
      // FormDataから画像ファイルとテキストの配列を取得
      const dataLength = Number(formData.get('length') as string)
      const imageFiles = new Array(dataLength)
        .map((_, index) => formData.get(`image-${index}`) as File)
        .filter((file) => file !== null) // null を除外
      const texts = new Array(dataLength)
        .map((_, index) => formData.get(`text-${index}`) as string)
        .filter((text) => text !== null) // null を除外

      if (!imageFiles.length || !texts.length) {
        return NextResponse.json(
          { error: 'Image file and text are required' },
          { status: 400 }
        )
      }

      try {
        // processImage関数に画像ファイルとテキストの配列を渡す
        await processImage(imageFiles, texts, timestamp)
        return NextResponse.json(
          { message: 'Image processed successfully' },
          { status: 200 }
        )
      } catch (error) {
        console.error('Error processing images:', error)
        return NextResponse.json(
          { error: 'Image processing failed' },
          { status: 500 }
        )
      }
    }
  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
