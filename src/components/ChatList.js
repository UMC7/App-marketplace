// src/components/ChatList.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import Avatar from './Avatar';

const LockClosedIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const LockOpenIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 9.5-2" />
  </svg>
);

const TrashIcon = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const getChatKey = (offerId, userId) => `${offerId}_${userId}`;

function ChatList({ currentUser, onOpenChat, onOpenOffer }) {
  const [chatSummaries, setChatSummaries] = useState([]);
  const [actionBusy, setActionBusy] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChats = async () => {
      if (!currentUser) return;
      setLoading(true);

      const { data: messages, error } = await supabase
        .from('yacht_work_messages')
        .select('id, offer_id, sender_id, receiver_id, sent_at')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

      if (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
        return;
      }

      const uniqueChats = {};
      for (const msg of messages || []) {
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

      const [{ data: users }, { data: offers }, { data: unreadRows }] = await Promise.all([
        userIds.length
          ? supabase.from('users').select('id, nickname, avatar_url').in('id', userIds)
          : Promise.resolve({ data: [] }),
        offerIds.length
          ? supabase.from('yacht_work_offers').select('id, title').in('id', offerIds)
          : Promise.resolve({ data: [] }),
        supabase
          .from('yacht_work_messages')
          .select('offer_id, sender_id')
          .eq('receiver_id', currentUser.id)
          .eq('read', false),
      ]);

      let stateMap = {};
      if (offerIds.length) {
        const { data: states, error: stateError } = await supabase
          .from('yacht_work_chat_state')
          .select('offer_id, other_user_id, locked, deleted_at')
          .eq('user_id', currentUser.id)
          .in('offer_id', offerIds);

        if (stateError) {
          console.error('Error fetching chat state:', stateError);
        } else {
          stateMap = Object.fromEntries(
            (states || []).map((state) => [
              getChatKey(state.offer_id, state.other_user_id),
              state,
            ])
          );
        }
      }

      const usersMap = Object.fromEntries(
        (users || []).map((u) => [u.id, { nickname: u.nickname, avatar_url: u.avatar_url }])
      );
      const offersMap = Object.fromEntries(
        (offers || []).map((o) => [o.id, o.title])
      );
      const unreadMap = (unreadRows || []).reduce((acc, row) => {
        const key = getChatKey(row.offer_id, row.sender_id);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const internalRows = chatArray.map((chat) => {
        const state = stateMap[getChatKey(chat.offer_id, chat.user_id)];
        return {
          ...chat,
          nickname: usersMap[chat.user_id]?.nickname || 'User',
          avatar_url: usersMap[chat.user_id]?.avatar_url || null,
          offerTitle: offersMap[chat.offer_id] || 'Deleted offer',
          locked: !!state?.locked,
          deleted_at: state?.deleted_at || null,
          unreadCount: unreadMap[getChatKey(chat.offer_id, chat.user_id)] || 0,
        };
      });

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
        const { data: last } = await supabase
          .from('external_messages')
          .select('created_at')
          .eq('thread_id', t.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        externalRows.push({
          offer_id: '__external__',
          user_id: t.id,
          sent_at: last?.created_at || t.created_at,
          nickname: 'Anonymous',
          avatar_url: null,
          offerTitle: 'CV chat',
          locked: false,
          deleted_at: null,
          unreadCount: 0,
        });
      }

      const merged = [...internalRows, ...externalRows]
        .filter((row) => row.offer_id === '__external__' || !row.deleted_at)
        .sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));

      setChatSummaries(merged);
      setLoading(false);
    };

    fetchChats();
  }, [currentUser]);

  const handleOpenOffer = (offerId) => {
    if (onOpenOffer) onOpenOffer();
    navigate(`/yacht-works?open=${offerId}`);
  };

  const handleToggleLock = async (chat) => {
    if (!currentUser || chat.offer_id === '__external__') return;
    const key = getChatKey(chat.offer_id, chat.user_id);
    if (actionBusy[key]) return;

    const nextLocked = !chat.locked;
    setActionBusy((prev) => ({ ...prev, [key]: true }));

    const { error } = await supabase
      .from('yacht_work_chat_state')
      .upsert(
        {
          offer_id: chat.offer_id,
          user_id: currentUser.id,
          other_user_id: chat.user_id,
          locked: nextLocked,
          deleted_at: chat.deleted_at || null,
        },
        { onConflict: 'offer_id,user_id,other_user_id' }
      );

    if (error) {
      console.error('Error updating lock state:', error);
    } else {
      setChatSummaries((prev) =>
        prev.map((item) =>
          item.offer_id === chat.offer_id && item.user_id === chat.user_id
            ? { ...item, locked: nextLocked }
            : item
        )
      );
    }

    setActionBusy((prev) => ({ ...prev, [key]: false }));
  };

  const handleDelete = async (chat) => {
    if (!currentUser || chat.offer_id === '__external__') return;
    if (chat.locked) return;

    const confirmed = window.confirm('Delete this conversation?');
    if (!confirmed) return;

    const key = getChatKey(chat.offer_id, chat.user_id);
    if (actionBusy[key]) return;
    setActionBusy((prev) => ({ ...prev, [key]: true }));

    const nowIso = new Date().toISOString();

    const { error: stateError } = await supabase
      .from('yacht_work_chat_state')
      .upsert(
        {
          offer_id: chat.offer_id,
          user_id: currentUser.id,
          other_user_id: chat.user_id,
          locked: false,
          deleted_at: nowIso,
        },
        { onConflict: 'offer_id,user_id,other_user_id' }
      );

    if (stateError) {
      console.error('Error deleting chat (state):', stateError);
      setActionBusy((prev) => ({ ...prev, [key]: false }));
      return;
    }

    const { data: otherState, error: otherStateError } = await supabase
      .from('yacht_work_chat_state')
      .select('deleted_at')
      .eq('offer_id', chat.offer_id)
      .eq('user_id', chat.user_id)
      .eq('other_user_id', currentUser.id)
      .maybeSingle();

    if (otherStateError) {
      console.error('Error checking other chat state:', otherStateError);
    }

    const otherDeletedAt = otherState?.deleted_at;

    if (!otherDeletedAt) {
      const { error: notifyError } = await supabase
        .from('yacht_work_messages')
        .insert({
          offer_id: chat.offer_id,
          sender_id: currentUser.id,
          receiver_id: chat.user_id,
          message: '[system] The other user has deleted this conversation.',
          sent_at: nowIso,
          read: false,
        });

      if (notifyError) {
        console.error('Error sending delete notice:', notifyError);
      }
    } else {
      const { error: deleteError } = await supabase
        .from('yacht_work_messages')
        .delete()
        .eq('offer_id', chat.offer_id)
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${chat.user_id}),` +
            `and(sender_id.eq.${chat.user_id},receiver_id.eq.${currentUser.id})`
        );

      if (deleteError) {
        console.error('Error deleting chat messages:', deleteError);
      }
    }

    setChatSummaries((prev) =>
      prev.filter(
        (item) => !(item.offer_id === chat.offer_id && item.user_id === chat.user_id)
      )
    );
    setActionBusy((prev) => ({ ...prev, [key]: false }));
  };

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
      {loading ? (
        <p>Loading chats...</p>
      ) : chatSummaries.length === 0 ? (
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
                  handleOpenOffer(group.key);
                }}
                disabled={group.key === '__external__'}
              >
                {group.title}
              </button>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {group.items.map((chat) => {
                  const chatKey = getChatKey(chat.offer_id, chat.user_id);
                  const isExternal = chat.offer_id === '__external__';
                  const isBusy = !!actionBusy[chatKey];
                  const unreadCount = chat.unreadCount || 0;

                  return (
                    <li key={chatKey} style={{ marginBottom: '10px' }}>
                      <div
                        className="chat-card"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 8px',
                        }}
                      >
                        <button
                          className="chat-card-button"
                          style={{
                            padding: '4px 6px',
                            borderRadius: '4px',
                            width: '100%',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            flex: '1 1 auto',
                            minWidth: 0,
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
                              flexDirection: 'column',
                              alignItems: 'flex-start',
                              gap: '2px',
                              minWidth: 0,
                              flex: '1 1 auto',
                            }}
                          >
                            <strong style={{ flex: '0 0 auto' }}>{chat.nickname}</strong>
                          </span>
                        </button>
                        {!isExternal && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              flex: '0 0 auto',
                            }}
                          >
                            {unreadCount > 0 && (
                              <span
                                style={{
                                  minWidth: '20px',
                                  height: '20px',
                                  padding: '0 6px',
                                  borderRadius: '999px',
                                  background: '#ef4444',
                                  color: '#fff',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                aria-label={`${unreadCount} unread messages`}
                                title={`${unreadCount} unread messages`}
                              >
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </span>
                            )}
                            <button
                              type="button"
                              title={chat.locked ? 'Unlock chat' : 'Lock chat'}
                              onClick={() => handleToggleLock(chat)}
                              disabled={isBusy}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: isBusy ? 'not-allowed' : 'pointer',
                                color: '#0f172a',
                                padding: '6px',
                              }}
                            >
                              {chat.locked ? <LockClosedIcon /> : <LockOpenIcon />}
                            </button>
                            <button
                              type="button"
                              title={chat.locked ? 'Unlock to delete' : 'Delete chat'}
                              onClick={() => handleDelete(chat)}
                              disabled={isBusy || chat.locked}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: isBusy || chat.locked ? 'not-allowed' : 'pointer',
                                color: chat.locked ? '#6b7280' : '#b91c1c',
                                padding: '6px',
                              }}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatList;
