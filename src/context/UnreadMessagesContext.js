// src/context/UnreadMessagesContext.js

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import supabase from '../supabase';
import { useAuth } from './AuthContext';

const UnreadMessagesContext = createContext();

export function UnreadMessagesProvider({ children }) {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const debounceRef = useRef(null);

  const fetchUnreadMessages = useCallback(async () => {
    if (!currentUser) return;
    const [{ data, error }, { data: adminData }] = await Promise.all([
      supabase
        .from('yacht_work_messages')
        .select('id, offer_id, sender_id')
        .eq('receiver_id', currentUser.id)
        .eq('read', false),
      supabase
        .from('admin_messages')
        .select('id')
        .eq('receiver_id', currentUser.id)
        .eq('read', false),
    ]);

    if (!error && data) {
      const { data: deletedStates, error: stateError } = await supabase
        .from('yacht_work_chat_state')
        .select('offer_id, other_user_id')
        .eq('user_id', currentUser.id)
        .not('deleted_at', 'is', null);

      if (stateError) {
        const adminCount = adminData?.length || 0;
        setUnreadCount(data.length + adminCount);
        return;
      }

      const deletedKeys = new Set(
        (deletedStates || []).map((state) => `${state.offer_id}_${state.other_user_id}`)
      );
      const idsToMarkRead = [];
      const visibleUnread = [];

      for (const msg of data) {
        const key = `${msg.offer_id}_${msg.sender_id}`;
        if (deletedKeys.has(key)) {
          idsToMarkRead.push(msg.id);
        } else {
          visibleUnread.push(msg.id);
        }
      }

      if (idsToMarkRead.length > 0) {
        await supabase
          .from('yacht_work_messages')
          .update({ read: true })
          .in('id', idsToMarkRead);
      }

      const adminCount = adminData?.length || 0;
      setUnreadCount(visibleUnread.length + adminCount);
    }
  }, [currentUser]);

  const scheduleFetchUnread = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchUnreadMessages();
    }, 300);
  }, [fetchUnreadMessages]);

  useEffect(() => {
    fetchUnreadMessages();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return undefined;

    const channel = supabase
      .channel(`unread-messages-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'yacht_work_messages',
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        () => {
          scheduleFetchUnread();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'yacht_work_messages',
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        () => {
          scheduleFetchUnread();
        }
      )
      .subscribe();

    const adminChannel = supabase
      .channel(`unread-admin-messages-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_messages',
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        () => {
          scheduleFetchUnread();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_messages',
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        () => {
          scheduleFetchUnread();
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(channel);
      supabase.removeChannel(adminChannel);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return undefined;

    const intervalId = setInterval(() => {
      scheduleFetchUnread();
    }, 15000);

    const handleFocus = () => {
      scheduleFetchUnread();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [currentUser, scheduleFetchUnread]);

  return (
    <UnreadMessagesContext.Provider value={{ unreadCount, fetchUnreadMessages }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
}

export function useUnreadMessages() {
  return useContext(UnreadMessagesContext);
}
