"use client"

import { useRef, useEffect, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ChatInputProps {
  conversationId: string | null
  onMessagesUpdate?: (messages: any[]) => void
}

export function ChatInput({ conversationId, onMessagesUpdate }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  const { messages, sendMessage } = useChat()

  // Bubble messages up to parent for live display when no conversation selected
  useEffect(() => {
    if (onMessagesUpdate) {
      onMessagesUpdate(messages)
    }
  }, [messages, onMessagesUpdate])

  // Adjust textarea height
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [text])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      // Submit message
      if (text.trim()) {
        void handleSend()
      }
    }
  }

  const handleSend = async () => {
    const value = text.trim()
    if (!value) return
    setText("")
    try {
      setSending(true)
      await sendMessage({
        role: "user" as const,
        parts: [
          {
            type: "text",
            text: value,
          },
        ],
      } as any)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void handleSend()
        }}
        className="flex gap-2"
      >
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            adjustTextareaHeight()
          }}
          onKeyDown={onKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          disabled={sending}
          className="flex-1 resize-none min-h-[40px] max-h-[200px]"
          rows={1}
        />
        <Button type="submit" disabled={!text.trim() || sending} className="self-end">
          {sending ? "..." : "Send"}
        </Button>
      </form>
      {sending && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">AI is typing...</div>
      )}
    </div>
  )
}
