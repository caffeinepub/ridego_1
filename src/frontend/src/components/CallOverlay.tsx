import { Phone, PhoneOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface CallOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  calleeName: string;
}

type CallStatus = "calling" | "connected" | "ended";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function CallOverlay({
  isOpen,
  onClose,
  calleeName,
}: CallOverlayProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>("calling");
  const [duration, setDuration] = useState(0);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCallStatus("calling");
      setDuration(0);
    }
  }, [isOpen]);

  // Simulate: calling -> connected after 3s, auto-hang up after 8s
  useEffect(() => {
    if (!isOpen) return;

    const connectTimer = setTimeout(() => {
      setCallStatus("connected");
    }, 3000);

    const hangupTimer = setTimeout(() => {
      setCallStatus("ended");
      setTimeout(() => onClose(), 800);
    }, 11000); // 3s calling + 8s connected

    return () => {
      clearTimeout(connectTimer);
      clearTimeout(hangupTimer);
    };
  }, [isOpen, onClose]);

  // Duration counter while connected
  useEffect(() => {
    if (callStatus === "connected") {
      durationRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      if (durationRef.current) {
        clearInterval(durationRef.current);
        durationRef.current = null;
      }
    }
    return () => {
      if (durationRef.current) {
        clearInterval(durationRef.current);
        durationRef.current = null;
      }
    };
  }, [callStatus]);

  const handleHangup = () => {
    setCallStatus("ended");
    setTimeout(() => onClose(), 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-ocid="call.overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, oklch(0.20 0.05 250 / 0.97), oklch(0.10 0.01 250 / 0.99))",
          }}
        >
          {/* Pulsing rings */}
          {callStatus === "calling" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full border border-primary/20"
                  initial={{ width: 80, height: 80, opacity: 0.6 }}
                  animate={{
                    width: 80 + i * 60,
                    height: 80 + i * 60,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.4,
                    ease: "easeOut",
                  }}
                />
              ))}
            </div>
          )}

          {/* Connected waveform */}
          {callStatus === "connected" && (
            <div className="absolute bottom-48 left-0 right-0 flex justify-center gap-1 pointer-events-none">
              {Array.from({ length: 20 }, (_, i) => i).map((i) => (
                <motion.div
                  key={i}
                  className="w-1 rounded-full bg-success/50"
                  animate={{
                    height: [4, 8 + Math.random() * 20, 4],
                  }}
                  transition={{
                    duration: 0.6 + Math.random() * 0.4,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: i * 0.05,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}

          {/* Main card */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="flex flex-col items-center gap-6 px-8 w-full max-w-xs"
          >
            {/* Status */}
            <p className="text-white/50 text-xs font-medium uppercase tracking-widest">
              {callStatus === "calling"
                ? "In-app call"
                : callStatus === "connected"
                  ? "In-app call"
                  : "Call ended"}
            </p>

            {/* Avatar */}
            <div className="relative">
              {/* Outer glow ring */}
              <motion.div
                className={`absolute inset-0 rounded-full ${
                  callStatus === "connected"
                    ? "border-2 border-success/40"
                    : "border-2 border-primary/30"
                }`}
                animate={
                  callStatus === "calling"
                    ? { scale: [1, 1.08, 1], opacity: [0.8, 0.3, 0.8] }
                    : callStatus === "connected"
                      ? { scale: [1, 1.04, 1], opacity: [0.7, 0.4, 0.7] }
                      : { scale: 1, opacity: 0.5 }
                }
                transition={
                  callStatus !== "ended"
                    ? {
                        duration: callStatus === "calling" ? 1.2 : 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }
                    : {}
                }
                style={{
                  margin: -8,
                  width: "calc(100% + 16px)",
                  height: "calc(100% + 16px)",
                }}
              />
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center border-2 transition-colors duration-700 ${
                  callStatus === "connected"
                    ? "bg-success/20 border-success/50"
                    : callStatus === "ended"
                      ? "bg-white/10 border-white/20"
                      : "bg-primary/20 border-primary/40"
                }`}
              >
                <span
                  className={`text-2xl font-black transition-colors duration-700 ${
                    callStatus === "connected"
                      ? "text-success"
                      : callStatus === "ended"
                        ? "text-white/40"
                        : "text-primary"
                  }`}
                >
                  {getInitials(calleeName)}
                </span>
              </div>
            </div>

            {/* Name */}
            <div className="text-center">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {calleeName}
              </h2>
              <motion.p
                key={callStatus}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm font-medium mt-1 transition-colors ${
                  callStatus === "calling"
                    ? "text-primary"
                    : callStatus === "connected"
                      ? "text-success"
                      : "text-white/40"
                }`}
              >
                {callStatus === "calling" && (
                  <span className="flex items-center justify-center gap-2">
                    <Phone size={12} className="animate-bounce-subtle" />
                    Calling...
                  </span>
                )}
                {callStatus === "connected" &&
                  `Connected · ${formatDuration(duration)}`}
                {callStatus === "ended" && "Call ended"}
              </motion.p>
            </div>

            {/* Hang up button */}
            {callStatus !== "ended" && (
              <motion.button
                type="button"
                data-ocid="call.hangup_button"
                onClick={handleHangup}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                className="mt-4 w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-[0_4px_24px_0_oklch(0.58_0.22_27_/_0.5)] hover:bg-destructive/90 transition-colors"
              >
                <PhoneOff size={22} className="text-white" />
              </motion.button>
            )}

            {/* Hint */}
            <p className="text-white/20 text-[10px] text-center max-w-[200px] leading-relaxed">
              Simulated in-app voice call
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
