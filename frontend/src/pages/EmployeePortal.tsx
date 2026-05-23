import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { CalendarDays, RefreshCw, Clock, UserCheck, AlertCircle, FileText, Check, X, Users } from 'lucide-react';
import './EmployeePortal.css';

interface Employee {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  color: string | null;
  hourlyRate: number | null;
  restaurantId: string;
  restaurant: { name: string };
  isActive: boolean;
}

interface Shift {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  shiftType: string;
  breakMinutes: number;
  notes: string | null;
  schedule: {
    id: string;
    weekStart: string;
    weekEnd: string;
    restaurant: { name: string };
  };
}

interface Availability {
  id?: string;
  dayOfWeek: number;
  startTime: string | null;
  endTime: string | null;
  isAvailable: boolean;
}

interface TimeOffRequest {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  createdAt: string;
}

interface ShiftSwap {
  id: string;
  shiftId: string;
  shift: Shift;
  requestingEmployeeId: string;
  requestingEmployee: Employee;
  targetEmployeeId: string | null;
  targetEmployee: Employee | null;
  status: 'PENDING' | 'CLAIMED' | 'APPROVED' | 'DENIED' | 'CANCELLED';
  createdAt: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

export default function EmployeePortal() {
  const [me, setMe] = useState<any>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<'shifts' | 'swaps' | 'availability' | 'timeoff'>('shifts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab 1: Shifts
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedShiftForSwap, setSelectedShiftForSwap] = useState<Shift | null>(null);
  const [coworkers, setCoworkers] = useState<Employee[]>([]);
  const [targetEmployeeId, setTargetEmployeeId] = useState('');

  // Tab 2: Swaps Board
  const [availableSwaps, setAvailableSwaps] = useState<ShiftSwap[]>([]);
  const [mySwaps, setMySwaps] = useState<ShiftSwap[]>([]);

  // Tab 3: Availability
  const [availability, setAvailability] = useState<Availability[]>(
    DAYS_OF_WEEK.map(d => ({
      dayOfWeek: d.value,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
    }))
  );
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilitySuccess, setAvailabilitySuccess] = useState(false);

