import sharp from 'sharp'
import path from 'path'

export const generateLayoutImage = async (
  imagePaths: string[],
  textData: string[],
  timestamp: string
): Promise<string> => {
  try {
    sharp.cache(false)
    sharp.simd(false)

    const baseImage = sharp(
      path.join(process.cwd(), 'public', 'base_layout.png')
    )
    const baseImageBuffer = await baseImage.toBuffer()

    let layoutImage = sharp(baseImageBuffer)

    // 画像の配置領域
    const imagePositions = [
      { left: 68, top: 322, width: 1254, height: 562 }, // index 0
      { left: 860, top: 1044, width: 472, height: 242 }, // index 1
    ]

    const textPositions = [
      { left: 68, top: 184, width: 1254, height: 562, fontSize: 48 }, // index 0 のテキスト
      { left: 860, top: 1376, width: 472, height: 242, fontSize: 48 }, // index 1 のテキスト
    ]

    for (let i = 0; i < imagePaths.length && i < imagePositions.length; i++) {
      const topTextBuffer = Buffer.from(
        `<svg width="${textPositions[i].width}" height="${
          textPositions[i].height
        }">
          <text x="0" y="${textPositions[i].fontSize + 10}" font-size="${
          textPositions[i].fontSize
        }" fill="#5b5b5b" font-family="Zen Maru Gothic, sans-serif" textLength="${
          textPositions[i].width
        }" lengthAdjust="spacing">${textData[i] || ''}</text>
        </svg>`
      )

      const resizedImage = sharp(imagePaths[i]).resize(
        imagePositions[i].width,
        imagePositions[i].height,
        { fit: 'cover' }
      )

      const clonedLayoutImage = layoutImage.clone()

      const composites = [
        {
          input: await resizedImage.toBuffer(),
          left: imagePositions[i].left,
          top: imagePositions[i].top,
        },
        {
          input: await sharp(topTextBuffer).toBuffer(),
          left: textPositions[i].left,
          top: textPositions[i].top,
        },
      ]

      clonedLayoutImage.composite(composites)
      layoutImage = await sharp(await clonedLayoutImage.toBuffer())
    }

    const layoutImagePath = path.join(
      process.cwd(),
      'tmp',
      `layout.jpg`
    //   `${timestamp}_layout.jpg`
    )

    try {
      await layoutImage.toFile(layoutImagePath)
    } catch (error) {
      console.error('Error saving layout image:', error)
    }

    return layoutImagePath
  } catch (error) {
    console.error('Layout generation error:', error)
    throw error
  }
}
