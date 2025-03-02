'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PlusCircledIcon, TrashIcon } from '@radix-ui/react-icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface UploadFormProps {
  onUploadSuccess: () => void
  mode: 'video' | 'image'
  inputSets: { imageFile: File | null; text: string }[]
  setInputSets: React.Dispatch<
    React.SetStateAction<{ imageFile: File | null; text: string }[]>
  >
  handleAddInputSet: () => void
  handleImageFileChange: (file: File | null, index: number) => void
  handleTextChange: (text: string, index: number) => void
}

const UploadForm: React.FC<UploadFormProps> = ({
  onUploadSuccess,
  mode,
  inputSets,
  setInputSets,
  handleAddInputSet,
  handleImageFileChange,
  handleTextChange,
}) => {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [isUploadDisabled, setIsUploadDisabled] = useState(true)

  useEffect(() => {
    if (mode === 'video') {
      setIsUploadDisabled(!videoFile)
    } else {
      setIsUploadDisabled(
        inputSets.some(
          (set) => !set.imageFile || !set.text || set.text.length > 30
        )
      )
    }
  }, [videoFile, inputSets, mode])

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0])
    } else {
      setVideoFile(null)
    }
  }

  const handleRemoveInputSet = (index: number) => {
    const newInputSets = [...inputSets]
    newInputSets.splice(index, 1)
    setInputSets(newInputSets)
  }

  const handleUpload = async () => {
    if (isUploadDisabled) return

    try {
      const formData = new FormData()
      const timestampData = new FormData()
      if (mode === 'video') {
        formData.append('video', videoFile!)
      } else {
        inputSets.forEach((set, index) => {
          formData.append(`image-${index}`, set.imageFile!)
          formData.append(`text-${index}`, set.text)
        })
        formData.append(`length`, inputSets.length.toString())
      }

      const endpoint =
        mode === 'video' ? '/api/process-video' : '/api/process-image'

      const timestamp = Date.now()
      formData.append('timestamp', timestamp.toString())
      timestampData.append('timestamp', timestamp.toString())
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        console.error('処理に失敗しました:', response)
        alert('処理に失敗しました。')
        return
      }

      // /api/print API ルートを呼び出す
      const printResponse = await fetch('/api/print', {
        method: 'POST',
        // headers: {
        //   'Content-Type': 'application/json',
        // },
        body: timestampData,
      })
      console.log(printResponse)

      if (printResponse.ok) {
        onUploadSuccess()
      } else {
        console.error('処理に失敗しました:', printResponse)
        alert('処理に失敗しました。')
      }
    } catch (error) {
      console.error('アップロード中にエラーが発生しました:', error)
      alert('アップロード中にエラーが発生しました。')
    }
  }

  return (
    <div className="grid gap-4">
      {mode === 'video' ? (
        <div>
          <Label htmlFor="video">動画ファイル</Label>
          <Input
            id="video"
            type="file"
            accept="video/*"
            onChange={handleVideoFileChange}
          />
        </div>
      ) : (
        <>
          {inputSets.map((inputSet, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="flex-1 space-y-2">
                <div>
                  <Label htmlFor={`image-${index}`}>
                    画像ファイル {index + 1}
                  </Label>
                  <Input
                    id={`image-${index}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageFileChange(e.target.files[0], index)
                      } else {
                        handleImageFileChange(null, index)
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`text-${index}`}>テキスト {index + 1}</Label>
                  <Textarea
                    id={`text-${index}`}
                    value={inputSet.text}
                    onChange={(e) => handleTextChange(e.target.value, index)}
                    maxLength={30}
                  />
                  {inputSet.text.length > 30 && (
                    <p className="text-red-500 text-sm">
                      30文字以内で入力してください。
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleRemoveInputSet(index)}
                className="cursor-pointer"
              >
                <TrashIcon />
              </Button>
            </div>
          ))}
          <Button onClick={handleAddInputSet} className="cursor-pointer">
            <PlusCircledIcon className="mr-2" />
            追加
          </Button>
        </>
      )}
      <Tooltip>
        <TooltipTrigger disabled={!isUploadDisabled}>
          <TooltipContent>
            {mode === 'video'
              ? '動画ファイルを選択してください。'
              : '画像ファイルとテキストを入力してください。'}
          </TooltipContent>
        </TooltipTrigger>
        <Button
          onClick={handleUpload}
          disabled={isUploadDisabled}
          className="cursor-pointer"
        >
          アップロード
        </Button>
      </Tooltip>
    </div>
  )
}

export default UploadForm
