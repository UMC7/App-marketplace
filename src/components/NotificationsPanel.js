// src/components/NotificationsPanel.js
import React, { useEffect, useMemo, useState } from "react";
import supabase from "../supabase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function NotificationsPanel({ onClose }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const navigate = useNavigate();

  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);

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

  // Navegar a SeaJobs si la notificación trae deep link (cerrando modal y con fallback)
  const handleItemClick = (n) => {
    const d = parseData(n.data);
    const targetIsSeaJobs = d?.target === "seajobs" || d?.path === "/seajobs";
    const jobId = d?.job_id || d?.query?.open;
    if (!targetIsSeaJobs || !jobId) return;

    const url = `/seajobs?open=${encodeURIComponent(jobId)}`;

    // Cierra el modal si el padre pasó el callback
    if (typeof onClose === "function") onClose();

    // Navegación SPA
    try { navigate(url); } catch {}

    // Fallback duro si por cualquier razón no cambia la URL
    setTimeout(() => {
      const now = window.location.pathname + window.location.search;
      if (now !== url) window.location.assign(url);
    }, 0);
  };

  // Carga inicial
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      const { data: listRows } = await supabase
        .from("notifications")
        .select("id, title, body, data, is_read, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);

      setUnread(count ?? 0);
      setItems(listRows ?? []);
    })();
  }, [userId]);

  // Realtime
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`notif_${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setItems((p) => [payload.new, ...p].slice(0, 30));
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
        <div style={{ padding: "12px 0", color: "#666" }}>No notifications yet.</div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: 420, overflowY: "auto" }}>
          {items.map((n) => (
            <li
              key={n.id}
              onClick={() => handleItemClick(n)}
              style={{
                padding: "10px 8px",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                background: n.is_read ? "transparent" : "rgba(37,99,235,0.08)",
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
      )}
    </div>
  );
}