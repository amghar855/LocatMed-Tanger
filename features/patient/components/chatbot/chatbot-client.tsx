"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Camera,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Sparkles,
  X,
  Menu,
  LogOut,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { askPatientChatbotAction } from "@/app/patient/chatbot/actions";
import type { ChatMessage, ChatSuggestion } from "@/features/patient/types/chatbot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PatientNavLinks } from "@/features/patient/components/layout/patient-nav-links";
import { SidebarDrawerContent } from "@/components/locatomed/patient-navbar";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/locatomed/i18n-provider";

type MinimalSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type MinimalSpeechRecognitionCtor = new () => MinimalSpeechRecognition;

type PatientInfo = {
  name: string;
  email: string;
};

type ChatbotClientProps = {
  initialMessage: string;
  initialSuggestions: ChatSuggestion[];
  patient?: PatientInfo;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function createAssistantMessage(text: string, suggestions: ChatSuggestion[]): ChatMessage {
  return {
    id: `assistant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: "assistant",
    text,
    suggestions,
  };
}

function createUserMessage(text: string): ChatMessage {
  return {
    id: `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role: "user",
    text,
  };
}

export function ChatbotClient({ initialMessage, initialSuggestions, patient }: ChatbotClientProps) {
  const { t, locale } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [question, setQuestion] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    createAssistantMessage(initialMessage, initialSuggestions),
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [question]);

  const lastAssistantSuggestions = useMemo(() => {
    const assistantMessages = messages.filter((m) => m.role === "assistant");
    return assistantMessages[assistantMessages.length - 1]?.suggestions ?? [];
  }, [messages]);

  function submitQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed && attachments.length === 0) return;

    const attachmentSuffix =
      attachments.length > 0
        ? `\n\n${t("patient.chatbot.attachLabel")}: ${attachments.map((f) => f.name).join(", ")}`
        : "";
    const messageText = trimmed || t("patient.chatbot.defaultAttachmentMessage");

    const userMessage = createUserMessage(`${messageText}${attachmentSuffix}`);
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setAttachments([]);

    const formData = new FormData();
    formData.set("question", `${messageText}${attachmentSuffix}`);

    startTransition(async () => {
      const response = await askPatientChatbotAction(formData);
      if ("error" in response) {
        toast.error(response.error);
        setMessages((prev) => [
          ...prev,
          createAssistantMessage(
            t("patient.chatbot.assistantError"),
            lastAssistantSuggestions
          ),
        ]);
        return;
      }
      if ("data" in response) {
        setMessages((prev) => [
          ...prev,
          createAssistantMessage(response.data.answer, response.data.suggestions),
        ]);
      }
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.closest("form")?.requestSubmit();
    }
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setAttachments((prev) => [...prev, ...Array.from(fileList)].slice(0, 3));
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleVoiceInput() {
    const SpeechRecognitionCtor = (
      window as Window & {
        webkitSpeechRecognition?: MinimalSpeechRecognitionCtor;
        SpeechRecognition?: MinimalSpeechRecognitionCtor;
      }
    ).SpeechRecognition ??
      (
        window as Window & {
          webkitSpeechRecognition?: MinimalSpeechRecognitionCtor;
        }
      ).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      toast.error(t("patient.chatbot.voiceNotSupported"));
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = locale === "ar" ? "ar-MA" : locale === "en" ? "en-US" : "fr-FR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim() ?? "";
      if (transcript) setQuestion((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* ── Persistent Sidebar (Desktop) ── */}
      <aside
        className="hidden w-[280px] shrink-0 flex-col border-r border-slate-200/80 px-6 py-6 shadow-sm lg:flex"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <Link href="/patient/dashboard" className="mb-8 flex items-center gap-2 px-1">
          <img
            src="/logo-locatomed.png"
            alt="LocatMed"
            className="h-10 w-auto object-contain transition-transform hover:scale-105"
          />
        </Link>
        
        <div className="flex-1 min-h-0">
          <SidebarDrawerContent 
            patient={patient ?? { name: "LocatMed", email: "" }} 
            onNavigate={() => {}}
          />
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ── Header ── */}
        <header className="relative z-[1000] flex h-14 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-sm lg:px-6">
          {/* Left — App Logo (Mobile only) */}
          <Link
            href="/patient/dashboard"
            className="flex shrink-0 items-center gap-2 pr-3 group lg:hidden"
          >
            <img
              src="/logo-locatomed.png"
              alt="LocatMed"
              className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Center — Assistant name only */}
          <div className="flex-1 flex justify-center items-center">
            <p className="text-sm font-semibold text-slate-900">{t("patient.chatbot.title")}</p>
          </div>

          {/* Right — Hamburger + Navigation drawer (Mobile only) */}
          <div className="flex w-28 justify-end shrink-0 lg:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="size-9 rounded-xl" />}>
                <Menu className="size-4" />
                <span className="sr-only">{t("patient.chatbot.menu")}</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 px-5 py-6">
                <SheetHeader>
                  <SheetTitle className="sr-only">{t("patient.nav.navigation")}</SheetTitle>
                  <SheetDescription className="sr-only">{t("patient.nav.webAria")}</SheetDescription>
                </SheetHeader>
                <div className="flex h-full flex-col">
                  <SidebarDrawerContent 
                    patient={patient ?? { name: "LocatMed", email: "" }} 
                    onNavigate={() => setMenuOpen(false)} 
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

      {/* ── Disclaimer ── */}
      {showDisclaimer && (
        <div className="relative flex shrink-0 items-start gap-2.5 border-b border-amber-100 bg-amber-50 px-4 py-3">
          <AlertCircle className="size-4 shrink-0 text-amber-500 mt-0.5" />
          <div className="flex flex-col gap-0.5 pr-6">
            <p className="text-xs font-semibold text-amber-800">
              {t("patient.chatbot.medicalWarning")}
            </p>
            <p className="text-[11px] leading-relaxed text-amber-700/80">
              {t("patient.chatbot.medicalWarningBody")}
            </p>
          </div>
          <button
            onClick={() => setShowDisclaimer(false)}
            className="absolute right-3 top-3 text-amber-500 hover:text-amber-700 transition-colors"
            aria-label="Fermer l'avertissement"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2.5",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-600 shadow-sm">
                  <Sparkles className="size-3.5 text-white" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  message.role === "user"
                    ? "rounded-br-sm bg-teal-600 text-white"
                    : "rounded-bl-sm bg-white text-slate-800 shadow-sm ring-1 ring-slate-100"
                )}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.role === "assistant" && message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.suggestions.map((suggestion) => (
                      <Link
                        key={suggestion.id}
                        href={suggestion.href}
                        className="inline-flex flex-col items-start gap-0.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left transition-colors hover:bg-slate-100"
                      >
                        <span className="text-xs font-semibold text-slate-900">{suggestion.title}</span>
                        {suggestion.subtitle && (
                          <span className="text-[10px] text-slate-500">{suggestion.subtitle}</span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isPending && (
            <div className="flex justify-start gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-600 shadow-sm">
                <Sparkles className="size-3.5 text-white" />
              </div>
              <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:0ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:150ms]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input bar ── */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-4 pb-safe pt-3">
        <div className="mx-auto max-w-2xl">
          {/* Attachment chips */}
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {attachments.map((file, index) => (
                <span
                  key={`${file.name}-${index}`}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                >
                  {file.name}
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <form onSubmit={submitQuestion} className="flex items-end gap-2">
            {/* Hidden file inputs */}
            <Input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => addFiles(e.target.files)}
            />
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="sr-only"
              multiple
              onChange={(e) => addFiles(e.target.files)}
            />

            {/* Tool buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
              >
                <Paperclip className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex size-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
              >
                <Camera className="size-4" />
              </button>
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={cn(
                  "flex size-9 items-center justify-center rounded-full transition-colors",
                  isListening
                    ? "bg-teal-600 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                )}
              >
                {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </button>
            </div>

            {/* Text input */}
            <textarea
              ref={textareaRef}
              id="chat-question"
              name="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={t("patient.chatbot.sendPlaceholder")}
              className="flex-1 resize-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100"
              maxLength={350}
              style={{ minHeight: "40px" }}
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={isPending || (!question.trim() && attachments.length === 0)}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white transition-opacity hover:bg-teal-700 disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </form>

          <p className="mt-1.5 text-center text-[10px] text-slate-400">
            {t("patient.chatbot.newLineHint")}
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}
