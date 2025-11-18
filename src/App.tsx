import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Paperclip, Send, ImageIcon, Loader2, RotateCcw, Download, MessageSquarePlus, Copy, Check } from 'lucide-react'
import OpenAI from 'openai'
import { parseNaturalLanguage, buildPromptFromParsed, extractCharacterHints } from './utils/nlpParser'

interface Message {
  id: number
  text: string
  isUser: boolean
  timestamp: string
  imageUrl?: string
  type?: 'text' | 'image' | 'story' | 'storybook' | 'info'
  images?: { sentence: string; imageUrl: string }[]
  story?: string
  characterDesc?: string
  styleInfo?: string
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      text: 'Hi! Upload a photo of your handwritten journal entry, and I\'ll transform it into a beautiful storybook. You can also tell me what style you\'d like - anime, watercolor, 3D, or describe your character!',
      isUser: false,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    }
  ])
  const [inputMessage, setInputMessage] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [progress, setProgress] = useState<number>(0)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [lastStorybook, setLastStorybook] = useState<Message | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, {
      ...message,
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
    }
  }

  const processJournalEntry = async (file: File, userInstructions?: string) => {
    setIsProcessing(true)
    setProgress(5)

    try {
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      })

      // Step 1: OCR
      addMessage({
        text: 'Reading your handwriting...',
        isUser: false,
        type: 'text'
      })

      setProgress(15)

      const arrayBuffer = await file.arrayBuffer()
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      const ocrResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Transcribe all handwritten text from this journal entry. Output only the transcribed text, no commentary.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${file.type};base64,${base64}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      })

      const extractedText = ocrResponse.choices[0]?.message.content || ''

      setProgress(25)
      addMessage({
        text: `I read: "${extractedText}"`,
        isUser: false,
        type: 'text'
      })

      // Step 2: Parse user instructions
      const parsed = userInstructions ? parseNaturalLanguage(userInstructions) : { artStyles: [], characters: [], moods: [], colors: [], lighting: [], rawText: '' }
      const characterHints = userInstructions ? extractCharacterHints(userInstructions) : ''

      // Step 3: Generate story
      addMessage({
        text: 'Creating your story...',
        isUser: false,
        type: 'text'
      })

      setProgress(35)

      const storyResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a creative children's story writer. Transform short journal entries into engaging 4-sentence stories suitable for children aged 4-8.

