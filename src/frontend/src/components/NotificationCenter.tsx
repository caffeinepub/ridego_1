import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  AppNotification,
  NotificationType,
} from "@/hooks/useNotifications";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle,
  Info,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface NotificationCenterProps {
  notifications: AppNotification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

function getRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getTypeIcon(type: NotificationType) {
  switch (type) {
    case "success":
      return <CheckCircle size={14} className="text-success shrink-0 mt-0.5" />;
    case "warning":
      return (
        <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" />
      );
    case "error":
      return (
        <AlertCircle size={14} className="text-destructive shrink-0 mt-0.5" />
      );
    default:
      return <Info size={14} className="text-primary shrink-0 mt-0.5" />;
  }
}

function getTypeBg(type: NotificationType): string {
  switch (type) {
    case "success":
      return "bg-success/10 border-success/20";
    case "warning":
      return "bg-warning/10 border-warning/20";
    case "error":
      return "bg-destructive/10 border-destructive/20";
    default:
      return "bg-primary/10 border-primary/20";
  }
}

// A small live counter that ticks for relative times
function RelativeTime({ timestamp }: { timestamp: number }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className="text-[10px] text-white/40 shrink-0">
      {getRelativeTime(timestamp)}
    </span>
  );
}

export default function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAllRead,
  onClearAll,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleToggle = () => {
    if (!open && unreadCount > 0) {
      // Don't mark all read on open — let user explicitly do it
    }
    setOpen((prev) => !prev);
  };

  return (
    <div className="relative">
      {/* Bell trigger */}
      <button
        ref={triggerRef}
        type="button"
        data-ocid="notifications.bell_button"
        onClick={handleToggle}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        className="relative w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Bell size={17} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center leading-none"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            data-ocid="notifications.panel"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-10 w-80 bg-shell border border-white/10 rounded-2xl shadow-2xl z-[200] overflow-hidden"
            style={{ transformOrigin: "top right" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-primary" />
                <span className="text-sm font-semibold text-white">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <>
                    <button
                      type="button"
                      data-ocid="notifications.mark_all_button"
                      onClick={onMarkAllRead}
                      className="text-[10px] text-white/50 hover:text-primary transition-colors px-1.5 py-1 rounded-md hover:bg-white/5"
                    >
                      Mark all read
                    </button>
                    <button
                      type="button"
                      data-ocid="notifications.clear_button"
                      onClick={onClearAll}
                      className="w-6 h-6 flex items-center justify-center rounded-md text-white/40 hover:text-destructive hover:bg-white/5 transition-colors"
                      aria-label="Clear all notifications"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Close notifications"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Notification list */}
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                  <Bell size={18} className="text-white/30" />
                </div>
                <p className="text-white/40 text-sm font-medium">
                  No notifications yet
                </p>
                <p className="text-white/25 text-xs mt-1">
                  Ride updates will appear here
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-80">
                <div className="p-2 space-y-1">
                  <AnimatePresence initial={false}>
                    {notifications.map((notif, idx) => (
                      <motion.div
                        key={notif.id}
                        data-ocid={`notifications.item.${idx + 1}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.15, delay: idx * 0.03 }}
                        className={`
                          flex items-start gap-2.5 px-3 py-2.5 rounded-xl border transition-all
                          ${getTypeBg(notif.type)}
                          ${!notif.read ? "ring-1 ring-white/10" : "opacity-70"}
                        `}
                      >
                        {getTypeIcon(notif.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <span
                              className={`text-xs font-semibold leading-tight ${notif.read ? "text-white/60" : "text-white"}`}
                            >
                              {notif.title}
                            </span>
                            <RelativeTime timestamp={notif.timestamp} />
                          </div>
                          <p className="text-[11px] text-white/50 leading-snug mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
