import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Paperclip, Send, ImageIcon, Sparkles, RotateCcw, RefreshCw } from 'lucide-react'
import OpenAI from 'openai'
import { parseNaturalLanguage, buildPromptFromParsed, extractCharacterHints } from './utils/nlpParser'
import { TypingIndicator } from './components/TypingIndicator'
import { ConfirmationMessage } from './components/ConfirmationMessage'

interface Message {
  id: number
  text: string
  isUser: boolean
  timestamp: string
  imageUrl?: string
  type?: 'text' | 'image' | 'story' | 'storybook' | 'confirmation'
  images?: { sentence: string; imageUrl: string }[]
  story?: string
  confirmationType?: 'character' | 'style'
  confirmationData?: {
    characterDescription?: string
    artStyle?: string
    mood?: string
    colors?: string[]
  }
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
  const [currentStep, setCurrentStep] = useState<string>('')

  // Conversation context
  const [lastCharacterDesc, setLastCharacterDesc] = useState<string>('')
  const [lastArtStyle, setLastArtStyle] = useState<string>('')

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

  const handleRegenerateStory = async (storyMessageId: number) => {
    // Find the story message and its context
    const storyMsg = messages.find(m => m.id === storyMessageId)
    if (!storyMsg || !storyMsg.story) return

    // Find the extracted text message before this story
    const storyIndex = messages.findIndex(m => m.id === storyMessageId)
    const extractedMsg = messages.slice(0, storyIndex).reverse().find(m => m.text.startsWith('I read:'))
    if (!extractedMsg) return

    const extractedText = extractedMsg.text.replace('I read: "', '').replace('"', '')

    setIsProcessing(true)
    setCurrentStep('Regenerating story')
    setProgress(30)

    try {
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true,
      })

