import { NextResponse } from 'next/server'
import { processImage } from '@/lib/imageProcessor'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const dataLength = Number(formData.get('length') as string)
    const timestamp = formData.get('timestamp') as string

    const imageFiles = Array.from(new Array(dataLength))
      .map((_, index) => formData.get(`image-${index}`) as File)
      .filter((file) => file !== null) // null を除外

    const texts = Array.from(new Array(dataLength))
      .map((_, index) => formData.get(`text-${index}`) as string)
      .filter((text) => text !== null) // null を除外

    if (!imageFiles.length || !texts.length) {
      return NextResponse.json(
        { error: 'Image file and text are required' },
        { status: 400 }
      )
    }

    try {
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
  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
