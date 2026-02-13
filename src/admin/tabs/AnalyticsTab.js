// src/admin/tabs/AnalyticsTab.js
import React, { useState } from 'react';
import AnalyticsUsersTab from './AnalyticsUsersTab';
import AnalyticsJobsTab from './AnalyticsJobsTab';

const SUBTABS = [
  { key: 'users', label: 'Users' },
  { key: 'jobs', label: 'Jobs' },
];

export default function AnalyticsTab() {
  const [active, setActive] = useState('users');

  return (
    <div>
      <h3>Analytics</h3>
      <div className="analytics-subtabs">
        {SUBTABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`analytics-subtab ${active === tab.key ? 'active' : ''}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === 'users' && <AnalyticsUsersTab />}
      {active === 'jobs' && <AnalyticsJobsTab />}
    </div>
  );
}
