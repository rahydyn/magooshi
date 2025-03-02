import { storage } from '@/lib/firebaseClient'
import axios from 'axios'
import { getDownloadURL, ref } from 'firebase/storage'
import { NextResponse } from 'next/server'

const clientId = process.env.CLIENT_ID // クライアントID
const clientSecret = process.env.CLIENT_SECRET // クライアントシークレット
const printerEmail = process.env.PRINTER_EMAIL // プリンターのメールアドレス
const host = 'api.epsonconnect.com' // Epson Connect APIのホスト名

export const POST = async (request: Request) => {
  try {
    const formData = await request.formData()
    const timestamp = formData.get('timestamp') as string
    const imageName = `newspaper/${timestamp}_newspaper.jpg`

    // Firebase Storage から画像を取得
    const imageRef = ref(storage, imageName)
    // const [imageBuffer] = await imageRef.download()
    const [imageBuffer] = await getDownloadURL(imageRef)

    // Base64 エンコード
    const base64Image = Buffer.from(imageBuffer).toString('base64')

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

    // 3. 印刷ファイルのアップロード
    await axios.post(`${uploadUri}&File=1.jpg`, base64Image, {
      headers: {
        'Content-Type': 'image/jpeg', // Base64 エンコードされた画像データを送信
      },
    })

    // 4. 印刷実行
    await axios.post(
      `https://${host}/api/1/printing/printers/${deviceId}/jobs/${printJobId}/print`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
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
  }
}
