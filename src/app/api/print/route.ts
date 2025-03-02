import axios from 'axios'
import { getDownloadURL, ref } from 'firebase/storage'
import { storage } from '@/lib/firebaseClient'
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
    const imageUrl = await getDownloadURL(imageRef) // ダウンロード URL を取得

    const response = await fetch(imageUrl) // URL から画像をダウンロード
    const imageBuffer = Buffer.from(await response.arrayBuffer()) // バッファに変換

    // Base64 エンコード
    const base64Image = imageBuffer.toString('base64')

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
    try {
      const decodedImage = Buffer.from(base64Image, 'base64')
      const uploadFileResponse = await axios.post(
        `${uploadUri}&File=1.jpg`,
        decodedImage,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        }
      )
      // アップロードの成功ステータスコードをチェック
      if (!uploadFileResponse.status.toString().startsWith('2')) {
        throw new Error(
          `印刷ファイルのアップロードに失敗しました。ステータスコード: ${uploadFileResponse.status}`
        )
      }
    } catch (error) {
      console.error(
        '印刷ファイルのアップロード中にエラーが発生しました:',
        error
      )
      return NextResponse.json(
        { message: '印刷ファイルのアップロード中にエラーが発生しました。' },
        { status: 500 }
      )
    }

    // 4. 印刷実行
    try {
      const executePrintResponse = await axios.post(
        `https://${host}/api/1/printing/printers/${deviceId}/jobs/${printJobId}/print`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      //   console.log(executePrintResponse)

      // 印刷実行の成功ステータスコードをチェック
      if (!executePrintResponse.status.toString().startsWith('2')) {
        throw new Error(
          `印刷実行に失敗しました。ステータスコード: ${executePrintResponse.status}`
        )
      }
    } catch (error) {
      console.error('印刷実行中にエラーが発生しました:', error)
      return NextResponse.json(
        { message: '印刷実行中にエラーが発生しました。' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: '印刷ジョブが正常に送信されました。' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error sending print job:', error)
    return NextResponse.json(
      { message: '印刷ジョブの送信中にエラーが発生しました。' },
      { status: 500 }
    )
  }
}
