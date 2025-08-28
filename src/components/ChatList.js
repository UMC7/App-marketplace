// src/components/ChatList.js
import React, { useEffect, useState } from 'react';
import supabase from '../supabase';
import Avatar from './Avatar';

function ChatList({ currentUser, onOpenChat }) {
  const [chatSummaries, setChatSummaries] = useState([]);

  useEffect(() => {
    const fetchChats = async () => {
      if (!currentUser) return;

      const { data: messages, error } = await supabase
        .from('yacht_work_messages')
        .select('id, offer_id, sender_id, receiver_id, sent_at')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      const uniqueChats = {};

      for (let msg of messages) {
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

      // Obtener perfiles y títulos de oferta
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

      const enrichedChats = chatArray.map((chat) => ({
        ...chat,
        nickname: usersMap[chat.user_id]?.nickname || 'User',
        avatar_url: usersMap[chat.user_id]?.avatar_url || null,
        offerTitle: offersMap[chat.offer_id] || 'Deleted offer',
      }));

      setChatSummaries(enrichedChats);
    };

    fetchChats();
  }, [currentUser]);

  return (
    <div>
      <h3>Active Chats</h3>
      {chatSummaries.length === 0 ? (
        <p>No chats yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {chatSummaries.map((chat) => (
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
                {/* Avatar circular del otro usuario */}
                <Avatar
                  nickname={chat.nickname || 'User'}
                  srcUrl={chat.avatar_url || null}
                  size={28}
                  shape="circle"
                />

                {/* Contenedor de texto: permite elipsis en el título */}
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '6px',
                    minWidth: 0, // necesario para que elipsis funcione dentro de flex
                    flex: 1,
                  }}
                >
                  <strong style={{ flex: '0 0 auto' }}>{chat.nickname}</strong>
                  <span style={{ flex: '0 0 auto' }}>–</span>
                  <em
                    style={{
                      flex: '1 1 auto',
                      minWidth: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block',
                    }}
                    title={chat.offerTitle} // tooltip con el título completo
                  >
                    {chat.offerTitle}
                  </em>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ChatList;