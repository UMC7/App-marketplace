import React, { useEffect, useState } from 'react';
import supabase from '../supabase';

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
        console.error('Error al obtener mensajes:', error);
        return;
      }

      const uniqueChats = {};

      for (let msg of messages) {
        const otherUser =
          msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        const key = `${msg.offer_id}_${otherUser}`;

        if (!uniqueChats[key] || new Date(msg.sent_at) > new Date(uniqueChats[key].sent_at)) {
          uniqueChats[key] = { offer_id: msg.offer_id, user_id: otherUser, sent_at: msg.sent_at };
        }
      }

      const chatArray = Object.values(uniqueChats);

      // Obtener nicknames y títulos de oferta
      const userIds = [...new Set(chatArray.map(c => c.user_id))];
      const offerIds = [...new Set(chatArray.map(c => c.offer_id))];

      const [{ data: users }, { data: offers }] = await Promise.all([
        supabase.from('users').select('id, nickname').in('id', userIds),
        supabase.from('yacht_work_offers').select('id, title').in('id', offerIds),
      ]);

      const usersMap = Object.fromEntries(users.map(u => [u.id, u.nickname]));
      const offersMap = Object.fromEntries(offers.map(o => [o.id, o.title]));

      const enrichedChats = chatArray.map(chat => ({
        ...chat,
        nickname: usersMap[chat.user_id] || 'Usuario',
        offerTitle: offersMap[chat.offer_id] || 'Oferta eliminada',
      }));

      setChatSummaries(enrichedChats);
    };

    fetchChats();
  }, [currentUser]);

  return (
    <div>
      <h3>Chats Activos</h3>
      {chatSummaries.length === 0 ? (
        <p>No hay chats por ahora.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {chatSummaries.map(chat => (
            <li key={`${chat.offer_id}_${chat.user_id}`} style={{ marginBottom: '10px' }}>
              <button
                style={{
                  padding: '10px',
                  borderRadius: '5px',
                  background: '#eef5ff',
                  border: '1px solid #ccc',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
                onClick={() =>
                  onOpenChat(chat.offer_id, chat.user_id)
                }
              >
                <strong>{chat.nickname}</strong> – <em>{chat.offerTitle}</em>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ChatList;