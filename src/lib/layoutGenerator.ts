import path from 'path'
import sharp from 'sharp'

export const generateLayoutImage = async (
  imageUrls: string[], // 画像URLの配列を受け取る
  textData: string[]
  //   timestamp: string
): Promise<Buffer> => {
  // 画像の配置領域
  const imagePositions = [
    { left: 68, top: 322, width: 1254, height: 562 }, // index 0
    { left: 860, top: 1044, width: 472, height: 242 }, // index 1
    { left: 80, top: 1154, width: 662, height: 352 }, // index 2 のテキスト
    { left: 80, top: 1539, width: 320, height: 390 }, // index 3 のテキスト
    { left: 420, top: 1539, width: 320, height: 390 }, // index 4 のテキスト
  ]

  // テキストの配置領域
  const textPositions = [
    { left: 68, top: 184, width: 1254, height: 562, fontSize: 30 }, // index 0 のテキスト
    { left: 860, top: 1376, width: 472, height: 242, fontSize: 22 }, // index 1 のテキスト
    { left: 160, top: 1046, width: 510, height: 104, fontSize: 26 }, // index 2 のテキスト
    { left: 880, top: 1750, width: 432, height: 192, fontSize: 22 }, // index 3 のテキスト
  ]

  try {
    sharp.cache(false)
    sharp.simd(false)

    const baseImage = sharp(
      path.join(process.cwd(), 'public', 'base_layout.png')
    )

    let layoutImage = baseImage

    for (let i = 0; i < imageUrls.length && i < imagePositions.length; i++) {
      // Firebase Storage から画像を取得
      const response = await fetch(imageUrls[i])
      const arrayBuffer = await response.arrayBuffer() // ArrayBuffer に変換
      const buffer = Buffer.from(arrayBuffer) // Buffer に変換
      const resizedImage = sharp(buffer).resize(
        imagePositions[i].width,
        imagePositions[i].height,
        {
          fit: 'cover',
        }
      )

      const clonedLayoutImage = layoutImage.clone()
      const composites = [
        {
          input: await resizedImage.toBuffer(),
          left: imagePositions[i].left,
          top: imagePositions[i].top,
        },
      ]

      // i < textPositions.length でテキストを配置するかどうかを判断
      if (i < textPositions.length) {
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
        composites.push({
          input: await sharp(topTextBuffer).toBuffer(),
          left: textPositions[i].left,
          top: textPositions[i].top,
        })
      }

      clonedLayoutImage.composite(composites)
      layoutImage = await sharp(await clonedLayoutImage.toBuffer())
    }

    return await layoutImage.toBuffer() // Buffer を返す
  } catch (error) {
    console.error('Layout generation error:', error)
    throw error
  }
}
