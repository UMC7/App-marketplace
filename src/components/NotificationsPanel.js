// src/components/NotificationsPanel.js
import React, { useEffect, useMemo, useState } from "react";
import supabase from "../supabase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { buildChatNotificationUrl, getChatParams, notificationDataMatchesChat, openChatFromNotification } from "../utils/notificationRoutes";

const PAGE_SIZE = 30;

export default function NotificationsPanel({ onClose, onReadOne }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const navigate = useNavigate();

  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const parseData = (raw) => {
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

const handleItemClick = async (n) => {
  const d = parseData(n.data);
  const chatUrl = buildChatNotificationUrl(d);
  const chatParams = getChatParams(d);

  // Marcar como leída la notificación clicada
  if (n.is_read === false) {
    setItems((p) => p.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)));
    setUnread((c) => Math.max(0, c - 1));
    if (typeof onReadOne === "function") onReadOne();
  }
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", n.id);

  if (error) {
    setItems((p) => p.map((i) => (i.id === n.id ? { ...i, is_read: false } : i)));
    setUnread((c) => c + 1);
    if (typeof onReadOne === "function") onReadOne();
  }

  // Si es notificación de chat: marcar como leídas todas las del mismo chat y actualizar contador al instante
  if (chatUrl && chatParams) {
    const sameChatIds = items
      .filter(
        (i) =>
          i.id !== n.id &&
          !i.is_read &&
          notificationDataMatchesChat(parseData(i.data), chatParams.offerId, chatParams.receiverId, chatParams.adminThreadId)
      )
      .map((i) => i.id);
    if (sameChatIds.length > 0) {
      await supabase.from("notifications").update({ is_read: true }).in("id", sameChatIds);
      setItems((p) =>
        p.map((i) => (sameChatIds.includes(i.id) ? { ...i, is_read: true } : i))
      );
      setUnread((c) => Math.max(0, c - sameChatIds.length));
      if (typeof onReadOne === "function") onReadOne();
    }
  }

  if (typeof onClose === "function") onClose();

  // Chat: abrir modal Chats con la conversación específica (misma UX que Chats → seleccionar)
  if (chatUrl && chatParams) {
    openChatFromNotification(chatParams.offerId, chatParams.receiverId, chatParams.adminThreadId);
    return;
  }

  const dashboardOfferId = d?.offer_id || d?.job_id || d?.jobDashboard;
  const targetIsDashboard = d?.target === "job_dashboard";

  const targetIsSeaJobs = d?.target === "seajobs" || d?.path === "/seajobs" || d?.path === "/yacht-works";
  const targetIsChat = d?.target === "chat" || (d?.offer_id && !targetIsSeaJobs);
  const jobId = d?.job_id || d?.query?.open;
  const offerId = d?.offer_id;

  let url = null;
  if (targetIsDashboard && dashboardOfferId) {
    url = `/profile?tab=empleos&jobDashboard=${encodeURIComponent(dashboardOfferId)}`;
  } else if (targetIsSeaJobs && jobId) {
    const basePath = d?.path || "/yacht-works";
    url = `${basePath}?open=${encodeURIComponent(jobId)}`;
  } else if (targetIsChat && offerId) {
    url = `/yacht-works?open=${encodeURIComponent(offerId)}`;
  }

  if (url) {
    try {
      navigate(url);
    } catch {}
    setTimeout(() => {
      const now = window.location.pathname + window.location.search;
      if (now !== url) window.location.assign(url);
    }, 0);
  }
};

  const fetchNotificationPage = async (nextPage = 0, append = false) => {
    const start = nextPage * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;
    const { data: listRows, error } = await supabase
      .from("notifications")
      .select("id, title, body, data, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(start, end);

    if (error) {
      console.error("Error fetching notifications page:", error);
      return;
    }

    const nextItems = listRows || [];
    setItems((prev) => (append ? [...prev, ...nextItems] : nextItems));
    setHasMore(nextItems.length === PAGE_SIZE);
  };

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      setUnread(count ?? 0);
      setPage(0);
      await fetchNotificationPage(0, false);
    })();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`notif_${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setItems((p) => [payload.new, ...p].slice(0, 100));
          setUnread((c) => c + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setItems((p) => p.map((i) => (i.id === payload.new.id ? payload.new : i)));
          if (payload?.old?.is_read === false && payload?.new?.is_read === true) {
            setUnread((c) => Math.max(0, c - 1));
          }
        }
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [userId]);

  const badge = useMemo(() => (unread > 0 ? (unread > 99 ? "99+" : unread) : null), [unread]);

  const markAllAsRead = async () => {
    if (!userId || unread === 0) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (!error) {
      setUnread(0);
      setItems((p) => p.map((n) => ({ ...n, is_read: true })));
    }
  };

  return (
    <div style={{ minWidth: 280, maxWidth: 520 }}>
      <div className="notif-modal-head">
        <h3 className="notif-modal-title">
          Notifications{badge ? ` (${badge})` : ""}
        </h3>
        <button
          type="button"
          onClick={markAllAsRead}
          disabled={!badge}
          className="notif-action-pill"
        >
          Mark all as read
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: "12px 0", color: "var(--notif-muted, #6b7280)" }}>
          No notifications yet.
        </div>
      ) : (
        <div style={{ maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
            {items.map((n) => (
              <li
                key={n.id}
                onClick={() => handleItemClick(n)}
                style={{
                  padding: "10px 8px",
                  borderBottom: "1px solid var(--notif-border, #3a3a3a)",
                  background: n.is_read ? "transparent" : "var(--notif-unread, rgba(104,173,168,0.34))",
                  boxShadow: n.is_read ? "none" : "inset 4px 0 0 0 var(--accent-color)",
                  cursor: "pointer"
                }}
                title={n.title || "Notification"}
              >
                <div style={{ fontWeight: 600 }}>{n.title || "Notification"}</div>
                {n.body && <div style={{ fontSize: 14, marginTop: 2 }}>{n.body}</div>}
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  {new Date(n.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
          {hasMore && (
            <div style={{ padding: "12px 8px", textAlign: "center", borderTop: "1px solid var(--notif-border, #e5e7eb)" }}>
              <button
                type="button"
                onClick={async () => {
                  setIsLoadingMore(true);
                  const nextPage = page + 1;
                  await fetchNotificationPage(nextPage, true);
                  setPage(nextPage);
                  setIsLoadingMore(false);
                }}
                style={{
                  background: "var(--primary-color, #68ada8)",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: 6,
                  padding: "8px 16px",
                  cursor: isLoadingMore ? "default" : "pointer",
                  fontSize: 13,
                  fontWeight: 500
                }}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Load more notifications"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
