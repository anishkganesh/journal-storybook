import { User, Palette } from 'lucide-react'

interface ConfirmationMessageProps {
  type: 'character' | 'style'
  data: {
    characterDescription?: string
    artStyle?: string
    mood?: string
    colors?: string[]
  }
}

export const ConfirmationMessage = ({ type, data }: ConfirmationMessageProps) => {
  if (type === 'character' && data.characterDescription) {
    return (
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30 p-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <User className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
              Character Design
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5 leading-relaxed">
              {data.characterDescription}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'style') {
    return (
      <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/30 p-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-purple-900 dark:text-purple-100">
              Style Settings
            </p>
            <div className="text-xs text-purple-700 dark:text-purple-300 mt-0.5 space-y-1">
              {data.artStyle && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium">Style:</span>
                  <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 rounded text-[10px]">
                    {data.artStyle}
                  </span>
                </div>
              )}
              {data.mood && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium">Mood:</span>
                  <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 rounded text-[10px]">
                    {data.mood}
                  </span>
                </div>
              )}
              {data.colors && data.colors.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium">Colors:</span>
                  {data.colors.map((color, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/50 rounded text-[10px]"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
