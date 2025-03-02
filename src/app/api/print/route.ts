import { NextApiRequest } from 'next'
import { NextResponse } from 'next/server'
import axios from 'axios'
import fs from 'fs/promises'
import path from 'path'

export async function POST(req: NextApiRequest) {
  const clientId = process.env.CLIENT_ID // クライアントID
  const clientSecret = process.env.CLIENT_SECRET // クライアントシークレット
  const printerEmail = process.env.PRINTER_EMAIL // プリンターのメールアドレス
  const host = 'api.epsonconnect.com' // Epson Connect APIのホスト名
  if (req.method !== 'POST') {
    return NextResponse.json(
      { message: '印刷ジョブの送信中にエラーが発生しました。' },
      { status: 405 }
    )
  }

  try {
    console.log(req.body)
    const timestamp = req.body.timestamp // リクエストボディからタイムスタンプを取得
    console.log('timestamp:', timestamp)

    // const fileName = `${timestamp}_layout.jpg` // タイムスタンプを含めたファイル名
    const fileName = `layout.jpg` // タイムスタンプを含めたファイル名
    const imagePath = path.join(process.cwd(), 'tmp', fileName) // 画像のパス    console.log('imagePath:', imagePath)
    console.log(imagePath)

    // 1. 認証
    const authResponse = await axios.post(
      `https://${host}/api/1/printing/oauth2/auth/token?subject=printer`,
      {
        grant_type: 'password',
        username: printerEmail,
        password: '',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${clientId}:${clientSecret}`
          ).toString('base64')}`,
        },
      }
    )
    const accessToken = authResponse.data.access_token
    const deviceId = authResponse.data.subject_id
    console.log('deviceId:', deviceId)

    // 2. 印刷設定
    const printSettingResponse = await axios.post(
      `https://${host}/api/1/printing/printers/${deviceId}/jobs`,
      {
        job_name: 'Print Job',
        print_mode: 'photo',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    const printJobId = printSettingResponse.data.id
    const uploadUri = printSettingResponse.data.upload_uri
    console.log('uploadUri:', uploadUri)

    // 3. 印刷ファイルのアップロード
    const imageBuffer = await fs.readFile(imagePath, (err, data) => {
      if (err) {
        console.error('Error reading layout image:', err)
        throw err
      }
      return data
    })
    await axios.post(`${uploadUri}&File=1.jpg`, imageBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    })
    console.log('uploading...', printJobId)

    // 4. 印刷実行
    await axios
      .post(
        `https://${host}/api/1/printing/printers/${deviceId}/jobs/${printJobId}/print`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then((res) => {
        console.log(res.data)
      })
      .catch((err) => {
        console.log(err)
      })
    console.log('uploaded:')

    // res.status(200).json({ message: '印刷ジョブが正常に送信されました。' })
    return NextResponse.json(
      { message: '印刷ジョブが正常に送信されました。' },
      { status: 200 }
    )
  } catch (error) {
    console.error('印刷ジョブの送信中にエラーが発生しました:', error)
    return NextResponse.json(
      { message: '印刷ジョブの送信中にエラーが発生しました。' },
      { status: 500 }
    )
    // res
    //   .status(500)
    //   .json({ message: '印刷ジョブの送信中にエラーが発生しました。' })
  }
}
