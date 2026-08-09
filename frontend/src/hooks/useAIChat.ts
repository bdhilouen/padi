"use client";

import { useState, useCallback, useEffect } from "react";
import type { ChatMessage } from "@/types";
import type { ApiChatSession, ApiChatMessage } from "@/types/api";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";

const WELCOME_MSG: ChatMessage = {
  id: "msg_welcome",
  role: "assistant",
  content: "Halo! Saya adalah CitizenAI, asisten administrasi digital Anda. Saya dapat membantu Anda dengan pertanyaan seputar administrasi kependudukan, pajak, BPJS, dan layanan pemerintah lainnya. Ada yang bisa saya bantu?",
  timestamp: new Date(),
};

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const initSession = useCallback(async () => {
    setIsInitializing(true);
    try {
      // 1. Get existing sessions
      const { data: sessions } = await apiClient.get<ApiChatSession[]>("/chat/sessions");
      
      let activeSessionId = null;
      if (sessions && sessions.length > 0) {
        activeSessionId = sessions[0].id;
      } else {
        // 2. Create new session if none exists
        const { data: newSession } = await apiClient.post<ApiChatSession>("/chat/sessions", {
          title: "Tanya Jawab CitizenHub",
        });
        activeSessionId = newSession.id;
      }
      setSessionId(activeSessionId);
      
      // 3. Fetch messages for this session
      const { data: apiMessages } = await apiClient.get<ApiChatMessage[]>(`/chat/sessions/${activeSessionId}/messages`);
      
      if (apiMessages && apiMessages.length > 0) {
        const mappedMessages = apiMessages.map((msg) => ({
          id: msg.id,
          role: msg.role.toLowerCase() === "user" ? "user" : "assistant",
          content: msg.content,
          timestamp: new Date(msg.created_at),
        } as ChatMessage));
        setMessages(mappedMessages);
      } else {
        setMessages([{ ...WELCOME_MSG, timestamp: new Date() }]);
      }
    } catch (err) {
      console.error("Failed to initialize chat session", err);
      toast.error("Gagal memuat sesi percakapan AI.");
      setMessages([{ ...WELCOME_MSG, timestamp: new Date() }]);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!sessionId) return;
      const userMsg: ChatMessage = {
        id: `msg_local_${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      try {
        const { data: replyMsg } = await apiClient.post<ApiChatMessage>(`/chat/sessions/${sessionId}/messages`, {
          message: content,
        });

        const assistantMsg: ChatMessage = {
          id: replyMsg.id,
          role: "assistant",
          content: replyMsg.content,
          timestamp: new Date(replyMsg.created_at),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        toast.error("Gagal mengirim pesan ke AI.");
      } finally {
        setIsTyping(false);
      }
    },
    [sessionId]
  );

  const clearMessages = useCallback(async () => {
    if (!sessionId) return;
    try {
      await apiClient.delete(`/chat/sessions/${sessionId}`);
      toast.success("Sesi percakapan dihapus.");
      setSessionId(null);
      setMessages([]);
      // Re-initialize to create a new session
      initSession();
    } catch (err) {
      toast.error("Gagal menghapus percakapan.");
    }
  }, [sessionId, initSession]);

  return { messages, isTyping, isInitializing, sendMessage, clearMessages };
}
