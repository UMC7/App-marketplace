// src/context/UnreadMessagesContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../supabase';
import { useAuth } from './AuthContext';

const UnreadMessagesContext = createContext();

export function UnreadMessagesProvider({ children }) {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadMessages = async () => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('yacht_work_messages')
      .select('id')
      .eq('receiver_id', currentUser.id)
      .eq('read', false);

    if (!error && data) {
      setUnreadCount(data.length);
    }
  };

  useEffect(() => {
    fetchUnreadMessages();
  }, [currentUser]);

  return (
    <UnreadMessagesContext.Provider value={{ unreadCount, fetchUnreadMessages }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
}

export function useUnreadMessages() {
  return useContext(UnreadMessagesContext);
}