Rules:
- Expand into exactly 4 complete sentences
- Add vivid descriptions and emotions
- Make it age-appropriate and imaginative
- Include sensory details (colors, sounds, feelings)
- Create a clear beginning, middle, and end
- Use simple, engaging language
- Each sentence should be suitable for its own illustration${characterHints ? `\n- Feature this character: ${characterHints}` : ''}`,
          },
          {
            role: 'user',
            content: `Transform this journal entry into a 4-sentence children's story:\n\n${extractedText}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      })

      const story = storyResponse.choices[0]?.message.content || ''

      setProgress(45)
      addMessage({
        text: story,
        isUser: false,
        type: 'story',
        story
      })

      // Step 4: Generate character description
      addMessage({
        text: 'Designing your character...',
        isUser: false,
        type: 'text'
      })

      setProgress(50)

      const charResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Extract and create a detailed visual description of the main character from this story. Include age, physical features, clothing, and distinctive characteristics. Keep it under 100 words.${characterHints ? ` Incorporate these details: ${characterHints}` : ''}`,
          },
          {
            role: 'user',
            content: story,
          },
        ],
        temperature: 0.3,
        max_tokens: 150,
      })

      const characterDesc = charResponse.choices[0]?.message.content || ''

      // Determine style information
      const styleInfo = parsed.artStyles.length > 0
        ? `${parsed.artStyles.join(', ')}${parsed.moods.length > 0 ? ` with ${parsed.moods.join(', ')} mood` : ''}`
        : 'Classic children\'s storybook style'

      setProgress(55)

      // Display character and style information
      addMessage({
        text: `Character: ${characterDesc}\n\nStyle: ${styleInfo}`,
        isUser: false,
        type: 'info'
      })

      // Step 5: Generate images
      addMessage({
        text: 'Generating your storybook illustrations...',
        isUser: false,
        type: 'text'
      })

      const sentences = story
        .split(/(?<=[.!?])\s+/)
        .filter((s) => s.trim().length > 0)
        .slice(0, 4)

      const images: { sentence: string; imageUrl: string }[] = []

      for (let i = 0; i < sentences.length; i++) {
        setProgress(50 + ((i + 1) / sentences.length) * 45)

        const prompt = buildPromptFromParsed(sentences[i], parsed, characterDesc)

        const imageResponse = await openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt,
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid',
          n: 1,
        })

        const imageUrl = imageResponse.data?.[0]?.url || ''
        images.push({ sentence: sentences[i], imageUrl })

        // Rate limiting
        if (i < sentences.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }

      setProgress(100)

      const storybookMessage: Message = {
        id: Date.now(),
        text: 'Your storybook is ready!',
        isUser: false,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type: 'storybook',
        images,
        story,
        characterDesc,
        styleInfo
      }

      setMessages(prev => [...prev, storybookMessage])
      setLastStorybook(storybookMessage)

    } catch (err) {
      addMessage({
        text: `Error: ${(err as Error).message}`,
        isUser: false,
        type: 'text'
      })
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const handleNewChat = () => {
    setMessages([{
      id: Date.now(),
      text: 'Hi! Upload a photo of your handwritten journal entry, and I\'ll transform it into a beautiful storybook. You can also tell me what style you\'d like - anime, watercolor, 3D, or describe your character!',
      isUser: false,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    }])
    setLastStorybook(null)
    setInputMessage('')
    setSelectedFile(null)
  }

  const handleCopy = async (text: string, messageId: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(messageId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = (message: Message) => {
    if (!message.images || !message.story) return

    // Create HTML content for the storybook
    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My Storybook</title>
  <style>
    body { font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .page { background: white; padding: 40px; margin-bottom: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); page-break-after: always; }
    .page img { width: 100%; border-radius: 8px; margin-bottom: 20px; }
    .page p { font-size: 18px; line-height: 1.6; color: #333; text-align: center; }
    .title { font-size: 32px; text-align: center; margin-bottom: 40px; color: #2c3e50; }
    @media print { body { background: white; } .page { box-shadow: none; } }
  </style>
</head>
<body>
  <h1 class="title">My Storybook</h1>
`

    message.images.forEach((item, index) => {
      htmlContent += `
  <div class="page">
    <img src="${item.imageUrl}" alt="Page ${index + 1}">
    <p>${item.sentence}</p>
  </div>
`
    })

    htmlContent += `
</body>
</html>
`

    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `storybook-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRegenerate = async () => {
    if (!lastStorybook) return

    // Find the original user message with the image
    const userMessages = messages.filter(m => m.isUser && m.type === 'image')
    const lastUserMessage = userMessages[userMessages.length - 1]

    if (!lastUserMessage) return

    // Remove all messages after the user's upload
    const userMessageIndex = messages.findIndex(m => m.id === lastUserMessage.id)
    setMessages(messages.slice(0, userMessageIndex + 1))
    setLastStorybook(null)

    // Re-fetch the file from the blob URL and reprocess
    try {
      const response = await fetch(lastUserMessage.imageUrl!)
      const blob = await response.blob()
      const file = new File([blob], 'journal.jpg', { type: blob.type })
      await processJournalEntry(file, lastUserMessage.text !== '📎 Image attached' ? lastUserMessage.text : undefined)
    } catch (err) {
      addMessage({
        text: 'Failed to regenerate. Please upload the image again.',
        isUser: false,
        type: 'text'
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inputMessage.trim() && !selectedFile) return

    // Add user message
    const userImageUrl = selectedFile ? URL.createObjectURL(selectedFile) : undefined
    addMessage({
      text: inputMessage || '📎 Image attached',
      isUser: true,
      type: selectedFile ? 'image' : 'text',
      imageUrl: userImageUrl
    })

    const file = selectedFile
    const instructions = inputMessage

    setInputMessage('')
    setSelectedFile(null)

    if (file) {
      await processJournalEntry(file, instructions)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#212121]">
      {/* Header - ChatGPT style */}
      <div className="sticky top-0 z-10 border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#212121]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Storybook AI</h1>
          </div>
          <Button
            onClick={handleNewChat}
            variant="ghost"
            size="sm"
            className="gap-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={isProcessing}
          >
            <MessageSquarePlus className="h-4 w-4" />
            New chat
          </Button>
        </div>
      </div>

      {/* Messages - ChatGPT style */}
      <div className="flex-1 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`group ${message.isUser ? 'bg-white dark:bg-[#212121]' : 'bg-gray-50 dark:bg-[#444654]'} border-b border-black/10 dark:border-white/10`}
          >
            <div className="max-w-3xl mx-auto px-4 py-6">
              <div className="flex gap-4">
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center text-xs font-medium ${
                  message.isUser
                    ? 'bg-blue-500 text-white'
                    : 'bg-green-600 text-white'
                }`}>
                  {message.isUser ? 'Y' : 'AI'}
                </div>

                {/* Message content */}
                <div className="flex-1 min-w-0">
                  {/* Text content */}
                  {message.text && message.type !== 'info' && (
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-base leading-7 text-gray-800 dark:text-gray-100 whitespace-pre-wrap m-0">{message.text}</p>
                    </div>
                  )}

                  {/* Info box for character and style */}
                  {message.type === 'info' && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="prose dark:prose-invert max-w-none">
                        {message.text.split('\n\n').map((section, idx) => {
                          const [label, ...content] = section.split(': ')
                          return (
                            <p key={idx} className="text-sm leading-6 text-gray-800 dark:text-gray-100 m-0 mb-2 last:mb-0">
                              <strong className="font-semibold">{label}:</strong> {content.join(': ')}
                            </p>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Image preview */}
                  {message.type === 'image' && message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Uploaded journal"
                      className="rounded-lg max-w-md border border-gray-200 dark:border-gray-700 mt-2"
                    />
                  )}

                  {/* Storybook display */}
                  {message.type === 'storybook' && message.images && (
                    <div className="space-y-4 w-full mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {message.images.map((item, index) => (
                          <div key={index} className="space-y-2">
                            <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                              <img
                                src={item.imageUrl}
                                alt={`Page ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                                Page {index + 1}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic leading-relaxed">
                              {item.sentence}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons - ChatGPT style */}
                  {!message.isUser && message.text && (
                    <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        onClick={() => handleCopy(message.text, message.id)}
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      {message.type === 'storybook' && (
                        <>
                          <Button
                            onClick={() => handleDownload(message)}
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            <Download className="h-3 w-3" />
                            <span>Download</span>
                          </Button>
                          <Button
                            onClick={handleRegenerate}
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                            disabled={isProcessing}
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Regenerate</span>
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator - ChatGPT style */}
        {isProcessing && (
          <div className="bg-gray-50 dark:bg-[#444654] border-b border-black/10 dark:border-white/10">
            <div className="max-w-3xl mx-auto px-4 py-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-sm bg-green-600 text-white flex items-center justify-center text-xs font-medium">
                  AI
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                  <Progress value={progress} className="w-full max-w-md" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area - ChatGPT style */}
      <div className="border-t border-black/10 dark:border-white/10 bg-white dark:bg-[#212121]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit}>
            <div className="relative flex items-center gap-2">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/*"
              />

              {/* File attachment button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Paperclip className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </Button>

              {/* Message input container */}
              <div className="flex-1 relative">
                <div className="relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={selectedFile ? `Optional: Add style preferences or character details...` : "Message Storybook AI..."}
                    disabled={isProcessing}
                    className="w-full pl-4 pr-12 py-3 bg-white dark:bg-[#40414f] border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  {/* Send button inside input */}
                  <Button
                    type="submit"
                    size="icon"
                    disabled={(!inputMessage.trim() && !selectedFile) || isProcessing}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {/* File preview badge */}
                {selectedFile && (
                  <div className="absolute -top-10 left-0 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-md text-xs">
                    <ImageIcon className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <span className="max-w-[200px] truncate text-blue-900 dark:text-blue-100">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-bold"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              Try: "Make it anime style with a brave knight" or upload your journal entry
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default App
