// src/pages/AdminPanel.js
import React, { useEffect, useState } from 'react';
import supabase from '../supabase';
import { useAuth } from '../context/AuthContext';

function AdminPanel() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser]);

  const fetchAllData = async () => {
    const { data: usersData } = await supabase.from('users').select('*');
    const { data: productsData } = await supabase.from('products').select('*');
    const { data: messagesData } = await supabase.from('messages').select('*');

    setUsers(usersData || []);
    setProducts(productsData || []);
    setMessages(messagesData || []);
  };

  const handleDeleteProduct = async (id) => {
    await supabase.from('products').delete().eq('id', id);
    fetchAllData();
  };

  const handleDeleteMessage = async (id) => {
    await supabase.from('messages').delete().eq('id', id);
    fetchAllData();
  };

  const toggleBlockUser = async (id, currentStatus) => {
    await supabase
      .from('users')
      .update({ is_blocked: !currentStatus })
      .eq('id', id);
    fetchAllData();
  };

  if (!currentUser) return <p>Loading...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Admin Panel</h2>

      <section>
        <h3>Users</h3>
        <ul>
          {users.map(user => (
            <li key={user.id}>
              {user.email} - Role: {user.role} - Blocked: {user.is_blocked ? 'Yes' : 'No'}
              {user.role !== 'admin' && (
                <button onClick={() => toggleBlockUser(user.id, user.is_blocked)}>
                  {user.is_blocked ? 'Unblock' : 'Block'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Products</h3>
        <ul>
          {products.map(product => (
            <li key={product.id}>
              {product.name} - {product.description?.slice(0, 50)}...
              <button onClick={() => handleDeleteProduct(product.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Messages</h3>
        <ul>
          {messages.map(msg => (
            <li key={msg.id}>
              From: {msg.sender_id} → To: {msg.receiver_id} | {msg.content?.slice(0, 50)}...
              <button onClick={() => handleDeleteMessage(msg.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default AdminPanel;