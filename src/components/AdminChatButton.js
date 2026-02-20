// src/components/AdminChatButton.js
import React, { useEffect, useMemo, useState } from 'react';
import supabase from '../supabase';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import ChatPage from './ChatPage';
import '../styles/AdminChatButton.css';
import { toast } from 'react-toastify';

const AdminChatButton = () => {
  const { currentUser } = useAuth();
  const [hideInChat, setHideInChat] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminUserId, setAdminUserId] = useState(null);
  const [adminThreadId, setAdminThreadId] = useState(null);

  const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser?.role]);

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
      toast.info('Inicia sesion para abrir el chat con el admin.');
      return;
    }
    if (isAdmin) return;

    setLoading(true);
    const adminId = await ensureAdminUser();
    if (!adminId) {
      setLoading(false);
      toast.error('No se pudo cargar el chat con el admin.');
      return;
    }
    if (adminId === currentUser.id) {
      setLoading(false);
      return;
    }

    const { data: existing } = await supabase
      .from('admin_threads')
      .select('id')
      .eq('admin_id', adminId)
      .eq('user_id', currentUser.id)
      .maybeSingle();

    let threadId = existing?.id;
    if (!threadId) {
      const { data: created, error: createError } = await supabase
        .from('admin_threads')
        .insert({ admin_id: adminId, user_id: currentUser.id })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating admin chat:', createError);
        if (createError.code === '42501') {
          toast.error('No tienes permisos para iniciar el chat con el admin.');
        } else {
          toast.error('No se pudo iniciar el chat con el admin.');
        }
        setLoading(false);
        return;
      }
      threadId = created?.id;
    }

    setAdminThreadId(threadId);
    setChatOpen(true);
    setLoading(false);
  };

  if (isAdmin || hideInChat) return null;

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

      {chatOpen && adminThreadId && adminUserId && (
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
