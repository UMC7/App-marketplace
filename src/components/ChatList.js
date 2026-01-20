// src/components/ChatList.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import Avatar from './Avatar';

function ChatList({ currentUser, onOpenChat, onOpenOffer }) {
  const [chatSummaries, setChatSummaries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = async () => {
      if (!currentUser) return;

      // ---------- INTERNAL (tu lógica original) ----------
      const { data: messages, error } = await supabase
        .from('yacht_work_messages')
        .select('id, offer_id, sender_id, receiver_id, sent_at')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      const uniqueChats = {};
      for (let msg of messages || []) {
        const otherUser =
          msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        const key = `${msg.offer_id}_${otherUser}`;

        if (
          !uniqueChats[key] ||
          new Date(msg.sent_at) > new Date(uniqueChats[key].sent_at)
        ) {
          uniqueChats[key] = {
            offer_id: msg.offer_id,
            user_id: otherUser,
            sent_at: msg.sent_at,
          };
        }
      }

      const chatArray = Object.values(uniqueChats);
      const userIds = [...new Set(chatArray.map((c) => c.user_id))];
      const offerIds = [...new Set(chatArray.map((c) => c.offer_id))];

      const [{ data: users }, { data: offers }] = await Promise.all([
        supabase.from('users').select('id, nickname, avatar_url').in('id', userIds),
        supabase.from('yacht_work_offers').select('id, title').in('id', offerIds),
      ]);

      const usersMap = Object.fromEntries(
        (users || []).map((u) => [u.id, { nickname: u.nickname, avatar_url: u.avatar_url }])
      );
      const offersMap = Object.fromEntries(
        (offers || []).map((o) => [o.id, o.title])
      );

      const internalRows = chatArray.map((chat) => ({
        ...chat,
        nickname: usersMap[chat.user_id]?.nickname || 'User',
        avatar_url: usersMap[chat.user_id]?.avatar_url || null,
        offerTitle: offersMap[chat.offer_id] || 'Deleted offer',
      }));

      const { data: threads, error: extErr } = await supabase
        .from('external_threads')
        .select('id, candidate_id, status, created_at')
        .eq('candidate_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (extErr) {
        console.error('Error fetching external threads:', extErr);
      }

      const externalRows = [];
      for (const t of threads || []) {
        // último mensaje para ordenar
        const { data: last } = await supabase
          .from('external_messages')
          .select('created_at')
          .eq('thread_id', t.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        externalRows.push({
          // mapeo compatible con tu UI y onOpenChat
          offer_id: '__external__',
          user_id: t.id, // usamos el threadId en el segundo argumento
          sent_at: last?.created_at || t.created_at,
          nickname: 'Anonymous',
          avatar_url: null,
          offerTitle: 'CV chat',
        });
      }

      // Merge + sort por fecha, manteniendo idéntica estructura
      const merged = [...internalRows, ...externalRows].sort(
        (a, b) => new Date(b.sent_at) - new Date(a.sent_at)
      );

      setChatSummaries(merged);
    };

    fetchChats();
  }, [currentUser]);

  const groups = [];
  const groupIndex = new Map();
  for (const chat of chatSummaries) {
    const key = String(chat.offer_id);
    let group = groupIndex.get(key);
    if (!group) {
      group = { key, title: chat.offerTitle, items: [] };
      groupIndex.set(key, group);
      groups.push(group);
    }
    group.items.push(chat);
  }

  return (
    <div>
      <h3>Active Chats</h3>
      {chatSummaries.length === 0 ? (
        <p>No chats yet.</p>
      ) : (
        <div>
          {groups.map((group) => (
            <div key={group.key} style={{ marginBottom: '12px' }}>
              <button
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: '#1b2430',
                  color: '#e2e8f0',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.08)',
                  marginBottom: '8px',
                  cursor: group.key === '__external__' ? 'default' : 'pointer',
                  textAlign: 'left',
                }}
                title={group.title}
                type="button"
                onClick={() => {
                  if (group.key === '__external__') return;
                  if (onOpenOffer) onOpenOffer();
                  navigate(`/yacht-works?open=${group.key}`);
                }}
                disabled={group.key === '__external__'}
              >
                {group.title}
              </button>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {group.items.map((chat) => (
                  <li key={`${chat.offer_id}_${chat.user_id}`} style={{ marginBottom: '10px' }}>
                    <button
                      style={{
                        padding: '10px',
                        borderRadius: '5px',
                        background: '#eef5ff',
                        border: '1px solid #ccc',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                      onClick={() => onOpenChat(chat.offer_id, chat.user_id)}
                    >
                      <Avatar
                        nickname={chat.nickname || 'User'}
                        srcUrl={chat.avatar_url || null}
                        size={28}
                        shape="circle"
                      />
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '6px',
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <strong style={{ flex: '0 0 auto' }}>{chat.nickname}</strong>
                        <span style={{ flex: '0 0 auto' }}> - </span>
                        <em
                          style={{
                            flex: '1 1 auto',
                            minWidth: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'block',
                          }}
                          title={chat.offerTitle}
                        >
                          {chat.offerTitle}
                        </em>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatList;
