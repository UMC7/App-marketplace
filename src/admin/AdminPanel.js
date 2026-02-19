// /src/admin/AdminPanel.js
import React, { useEffect, useRef, useState } from 'react';
import AnalyticsTab from './tabs/AnalyticsTab';
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
  { key: 'analytics', label: 'Analytics' },
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const panel = panelRef.current;
    if (!panel) return;

    const bar = panel.querySelector('.admin-scrollbar');
    const inner = bar?.querySelector('.admin-scrollbar-inner');
    if (!bar || !inner) return;

    let active = null;
    let resizeObserver = null;
    const hoverHandlers = new Map();

    const candidates = Array.from(
      panel.querySelectorAll('.admin-table, .analytics-block')
    );

    const syncBarFromActive = () => {
      if (!active) return;
      bar.scrollLeft = active.scrollLeft;
    };

    const updateBar = () => {
      if (!active) {
        bar.dataset.active = 'false';
        inner.style.width = '0px';
        return;
      }
      const width = active.scrollWidth;
      inner.style.width = `${width}px`;
      const shouldShow = width > active.clientWidth + 1;
      bar.dataset.active = shouldShow ? 'true' : 'false';
      if (!shouldShow) {
        bar.scrollLeft = 0;
      }
    };

    const onActiveScroll = () => {
      if (!active) return;
      bar.scrollLeft = active.scrollLeft;
    };

    const activate = (el) => {
      if (!el || el === active) return;
      if (active) {
        active.removeEventListener('scroll', onActiveScroll);
      }
      active = el;
      active.addEventListener('scroll', onActiveScroll, { passive: true });
      updateBar();
      syncBarFromActive();
    };

    const onBarScroll = () => {
      if (!active) return;
      active.scrollLeft = bar.scrollLeft;
    };

    bar.addEventListener('scroll', onBarScroll, { passive: true });

    candidates.forEach((el) => {
      const onEnter = () => activate(el);
      const onFocus = () => activate(el);
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('focusin', onFocus);
      hoverHandlers.set(el, { onEnter, onFocus });
    });

    const firstScrollable = candidates.find(
      (el) => el.scrollWidth > el.clientWidth + 1
    );
    if (firstScrollable) {
      activate(firstScrollable);
    } else if (candidates[0]) {
      activate(candidates[0]);
    } else {
      bar.dataset.active = 'false';
    }

    resizeObserver = new ResizeObserver(() => {
      updateBar();
    });
    candidates.forEach((el) => resizeObserver.observe(el));

    updateBar();

    return () => {
      bar.removeEventListener('scroll', onBarScroll);
      if (active) {
        active.removeEventListener('scroll', onActiveScroll);
      }
      hoverHandlers.forEach((handlers, el) => {
        el.removeEventListener('mouseenter', handlers.onEnter);
        el.removeEventListener('focusin', handlers.onFocus);
      });
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':     return <AnalyticsTab />;
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
    <div className="admin-panel" ref={panelRef}>
      <h2>Admin Panel</h2>
      <button
        type="button"
        className="admin-menu-toggle"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        aria-expanded={isMenuOpen ? 'true' : 'false'}
        aria-controls="admin-tabs-panel"
      >
        ☰ Menu
      </button>
      <nav id="admin-tabs-panel" className={`admin-tabs ${isMenuOpen ? 'active' : ''}`}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setIsMenuOpen(false); }}
            className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div>{renderTabContent()}</div>
      <div className="admin-scrollbar" aria-hidden="true">
        <div className="admin-scrollbar-inner" />
      </div>
    </div>
  );
}

export default AdminPanel;
