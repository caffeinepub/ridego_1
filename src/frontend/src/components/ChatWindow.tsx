import { MessageCircle, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  id: number;
  text: string;
  sender: "me" | "other";
  timestamp: string;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  otherPartyName: string;
  myRole: "rider" | "driver";
}

const QUICK_REPLIES = [
  "On my way 🚗",
  "Reached pickup 📍",
  "2 min away ⏰",
  "Where are you? 🔍",
  "Almost there!",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWindow({
  isOpen,
  onClose,
  otherPartyName,
  myRole,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Seed with initial realistic messages
    const now = new Date();
    const twoMinAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const oneMinAgo = new Date(now.getTime() - 60 * 1000);

    if (myRole === "rider") {
      return [
        {
          id: 1,
          text: "On my way! Be there in 5 minutes 🚗",
          sender: "other",
          timestamp: formatTime(twoMinAgo),
        },
        {
          id: 2,
          text: "Please hurry up, I'm waiting!",
          sender: "me",
          timestamp: formatTime(oneMinAgo),
        },
        {
          id: 3,
          text: "Almost there, just 2 minutes away ⏰",
          sender: "other",
          timestamp: formatTime(now),
        },
      ];
    }
    return [
      {
        id: 1,
        text: "I'm waiting at the pickup point",
        sender: "other",
        timestamp: formatTime(twoMinAgo),
      },
      {
        id: 2,
        text: "On my way! Be there in 5 minutes 🚗",
        sender: "me",
        timestamp: formatTime(oneMinAgo),
      },
      {
        id: 3,
        text: "Okay, I'll wait here",
        sender: "other",
        timestamp: formatTime(now),
      },
    ];
  });

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  // biome-ignore lint/correctness/useExhaustiveDependencies: we intentionally run on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const now = new Date();
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: text.trim(),
        sender: "me",
        timestamp: formatTime(now),
      },
    ]);
    setInputValue("");

    // Simulate a reply after a short delay
    setTimeout(
      () => {
        const replies =
          myRole === "rider"
            ? ["Got it! See you soon 👍", "Okay, I'm close by", "On the way!"]
            : [
                "Thanks! Waiting here 👍",
                "Okay, see you soon",
                "Sure, I'm at the pickup",
              ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: randomReply,
            sender: "other",
            timestamp: formatTime(new Date()),
          },
        ]);
      },
      1500 + Math.random() * 1000,
    );
  };

  const handleQuickReply = (text: string) => {
    sendMessage(text);
  };

  const handleSend = () => {
    sendMessage(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Chat Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto flex flex-col"
            style={{ height: "70vh" }}
          >
            <div className="flex flex-col h-full rounded-t-2xl overflow-hidden bg-[oklch(0.16_0.012_250)] border border-white/10 shadow-2xl">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center gap-3 px-4 pb-3 pt-1 border-b border-white/10 shrink-0">
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {getInitials(otherPartyName)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {otherPartyName}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <p className="text-[10px] text-white/50">In-ride chat</p>
                  </div>
                </div>
                <button
                  type="button"
                  data-ocid="chat.close_button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors text-white/60 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.sender === "me" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {msg.sender === "other" && (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-primary">
                          {getInitials(otherPartyName)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm leading-snug ${
                          msg.sender === "me"
                            ? "bg-primary text-white rounded-tr-sm"
                            : "bg-white/10 text-white rounded-tl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-white/35 mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              <div className="px-4 pb-2 shrink-0">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {QUICK_REPLIES.map((reply, idx) => (
                    <button
                      key={reply}
                      type="button"
                      data-ocid={`chat.quickreply_button.${idx + 1}`}
                      onClick={() => handleQuickReply(reply)}
                      className="shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="px-4 pb-4 pt-1 border-t border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-white/8 border border-white/15 rounded-xl px-3 py-2.5">
                    <MessageCircle
                      size={14}
                      className="text-white/35 shrink-0"
                    />
                    <input
                      ref={inputRef}
                      type="text"
                      data-ocid="chat.input"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    data-ocid="chat.send_button"
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send size={15} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
