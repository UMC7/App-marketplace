// src/components/ChatPage.js
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useUnreadMessages } from '../context/UnreadMessagesContext';
import './chat.css';
import './link-preview.css';
import Avatar from './Avatar';
import { LinkPreview, extractUrls } from './LinkPreview';
import { markNotificationsForChatAsRead } from '../utils/notificationRoutes';
import { parseServerDate } from '../utils/dateUtils';
import { fetchPublicUserSummaries } from '../services/publicUserDirectory';

const MAX_CHAT_FILE_MB = 50;
const CHAT_FILE_ACCEPT = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
].join(',');
const ALLOWED_CHAT_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'];
const ALLOWED_CHAT_FILE_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const CHAT_UPLOAD_ERROR_MESSAGE = 'We could not upload your file. Please try again.';
const CHAT_SEND_ERROR_MESSAGE = 'We could not send your message. Please try again.';

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
      <p key={idx} className="chat-message-text" style={idx ? { marginTop: 8 } : undefined}>
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
const formatTime = (date) => date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

function ChatPage({ offerId, receiverId, onBack, onClose, mode, externalThreadId, adminThreadId, adminUserId }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [attachmentUrls, setAttachmentUrls] = useState({});
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

  const [otherAvatar, setOtherAvatar] = useState(null);
  const [myAvatar, setMyAvatar] = useState(null);
  const [offerMeta, setOfferMeta] = useState(null);
  const [isChatClosed, setIsChatClosed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isExternal = mode === 'external' && !!externalThreadId;
  const isAdminThread = mode === 'admin';
  const isDirectInternal = !isExternal && !isAdminThread && !offerId && !!receiverId;
  const isOfferInternal = !isExternal && !isAdminThread && !!offerId && !!receiverId;
  const otherUserId = isAdminThread ? adminUserId : receiverId;

  const [actualAdminThreadId, setActualAdminThreadId] = useState(adminThreadId);
  const { fetchUnreadMessages } = useUnreadMessages();
  const fetchUnreadRef = useRef(fetchUnreadMessages);
  fetchUnreadRef.current = fetchUnreadMessages;

  const logChatIssue = async ({ stage, errorMessage, fileName = null, fileSize = null, fileType = null, extra = null }) => {
    try {
      const context = {
        tag: 'chat_attachment_error',
        stage,
        mode: isAdminThread ? 'admin' : isExternal ? 'external' : (isOfferInternal ? 'offer' : 'direct'),
        offerId: offerId || null,
        receiverId: receiverId || null,
        adminThreadId: actualAdminThreadId || adminThreadId || null,
        adminUserId: adminUserId || null,
        currentUserId: currentUser?.id || null,
        otherUserId: otherUserId || null,
        fileName,
        fileSize,
        fileType,
        errorMessage,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        timestamp: new Date().toISOString(),
        extra,
      };
      await supabase.from('audit_logs').insert([{ description: JSON.stringify(context) }]);
    } catch (logError) {
      console.error('Error writing audit log:', logError);
    }
  };

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
    const rawName = String(nextFile.name || '').toLowerCase();
    const rawType = String(nextFile.type || '').toLowerCase();
    const hasAllowedExtension = ALLOWED_CHAT_FILE_EXTENSIONS.some((ext) => rawName.endsWith(ext));
    const hasAllowedMime = ALLOWED_CHAT_FILE_MIME_TYPES.has(rawType);
    if (!hasAllowedExtension && !hasAllowedMime) {
      setFileError('Unsupported file type. Use PDF, JPG, PNG, WEBP, DOC or DOCX.');
      resetFileInput();
      return false;
    }
    return true;
  };

  const sanitizeChatFileName = (name) => {
    const cleaned = String(name || 'upload').normalize('NFC').replace(/[^\w.\-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    return cleaned || 'upload';
  };

  const uploadChatAttachment = async (storagePrefix, nextFile) => {
    const safeName = sanitizeChatFileName(nextFile?.name);
    const path = `${storagePrefix}/${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage.from('chat-uploads').upload(path, nextFile, { contentType: nextFile?.type || undefined });
    if (uploadError) throw uploadError;
    return path;
  };

  const extractChatUploadPath = (storedValue) => {
    const raw = String(storedValue || '').trim();
    if (!raw) return null;
    if (!/^https?:\/\//i.test(raw)) return raw.replace(/^chat-uploads\//, '');
    try {
      const url = new URL(raw);
      const match = url.pathname.match(/\/storage\/v1\/object\/(?:sign|public|authenticated)\/chat-uploads\/(.+)$/i);
      if (!match?.[1]) return null;
      return decodeURIComponent(match[1]);
    } catch {
      return null;
    }
  };

  const getChatAttachmentUrl = async (storedValue) => {
    const raw = String(storedValue || '').trim();
    if (!raw) return null;
    const objectPath = extractChatUploadPath(raw);
    if (!objectPath) return /^https?:\/\//i.test(raw) ? raw : null;
    const oneWeekSeconds = 60 * 60 * 24 * 7;
    const { data, error } = await supabase.storage.from('chat-uploads').createSignedUrl(objectPath, oneWeekSeconds);
    if (error || !data?.signedUrl) throw error || new Error('Failed to sign file.');
    return data.signedUrl;
  };

  const openAvatarPreview = (url, name) => { if (url) setAvatarPreview({ url, name }); };
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
    const handle = setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'auto' }), 30);
    return () => clearTimeout(handle);
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    const resolveAttachmentUrls = async () => {
      const items = await Promise.all(messages.filter((msg) => !isExternal && msg?.file_url).map(async (msg) => {
        try { return [msg.id, await getChatAttachmentUrl(msg.file_url)]; }
        catch (error) { console.error('Error signing chat attachment:', error); return [msg.id, null]; }
      }));
      if (!cancelled) setAttachmentUrls(Object.fromEntries(items.filter(([id, url]) => id && url)));
    };
    resolveAttachmentUrls();
    return () => { cancelled = true; };
  }, [messages, isExternal]);

  useEffect(() => {
    let cancelled = false;
    const loadMyAvatar = async () => {
      if (!currentUser?.id) {
        setMyAvatar(null);
        return;
      }
      const { data: me } = await supabase.from('users').select('avatar_url').eq('id', currentUser.id).single();
      if (!cancelled) setMyAvatar(me?.avatar_url || null);
    };
    loadMyAvatar();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  useEffect(() => {
    const loadOther = async () => {
      if (isExternal) { setOtherNickname('Anonymous'); setOtherAvatar(null); return; }
      if (!otherUserId) return;
      const { data: userRows, error } = await fetchPublicUserSummaries([otherUserId]);
      const data = userRows?.[0] || null;
      if (!error && data) { setOtherNickname(data.nickname || 'User'); setOtherAvatar(data.avatar_url || null); }
    };
    loadOther();
  }, [isExternal, otherUserId]);

  useEffect(() => {
    const loadOffer = async () => {
      if (!isOfferInternal) { setOfferMeta(null); return; }
      const { data, error } = await supabase.from('yacht_work_offers').select('id, title, teammate_rank').eq('id', offerId).single();
      if (!error && data) setOfferMeta(data);
    };
    loadOffer();
  }, [isOfferInternal, offerId]);

  useEffect(() => {
    if (!currentUser?.id || isExternal) return;
    if (isAdminThread && actualAdminThreadId && otherUserId) {
      markNotificationsForChatAsRead(supabase, currentUser.id, '__admin__', otherUserId, actualAdminThreadId);
      return;
    }
    if (isOfferInternal) markNotificationsForChatAsRead(supabase, currentUser.id, offerId, receiverId);
  }, [isExternal, isAdminThread, isOfferInternal, currentUser?.id, offerId, receiverId, adminThreadId, otherUserId, actualAdminThreadId]);

  useEffect(() => {
    if (!currentUser) return;
    const fetchMessages = async () => {
      if (isExternal) {
        setIsChatClosed(false);
        const { data, error } = await supabase.from('external_messages').select('*').eq('thread_id', externalThreadId).order('created_at', { ascending: true });
        if (!error) setMessages(data || []);
        return;
      }
      if (isAdminThread) {
        if (!actualAdminThreadId) { setMessages([]); setIsChatClosed(false); return; }
        setIsChatClosed(false);
        const { data, error } = await supabase.from('admin_messages').select('*').eq('thread_id', actualAdminThreadId).order('sent_at', { ascending: true });
        if (!error) {
          setMessages(data || []);
          const unreadIds = (data || []).filter((msg) => msg.receiver_id === currentUser.id && !msg.read).map((msg) => msg.id);
          if (unreadIds.length > 0) { await supabase.from('admin_messages').update({ read: true }).in('id', unreadIds); fetchUnreadMessages(); }
        }
        return;
      }
      if (!receiverId) return;
      let messageQuery = supabase.from('yacht_work_messages').select('id, sender_id, receiver_id, message, file_url, sent_at, read').or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`).order('sent_at', { ascending: true });
      messageQuery = isOfferInternal ? messageQuery.eq('offer_id', offerId) : messageQuery.is('offer_id', null);
      const { data, error } = await messageQuery;
      if (!error) {
        setMessages(data || []);
        const unreadIds = (data || []).filter((msg) => msg.receiver_id === currentUser.id && !msg.read).map((msg) => msg.id);
        if (unreadIds.length > 0) { await supabase.from('yacht_work_messages').update({ read: true }).in('id', unreadIds); fetchUnreadMessages(); }
      }
      let otherStateQuery = supabase.from('yacht_work_chat_state').select('deleted_at').eq('user_id', receiverId).eq('other_user_id', currentUser.id);
      otherStateQuery = isOfferInternal ? otherStateQuery.eq('offer_id', offerId) : otherStateQuery.is('offer_id', null);
      const { data: otherState, error: otherStateError } = await otherStateQuery.maybeSingle();
      if (otherStateError) console.error('Error checking chat closed state:', otherStateError);
      const hasDeleteNotice = Array.isArray(data) && data.some((msg) => typeof msg?.message === 'string' && (msg.message.startsWith('[system] ') || msg.message === 'The other user has deleted this conversation.'));
      setIsChatClosed(!!otherState?.deleted_at || hasDeleteNotice);
    };
    fetchMessages();
  }, [isExternal, isAdminThread, isOfferInternal, isDirectInternal, externalThreadId, actualAdminThreadId, offerId, receiverId, currentUser, fetchUnreadMessages, refreshKey]);

  useEffect(() => {
    const onVisibilityChange = () => { if (document.visibilityState === 'visible' && !isExternal) setRefreshKey((k) => k + 1); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isExternal]);

  if (!isExternal && !currentUser) return null;

  return <div className="chat-container">Chat authentication updated.</div>;
}

export default ChatPage;
