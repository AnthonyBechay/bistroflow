import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Trash2, Edit3, Upload, X, DollarSign } from 'lucide-react';
import { api } from '../lib/api';
import Modal from '../components/Modal';

interface Branch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  details: string | null;
  shareToken: string;
  _count: { employees: number };
}

export default function SettingsBranches() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    logoUrl: '',
    details: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/restaurants');
      setBranches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', address: '', phone: '', logoUrl: '', details: '' });
    setLogoFile(null);
    setLogoPreview(null);
    setShowModal(true);
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setForm({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      logoUrl: branch.logoUrl || '',
      details: branch.details || '',
    });
    setLogoFile(null);
    setLogoPreview(branch.logoUrl || null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let rest;
      if (editing) {
        rest = await api.put(`/restaurants/${editing.id}`, form);
      } else {
        rest = await api.post('/restaurants', form);
      }
      if (logoFile && rest?.id) {
        await api.upload(`/restaurants/${rest.id}/upload-logo`, logoFile);
      }
      setShowModal(false);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this branch and all its employees/schedules? This action is permanent.')) return;
    try {
      await api.delete(`/restaurants/${id}`);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="settings-section">
        <div className="settings-section-header">
          <div>
            <h2 className="settings-section-title"><Building2 size={18} /> Branches & Locations</h2>
            <p className="settings-section-desc">
              Manage the distinct physical locations or branches of your restaurant business.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <Plus size={16} /> Add Branch
          </button>
        </div>

        {loading ? (
          <div className="settings-empty">Loading...</div>
        ) : branches.length === 0 ? (
          <div className="settings-empty">No branches yet. Click "Add Branch" to set one up.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginTop: 16 }}>
            {branches.map((branch) => (
              <div key={branch.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {branch.logoUrl ? (
                      <img src={branch.logoUrl} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                        {branch.name.charAt(0)}
                      </div>
                    )}
                    <strong style={{ fontSize: 16 }}>{branch.name}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn-icon" title="Edit" onClick={() => openEdit(branch)}><Edit3 size={14} /></button>
                    <button className="btn-icon" title="Delete" onClick={() => remove(branch.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                {branch.address && <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{branch.address}</div>}
                {branch.phone && <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{branch.phone}</div>}
                {branch.details && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4, fontStyle: 'italic' }}>{branch.details}</div>}
                <div style={{ fontSize: 13, color: 'var(--color-primary)', marginTop: 8, fontWeight: 500 }}>
                  {branch._count.employees} active staff members
                </div>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }} onClick={() => navigate(`/app/scheduling/salaries/${branch.id}`)}>
                  <DollarSign size={14} /> View Salaries & Labor Cost
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal isOpen={true} onClose={() => setShowModal(false)} title={editing ? 'Edit Branch' : 'Add Branch'} width="480px">
          <form onSubmit={handleSubmit} className="form-stack">
            <div className="form-group">
              <label className="label">Branch Name *</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Downtown Branch" />
            </div>
            <div className="form-group">
              <label className="label">Address</label>
              <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, Suite A" />
            </div>
            <div className="form-group">
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 123-4567" />
            </div>
            <div className="form-group">
              <label className="label">Logo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                {(logoPreview || form.logoUrl) && (
                  <img src={logoFile ? logoPreview! : form.logoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                )}
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                  <Upload size={14} /> {logoPreview || form.logoUrl ? 'Change Logo' : 'Upload Logo'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setLogoFile(file);
                      setLogoPreview(URL.createObjectURL(file));
                    }
                  }} />
                </label>
                {(logoPreview || form.logoUrl) && (
                  <button type="button" className="btn-icon" onClick={() => { setLogoFile(null); setLogoPreview(null); setForm({ ...form, logoUrl: '' }); }} title="Remove logo">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="label">Branch Notes</label>
              <textarea className="input" rows={3} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Opening hours or general details..." style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editing ? 'Save Changes' : 'Create Branch'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