  // Tab 4: Time Off
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [timeOffForm, setTimeOffForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [submittingTimeOff, setSubmittingTimeOff] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const meData = await api.get('/auth/me');
      setMe(meData);
      
      if (!meData.employee) {
        setError('Your login is not associated with an Employee record. Please contact your manager.');
        setLoading(false);
        return;
      }
      
      const empData = meData.employee;
      setEmployee(empData);
      
      // Load tab data
      await Promise.all([
        loadShifts(),
        loadSwaps(empData.id),
        loadAvailability(),
        loadTimeOffRequests(),
        loadCoworkers(empData.restaurantId, empData.id),
      ]);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load employee portal profile.');
      setLoading(false);
    }
  };

  const loadShifts = async () => {
    try {
      const data = await api.get('/employee-portal/shifts');
      setShifts(data);
    } catch (err) {
      console.error('Failed to load shifts', err);
    }
  };

  const loadSwaps = async (empId: string) => {
    try {
      const data = await api.get('/employee-portal/swaps');
      // Filter swaps
      setAvailableSwaps(data.filter((s: ShiftSwap) => s.requestingEmployeeId !== empId));
      setMySwaps(data.filter((s: ShiftSwap) => s.requestingEmployeeId === empId));
    } catch (err) {
      console.error('Failed to load swaps', err);
    }
  };

  const loadAvailability = async () => {
    try {
      const data = await api.get('/employee-portal/availability');
      if (data && data.length > 0) {
        // Map availability to all days to ensure 1-7 are defined
        const fullAvail = DAYS_OF_WEEK.map(d => {
          const match = data.find((a: Availability) => a.dayOfWeek === d.value);
          return match || {
            dayOfWeek: d.value,
            startTime: '09:00',
            endTime: '17:00',
            isAvailable: false,
          };
        });
        setAvailability(fullAvail);
      }
    } catch (err) {
      console.error('Failed to load availability', err);
    }
  };

  const loadTimeOffRequests = async () => {
    try {
      const data = await api.get('/employee-portal/time-off');
      setTimeOffRequests(data);
    } catch (err) {
      console.error('Failed to load time off requests', err);
    }
  };

  const loadCoworkers = async (restId: string, empId: string) => {
    try {
      const data = await api.get(`/employees?restaurantId=${restId}`);
      setCoworkers(data.filter((c: Employee) => c.id !== empId && c.isActive));
    } catch (err) {
      console.error('Failed to load coworkers', err);
    }
  };

  // Helper: calculate total hours of a shift
  const getShiftHours = (shift: Shift) => {
    const [sh, sm] = shift.startTime.split(':').map(Number);
    const [eh, em] = shift.endTime.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    const net = diff - (shift.breakMinutes || 0);
    return Math.max(0, net / 60);
  };

  const formatShiftDate = (shift: Shift) => {
    const monday = new Date(shift.schedule.weekStart);
    const targetDate = new Date(monday);
    // dayOfWeek is 1 = Mon, ..., 7 = Sun. So targetDate offset is dayOfWeek - 1.
    targetDate.setDate(monday.getDate() + (shift.dayOfWeek - 1));
    return targetDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getWeekStartString = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Handle posting swap
  const handleOpenSwapModal = (shift: Shift) => {
    setSelectedShiftForSwap(shift);
    setTargetEmployeeId('');
    setShowSwapModal(true);
  };

  const handlePostSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftForSwap || !employee) return;
    try {
      await api.post('/employee-portal/swaps', {
        shiftId: selectedShiftForSwap.id,
        targetEmployeeId: targetEmployeeId || null,
      });
      setShowSwapModal(false);
      setSelectedShiftForSwap(null);
      await loadSwaps(employee.id);
      alert('Shift swap requested! It is now on the swap board pending coworker claim and manager approval.');
    } catch (err: any) {
      alert(err.message || 'Failed to request shift swap.');
    }
  };

  const handleClaimSwap = async (swapId: string) => {
    if (!employee) return;
    if (!confirm('Are you sure you want to claim this shift? This will require manager approval before the schedule updates.')) return;
    try {
      await api.post(`/employee-portal/swaps/${swapId}/claim`, {});
      alert('Shift claimed! Awaiting manager approval.');
      await loadSwaps(employee.id);
      await loadShifts();
    } catch (err: any) {
      alert(err.message || 'Failed to claim shift.');
    }
  };

  // Handle Availability save
  const handleAvailabilityToggle = (dayVal: number) => {
    setAvailability(prev =>
      prev.map(a => (a.dayOfWeek === dayVal ? { ...a, isAvailable: !a.isAvailable } : a))
    );
  };

  const handleAvailabilityTimeChange = (dayVal: number, field: 'startTime' | 'endTime', value: string) => {
    setAvailability(prev =>
      prev.map(a => (a.dayOfWeek === dayVal ? { ...a, [field]: value } : a))
    );
  };

  const handleSaveAvailability = async () => {
    setSavingAvailability(true);
    setAvailabilitySuccess(false);
    try {
      const days = availability.map(a => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.isAvailable ? a.startTime : null,
        endTime: a.isAvailable ? a.endTime : null,
        isAvailable: a.isAvailable,
      }));
      await api.post('/employee-portal/availability', { days });
      setAvailabilitySuccess(true);
      setTimeout(() => setAvailabilitySuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save availability.');
    } finally {
      setSavingAvailability(false);
    }
  };

  // Handle Time Off submission
  const handleSubmitTimeOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeOffForm.startDate || !timeOffForm.endDate) {
      alert('Please select both start and end dates.');
      return;
    }
    setSubmittingTimeOff(true);
    try {
      await api.post('/employee-portal/time-off', {
        startDate: timeOffForm.startDate,
        endDate: timeOffForm.endDate,
        reason: timeOffForm.reason || null,
      });
      setTimeOffForm({ startDate: '', endDate: '', reason: '' });
      await loadTimeOffRequests();
      alert('Time-off request submitted successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit time-off request.');
    } finally {
      setSubmittingTimeOff(false);
    }
  };

  if (loading) {
    return (
      <div className="portal-loading">
        <RefreshCw className="spinner" size={32} />
        <p>Loading your portal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portal-error-container">
        <AlertCircle size={48} className="error-icon" />
        <h2>Access Restricted</h2>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  // Calculate stats for My Shifts (this week and future)
  const currentWeekShifts = shifts.filter(s => {
    const weekStart = new Date(s.schedule.weekStart);
    const now = new Date();
    // Get difference in days to check if the shift is roughly current/upcoming
    const diff = (now.getTime() - weekStart.getTime()) / (1000 * 3600 * 24);
    return diff >= -7 && diff <= 7;
  });

  const totalShiftsCount = currentWeekShifts.length;
  const totalHoursCount = currentWeekShifts.reduce((acc, s) => acc + getShiftHours(s), 0);
  const estimatedPay = employee?.hourlyRate ? totalHoursCount * employee.hourlyRate : null;

  return (
    <div className="employee-portal">
      <div className="portal-header">
        <div>
          <h1 className="portal-title">Employee Portal</h1>
          <p className="portal-subtitle">
            Welcome back, <strong>{employee?.name}</strong> • {employee?.role || 'Crew'} at <strong>{employee?.restaurant.name}</strong>
          </p>
        </div>
      </div>

      <div className="portal-tabs">
        <button
          className={`portal-tab-btn ${activeTab === 'shifts' ? 'active' : ''}`}
          onClick={() => setActiveTab('shifts')}
        >
          <CalendarDays size={18} />
          <span>My Shifts</span>
        </button>
        <button
          className={`portal-tab-btn ${activeTab === 'swaps' ? 'active' : ''}`}
          onClick={() => setActiveTab('swaps')}
        >
          <RefreshCw size={18} />
          <span>Shift Swaps</span>
        </button>
        <button
          className={`portal-tab-btn ${activeTab === 'availability' ? 'active' : ''}`}
          onClick={() => setActiveTab('availability')}
        >
          <Clock size={18} />
          <span>Availability</span>
        </button>
        <button
          className={`portal-tab-btn ${activeTab === 'timeoff' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeoff')}
        >
          <FileText size={18} />
          <span>Time Off</span>
        </button>
      </div>

      <div className="portal-tab-content">
        {/* ── MY SHIFTS TAB ── */}
        {activeTab === 'shifts' && (
          <div className="shifts-tab-view animate-fade-in">
            {/* Quick Metrics */}
            <div className="metrics-grid">
              <div className="metric-card">
                <span className="metric-label">Scheduled Shifts</span>
                <span className="metric-value">{totalShiftsCount}</span>
                <span className="metric-subtext">Active week context</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">Total Hours</span>
                <span className="metric-value">{totalHoursCount.toFixed(1)} hrs</span>
                <span className="metric-subtext">Net of breaks</span>
              </div>
              {estimatedPay !== null && (
                <div className="metric-card highlight-metric">
                  <span className="metric-label">Est. Weekly Pay</span>
                  <span className="metric-value">${estimatedPay.toFixed(2)}</span>
                  <span className="metric-subtext">Hourly rate: ${employee?.hourlyRate?.toFixed(2)}/hr</span>
                </div>
              )}
            </div>

            <div className="section-card">
              <h2 className="section-title">My Schedule</h2>
              {shifts.length === 0 ? (
                <div className="empty-state">
                  <CalendarDays size={48} className="empty-icon" />
                  <p>You have no scheduled shifts at the moment.</p>
                </div>
              ) : (
                <div className="shifts-list">
                  {shifts.map(shift => {
                    const hrs = getShiftHours(shift);
                    return (
                      <div key={shift.id} className={`shift-item shift-type-${shift.shiftType.toLowerCase()}`}>
                        <div className="shift-info-block">
                          <span className="shift-date">{formatShiftDate(shift)}</span>
                          <div className="shift-time-block">
                            <Clock size={14} />
                            <span className="shift-time">
                              {shift.startTime} - {shift.endTime} ({hrs.toFixed(1)} hrs)
                            </span>
                            {shift.breakMinutes > 0 && (
                              <span className="shift-break-badge">{shift.breakMinutes}m break</span>
                            )}
                          </div>
                          {shift.notes && <p className="shift-notes">"{shift.notes}"</p>}
                          <span className="shift-schedule-ref">
                            Schedule Week: {getWeekStartString(shift.schedule.weekStart)}
                          </span>
                        </div>
                        <div className="shift-actions">
                          {shift.shiftType === 'WORK' && (
                            <button
                              className="btn-swap-request"
                              onClick={() => handleOpenSwapModal(shift)}
                            >
                              <RefreshCw size={14} />
                              <span>Swap Shift</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SHIFT SWAPS TAB ── */}
        {activeTab === 'swaps' && (
          <div className="swaps-tab-view animate-fade-in">
            <div className="swaps-split-layout">
              {/* Left Column: Board */}
              <div className="swaps-board">
                <div className="section-card">
                  <h2 className="section-title">Coworkers' Swap Board</h2>
                  <p className="section-description">Shifts posted by your team. Claim them to request taking over the shift.</p>
                  
                  {availableSwaps.length === 0 ? (
                    <div className="empty-state">
                      <Users size={32} className="empty-icon" />
                      <p>No shifts currently posted for swaps by coworkers.</p>
                    </div>
                  ) : (
                    <div className="swaps-list">
                      {availableSwaps.map(swap => {
                        const hrs = getShiftHours(swap.shift);
                        return (
                          <div key={swap.id} className="swap-card">
                            <div className="swap-card-header">
                              <span className="coworker-name">{swap.requestingEmployee.name}</span>
                              <span className="coworker-role">{swap.requestingEmployee.role || 'Crew'}</span>
                            </div>
                            <div className="swap-card-body">
                              <p className="swap-shift-date">{formatShiftDate(swap.shift)}</p>
                              <p className="swap-shift-time">{swap.shift.startTime} - {swap.shift.endTime} ({hrs.toFixed(1)} hrs)</p>
                              {swap.shift.notes && <p className="swap-shift-notes">"{swap.shift.notes}"</p>}
                            </div>
                            <div className="swap-card-footer">
                              <button
                                className="btn-claim-swap"
                                onClick={() => handleClaimSwap(swap.id)}
                              >
                                <Check size={14} />
                                <span>Claim Shift</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: My Requests */}
              <div className="my-swaps">
                <div className="section-card">
                  <h2 className="section-title">My Swap Requests</h2>
                  
                  {mySwaps.length === 0 ? (
                    <div className="empty-state">
                      <RefreshCw size={32} className="empty-icon" />
                      <p>You haven't posted any shift swaps yet.</p>
                    </div>
                  ) : (
                    <div className="my-swaps-list">
                      {mySwaps.map(swap => {
                        const hrs = getShiftHours(swap.shift);
                        return (
                          <div key={swap.id} className="my-swap-item">
                            <div className="my-swap-info">
                              <span className="my-swap-date">{formatShiftDate(swap.shift)}</span>
                              <span className="my-swap-time">{swap.shift.startTime} - {swap.shift.endTime}</span>
                            </div>
                            <div className="my-swap-status">
                              <span className={`status-badge status-${swap.status.toLowerCase()}`}>
                                {swap.status}
                              </span>
                              {swap.targetEmployee && (
                                <span className="swap-claimant">Claimed by: {swap.targetEmployee.name}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── AVAILABILITY TAB ── */}
        {activeTab === 'availability' && (
          <div className="availability-tab-view animate-fade-in">
            <div className="section-card">
              <h2 className="section-title">My Weekly Availability</h2>
              <p className="section-description">
                Specify the general hours you are available to work each day of the week. Managers refer to this when planning schedules.
              </p>

              <div className="availability-list">
                {availability.map(item => {
                  const dayName = DAYS_OF_WEEK.find(d => d.value === item.dayOfWeek)?.label || '';
                  return (
                    <div key={item.dayOfWeek} className={`availability-row ${item.isAvailable ? 'available' : 'unavailable'}`}>
                      <div className="day-toggle-col">
                        <label className="toggle-container">
                          <input
                            type="checkbox"
                            checked={item.isAvailable}
                            onChange={() => handleAvailabilityToggle(item.dayOfWeek)}
                          />
                          <span className="slider"></span>
                        </label>
                        <span className="day-name">{dayName}</span>
                      </div>

                      {item.isAvailable ? (
                        <div className="time-inputs-col">
                          <div className="time-input-group">
                            <label>Start Time</label>
                            <input
                              type="time"
                              value={item.startTime || '09:00'}
                              onChange={e => handleAvailabilityTimeChange(item.dayOfWeek, 'startTime', e.target.value)}
                            />
                          </div>
                          <div className="time-input-group">
                            <label>End Time</label>
                            <input
                              type="time"
                              value={item.endTime || '17:00'}
                              onChange={e => handleAvailabilityTimeChange(item.dayOfWeek, 'endTime', e.target.value)}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="unavailable-placeholder">
                          <span>Unavailable to work</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="availability-footer">
                {availabilitySuccess && (
                  <div className="availability-success-msg">
                    <Check size={16} />
                    <span>Availability saved successfully!</span>
                  </div>
                )}
                <button
                  className="btn-save-availability"
                  disabled={savingAvailability}
                  onClick={handleSaveAvailability}
                >
                  {savingAvailability ? 'Saving...' : 'Save Availability'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TIME OFF TAB ── */}
        {activeTab === 'timeoff' && (
          <div className="timeoff-tab-view animate-fade-in">
            <div className="timeoff-split-layout">
              {/* Form */}
              <div className="timeoff-form-container">
                <div className="section-card">
                  <h2 className="section-title">Request Time Off</h2>
                  <p className="section-description">Submit a request for upcoming vacation days, sick leave, or personal time off.</p>
                  
                  <form onSubmit={handleSubmitTimeOff} className="timeoff-form">
                    <div className="form-group">
                      <label>Start Date</label>
                      <input
                        type="date"
                        required
                        value={timeOffForm.startDate}
                        onChange={e => setTimeOffForm(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input
                        type="date"
                        required
                        value={timeOffForm.endDate}
                        onChange={e => setTimeOffForm(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Reason / Notes</label>
                      <textarea
                        rows={3}
                        placeholder="Please provide details (e.g. Family vacation, dentist appointment, personal day)..."
                        value={timeOffForm.reason}
                        onChange={e => setTimeOffForm(prev => ({ ...prev, reason: e.target.value }))}
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn-submit-timeoff"
                      disabled={submittingTimeOff}
                    >
                      {submittingTimeOff ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </form>
                </div>
              </div>

              {/* History */}
              <div className="timeoff-history">
                <div className="section-card">
                  <h2 className="section-title">Request History</h2>
                  
                  {timeOffRequests.length === 0 ? (
                    <div className="empty-state">
                      <FileText size={32} className="empty-icon" />
                      <p>No time-off requests found in your history.</p>
                    </div>
                  ) : (
                    <div className="timeoff-history-list">
                      {timeOffRequests.map(req => {
                        const start = new Date(req.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                        const end = new Date(req.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                        return (
                          <div key={req.id} className="timeoff-history-item">
                            <div className="timeoff-item-info">
                              <span className="timeoff-dates">{start} - {end}</span>
                              {req.reason && <p className="timeoff-reason">Reason: "{req.reason}"</p>}
                              <span className="timeoff-submitted-at">Submitted on {new Date(req.createdAt).toLocaleDateString()}</span>
                            </div>
                            <span className={`status-badge status-${req.status.toLowerCase()}`}>
                              {req.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SHIFT SWAP MODAL ── */}
      {showSwapModal && selectedShiftForSwap && (
        <div className="modal-overlay" onClick={() => setShowSwapModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Post Shift to Swap Board</h3>
              <button className="btn-close" onClick={() => setShowSwapModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePostSwap} className="modal-form">
              <div className="modal-shift-preview">
                <p><strong>Shift Details:</strong></p>
                <p>{formatShiftDate(selectedShiftForSwap)}</p>
                <p>{selectedShiftForSwap.startTime} - {selectedShiftForSwap.endTime} ({getShiftHours(selectedShiftForSwap).toFixed(1)} hrs)</p>
              </div>

              <div className="form-group">
                <label>Direct Swap (Optional)</label>
                <select
                  value={targetEmployeeId}
                  onChange={e => setTargetEmployeeId(e.target.value)}
                >
                  <option value="">Post publicly (Anyone can claim)</option>
                  {coworkers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.role ? `(${c.role})` : ''}
                    </option>
                  ))}
                </select>
                <p className="form-help-text">
                  Choose a coworker to direct this swap request to them. Otherwise, any qualified employee from your branch can claim it.
                </p>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowSwapModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Post to Swap Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
