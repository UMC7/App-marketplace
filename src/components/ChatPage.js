// src/components/ChatPage.js
import React, { useEffect, useState, useRef } from 'react';
import supabase from '../supabase';
import { useUnreadMessages } from '../context/UnreadMessagesContext';
import './chat.css';
import Avatar from './Avatar';

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

function ChatPage({ offerId, receiverId, onBack, mode, externalThreadId }) {
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [otherNickname, setOtherNickname] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef();

  // Avatars
  const [otherAvatar, setOtherAvatar] = useState(null);
  const [myAvatar, setMyAvatar] = useState(null);

  // External/anonymous mode flag
  const isExternal = mode === 'external' && !!externalThreadId;

  const { fetchUnreadMessages } = useUnreadMessages();

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

  // Load counterpart profile (internal) or set Anonymous (external)
  useEffect(() => {
    const loadOther = async () => {
      if (isExternal) {
        setOtherNickname('Anonymous');
        setOtherAvatar(null);
        return;
      }
      if (!receiverId) return;
      const { data, error } = await supabase
        .from('users')
        .select('nickname, avatar_url')
        .eq('id', receiverId)
        .single();
      if (!error && data) {
        setOtherNickname(data.nickname || 'User');
        setOtherAvatar(data.avatar_url || null);
      }
    };
    loadOther();
  }, [isExternal, receiverId]);

  // Load messages (internal vs external)
  useEffect(() => {
    if (!currentUser) return;

    const fetchMessages = async () => {
      if (isExternal) {
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
    };

    fetchMessages();
  }, [isExternal, externalThreadId, offerId, receiverId, currentUser, fetchUnreadMessages]);

  const handleSend = async () => {
    if (!message && !file) return;

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
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = null;

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
      const path = `chat/${offerId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('chat-uploads')
        .upload(path, file);
      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return;
      }
      const { data } = await supabase.storage
        .from('chat-uploads')
        .createSignedUrl(path, 60 * 60);
      fileUrl = data.signedUrl;
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
      setFile(null);
      fileInputRef.current.value = null;

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
    }
  };

  if (!currentUser) return <div>Loading user...</div>;

  const renderMessages = () => (
    <div className="chat-messages">
      {messages.map((msg) => {
        const isOwnMessage = isExternal
          ? msg.sender_role === 'candidate'
          : msg.sender_id === currentUser.id;

        const text = isExternal ? msg.content : msg.message;

        const time = isExternal
          ? new Date(msg.created_at).toLocaleString()
          : new Date(msg.sent_at).toLocaleString();

        return (
          <div key={msg.id} className={`chat-message-row ${isOwnMessage ? 'own' : 'other'}`}>
            <div className="chat-message-avatar">
              {isOwnMessage ? (
                <Avatar nickname={'You'} srcUrl={myAvatar || null} size={32} shape="circle" />
              ) : (
                <Avatar
                  nickname={isExternal ? 'Anonymous' : (otherNickname || 'User')}
                  srcUrl={isExternal ? null : (otherAvatar || null)}
                  size={32}
                  shape="circle"
                />
              )}
            </div>

            <div className={`chat-message ${isOwnMessage ? 'own' : 'other'}`}>
              <div className="chat-message-sender">
                {isOwnMessage ? 'You' : (isExternal ? 'Anonymous' : otherNickname)}
              </div>
              {text && renderMessageText(text)}
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
      })}
    </div>
  );

  const renderInput = () => (
    <div className="chat-input">
      {!isExternal && (
        <>
          <label className="file-clip" htmlFor="file-input">📎</label>
          <input
            id="file-input"
            type="file"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files[0])}
          />
        </>
      )}
      <textarea
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );

  const headerLabel = isExternal ? 'Anonymous chat' : `Offer private chat – ${otherNickname}`;

  if (isMobile) {
    return (
      <div className="chat-container chat-mobile-fullscreen">
        <button className="chat-back-btn" onClick={onBack}>⬅ Back</button>
        <div className="chat-header">{headerLabel}</div>
        {renderMessages()}
        {renderInput()}
      </div>
    );
  }

  return (
    <div className="chat-container">
      {onBack && <button className="chat-back-btn" onClick={onBack}>⬅ Back</button>}
      <div className="chat-header">{headerLabel}</div>
      {renderMessages()}
      {renderInput()}
    </div>
  );
}

export default ChatPage;
