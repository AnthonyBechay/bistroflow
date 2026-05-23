import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Check, X, Clock, RefreshCw, Calendar, FileText, User } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  role: string | null;
  restaurant: { name: string };
}

interface Shift {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  shiftType: string;
  schedule: {
    weekStart: string;
  };
}

interface TimeOffRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
  employee: Employee;
}

interface ShiftSwap {
  id: string;
  status: string;
  shift: Shift;
  requestingEmployee: Employee;
  targetEmployee: Employee | null;
}

export default function SettingsPendingRequests() {
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);
  const [swaps, setSwaps] = useState<ShiftSwap[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const q = selectedRestaurant ? `?restaurantId=${selectedRestaurant}` : '';
      const data = await api.get(`/schedules/pending-requests${q}`);
      setTimeOff(data.timeOff || []);
      setSwaps(data.swaps || []);
    } catch (err) {
      console.error('Failed to load pending requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/restaurants').then(setRestaurants).catch(() => {});
  }, []);

  useEffect(() => {
    loadRequests();
  }, [selectedRestaurant]);

  const handleApproveSwap = async (id: string) => {
    try {
      await api.post(`/schedules/swaps/${id}/approve`, {});
      alert('Shift swap approved successfully!');
      loadRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to approve swap.');
    }
  };

  const handleDenySwap = async (id: string) => {
    if (!confirm('Are you sure you want to deny this shift swap?')) return;
    try {
      await api.post(`/schedules/swaps/${id}/deny`, {});
      alert('Shift swap denied.');
      loadRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to deny swap.');
    }
  };

  const handleApproveTimeOff = async (id: string) => {
    try {
      await api.post(`/schedules/time-off/${id}/approve`, {});
      alert('Time-off request approved successfully!');
      loadRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to approve time-off.');
    }
  };

  const handleDenyTimeOff = async (id: string) => {
    if (!confirm('Are you sure you want to deny this time-off request?')) return;
    try {
      await api.post(`/schedules/time-off/${id}/deny`, {});
      alert('Time-off request denied.');
      loadRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to deny time-off.');
    }
  };

  const getShiftDate = (shift: Shift) => {
    const monday = new Date(shift.schedule.weekStart);
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + (shift.dayOfWeek - 1));
    return targetDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="pending-requests-settings">
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
          Filter by Branch:
        </span>
        <select
          className="select"
          style={{ width: '200px' }}
          value={selectedRestaurant}
          onChange={(e) => setSelectedRestaurant(e.target.value)}
        >
          <option value="">All Branches</option>
          {restaurants.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          Loading requests...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          
          {/* Shift Swaps Column */}
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <RefreshCw size={20} color="var(--color-primary)" />
              <span>Shift Swap Approvals</span>
            </h2>
            {swaps.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No pending shift swaps to approve.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {swaps.map((swap) => (
                  <div
                    key={swap.id}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      padding: '16px',
                      background: 'var(--color-surface)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                        Swap Request
                      </span>
                      <span className={`status-badge status-${swap.status.toLowerCase()}`}>
                        {swap.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <User size={14} />
                        <span><strong>Requester:</strong> {swap.requestingEmployee.name} ({swap.requestingEmployee.restaurant.name})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <Calendar size={14} />
                        <span><strong>Shift:</strong> {getShiftDate(swap.shift)} ({swap.shift.startTime} - {swap.shift.endTime})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} color="var(--color-primary)" />
                        <span>
                          <strong>Claimed By:</strong>{' '}
                          {swap.targetEmployee ? swap.targetEmployee.name : <em style={{ color: 'var(--color-text-muted)' }}>Nobody yet</em>}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={swap.status !== 'CLAIMED'}
                        onClick={() => handleApproveSwap(swap.id)}
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <Check size={14} />
                        <span>Approve Swap</span>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDenySwap(swap.id)}
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <X size={14} />
                        <span>Deny</span>
                      </button>
                    </div>
                    {swap.status !== 'CLAIMED' && (
                      <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px', textAlign: 'center' }}>
                        Cannot approve until a coworker claims this shift.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Time Off Column */}
          <div className="card">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Clock size={20} color="var(--color-primary)" />
              <span>Time-Off Requests</span>
            </h2>
            {timeOff.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No pending time-off requests.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {timeOff.map((req) => {
                  const start = new Date(req.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                  const end = new Date(req.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <div
                      key={req.id}
                      style={{
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        padding: '16px',
                        background: 'var(--color-surface)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                          {req.employee.name}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                          {req.employee.restaurant.name}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Calendar size={14} />
                          <span><strong>Dates:</strong> {start} to {end}</span>
                        </div>
                        {req.reason && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', background: 'var(--color-bg-warm)', padding: '8px', borderRadius: '4px' }}>
                            <FileText size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span><strong>Reason:</strong> "{req.reason}"</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleApproveTimeOff(req.id)}
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          <Check size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDenyTimeOff(req.id)}
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          <X size={14} />
                          <span>Deny</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
