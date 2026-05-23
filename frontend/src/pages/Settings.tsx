import { useState } from 'react';
import { Database, Shield, Building2, Clock } from 'lucide-react';
import SettingsDataManagement from './SettingsDataManagement';
import SettingsUsers from './SettingsUsers';
import SettingsBranches from './SettingsBranches';
import SettingsPendingRequests from './SettingsPendingRequests';
import './Settings.css';

type Tab = 'data' | 'users' | 'branches' | 'requests';

const TABS: { key: Tab; label: string; icon: any; desc: string }[] = [
  { key: 'data', label: 'Data Management', icon: Database, desc: 'Suppliers, storage, categories, and tags' },
  { key: 'users', label: 'User Management', icon: Shield, desc: 'Employee accounts and access' },
  { key: 'branches', label: 'Branches & Locations', icon: Building2, desc: 'Add and manage restaurant branches and locations' },
  { key: 'requests', label: 'Pending Approvals', icon: Clock, desc: 'Approve or deny employee shift swaps and time-off requests' },
];

export default function Settings() {
  const [tab, setTab] = useState<Tab>('data');
  const current = TABS.find((t) => t.key === tab)!;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">{current.desc}</p>
        </div>
      </div>

      <div className="settings-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`settings-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            <t.icon size={16} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="settings-tab-body">
        {tab === 'data' && <SettingsDataManagement />}
        {tab === 'users' && <SettingsUsers />}
        {tab === 'branches' && <SettingsBranches />}
        {tab === 'requests' && <SettingsPendingRequests />}
      </div>
    </div>
  );
}
