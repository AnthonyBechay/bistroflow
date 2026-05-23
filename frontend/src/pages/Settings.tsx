import { useState } from 'react';
import { Database, Shield, Building2 } from 'lucide-react';
import SettingsDataManagement from './SettingsDataManagement';
import SettingsUsers from './SettingsUsers';
import SettingsBranches from './SettingsBranches';
import './Settings.css';

type Tab = 'branches' | 'data' | 'users';

const TABS: { key: Tab; label: string; icon: any; desc: string }[] = [
  { key: 'branches', label: 'Branches & Locations', icon: Building2, desc: 'Add and manage restaurant branches and locations' },
  { key: 'data', label: 'Data Management', icon: Database, desc: 'Suppliers, storage, categories, and tags' },
  { key: 'users', label: 'User Management', icon: Shield, desc: 'Employee accounts and access' },
];

export default function Settings() {
  const [tab, setTab] = useState<Tab>(() => {
    const saved = localStorage.getItem('settingsActiveTab') as Tab;
    return (saved && ['branches', 'data', 'users'].includes(saved)) ? saved : 'branches';
  });
  
  const current = TABS.find((t) => t.key === tab)!;

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    localStorage.setItem('settingsActiveTab', newTab);
  };

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
            onClick={() => handleTabChange(t.key)}
          >
            <t.icon size={16} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="settings-tab-body">
        {tab === 'branches' && <SettingsBranches />}
        {tab === 'data' && <SettingsDataManagement />}
        {tab === 'users' && <SettingsUsers />}
      </div>
    </div>
  );
}
