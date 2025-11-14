interface TypingIndicatorProps {
  text?: string
}

export const TypingIndicator = ({ text = "Thinking" }: TypingIndicatorProps) => {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="animate-pulse">{text}</span>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:0ms]" />
        <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:150ms]" />
        <div className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  )
}
