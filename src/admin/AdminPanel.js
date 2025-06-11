// /src/admin/AdminPanel.js
import React, { useState } from 'react';
import UsersTab from './tabs/UsersTab';
import ProductsTab from './tabs/ProductsTab';
import ServicesTab from './tabs/ServicesTab';
import EventsTab from './tabs/EventsTab';
import JobsTab from './tabs/JobsTab';
import MessagesTab from './tabs/MessagesTab';
import ReportsTab from './tabs/ReportsTab';
import ReviewsTab from './tabs/ReviewsTab';
import UserReviewsTab from './tabs/UserReviewsTab';
import LogsTab from './tabs/LogsTab';
import '../styles/admin.css'; // o ajusta la ruta según donde tengas tus estilos

const TABS = [
  { key: 'users', label: 'Users' },
  { key: 'products', label: 'Products' },
  { key: 'services', label: 'Services' },
  { key: 'events', label: 'Events' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'messages', label: 'Messages' },
  { key: 'reports', label: 'Reports' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'user_reviews', label: 'User Reviews' },
  { key: 'logs', label: 'Logs' }
];

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':         return <UsersTab />;
      case 'products':      return <ProductsTab />;
      case 'services':      return <ServicesTab />;
      case 'events':        return <EventsTab />;
      case 'jobs':          return <JobsTab />;
      case 'messages':      return <MessagesTab />;
      case 'reports':       return <ReportsTab />;
      case 'reviews':       return <ReviewsTab />;
      case 'user_reviews':  return <UserReviewsTab />;
      case 'logs':          return <LogsTab />;
      default:              return null;
    }
  };

  return (
    <div className="admin-panel">
      <h2>Admin Panel</h2>
      <nav style={{ marginBottom: '20px' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              marginRight: '8px',
              padding: '6px 12px',
              backgroundColor: activeTab === tab.key ? '#333' : '#ddd',
              color: activeTab === tab.key ? '#fff' : '#333',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div>{renderTabContent()}</div>
    </div>
  );
}

export default AdminPanel;