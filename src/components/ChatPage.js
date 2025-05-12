import React, { useEffect, useState, useRef } from 'react';
import supabase from '../supabase';

function ChatPage({ offerId, receiverId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [otherNickname, setOtherNickname] = useState('');
  const fileInputRef = useRef();

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
        .select('id, sender_id, receiver_id, message, file_url, sent_at')
        .eq('offer_id', offerId)
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId})` +
          `,and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`
        )
        .order('sent_at', { ascending: true });

      if (!error) setMessages(data);
    };

    fetchMessages();
  }, [offerId, currentUser, receiverId]);

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
        .createSignedUrl(path, 60 * 60); // 1 hour
      fileUrl = data.signedUrl;
    }

    const { error } = await supabase.from('yacht_work_messages').insert({
      offer_id: offerId,
      sender_id: currentUser.id,
      receiver_id: receiverId,
      message: message || null,
      file_url: fileUrl || null,
      sent_at: new Date().toISOString(),
    });

    if (!error) {
      setMessage('');
      setFile(null);
      fileInputRef.current.value = null;
      const { data: updated } = await supabase
        .from('yacht_work_messages')
        .select('id, sender_id, receiver_id, message, file_url, sent_at')
        .eq('offer_id', offerId)
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverId})` +
          `,and(sender_id.eq.${receiverId},receiver_id.eq.${currentUser.id})`
        )
        .order('sent_at', { ascending: true });
      setMessages(updated);
    }
  };

  if (!currentUser) return <div>Cargando usuario...</div>;

  return (
    <div style={{ padding: 20 }}>
      {onBack && (
        <button onClick={onBack} style={{ marginBottom: '10px' }}>
          ⬅ Volver a chats
        </button>
      )}
      <h2>Chat privado de la oferta</h2>
      <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid #ccc', padding: 10 }}>
        {messages.map((msg) => {
  const isOwnMessage = msg.sender_id === currentUser.id;

  return (
    <div
      key={msg.id}
      style={{
        marginBottom: 12,
        display: 'flex',
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
      }}
    >
      <div
        style={{
          maxWidth: '75%',
          backgroundColor: isOwnMessage ? '#d0ebff' : '#f1f1f1',
          padding: '10px',
          borderRadius: '10px',
          textAlign: 'left',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
          {isOwnMessage ? 'Tú' : otherNickname}
        </div>
        {msg.message && <p style={{ margin: 0 }}>{msg.message}</p>}
        {msg.file_url && (
          <a
            href={msg.file_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'block', marginTop: 4 }}
          >
            📎 Ver archivo
          </a>
        )}
        <div style={{ fontSize: '0.8em', color: '#666', marginTop: 6 }}>
          {new Date(msg.sent_at).toLocaleString()}
        </div>
      </div>
    </div>
  );
})}
      </div>
      <div style={{ marginTop: 20 }}>
        <textarea
          placeholder="Escribe tu mensaje..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          style={{ width: '100%' }}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginTop: 8 }}
        />
        <button onClick={handleSend} style={{ marginTop: 10 }}>
          Enviar
        </button>
      </div>
    </div>
  );
}

export default ChatPage;