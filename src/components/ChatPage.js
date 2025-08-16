// src/components/ChatPage.js

import React, { useEffect, useState, useRef } from 'react';
import supabase from '../supabase';
import { useUnreadMessages } from '../context/UnreadMessagesContext';
import './chat.css';

function ChatPage({ offerId, receiverId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [otherNickname, setOtherNickname] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef();

  const { fetchUnreadMessages } = useUnreadMessages(); // ✅ actualizar contador global

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      document.body.classList.add('chat-fullscreen-active');
    } else {
      document.body.classList.remove('chat-fullscreen-active');
    }
    return () => document.body.classList.remove('chat-fullscreen-active');
  }, [isMobile]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchOtherNickname = async () => {
      if (!receiverId) return;
      const { data, error } = await supabase
        .from('users')
        .select('nickname')
        .eq('id', receiverId)
        .single();

      if (!error && data) {
        setOtherNickname(data.nickname);
      }
    };
    fetchOtherNickname();
  }, [receiverId]);

  useEffect(() => {
    if (!offerId || !currentUser) return;

    const fetchMessages = async () => {
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

        // ✅ Marcar como leídos los mensajes recibidos por el usuario actual
        const unreadIds = data
          .filter(msg => msg.receiver_id === currentUser.id && !msg.read)
          .map(msg => msg.id);

        if (unreadIds.length > 0) {
          await supabase
            .from('yacht_work_messages')
            .update({ read: true })
            .in('id', unreadIds);

          fetchUnreadMessages(); // ✅ actualizar el contador global inmediatamente
        }
      }
    };

    fetchMessages();
  }, [offerId, currentUser, receiverId, fetchUnreadMessages]);

  const handleSend = async () => {
    if (!message && !file) return;

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
      read: false
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
        const isOwnMessage = msg.sender_id === currentUser.id;
        return (
          <div key={msg.id} className={`chat-message ${isOwnMessage ? 'own' : 'other'}`}>
            <div className="chat-message-sender">{isOwnMessage ? 'You' : otherNickname}</div>
            {msg.message && <p className="chat-message-text">{msg.message}</p>}
            {msg.file_url && (
              <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="chat-file-link">
                📎 View file
              </a>
            )}
            <div className="chat-message-time">{new Date(msg.sent_at).toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );

  const renderInput = () => (
    <div className="chat-input">
      <label className="file-clip" htmlFor="file-input">📎</label>
      <input
        id="file-input"
        type="file"
        ref={fileInputRef}
        onChange={(e) => setFile(e.target.files[0])}
      />
      <textarea
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="chat-container chat-mobile-fullscreen">
        <button className="chat-back-btn" onClick={onBack}>⬅ Back to chats</button>
        <div className="chat-header">Offer private chat – {otherNickname}</div>
        {renderMessages()}
        {renderInput()}
      </div>
    );
  }

  return (
    <div className="chat-container">
      {onBack && <button className="chat-back-btn" onClick={onBack}>⬅ Back to chats</button>}
      <div className="chat-header">Offer private chat – {otherNickname}</div>
      {renderMessages()}
      {renderInput()}
    </div>
  );
}

export default ChatPage;