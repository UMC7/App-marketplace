// src/components/AdminChatButton.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import ChatPage from './ChatPage';
import '../styles/AdminChatButton.css';
import { toast } from 'react-toastify';

const AdminChatButton = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [hideInChat, setHideInChat] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminUserId, setAdminUserId] = useState(null);
  const [adminThreadId, setAdminThreadId] = useState(null);

  const isAdmin = useMemo(
    () => currentUser?.role === 'admin' || currentUser?.app_metadata?.role === 'admin',
    [currentUser?.role, currentUser?.app_metadata?.role]
  );

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setHideInChat(document.body.classList.contains('chat-fullscreen-active'))
    );

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    setHideInChat(document.body.classList.contains('chat-fullscreen-active'));

    return () => observer.disconnect();
  }, []);

  const ensureAdminUser = async () => {
    if (adminUserId) return adminUserId;

    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error || !data?.id) {
      console.error('Unable to load admin user.', error);
      return null;
    }

    setAdminUserId(data.id);
    return data.id;
  };

  const openAdminChat = async () => {
    if (!currentUser?.id) {
      toast.info('Please sign in to chat with the admin.');
      navigate('/login');
      return;
    }
    if (isAdmin) return;

    setLoading(true);
    try {
      const adminId = await ensureAdminUser();
      if (!adminId) {
        toast.error('No se pudo cargar el chat con el admin.');
        return;
      }
      if (adminId === currentUser.id) return;

      const { data: threads, error: threadsError } = await supabase
        .from('admin_threads')
        .select('id')
        .eq('admin_id', adminId)
        .eq('user_id', currentUser.id);

      if (threadsError) {
        console.error('Unable to load admin threads.', threadsError);
        toast.error('No se pudo abrir el chat con el admin.');
        return;
      }

      let reusableThreadId = null;
      const threadIds = (threads || []).map((row) => row?.id).filter(Boolean);

      if (threadIds.length > 0) {
        const { data: threadStates, error: stateError } = await supabase
          .from('admin_chat_state')
          .select('thread_id, user_id, deleted_at')
          .in('thread_id', threadIds)
          .in('user_id', [currentUser.id, adminId]);

        if (stateError) {
          console.error('Unable to load admin chat state.', stateError);
        }

        const deletedThreadIds = new Set(
          (threadStates || [])
            .filter((row) => row?.deleted_at)
            .map((row) => row.thread_id)
        );

        reusableThreadId =
          threadIds.find((threadId) => !deletedThreadIds.has(threadId)) || null;
      }

      setAdminThreadId(reusableThreadId);
      setChatOpen(true);
    } finally {
      setLoading(false);
    }
  };

  if (isAdmin || (hideInChat && !chatOpen)) return null;

  return (
    <>
      {!chatOpen && (
        <button
          type="button"
          className={`admin-chat-fab ${loading ? 'admin-chat-fab--loading' : ''}`}
          onClick={openAdminChat}
          aria-label="Chat with admin"
          title="Chat with admin"
          disabled={loading}
        >
          <span className="material-icons notranslate" aria-hidden="true">support_agent</span>
        </button>
      )}

      {chatOpen && adminUserId && (
        <Modal onClose={() => setChatOpen(false)}>
          <ChatPage
            mode="admin"
            adminThreadId={adminThreadId}
            adminUserId={adminUserId}
            onBack={() => setChatOpen(false)}
            onClose={() => setChatOpen(false)}
          />
        </Modal>
      )}
    </>
  );
};

export default AdminChatButton;
