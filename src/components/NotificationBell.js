// src/components/NotificationBell.js
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../supabase";
import { useAuth } from "../context/AuthContext";
import { buildChatNotificationUrl, getChatParams, notificationDataMatchesChat, openChatFromNotification } from "../utils/notificationRoutes";

export default function NotificationBell() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;

  const [open, setOpen] = useState(false);
  const PAGE_SIZE = 30;
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const btnRef = useRef(null);
  const popRef = useRef(null);
  const listRef = useRef(null);
  const loadMoreRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const navigate = useNavigate();

  // Helper: parse n.data (puede venir como objeto o string JSON)
  const parseData = (raw) => {
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

const handleItemClick = async (e, n) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const d = parseData(n.data);
  const chatUrl = buildChatNotificationUrl(d);
  const chatParams = getChatParams(d);

  // Marcar como leída la notificación clicada
  if (n.is_read === false) {
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)));
    setUnread((c) => Math.max(0, c - 1));
  }
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", n.id);

  if (error) {
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: false } : i)));
    setUnread((c) => c + 1);
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
      setItems((prev) =>
        prev.map((i) => (sameChatIds.includes(i.id) ? { ...i, is_read: true } : i))
      );
      setUnread((c) => Math.max(0, c - sameChatIds.length));
    }
  }

  setOpen(false);

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

  const fetchNotificationPage = useCallback(async ({ cursor = null, append = false } = {}) => {
    if (!userId) return;
    let query = supabase
      .from("notifications")
      .select("id, title, body, data, is_read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (cursor) {
      query = query.or(
        `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
      );
    }

    const { data: listRows, error } = await query.limit(PAGE_SIZE);

    if (error) {
      console.error("Error fetching notification page:", error);
      return;
    }
    const nextItems = listRows || [];
    setItems((prev) => {
      if (!append) return nextItems;
      const known = new Set(prev.map((item) => item.id));
      return [...prev, ...nextItems.filter((item) => !known.has(item.id))];
    });
    const lastItem = nextItems[nextItems.length - 1];
    setNextCursor(lastItem ? { created_at: lastItem.created_at, id: lastItem.id } : cursor);
    setHasMore(nextItems.length === PAGE_SIZE);
  }, [userId]);

  const recount = useCallback(async () => {
    if (!userId) return;
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setUnread(count ?? 0);
  }, [userId]);

  const reloadNotifications = useCallback(async () => {
    setNextCursor(null);
    await Promise.all([recount(), fetchNotificationPage()]);
  }, [recount, fetchNotificationPage]);

  useEffect(() => {
    if (!userId) return;
    reloadNotifications();
  }, [userId, reloadNotifications]);

  const loadMoreNotifications = useCallback(async () => {
    if (!hasMore || isLoadingMoreRef.current || !nextCursor) return;
    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      await fetchNotificationPage({ cursor: nextCursor, append: true });
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [fetchNotificationPage, hasMore, nextCursor]);

  useEffect(() => {
    if (!open || !hasMore || !loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMoreNotifications();
      },
      { root: listRef.current, rootMargin: "0px 0px 160px" }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [open, hasMore, loadMoreNotifications]);

  // Realtime + polling de respaldo (por si Realtime falla en desktop)
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notif_${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          setUnread((c) => c + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setItems((prev) => prev.map((i) => (i.id === payload.new.id ? payload.new : i)));
          if (payload?.old?.is_read === false && payload?.new?.is_read === true) {
            setUnread((c) => Math.max(0, c - 1));
          }
        }
      )
      .subscribe();

    const poll = setInterval(recount, 15000);

    const onFocus = () => recount();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      supabase.removeChannel(channel);
    };
  }, [userId, recount]);

  const hasUnread = unread > 0;
  const badge = useMemo(() => (hasUnread ? (unread > 99 ? "99+" : unread) : null), [unread, hasUnread]);

  const markAllAsRead = async () => {
    if (!userId || unread === 0) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (!error) {
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  // Cerrar con click fuera y ESC
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (popRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!userId) return null;

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      {/* Botón campana */}
      <button
        ref={btnRef}
        onClick={(e) => {
          // Evita burbujeo a contenedores con <Link to="/">
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => {
            if (!v) reloadNotifications();
            return !v;
          });
        }}
        className="alerts-icon-text"
        aria-label="Alerts"
        style={{ position: "relative", background: "transparent", border: "none", color: "inherit" }}
      >
        {badge && <span className="chat-badge">{badge}</span>}
        <span className="material-icons">notifications_none</span>
        <small>Alerts</small>
      </button>

      {/* Dropdown pegado al botón */}
      {open && (
        <div
          ref={popRef}
          // Bloquea clicks internos para que no suban al header (evita redirecciones a landing)
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="notif-dropdown"
          style={{
            position: "absolute",
            right: 0,
            top: 44,
            width: 340,
            maxWidth: "90vw",
            maxHeight: 420,
            zIndex: 10000,
          }}
        >
          <div className="notif-head">
            <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
            <button
              onClick={markAllAsRead}
              disabled={unread === 0}
              style={{
                background: "transparent",
                border: "none",
                color: unread === 0 ? "var(--notif-muted, #6b7280)" : "var(--primary-color)",
                fontSize: 12,
                cursor: unread === 0 ? "default" : "pointer",
              }}
              title="Mark all as read"
            >
              Mark all as read
            </button>
          </div>

          <div ref={listRef} className="notif-list-wrapper" style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <ul className="notif-list" style={{ flex: 1 }}>
              {items.length === 0 ? (
                <li className="notif-empty">
                  No notifications
                </li>
              ) : (
                items.map((n) => (
                  <li
                    key={n.id}
                    onClick={(e) => handleItemClick(e, n)}
                    className={`notif-item ${!n.is_read ? "notif-unread" : ""}`}
                    style={{ cursor: "pointer" }}
                    title={n.title || "Notification"}
                  >
                    <div className="notif-item-title">{n.title || "Notification"}</div>
                    {n.body && <div className="notif-item-body">{n.body}</div>}
                    <div className="notif-item-time">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </li>
                ))
              )}
            </ul>
            {hasMore && (
              <div ref={loadMoreRef} className="notif-load-more-wrapper" aria-live="polite">
                {isLoadingMore && "Loading notifications..."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
