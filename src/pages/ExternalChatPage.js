// src/pages/ExternalChatPage.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../supabase';
import '../components/chat.css';
import '../components/link-preview.css';
import { LinkPreview, extractUrls } from '../components/LinkPreview';

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

export default function ExternalChatPage() {
  const { handle, threadId } = useParams();
  const [qs] = useSearchParams();
  const token = qs.get('token') || '';
  const [sb, setSb] = useState(null);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  // build a dedicated supabase client that sends the ephemeral JWT
  useEffect(() => {
    if (!token) return;
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    setSb(client);
  }, [token]);

  useEffect(() => {
    if (!sb || !threadId) return;
    let mounted = true;

    const fetchMsgs = async () => {
      const { data, error } = await sb
        .from('external_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (!error && mounted) {
        setMessages(data || []);
        setLoading(false);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    };

    fetchMsgs();
    const iv = setInterval(fetchMsgs, 4000); // simple polling MVP
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [sb, threadId]);

  const send = async () => {
    if (!sb || !text.trim()) return;
    const payload = {
      thread_id: threadId,
      sender_role: 'employer',
      content: text.trim(),
      attachments: [],
    };
    const { error } = await sb.from('external_messages').insert([payload]);
    if (!error) {
      setText('');
      const { data } = await sb
        .from('external_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      setMessages(data || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  };

  if (!token) return <Navigate to={`/cv/${handle}`} replace />;

  return (
    <div className="container">
      <div className="chat-container">
        <div className="chat-header">Anonymous chat with candidate</div>

        {loading ? (
          <div className="chat-messages">Loading chat…</div>
        ) : (
          <div className="chat-messages">
            {messages.map((m) => {
              const own = m.sender_role === 'employer';
              return (
                <div key={m.id} className={`chat-message-row ${own ? 'own' : 'other'}`}>
                  <div className="chat-message-avatar">
                    <div
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: own ? '#6CA7A3' : '#999',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 12, fontWeight: 700,
                      }}
                      title={own ? 'You' : 'Candidate'}
                    >
                      {own ? 'YOU' : 'CV'}
                    </div>
                  </div>
                  <div className={`chat-message ${own ? 'own' : 'other'}`}>
                    <div className="chat-message-sender">{own ? 'You' : 'Candidate'}</div>
                    {m.content && renderMessageText(m.content)}
                    {m.content && extractUrls(m.content).map((url, idx) => (
                      <LinkPreview key={`link-${m.id}-${idx}`} url={url} />
                    ))}
                    <div className="chat-message-time">
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}

        <div className="chat-input">
          <textarea
            rows={2}
            placeholder="Type your message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button onClick={send}>Send</button>
        </div>
      </div>
    </div>
  );
}
