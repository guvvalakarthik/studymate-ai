"use client";

import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  image?: string;
};

const starterPrompts = [
  "Explain the difference between AI and machine learning with a quick example.",
  "I uploaded a diagram of a neural network. Can you explain what each layer does?",
  "Give me 3 active recall techniques for studying biology before an exam.",
];

const STORAGE_KEY = "studymate-ai-chat-v1";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Message[];
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      } catch {
        // ignore invalid saved data
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const hasMessages = messages.length > 0;

  const messageCountLabel = useMemo(() => {
    return `${messages.length} message${messages.length === 1 ? "" : "s"}`;
  }, [messages.length]);

  const sendMessage = async (customInput?: string, customImage?: string) => {
    const finalInput = (customInput ?? input).trim();
    const finalImage = customImage ?? imagePreview;

    if ((!finalInput && !finalImage) || loading) {
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: finalInput || "Explain this image.",
      image: finalImage ?? undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setImagePreview(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages.map((message) => ({
            role: message.role,
            content: message.content,
            image: message.image,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "",
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        assistantMessage += decoder.decode(value, { stream: true });

        setMessages([
          ...updatedMessages,
          {
            role: "assistant",
            content: assistantMessage,
          },
        ]);
      }
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Something went wrong.";
      setErrorMessage(errorText);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "Sorry, something went wrong while processing your request. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(typeof reader.result === "string" ? reader.result : null);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
    setImagePreview(null);
    setErrorMessage(null);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#172554_0%,_#080b17_35%,_#020617_100%)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col">
        <header className="border-b border-white/10 bg-slate-950/40 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">StudyMate AI</p>
              <h1 className="mt-1 text-xl font-semibold">Multimodal Learning Copilot</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                {messageCountLabel}
              </div>
              {hasMessages && (
                <button
                  type="button"
                  onClick={clearChat}
                  className="rounded-full border border-white/10 bg-slate-800 px-3 py-1 text-xs text-slate-200 hover:bg-slate-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-hidden px-4 py-6 sm:px-6">
          <div className="mx-auto flex h-full max-w-5xl flex-col gap-6">
            {!hasMessages ? (
              <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-white/10 bg-slate-900/60 p-8 text-center shadow-2xl shadow-cyan-950/30">
                <div className="mb-6 text-6xl">🎓</div>
                <h2 className="text-3xl font-bold text-white sm:text-4xl">Welcome to StudyMate AI</h2>
                <p className="mt-3 max-w-2xl text-base text-slate-300 sm:text-lg">
                  Ask questions, upload course images, and get grounded answers with RAG-powered assistance for better learning.
                </p>

                <div className="mt-8 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-cyan-500/20 bg-slate-800/70 p-4 text-left">
                    <div className="mb-3 text-2xl">💬</div>
                    <h3 className="text-lg font-semibold text-white">Text learning</h3>
                    <p className="mt-2 text-sm text-slate-300">Ask concept questions, revision prompts, and clarity checks in natural language.</p>
                  </div>
                  <div className="rounded-2xl border border-cyan-500/20 bg-slate-800/70 p-4 text-left">
                    <div className="mb-3 text-2xl">🖼️</div>
                    <h3 className="text-lg font-semibold text-white">Image understanding</h3>
                    <p className="mt-2 text-sm text-slate-300">Upload diagrams, slides, or handwritten notes and ask for explanations.</p>
                  </div>
                  <div className="rounded-2xl border border-cyan-500/20 bg-slate-800/70 p-4 text-left">
                    <div className="mb-3 text-2xl">🧠</div>
                    <h3 className="text-lg font-semibold text-white">RAG grounding</h3>
                    <p className="mt-2 text-sm text-slate-300">Responses are guided by a retrieval layer and educational knowledge base.</p>
                  </div>
                </div>

                <div className="mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="rounded-2xl border border-cyan-400/20 bg-slate-800/80 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-cyan-400/50 hover:bg-slate-700"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 space-y-5 overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/60 p-4 shadow-xl shadow-slate-950/20 sm:p-6">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-cyan-600 text-white"
                          : "bg-slate-800 text-slate-100"
                      }`}
                    >
                      {message.image && (
                        <img src={message.image} alt="Uploaded content" className="mb-3 max-h-60 rounded-xl object-cover" />
                      )}
                      <p className="whitespace-pre-wrap text-sm leading-7 sm:text-base">{message.content}</p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-slate-800 px-4 py-3 text-sm text-slate-300">
                      Thinking...
                    </div>
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-3 shadow-xl shadow-slate-950/20">
              {imagePreview && (
                <div className="mb-3 overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-800/80 p-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs uppercase tracking-[0.2em] text-cyan-200">Image attached</span>
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="rounded-full bg-slate-700 px-2 py-1 text-xs text-slate-200"
                    >
                      Remove
                    </button>
                  </div>
                  <img src={imagePreview} alt="Preview" className="mt-2 max-h-28 rounded-xl object-cover" />
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  📷 Image
                </label>

                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about notes, diagrams, concepts, or learning goals..."
                  rows={1}
                  className="max-h-32 min-h-[52px] flex-1 resize-none rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={loading || (!input.trim() && !imagePreview)}
                  className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {loading ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
