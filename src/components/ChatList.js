// src/components/ChatList.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabase';
import Avatar from './Avatar';
import './chat.css';

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

const CHAT_SORT_PREF_KEY = 'chatSortPreference';
const SORT_OPTIONS = [
  { value: 'unread', label: 'Unread first' },
  { value: 'by_job', label: 'By job' },
  { value: 'admin_first', label: 'Admin first' },
];

function ChatList({ currentUser, onOpenChat, onOpenOffer }) {
  const [chatSummaries, setChatSummaries] = useState([]);
  const [actionBusy, setActionBusy] = useState({});
  const [loading, setLoading] = useState(true);
  const [sortPreference, setSortPreference] = useState(() => {
    try {
      return localStorage.getItem(CHAT_SORT_PREF_KEY) || 'unread';
    } catch {
      return 'unread';
    }
  });
  const navigate = useNavigate();

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortPreference(value);
    try {
      localStorage.setItem(CHAT_SORT_PREF_KEY, value);
    } catch {}
  };

  useEffect(() => {
    const fetchChats = async () => {
      if (!currentUser) return;
      setLoading(true);

      const { data, error } = await supabase.rpc('rpc_chat_summaries');

      if (error) {
        console.error('Error fetching chat summaries:', error);
        setLoading(false);
        return;
      }

      const normalized = (data || []).map((row) => {
        if (row.chat_kind === 'admin') {
          return {
            offer_id: '__admin__',
            user_id: row.other_user_id,
            thread_id: row.thread_id,
            sent_at: row.sent_at,
            nickname: row.nickname || 'User',
            avatar_url: row.avatar_url || null,
            offerTitle: row.offer_title || 'Admin chats',
            locked: !!row.locked,
            deleted_at: null,
            unreadCount: row.unread_count || 0,
          };
        }

        if (row.chat_kind === 'external') {
          return {
            offer_id: '__external__',
            user_id: row.thread_id,
            thread_id: row.thread_id,
            sent_at: row.sent_at,
            nickname: row.nickname || 'Anonymous',
            avatar_url: null,
            offerTitle: row.offer_title || 'CV chat',
            locked: false,
            deleted_at: null,
            unreadCount: 0,
          };
        }

        return {
          offer_id: row.offer_id,
          user_id: row.other_user_id,
          thread_id: null,
          sent_at: row.sent_at,
          nickname: row.nickname || 'User',
          avatar_url: row.avatar_url || null,
          offerTitle: row.offer_title || 'Deleted offer',
          locked: !!row.locked,
          deleted_at: null,
          unreadCount: row.unread_count || 0,
        };
      });

      setChatSummaries(
        normalized.sort((a, b) => new Date(b.sent_at || 0) - new Date(a.sent_at || 0))
      );
      setLoading(false);
    };

    fetchChats();
  }, [currentUser]);

  const handleOpenOffer = (offerId) => {
    if (offerId === '__external__' || offerId === '__admin__') return;
    if (onOpenOffer) onOpenOffer();
    navigate(`/yacht-works?open=${offerId}`);
  };

  const handleToggleLock = async (chat) => {
    if (!currentUser || chat.offer_id === '__external__') return;
    const key = chat.offer_id === '__admin__' ? `__admin__${chat.thread_id}` : getChatKey(chat.offer_id, chat.user_id);
    if (actionBusy[key]) return;

    const nextLocked = !chat.locked;
    setActionBusy((prev) => ({ ...prev, [key]: true }));

    if (chat.offer_id === '__admin__') {
      const { error } = await supabase.from('admin_chat_state').upsert(
        {
          thread_id: chat.thread_id,
          user_id: currentUser.id,
          locked: nextLocked,
          deleted_at: chat.deleted_at || null,
        },
        { onConflict: 'thread_id,user_id' }
      );
      if (error) {
        console.error('Error updating admin lock state:', error);
      } else {
        setChatSummaries((prev) =>
          prev.map((item) =>
            item.offer_id === '__admin__' && item.thread_id === chat.thread_id ? { ...item, locked: nextLocked } : item
          )
        );
      }
    } else {
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
            item.offer_id === chat.offer_id && item.user_id === chat.user_id ? { ...item, locked: nextLocked } : item
          )
        );
      }
    }

    setActionBusy((prev) => ({ ...prev, [key]: false }));
  };

  const handleDelete = async (chat) => {
    if (!currentUser || chat.offer_id === '__external__') return;
    if (chat.locked) return;

    const confirmed = window.confirm('Delete this conversation?');
    if (!confirmed) return;

    const key = chat.offer_id === '__admin__' ? `__admin__${chat.thread_id}` : getChatKey(chat.offer_id, chat.user_id);
    if (actionBusy[key]) return;
    setActionBusy((prev) => ({ ...prev, [key]: true }));

    const nowIso = new Date().toISOString();

    if (chat.offer_id === '__admin__') {
      const { error: stateError } = await supabase.from('admin_chat_state').upsert(
        {
          thread_id: chat.thread_id,
          user_id: currentUser.id,
          locked: false,
          deleted_at: nowIso,
        },
        { onConflict: 'thread_id,user_id' }
      );
      if (stateError) {
        console.error('Error deleting admin chat (state):', stateError);
        setActionBusy((prev) => ({ ...prev, [key]: false }));
        return;
      }
      const { data: otherState } = await supabase
        .from('admin_chat_state')
        .select('deleted_at')
        .eq('thread_id', chat.thread_id)
        .eq('user_id', chat.user_id)
        .maybeSingle();
      if (!otherState?.deleted_at) {
        await supabase.from('admin_messages').insert([
          {
            thread_id: chat.thread_id,
            sender_id: currentUser.id,
            receiver_id: chat.user_id,
            message: '[system] The other user has deleted this conversation.',
            sent_at: nowIso,
            read: false,
          },
        ]);
      } else {
        await supabase.from('admin_messages').delete().eq('thread_id', chat.thread_id);
      }
      setChatSummaries((prev) => prev.filter((item) => !(item.offer_id === '__admin__' && item.thread_id === chat.thread_id)));
    } else {
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

      if (!otherStateError && !otherState?.deleted_at) {
        await supabase.from('yacht_work_messages').insert({
          offer_id: chat.offer_id,
          sender_id: currentUser.id,
          receiver_id: chat.user_id,
          message: '[system] The other user has deleted this conversation.',
          sent_at: nowIso,
          read: false,
        });
      } else if (otherState?.deleted_at) {
        await supabase
          .from('yacht_work_messages')
          .delete()
          .eq('offer_id', chat.offer_id)
          .or(
            `and(sender_id.eq.${currentUser.id},receiver_id.eq.${chat.user_id}),` +
              `and(sender_id.eq.${chat.user_id},receiver_id.eq.${currentUser.id})`
          );
      }

      setChatSummaries((prev) =>
        prev.filter(
          (item) => !(item.offer_id === chat.offer_id && item.user_id === chat.user_id)
        )
      );
    }

    setActionBusy((prev) => ({ ...prev, [key]: false }));
  };

  const groups = [];
  const groupIndex = new Map();
  for (const chat of chatSummaries) {
    const key = String(chat.offer_id);
    let group = groupIndex.get(key);
    if (!group) {
      group = { key, title: chat.offerTitle, items: [], hasUnread: false, latestSent: null };
      groupIndex.set(key, group);
      groups.push(group);
    }
    group.items.push(chat);
    if ((chat.unreadCount || 0) > 0) group.hasUnread = true;
    const sent = chat.sent_at ? new Date(chat.sent_at).getTime() : 0;
    if (sent > (group.latestSent || 0)) group.latestSent = sent;
  }

  for (const g of groups) {
    if (sortPreference === 'unread') {
      g.items.sort((a, b) => {
        const aUnread = (a.unreadCount || 0) > 0 ? 1 : 0;
        const bUnread = (b.unreadCount || 0) > 0 ? 1 : 0;
        if (bUnread !== aUnread) return bUnread - aUnread;
        return new Date(b.sent_at || 0) - new Date(a.sent_at || 0);
      });
    } else {
      g.items.sort((a, b) => new Date(b.sent_at || 0) - new Date(a.sent_at || 0));
    }
  }

  groups.sort((a, b) => {
    if (sortPreference === 'unread') {
      if (a.hasUnread !== b.hasUnread) return b.hasUnread ? 1 : -1;
      return (b.latestSent || 0) - (a.latestSent || 0);
    }
    if (sortPreference === 'admin_first') {
      const aAdmin = a.key === '__admin__' ? 1 : 0;
      const bAdmin = b.key === '__admin__' ? 1 : 0;
      if (bAdmin !== aAdmin) return bAdmin - aAdmin;
      if (a.key === '__external__') return 1;
      if (b.key === '__external__') return -1;
      return (b.latestSent || 0) - (a.latestSent || 0);
    }
    if (sortPreference === 'by_job') {
      if (a.key === '__admin__' && b.key !== '__admin__') return 1;
      if (b.key === '__admin__' && a.key !== '__admin__') return -1;
      if (a.key === '__external__') return 1;
      if (b.key === '__external__') return -1;
      return (b.latestSent || 0) - (a.latestSent || 0);
    }
    return (b.latestSent || 0) - (a.latestSent || 0);
  });

  return (
    <div>
      <div style={{ marginBottom: '12px', paddingRight: '40px' }}>
        <h3 style={{ margin: 0, marginBottom: '8px' }}>Active Chats</h3>
        {!loading && chatSummaries.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary, #64748b)' }}>Sort:</span>
            <select
              value={sortPreference}
              onChange={handleSortChange}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'var(--bg-elevated, #1b2430)',
                color: 'var(--text-primary, #e2e8f0)',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
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
                  cursor: (group.key === '__external__' || group.key === '__admin__') ? 'default' : 'pointer',
                  textAlign: 'left',
                }}
                title={group.title}
                type="button"
                onClick={() => {
                  if (group.key === '__external__' || group.key === '__admin__') return;
                  handleOpenOffer(group.key);
                }}
                disabled={group.key === '__external__' || group.key === '__admin__'}
              >
                {group.title}
              </button>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {group.items.map((chat) => {
                  const chatKey = chat.offer_id === '__admin__' ? `__admin__${chat.thread_id}` : getChatKey(chat.offer_id, chat.user_id);
                  const isExternal = chat.offer_id === '__external__';
                  const isAdmin = chat.offer_id === '__admin__';
                  const isBusy = !!actionBusy[chatKey];
                  const unreadCount = chat.unreadCount || 0;

                  return (
                    <li key={chatKey} style={{ marginBottom: '10px' }}>
                      <div
                        className={`chat-card${unreadCount > 0 ? ' chat-card-has-unread' : ''}`}
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
                          onClick={() => onOpenChat(chat.offer_id, chat.user_id, { adminThreadId: chat.thread_id })}
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
