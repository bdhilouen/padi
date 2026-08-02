"use client";

import { useState, useCallback } from "react";
import type { ChatMessage } from "@/types";

const MOCK_RESPONSES = [
  "Berdasarkan data administrasi Anda, STNK kendaraan Anda sudah kedaluwarsa sejak 15 Juni 2026. Segera perpanjang ke Samsat terdekat dengan membawa BPKB, KTP, dan STNK lama.",
  "Pajak Penghasilan Anda mendekati jatuh tempo pada 31 Agustus 2026. Anda bisa lapor SPT melalui DJP Online di djponline.pajak.go.id.",
  "BPJS Kesehatan Anda aktif hingga Agustus 2026. Iuran bulan depan akan ditagih pada 1 Agustus 2026.",
  "Untuk memperbarui data kependudukan setelah pindah alamat, Anda perlu mengunjungi Kantor Dukcapil setempat dengan membawa KTP asli, KK, dan surat keterangan pindah.",
  "Saya tidak memiliki informasi lengkap mengenai hal tersebut. Silakan hubungi instansi terkait secara langsung untuk informasi lebih lanjut.",
];

function getMockResponse(): string {
  return MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
}

export function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_welcome",
      role: "assistant",
      content:
        "Halo! Saya adalah CitizenAI, asisten administrasi digital Anda. Saya dapat membantu Anda dengan pertanyaan seputar administrasi kependudukan, pajak, BPJS, dan layanan pemerintah lainnya. Ada yang bisa saya bantu?",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // TODO: replace with real AI API call (LLM + RAG)
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const assistantMsg: ChatMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: "assistant",
      content: getMockResponse(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsTyping(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setIsTyping(false);
  }, []);

  return { messages, isTyping, sendMessage, clearMessages };
}
