"use client";

import { useRef, useEffect, useState } from "react";
import { Send, Bot, User, Trash2, Loader2 } from "lucide-react";
import { useAIChat } from "@/hooks/useAIChat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function AIAssistantPage() {
  const { messages, isTyping, isInitializing, sendMessage, clearMessages } = useAIChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    setInput("");
    await sendMessage(trimmed);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-screen lg:h-screen page-enter w-full">
      {/* Header */}
      <div className="py-6 px-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="">
          <h1 className="font-sans text-2xl font-bold text-foreground">AI Assistant</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tanya apa saja seputar administrasi Anda
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearMessages}
          aria-label="Hapus percakapan"
          title="Hapus percakapan"
          className="text-muted-foreground hover:text-danger hover:bg-danger/10"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 py-4 relative scroll-smooth overflow-y-hidden">
        <div className="space-y-4 pr-4 pl-4 lg:pr-10 lg:pl-10">
          {isInitializing ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Memuat riwayat percakapan...</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 max-w-[85%] lg:max-w-[60%]",
                msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted border border-border"
                )}
              >
                {msg.role === "user" ? (
                  <User className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Bot className="h-4 w-4 text-primary" strokeWidth={1.5} />
                )}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-card border border-border text-foreground rounded-tl-sm"
                )}
              >
                {msg.content}
                <p
                  className={cn(
                    "mt-1.5 text-[10px]",
                    msg.role === "user"
                      ? "text-primary-foreground/60 text-right"
                      : "text-muted-foreground"
                  )}
                >
                  {msg.timestamp.toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border border-border">
                <Bot className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          </>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="py-4 px-4 lg:px-10 border-t border-border shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pertanyaan Anda... "
            rows={1}
            aria-label="Pesan ke AI Assistant"
            className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all max-h-32 overflow-y-auto scrollbar-hide"
            style={{ minHeight: "44px" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
            }}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl"
            aria-label="Kirim pesan"
          >
            <Send className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}
