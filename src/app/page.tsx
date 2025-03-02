'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import UploadForm from '@/components/UploadForm/UploadForm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function Page() {
  const [isImageMode, setIsImageMode] = useState<boolean>(true)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  const handleUploadSuccess = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  const titleImage = '画像とテキストをアップロード'
  const titleVideo = '動画をアップロード'
  const descriptionImage =
    '画像とテキストをアップロードして、オリジナルの新聞を作成しましょう。'
  const descriptionVideo = '孫の動画をアップロードして、祖父母に届けましょう。'

  const [inputSets, setInputSets] = useState<
    { imageFile: File | null; text: string }[]
  >([{ imageFile: null, text: '' }])

  const handleAddInputSet = () => {
    setInputSets([...inputSets, { imageFile: null, text: '' }])
  }

  const handleImageFileChange = (file: File | null, index: number) => {
    const newInputSets = [...inputSets]
    newInputSets[index].imageFile = file
    setInputSets(newInputSets)
  }

  const handleTextChange = (text: string, index: number) => {
    const newInputSets = [...inputSets]
    newInputSets[index].text = text
    setInputSets(newInputSets)
  }

  return (
    <div className="flex justify-center items-center h-screen bg-[#FEFBEE]">
      <Card className="w-96 p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            {isImageMode ? titleImage : titleVideo}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {isImageMode ? descriptionImage : descriptionVideo}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            value={isImageMode ? 'image' : 'video'}
            onValueChange={(value: string) => setIsImageMode(value === 'image')}
          >
            <TabsList className="cursor-pointer">
              <TabsTrigger value="image">画像</TabsTrigger>
              <TabsTrigger value="video">動画</TabsTrigger>
            </TabsList>
            <TabsContent value={isImageMode ? 'image' : 'video'}>
              <UploadForm
                onUploadSuccess={handleUploadSuccess}
                mode={isImageMode ? 'image' : 'video'}
                inputSets={inputSets}
                setInputSets={setInputSets}
                handleAddInputSet={handleAddInputSet}
                handleImageFileChange={handleImageFileChange}
                handleTextChange={handleTextChange}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* モーダル */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>アップロード完了</DialogTitle>
            <DialogDescription>
              ファイルのアップロードが完了しました。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleCloseModal}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
