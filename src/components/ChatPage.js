// src/components/ChatPage.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import { useUnreadMessages } from '../context/UnreadMessagesContext';
import './chat.css';
import './link-preview.css';
import Avatar from './Avatar';
import { LinkPreview, extractUrls } from './LinkPreview';
import { markNotificationsForChatAsRead } from '../utils/notificationRoutes';
import { parseServerDate } from '../utils/dateUtils';

const MAX_CHAT_FILE_MB = 50;

const DISCLAIMER_PARAGRAPHS = [
  'Yacht Daywork connects candidates and employers but is not involved in the hiring process.',
  'Please be cautious when communicating online. Never send money or share sensitive personal or financial information to apply for a job. Legitimate employers will not request fees.',
  'All interactions are the responsibility of the parties involved. If something feels suspicious, stop the conversation and report it.',
  'We’re here to help make connections safer and easier. ⚓',
];

const renderMessageText = (text) => {
  if (!text) return null;
  const normalized = text.replace(/\r\n/g, '\n');
  const paragraphs = normalized.split(/\n{2,}/);
  return paragraphs.map((para, idx) => {
    const lines = para.split('\n');
    return (
      <p
        key={idx}
        className="chat-message-text"
        style={idx ? { marginTop: 8 } : undefined}
      >
        {lines.map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  });
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getDateLabel = (date) => {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatTime = (date) =>
  date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

function ChatPage({ offerId, receiverId, onBack, onClose, mode, externalThreadId, adminThreadId, adminUserId }) {
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [otherNickname, setOtherNickname] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef();
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  // Avatars
  const [otherAvatar, setOtherAvatar] = useState(null);
  const [myAvatar, setMyAvatar] = useState(null);
  const [offerMeta, setOfferMeta] = useState(null);
  const [isChatClosed, setIsChatClosed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // External/anonymous mode flag
  const isExternal = mode === 'external' && !!externalThreadId;
  const isAdminThread = mode === 'admin' && !!adminThreadId;
  const otherUserId = isAdminThread ? adminUserId : receiverId;

  const { fetchUnreadMessages } = useUnreadMessages();
  const fetchUnreadRef = useRef(fetchUnreadMessages);
  fetchUnreadRef.current = fetchUnreadMessages;

  const resetFileInput = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const validateFile = (nextFile) => {
    if (!nextFile) return true;
    const maxBytes = MAX_CHAT_FILE_MB * 1024 * 1024;
    if (nextFile.size > maxBytes) {
      setFileError(`File too large. Max ${MAX_CHAT_FILE_MB}MB.`);
      resetFileInput();
      return false;
    }
    return true;
  };

  const openAvatarPreview = (url, name) => {
    if (!url) return;
    setAvatarPreview({ url, name });
  };

  const closeAvatarPreview = () => setAvatarPreview(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) document.body.classList.add('chat-fullscreen-active');
    else document.body.classList.remove('chat-fullscreen-active');
    return () => document.body.classList.remove('chat-fullscreen-active');
  }, [isMobile]);

  useEffect(() => {
    if (!messages.length) return;
    const handle = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 30);
    return () => clearTimeout(handle);
  }, [messages]);

  // Load current user + my avatar
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const { data: me } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        setMyAvatar(me?.avatar_url || null);
      }
    };
    fetchUser();
  }, []);

  // Load counterpart profile (internal/admin) or set Anonymous (external)
  useEffect(() => {
    const loadOther = async () => {
      if (isExternal) {
        setOtherNickname('Anonymous');
        setOtherAvatar(null);
        return;
      }
      if (!otherUserId) return;
      const { data, error } = await supabase
        .from('users')
        .select('nickname, avatar_url')
        .eq('id', otherUserId)
        .single();
      if (!error && data) {
        setOtherNickname(data.nickname || 'User');
        setOtherAvatar(data.avatar_url || null);
      }
    };
    loadOther();
  }, [isExternal, otherUserId]);

  useEffect(() => {
    const loadOffer = async () => {
      if (isExternal || isAdminThread || !offerId) {
        setOfferMeta(null);
        return;
      }
      const { data, error } = await supabase
        .from('yacht_work_offers')
        .select('id, title, teammate_rank')
        .eq('id', offerId)
        .single();
      if (!error && data) {
        setOfferMeta(data);
      }
    };
    loadOffer();
  }, [isExternal, isAdminThread, offerId]);

  // Marcar como leídas las notificaciones de este chat al abrir la conversación
  useEffect(() => {
    if (isExternal || isAdminThread || !currentUser?.id || !offerId || !receiverId) return;
    markNotificationsForChatAsRead(supabase, currentUser.id, offerId, receiverId);
  }, [isExternal, isAdminThread, currentUser?.id, offerId, receiverId]);

  // Load messages (internal vs external)
  useEffect(() => {
    if (!currentUser) return;

    const fetchMessages = async () => {
      if (isExternal) {
        setIsChatClosed(false);
        const { data, error } = await supabase
          .from('external_messages')
          .select('*')
          .eq('thread_id', externalThreadId)
          .order('created_at', { ascending: true });

        if (!error) {
          setMessages(data || []);
        }
        return;
      }

      if (isAdminThread) {
        setIsChatClosed(false);
        const { data, error } = await supabase
          .from('admin_messages')
          .select('*')
          .eq('thread_id', adminThreadId)
          .order('sent_at', { ascending: true });

        if (!error) {
          setMessages(data || []);

          const unreadIds = (data || [])
            .filter((msg) => msg.receiver_id === currentUser.id && !msg.read)
            .map((msg) => msg.id);

          if (unreadIds.length > 0) {
            await supabase
              .from('admin_messages')
              .update({ read: true })
              .in('id', unreadIds);

            fetchUnreadMessages();
          }
        }
        return;
      }

      // Internal (existing flow)
      if (!offerId) return;
      const { data, error } = await supabase
        .from('yacht_work_messages')
        .select('id, sender_id, receiver_id, message, file_url, sent_at, read')
        .eq('offer_id', offerId)
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId}),` +
          `and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`
        )
        .order('sent_at', { ascending: true });

      if (!error) {
        setMessages(data);

        // Mark as read (internal only)
        const unreadIds = data
          .filter((msg) => msg.receiver_id === currentUser.id && !msg.read)
          .map((msg) => msg.id);

        if (unreadIds.length > 0) {
          await supabase
            .from('yacht_work_messages')
            .update({ read: true })
            .in('id', unreadIds);

          fetchUnreadMessages();
        }
      }

      const { data: otherState, error: otherStateError } = await supabase
        .from('yacht_work_chat_state')
        .select('deleted_at')
        .eq('offer_id', offerId)
        .eq('user_id', receiverId)
        .eq('other_user_id', currentUser.id)
        .maybeSingle();

      if (otherStateError) {
        console.error('Error checking chat closed state:', otherStateError);
      }

      const hasDeleteNotice = Array.isArray(data)
        && data.some((msg) => {
          const text = msg?.message;
          return typeof text === 'string'
            && (text.startsWith('[system] ') || text === 'The other user has deleted this conversation.');
        });

      setIsChatClosed(!!otherState?.deleted_at || hasDeleteNotice);
    };

    fetchMessages();
  }, [isExternal, isAdminThread, externalThreadId, adminThreadId, offerId, receiverId, currentUser, fetchUnreadMessages, refreshKey]);

  // Refetch mensajes al volver a la app (fallback cuando Realtime se desconecta en segundo plano)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isExternal) setRefreshKey((k) => k + 1);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isExternal]);

  useEffect(() => {
    if (isExternal || isAdminThread) return;
    if (!currentUser || !offerId || !receiverId) return;

    const channel = supabase
      .channel(`yacht-work-chat-${offerId}-${receiverId}-${currentUser.id}`, {
        config: { private: true },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'yacht_work_messages',
          filter: `offer_id=eq.${offerId}`,
        },
        async (ev) => {
          const payload = ev?.new ?? ev?.record ?? ev;
          if (!payload?.id) return;
          const isRelevant =
            (payload.sender_id === currentUser.id && payload.receiver_id === receiverId) ||
            (payload.sender_id === receiverId && payload.receiver_id === currentUser.id);
          if (!isRelevant) return;

          setMessages((prev) => {
            if (prev.some((msg) => msg.id === payload.id)) return prev;
            const next = [...prev, payload];
            next.sort((a, b) => new Date(a.sent_at || 0) - new Date(b.sent_at || 0));
            return next;
          });

          if (payload.receiver_id === currentUser.id && !payload.read) {
            await supabase
              .from('yacht_work_messages')
              .update({ read: true })
              .eq('id', payload.id);
            fetchUnreadRef.current?.();
          }
        }
      );

    channel.subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' && err) console.error('[Chat Realtime]', err);
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, offerId, receiverId, isExternal, isAdminThread]);

  useEffect(() => {
    if (!isExternal || !externalThreadId) return;

    const channel = supabase
      .channel(`external-chat-${externalThreadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'external_messages',
          filter: `thread_id=eq.${externalThreadId}`,
        },
        ({ new: payload }) => {
          if (!payload) return;
          setMessages((prev) => (prev.some((msg) => msg.id === payload.id) ? prev : [...prev, payload]));
        }
      );

    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [externalThreadId, isExternal]);

  useEffect(() => {
    if (!isAdminThread || !adminThreadId || !currentUser) return;

    const channel = supabase
      .channel(`admin-chat-${adminThreadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_messages',
          filter: `thread_id=eq.${adminThreadId}`,
        },
        async ({ new: payload }) => {
          if (!payload?.id) return;
          setMessages((prev) => (prev.some((msg) => msg.id === payload.id) ? prev : [...prev, payload]));
          if (payload.receiver_id === currentUser.id && !payload.read) {
            await supabase
              .from('admin_messages')
              .update({ read: true })
              .eq('id', payload.id);
            fetchUnreadRef.current?.();
          }
        }
      );

    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [isAdminThread, adminThreadId, currentUser]);

  const handleSend = async () => {
    if (isChatClosed) return;
    if (!message && !file) return;

    if (isAdminThread) {
      if (!adminThreadId || !otherUserId) return;

      let fileUrl = null;
      if (file) {
        if (!validateFile(file)) return;
        setUploading(true);
        const path = `admin-chat/${adminThreadId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('chat-uploads')
          .upload(path, file);
        if (uploadError) {
          setUploading(false);
          setFileError(uploadError.message || 'Upload failed.');
          console.error('Error uploading file:', uploadError);
          return;
        }
        const oneWeekSeconds = 60 * 60 * 24 * 7;
        const { data, error: signError } = await supabase.storage
          .from('chat-uploads')
          .createSignedUrl(path, oneWeekSeconds);
        if (signError || !data?.signedUrl) {
          setUploading(false);
          setFileError(signError?.message || 'Failed to sign file.');
          console.error('Error signing file:', signError);
          return;
        }
        fileUrl = data.signedUrl;
        setUploading(false);
      }

      const text = message.trim();
      const payload = {
        thread_id: adminThreadId,
        sender_id: currentUser.id,
        receiver_id: otherUserId,
        message: text || '',
        file_url: fileUrl || null,
        sent_at: new Date().toISOString(),
        read: false,
      };

      const { error } = await supabase.from('admin_messages').insert([payload]);
      if (!error) {
        setMessage('');
        resetFileInput();
        setFileError('');

        const { data: updated } = await supabase
          .from('admin_messages')
          .select('*')
          .eq('thread_id', adminThreadId)
          .order('sent_at', { ascending: true });
        setMessages(updated || []);
      } else {
        setFileError(error.message || 'Failed to send message.');
        console.error('Error sending message:', error);
      }
      return;
    }

    // External (anonymous) chat: text only (MVP)
    if (isExternal) {
      if (!externalThreadId || !message.trim()) return;

      const payload = {
        thread_id: externalThreadId,
        sender_role: 'candidate',
        content: message.trim(),
        attachments: [],
      };

      const { error } = await supabase.from('external_messages').insert([payload]);
      if (!error) {
        setMessage('');
        resetFileInput();

        const { data: updated } = await supabase
          .from('external_messages')
          .select('*')
          .eq('thread_id', externalThreadId)
          .order('created_at', { ascending: true });
        setMessages(updated || []);
      }
      return;
    }

    // Internal (existing flow)
    let fileUrl = null;
    if (file) {
      if (!validateFile(file)) return;
      setUploading(true);
      const path = `chat/${offerId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('chat-uploads')
        .upload(path, file);
      if (uploadError) {
        setUploading(false);
        setFileError(uploadError.message || 'Upload failed.');
        console.error('Error uploading file:', uploadError);
        return;
      }
      const oneWeekSeconds = 60 * 60 * 24 * 7;
      const { data, error: signError } = await supabase.storage
        .from('chat-uploads')
        .createSignedUrl(path, oneWeekSeconds);
      if (signError || !data?.signedUrl) {
        setUploading(false);
        setFileError(signError?.message || 'Failed to sign file.');
        console.error('Error signing file:', signError);
        return;
      }
      fileUrl = data.signedUrl;
      setUploading(false);
    }

    const { error } = await supabase.from('yacht_work_messages').insert({
      offer_id: offerId,
      sender_id: currentUser.id,
      receiver_id: receiverId,
      message: message || null,
      file_url: fileUrl || null,
      sent_at: new Date().toISOString(),
      read: false,
    });

    if (!error) {
      setMessage('');
      resetFileInput();
      setFileError('');

      const { data: updated } = await supabase
        .from('yacht_work_messages')
        .select('id, sender_id, receiver_id, message, file_url, sent_at, read')
        .eq('offer_id', offerId)
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId}),` +
          `and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`
        )
        .order('sent_at', { ascending: true });

      setMessages(updated);
    } else {
      setFileError(error.message || 'Failed to send message.');
      console.error('Error sending message:', error);
    }
  };

  if (!currentUser) return <div>Loading user...</div>;

  const renderMessages = () => (
    <div className="chat-messages">
      {!isExternal && !isAdminThread && (
        <div className="safety-notice" role="note">
          <h4 className="safety-notice-title">⚠️ Safety Notice</h4>
          {DISCLAIMER_PARAGRAPHS.map((paragraph, idx) => (
            <p key={`${paragraph}-${idx}`}>{paragraph}</p>
          ))}
        </div>
      )}
      {(() => {
        let lastDateKey = null;
        const rows = [];
        messages.forEach((msg) => {
          const isOwnMessage = isExternal
            ? msg.sender_role === 'candidate'
            : msg.sender_id === currentUser.id;

          const text = isExternal ? msg.content : msg.message;
          const isSystemMessage = !isExternal && !isAdminThread && typeof text === 'string'
            && (text.startsWith('[system] ') || text === 'The other user has deleted this conversation.');
          const systemText = isSystemMessage
            ? text.replace(/^\[system\]\s*/, '')
            : null;

          const timestamp = isExternal
            ? parseServerDate(msg.created_at)
            : parseServerDate(msg.sent_at);
          const dateKey = startOfDay(timestamp).toISOString();
          if (dateKey !== lastDateKey) {
            rows.push(
              <div key={`date-${dateKey}`} className="chat-date-separator">
                <span>{getDateLabel(timestamp)}</span>
              </div>
            );
            lastDateKey = dateKey;
          }

          const time = formatTime(timestamp);
          const avatarUrl = isOwnMessage ? myAvatar : (isExternal ? null : otherAvatar);
          const avatarName = isOwnMessage
            ? 'You'
            : (isExternal ? 'Anonymous' : (otherNickname || 'User'));

          if (isSystemMessage) {
            rows.push(
              <div key={msg.id} className="chat-message-row system">
                <div className="chat-message system">
                  {systemText && renderMessageText(systemText)}
                  <div className="chat-message-time">{time}</div>
                </div>
              </div>
            );
            return;
          }

          const avatar = (
            <Avatar
              nickname={avatarName}
              srcUrl={avatarUrl || null}
              size={32}
              shape="circle"
            />
          );

          rows.push(
            <div key={msg.id} className={`chat-message-row ${isOwnMessage ? 'own' : 'other'}`}>
              <div className="chat-message-avatar">
                {avatarUrl ? (
                  <button
                    type="button"
                    className="chat-avatar-button"
                    onClick={() => openAvatarPreview(avatarUrl, avatarName)}
                    aria-label={`View avatar for ${avatarName}`}
                  >
                    {avatar}
                  </button>
                ) : (
                  avatar
                )}
              </div>

              <div className={`chat-message ${isOwnMessage ? 'own' : 'other'}`}>
                <div className="chat-message-sender">
                  {isOwnMessage ? 'You' : (isExternal ? 'Anonymous' : otherNickname)}
                </div>
                {text && renderMessageText(text)}
                {text && extractUrls(text).map((url, idx) => (
                  <LinkPreview key={`link-${msg.id}-${idx}`} url={url} />
                ))}
        {!isExternal && msg.file_url && (
          <a
            href={msg.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-file-link"
                  >
                    📎 View file
                  </a>
                )}
                <div className="chat-message-time">{time}</div>
              </div>
            </div>
          );
        });

        return rows;
      })()}
      <div ref={bottomRef} />
    </div>
  );

  const renderInput = () => (
    <div className="chat-input">
      {isChatClosed && (
        <div className="chat-closed-note">
          This chat was closed. Open a new private chat to send messages.
        </div>
      )}
      <div className="chat-input-row">
        {!isExternal && (
          <>
            <label className="file-clip" htmlFor="file-input" title="Attach file">📎</label>
            <input
              id="file-input"
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const nextFile = e.target.files?.[0] || null;
                setFileError('');
                if (validateFile(nextFile)) setFile(nextFile);
              }}
              disabled={isChatClosed || uploading}
            />
          </>
        )}
        <textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          disabled={isChatClosed || uploading}
        />
        <button onClick={handleSend} disabled={isChatClosed || uploading}>
          {uploading ? 'Uploading...' : 'Send'}
        </button>
      </div>
      {!isExternal && file && (
        <div className="chat-input-meta">
          <span className="chat-file-pill" title={file.name}>
            {file.name} ({Math.round(file.size / 1024)} KB)
          </span>
          <button type="button" className="chat-file-remove" onClick={resetFileInput}>
            Remove
          </button>
        </div>
      )}
      {fileError && <div className="chat-file-error">{fileError}</div>}
    </div>
  );

  const renderAvatarModal = () => {
    if (!avatarPreview?.url) return null;
    return (
      <div className="chat-avatar-modal" onClick={closeAvatarPreview}>
        <div
          className="chat-avatar-modal-dialog"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="chat-avatar-modal-close"
            onClick={closeAvatarPreview}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              padding: 0,
              color: '#fff',
            }}
          >
            ✕
          </button>
          <img
            src={avatarPreview.url}
            alt={`Avatar of ${avatarPreview.name || 'user'}`}
          />
        </div>
      </div>
    );
  };

  const headerLabel = isExternal
    ? 'Anonymous chat'
    : isAdminThread
      ? `Admin chat – ${otherNickname}`
      : `Offer private chat – ${otherNickname}`;
  const offerLabel = offerMeta?.teammate_rank || offerMeta?.title;
  const handleOpenOffer = () => {
    if (!offerId) return;
    if (onClose) {
      onClose();
    } else if (onBack) {
      onBack();
    }
    navigate(`/yacht-works?open=${offerId}`);
  };

  if (isMobile) {
    return (
      <div className="chat-container chat-mobile-fullscreen">
        <div className="chat-back-bar">
          <button className="chat-back-btn" onClick={onBack}>⬅ Back</button>
        </div>
        {!isExternal && !isAdminThread && offerLabel && (
          <button className="chat-offer-link" type="button" onClick={handleOpenOffer}>
            Position: {offerLabel} · View job
          </button>
        )}
        <div className="chat-header">{headerLabel}</div>
        {renderMessages()}
        {renderInput()}
        {renderAvatarModal()}
      </div>
    );
  }

  return (
    <div className="chat-container">
      {onBack && (
        <div className="chat-back-bar">
          <button className="chat-back-btn" onClick={onBack}>⬅ Back</button>
        </div>
      )}
      {!isExternal && !isAdminThread && offerLabel && (
        <button className="chat-offer-link" type="button" onClick={handleOpenOffer}>
          Position: {offerLabel} · View job
        </button>
      )}
      <div className="chat-header">{headerLabel}</div>
      {renderMessages()}
      {renderInput()}
      {renderAvatarModal()}
    </div>
  );
}

export default ChatPage;
