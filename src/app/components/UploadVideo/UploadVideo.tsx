'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { storage } from '@/lib/firebaseClient'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
// import { extractFramesFromVideo } from '@/lib/videoUtils'

const UploadVideo = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [extractedFrames, setExtractedFrames] = useState<string[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!videoFile) {
      alert('動画ファイルを選択してください。')
      return
    }

    try {
      const storageRef = ref(storage, 'videos/' + videoFile.name)
      const uploadTask = uploadBytesResumable(storageRef, videoFile)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          setUploadProgress(progress)
        },
        (error) => {
          console.error('動画のアップロード中にエラーが発生しました:', error)
          alert('動画のアップロードに失敗しました。')
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
            console.log('動画をアップロードしました:', downloadURL)
            alert('動画をアップロードしました。')
            // 動画をアップロードしたら、動画から画像を抽出する。
            // const frames = await extractFramesFromVideo(videoFile, 5) // 5秒間隔で画像を抽出
            // setExtractedFrames(frames)
          })
        }
      )
    } catch (error) {
      console.error('動画のアップロード中にエラーが発生しました:', error)
      alert('動画のアップロード中にエラーが発生しました。')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>動画をアップロード</CardTitle>
        <CardDescription>
          孫の動画をアップロードして、祖父母に届けましょう。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="video">動画ファイル</Label>
            <Input
              id="video"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
            />
          </div>
          {uploadProgress > 0 && (
            <Progress value={uploadProgress} className="w-full" />
          )}
          <div className="flex flex-wrap">
            {extractedFrames.map((frame, index) => (
              <img
                key={index}
                src={frame}
                alt={`frame ${index}`}
                className="w-32 h-24 object-cover m-1"
              />
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleUpload}>アップロード</Button>
      </CardFooter>
    </Card>
  )
}

export default UploadVideo