      addMessage({
        text: 'Regenerating story with a fresh take...',
        isUser: false,
        type: 'text'
      })

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
- Each sentence should be suitable for its own illustration
- Make this version DIFFERENT from previous versions`,
          },
          {
            role: 'user',
            content: `Transform this journal entry into a 4-sentence children's story:\n\n${extractedText}`,
          },
        ],
        temperature: 0.9, // Higher for variety
        max_tokens: 300,
      })

      const newStory = storyResponse.choices[0]?.message.content || ''

      setProgress(60)

      addMessage({
        text: newStory,
        isUser: false,
        type: 'story',
        story: newStory
      })

      setProgress(100)
      addMessage({
        text: 'Story regenerated! Click "Generate Storybook" when you\'re ready to create illustrations.',
        isUser: false,
        type: 'text'
      })

    } catch (err) {
      addMessage({
        text: `Error: ${(err as Error).message}`,
        isUser: false,
        type: 'text'
      })
    } finally {
      setIsProcessing(false)
      setProgress(0)
      setCurrentStep('')
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
      setCurrentStep('Reading your handwriting')
      addMessage({
        text: '',
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
      const characterHints = userInstructions ? extractCharacterHints(userInstructions) : (lastCharacterDesc || '')

      // Add style confirmation if preferences provided
      if (parsed.artStyles.length > 0 || parsed.moods.length > 0 || parsed.colors.length > 0) {
        const artStyle = parsed.artStyles[0] || lastArtStyle || 'storybook'
        setLastArtStyle(artStyle)

        addMessage({
          text: '',
          isUser: false,
          type: 'confirmation',
          confirmationType: 'style',
          confirmationData: {
            artStyle,
            mood: parsed.moods[0],
            colors: parsed.colors
          }
        })
      }

      // Step 3: Generate story
      setCurrentStep('Creating your story')
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
      setCurrentStep('Designing the character')
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
      setLastCharacterDesc(characterDesc)

      // Add character confirmation
      addMessage({
        text: '',
        isUser: false,
        type: 'confirmation',
        confirmationType: 'character',
        confirmationData: {
          characterDescription: characterDesc
        }
      })

      // Step 5: Generate images
      setCurrentStep('Generating illustrations')
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
        setCurrentStep(`Generating illustration ${i + 1} of ${sentences.length}`)

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

      addMessage({
        text: 'Your storybook is ready! ✨',
        isUser: false,
        type: 'storybook',
        images,
        story
      })

    } catch (err) {
      addMessage({
        text: `Error: ${(err as Error).message}`,
        isUser: false,
        type: 'text'
      })
    } finally {
      setIsProcessing(false)
      setProgress(0)
      setCurrentStep('')
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

  const handleClearChat = () => {
    setMessages([{
      id: 0,
      text: 'Hi! Upload a photo of your handwritten journal entry, and I\'ll transform it into a beautiful storybook. You can also tell me what style you\'d like!',
      isUser: false,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    }])
    setLastCharacterDesc('')
    setLastArtStyle('')
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Journal to Storybook</h1>
          <p className="text-xs text-muted-foreground">Transform handwritten memories into illustrated stories</p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="text-xs"
              disabled={isProcessing}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              New Chat
            </Button>
          )}
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${message.isUser ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              message.isUser
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {message.isUser ? 'You' : 'AI'}
            </div>

            {/* Message bubble */}
            <div className={`flex flex-col gap-2 max-w-[80%] ${message.isUser ? 'items-end' : 'items-start'}`}>
              {/* Confirmation messages */}
              {message.type === 'confirmation' && message.confirmationType && message.confirmationData && (
                <ConfirmationMessage
                  type={message.confirmationType}
                  data={message.confirmationData}
                />
              )}

              {/* Text content */}
              {message.text && (
                <div className={`rounded-2xl px-4 py-2.5 ${
                  message.isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                </div>
              )}

              {/* Image preview */}
              {message.type === 'image' && message.imageUrl && (
                <img
                  src={message.imageUrl}
                  alt="Uploaded journal"
                  className="rounded-lg max-w-sm border shadow-sm"
                />
              )}

              {/* Story with regenerate button */}
              {message.type === 'story' && !message.isUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRegenerateStory(message.id)}
                  disabled={isProcessing}
                  className="text-xs h-7"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isProcessing ? 'animate-spin' : ''}`} />
                  Regenerate Story
                </Button>
              )}

              {/* Storybook display */}
              {message.type === 'storybook' && message.images && (
                <div className="space-y-4 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {message.images.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="relative aspect-square rounded-lg overflow-hidden border shadow-md">
                          <img
                            src={item.imageUrl}
                            alt={`Page ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                            Page {index + 1}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          {item.sentence}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <span className="text-[10px] text-muted-foreground px-2">
                {message.timestamp}
              </span>
            </div>
          </div>
        ))}

        {/* Loading indicator with typing animation */}
        {isProcessing && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-medium">
              AI
            </div>
            <div className="flex-1 space-y-2">
              <TypingIndicator text={currentStep || "Processing"} />
              <Progress value={progress} className="w-full max-w-md" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-card px-4 py-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
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
              className="flex-shrink-0"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Message input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  selectedFile
                    ? `Optional: Add style preferences or character details...`
                    : lastArtStyle
                      ? `Continue with ${lastArtStyle} style, or upload another journal...`
                      : "Type a message or attach an image..."
                }
                disabled={isProcessing}
                className="w-full px-4 py-2.5 bg-muted/50 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
              {selectedFile && (
                <div className="absolute -top-10 left-2 flex items-center gap-2 bg-muted px-3 py-1.5 rounded-md text-xs">
                  <ImageIcon className="h-3 w-3" />
                  <span className="max-w-[200px] truncate">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Send button */}
            <Button
              type="submit"
              size="icon"
              disabled={(!inputMessage.trim() && !selectedFile) || isProcessing}
              className="flex-shrink-0 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {lastArtStyle || lastCharacterDesc
              ? "Upload another journal or ask me to regenerate with different styles!"
              : "Try: \"Make it anime style with a brave knight\" or just upload your journal!"
            }
          </p>
        </form>
      </div>
    </div>
  )
}

export default App
