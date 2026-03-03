import { useCallback, useEffect, useRef, useState } from "react";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: number;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const permissionRequested = useRef(false);

  // Request browser notification permission on first use
  useEffect(() => {
    if (permissionRequested.current) return;
    permissionRequested.current = true;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
        // Permission request failed silently
      });
    }
  }, []);

  const notify = useCallback(
    (title: string, message: string, type: NotificationType = "info") => {
      const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newNotif: AppNotification = {
        id,
        title,
        message,
        type,
        timestamp: Date.now(),
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev]);

      // Fire browser notification if permission granted
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(title, {
            body: message,
            icon: "/assets/generated/ridego-app-icon-transparent.dim_512x512.png",
          });
        } catch {
          // Browser notification failed silently
        }
      }
    },
    [],
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    notify,
    markAllRead,
    clearAll,
  };
}
