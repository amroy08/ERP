import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Settings,
  List,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Activity,
  Check,
  RefreshCw,
  Search,
  Filter,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Tabs } from '../../components/common/Tabs';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { DataTable } from '../../components/common/DataTable';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  getNotificationRules,
  updateNotificationRule,
  getNotificationLogs,
  getNotificationLogSummary,
  runNotificationReminders,
  NotificationRule,
  NotificationLog,
  NotificationLogSummary,
  ReminderScanResults
} from '../../services/notificationAdminService';
import { TableColumn } from '../../types';

export const NotificationSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('rules');

  // Rules State
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [isRulesLoading, setIsRulesLoading] = useState(true);
  const [savingRuleId, setSavingRuleId] = useState<string | null>(null);

  // Rule Form States
  const [feesEnabled, setFeesEnabled] = useState(true);
  const [feesCooldown, setFeesCooldown] = useState(24);

  const [absenceEnabled, setAbsenceEnabled] = useState(true);
  const [absenceCooldown, setAbsenceCooldown] = useState(24);
  const [absenceThreshold, setAbsenceThreshold] = useState(3);
  const [absenceDays, setAbsenceDays] = useState(7);

  // Logs State
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(true);
  const [logSummary, setLogSummary] = useState<NotificationLogSummary | null>(null);
  const [logsPagination, setLogsPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  // Log Filters
  const [filterType, setFilterType] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterRead, setFilterRead] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Manual Scan Runner State
  const [isRunningScan, setIsRunningScan] = useState(false);
  const [scanResult, setScanResult] = useState<ReminderScanResults | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);

  // Role Guard: only admin and super_admin allowed
  useEffect(() => {
    if (user && user.role !== 'super_admin' && user.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Load Rules Data
  const fetchRulesData = async () => {
    setIsRulesLoading(true);
    try {
      const res = await getNotificationRules();
      if (res.success && res.data) {
        setRules(res.data);
        // Bind form variables
        const feesRule = res.data.find(r => r.type === 'FEES_REMINDER');
        if (feesRule) {
          setFeesEnabled(feesRule.enabled);
          setFeesCooldown(feesRule.cooldownHours);
        }
        const absRule = res.data.find(r => r.type === 'ATTENDANCE_ABSENCE_ALERT');
        if (absRule) {
          setAbsenceEnabled(absRule.enabled);
          setAbsenceCooldown(absRule.cooldownHours);
          setAbsenceThreshold(absRule.thresholdCount ?? 3);
          setAbsenceDays(absRule.thresholdDays ?? 7);
        }
      }
    } catch (err) {
      console.error('Failed to load rules:', err);
      toast.error('Failed to load notification reminder rules.');
    } finally {
      setIsRulesLoading(false);
    }
  };

  // Load Logs & Summary Data
  const fetchLogsData = async (page: number = 1) => {
    setIsLogsLoading(true);
    try {
      const params: any = {
        page,
        limit: logsPagination.limit,
      };
      if (filterType) params.type = filterType;
      if (filterRole) params.recipientRole = filterRole;
      if (filterRead) params.isRead = filterRead;
      if (filterPriority) params.priority = filterPriority;

      const [logsRes, summaryRes] = await Promise.all([
        getNotificationLogs(params),
        getNotificationLogSummary()
      ]);

      if (logsRes.success) {
        setLogs(logsRes.data || []);
        const total = logsRes.pagination.total;
        const limit = logsRes.pagination.limit;
        setLogsPagination({
          page,
          limit,
          total,
          pages: Math.ceil(total / limit) || 1
        });
      }

      if (summaryRes.success) {
        setLogSummary(summaryRes.data);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  // Reload rules on tab change to rules
  useEffect(() => {
    if (activeTab === 'rules') {
      fetchRulesData();
    } else if (activeTab === 'logs') {
      fetchLogsData(1);
    }
  }, [activeTab]);

  // Handle log filter changes
  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogsData(1);
    }
  }, [filterType, filterRole, filterRead, filterPriority]);

  // Update Notification Rule
  const handleSaveRule = async (type: 'FEES_REMINDER' | 'ATTENDANCE_ABSENCE_ALERT') => {
    const targetRule = rules.find(r => r.type === type);
    if (!targetRule) return;

    setSavingRuleId(targetRule.id);

    const payload: any = {};
    if (type === 'FEES_REMINDER') {
      payload.enabled = feesEnabled;
      payload.cooldownHours = feesCooldown;
    } else {
      payload.enabled = absenceEnabled;
      payload.cooldownHours = absenceCooldown;
      payload.thresholdCount = absenceThreshold;
      payload.thresholdDays = absenceDays;
    }

    // Client-side validations
    if (payload.cooldownHours < 0) {
      toast.error('Cooldown hours cannot be negative.');
      setSavingRuleId(null);
      return;
    }
    if (payload.thresholdCount !== undefined && payload.thresholdCount < 0) {
      toast.error('Threshold count cannot be negative.');
      setSavingRuleId(null);
      return;
    }
    if (payload.thresholdDays !== undefined && payload.thresholdDays < 0) {
      toast.error('Threshold lookback days cannot be negative.');
      setSavingRuleId(null);
      return;
    }

    try {
      const res = await updateNotificationRule(targetRule.id, payload);
      if (res.success) {
        toast.success(`${type === 'FEES_REMINDER' ? 'Fee Pending Reminder' : 'Absence Alert'} rule updated successfully.`);
        fetchRulesData();
      }
    } catch (err: any) {
      console.error('Failed to update rule:', err);
      toast.error(err.response?.data?.message || 'Failed to update reminder rule.');
    } finally {
      setSavingRuleId(null);
    }
  };

  // Trigger manual reminder scan
  const handleRunManualScan = async () => {
    if (isRunningScan) return;
    setIsRunningScan(true);
    setScanResult(null);

    try {
      const res = await runNotificationReminders();
      if (res.success && res.data) {
        setScanResult(res.data);
        setShowScanModal(true);
        toast.success('Reminder scans executed successfully.');
      }
    } catch (err: any) {
      console.error('Manual scan failed:', err);
      toast.error(err.response?.data?.message || 'Manual reminder scan execution failed.');
    } finally {
      setIsRunningScan(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'red';
      case 'high':
        return 'amber';
      case 'medium':
        return 'blue';
      case 'low':
      default:
        return 'gray';
    }
  };

  // Columns for the notification logs table
  const columns: TableColumn<any>[] = [
    {
      key: 'type',
      label: 'Notification Type',
      width: '180px',
      render: (_, item: NotificationLog) => (
        <span className="font-bold text-slate-700 text-xs tracking-wide">
          {item.type}
        </span>
      ),
    },
    {
      key: 'recipient',
      label: 'Recipient Details',
      width: '200px',
      render: (_, item: NotificationLog) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
            <User className="w-3 h-3 text-slate-400" />
            {item.recipientRole.toUpperCase()}
          </span>
          <span className="text-[10px] text-slate-400 font-mono font-semibold truncate max-w-[180px]">
            ID: {item.recipientUserId}
          </span>
        </div>
      ),
    },
    {
      key: 'message',
      label: 'Message Preview',
      render: (_, item: NotificationLog) => (
        <div className="flex flex-col gap-0.5 max-w-sm md:max-w-md">
          <span className="text-xs font-bold text-slate-900 truncate">{item.title}</span>
          <span className="text-xs text-slate-500 line-clamp-1">{item.message}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'State & Channels',
      width: '200px',
      render: (_, item: NotificationLog) => (
        <div className="flex flex-col gap-1">
          <div className="flex gap-1 items-center flex-wrap">
            <Badge variant={item.isRead ? 'green' : 'gray'} className="text-[9px] px-1 py-0.5">
              {item.isRead ? 'Read' : 'Unread'}
            </Badge>
            <Badge variant={getPriorityColor(item.priority)} className="text-[9px] px-1 py-0.5 font-bold">
              {item.priority.toUpperCase()}
            </Badge>
          </div>
          {item.deliveryLogs && item.deliveryLogs.length > 0 && (
            <div className="flex gap-1 items-center flex-wrap mt-0.5">
              {item.deliveryLogs.map((dl, i) => (
                <span
                  key={i}
                  className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                    dl.status === 'sent' || dl.status === 'delivered'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : dl.status === 'failed'
                      ? 'bg-red-50 text-red-700 border-red-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}
                >
                  {dl.channel.toUpperCase()}: {dl.status.toUpperCase()}
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Sent Date',
      width: '150px',
      render: (_, item: NotificationLog) => (
        <span className="text-xs text-slate-500 font-medium">
          {format(new Date(item.createdAt), 'dd MMM yyyy HH:mm')}
        </span>
      ),
    },
  ];

  const tabs = [
    { id: 'rules', label: 'Reminder Rules', icon: <Settings className="w-4 h-4" /> },
    { id: 'logs', label: 'Notification Logs', icon: <List className="w-4 h-4" /> },
    { id: 'manual', label: 'Manual Trigger', icon: <Play className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'System' }, { label: 'Notification Center' }]} />

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            Notification Center
          </h1>
          <p className="text-slate-500 text-sm">
            Configure reminder rules, monitor notification delivery metrics, and run system alerts.
          </p>
        </div>
        {activeTab === 'logs' && (
          <Button
            size="sm"
            variant="secondary"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={() => fetchLogsData(logsPagination.page)}
            isLoading={isLogsLoading}
          >
            Refresh Logs
          </Button>
        )}
      </div>

      <Card className="p-0 overflow-hidden border-slate-200 shadow-sm">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="bg-slate-50/50 px-4 pt-1" />

        <div className="p-6">
          {/* TAB 1: RULES CONFIGURATION */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              {isRulesLoading ? (
                <div className="space-y-4">
                  <div className="h-32 bg-slate-50 rounded-xl animate-pulse" />
                  <div className="h-32 bg-slate-50 rounded-xl animate-pulse" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {/* FEE REMINDER RULE CARD */}
                  <div className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          $
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-base">Fee Pending / Overdue Reminder</h3>
                          <p className="text-slate-500 text-xs font-medium">
                            Automatically triggers reminders to parents who have unpaid student fees.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                          <div className="flex items-center gap-3 mt-1.5">
                            <input
                              type="checkbox"
                              id="feesEnabled"
                              checked={feesEnabled}
                              onChange={e => setFeesEnabled(e.target.checked)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="feesEnabled" className="text-sm font-semibold text-slate-700 cursor-pointer">
                              {feesEnabled ? 'Rule Enabled' : 'Rule Disabled'}
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Cooldown Period (Hours)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={feesCooldown}
                            onChange={e => setFeesCooldown(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full max-w-[200px] border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700 mt-1"
                            disabled={!feesEnabled}
                          />
                          <p className="text-[10px] text-slate-400 italic">
                            Minimum hours required between reminders to the same parent.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Button
                        onClick={() => handleSaveRule('FEES_REMINDER')}
                        isLoading={savingRuleId === rules.find(r => r.type === 'FEES_REMINDER')?.id}
                        icon={<Check className="w-4 h-4" />}
                      >
                        Save Settings
                      </Button>
                    </div>
                  </div>

                  {/* ABSENCE REMINDER RULE CARD */}
                  <div className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition-shadow">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                          ⚠️
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-base">Repeated Absences Alert</h3>
                          <p className="text-slate-500 text-xs font-medium">
                            Notifies parents when a student accumulates multiple absences within a given lookback window.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
                          <div className="flex items-center gap-3 mt-1.5">
                            <input
                              type="checkbox"
                              id="absenceEnabled"
                              checked={absenceEnabled}
                              onChange={e => setAbsenceEnabled(e.target.checked)}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="absenceEnabled" className="text-sm font-semibold text-slate-700 cursor-pointer">
                              {absenceEnabled ? 'Rule Enabled' : 'Rule Disabled'}
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Cooldown Period (Hours)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={absenceCooldown}
                            onChange={e => setAbsenceCooldown(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700 mt-1"
                            disabled={!absenceEnabled}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Absences Threshold</label>
                          <input
                            type="number"
                            min="1"
                            value={absenceThreshold}
                            onChange={e => setAbsenceThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700 mt-1"
                            disabled={!absenceEnabled}
                          />
                          <p className="text-[10px] text-slate-400 italic">Total absences to trigger.</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lookback Window (Days)</label>
                          <input
                            type="number"
                            min="1"
                            value={absenceDays}
                            onChange={e => setAbsenceDays(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-700 mt-1"
                            disabled={!absenceEnabled}
                          />
                          <p className="text-[10px] text-slate-400 italic">Days range to scan absences.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Button
                        onClick={() => handleSaveRule('ATTENDANCE_ABSENCE_ALERT')}
                        isLoading={savingRuleId === rules.find(r => r.type === 'ATTENDANCE_ABSENCE_ALERT')?.id}
                        icon={<Check className="w-4 h-4" />}
                      >
                        Save Settings
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PAGINATED NOTIFICATION LOGS & FILTER GRID */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              {/* Summary Widgets */}
              {logSummary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Sent</p>
                    <p className="text-xl font-bold text-slate-800 mt-1">{logSummary.total}</p>
                  </div>
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Read Status</p>
                    <p className="text-xl font-bold text-emerald-700 mt-1">{logSummary.read} Read</p>
                  </div>
                  <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Unread Status</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">{logSummary.unread} Unread</p>
                  </div>
                  <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl">
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Active Rules</p>
                    <p className="text-xl font-bold text-purple-700 mt-1">{logSummary.activeRules} Enabled</p>
                  </div>
                </div>
              )}

              {/* Filters Block */}
              <div className="p-4 bg-slate-50/50 border border-slate-200 rounded-xl flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  Filter Logs
                </div>

                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none bg-white font-medium text-slate-600"
                >
                  <option value="">All Types</option>
                  <option value="FEES_REMINDER">Fees Reminders</option>
                  <option value="ATTENDANCE_ABSENCE_ALERT">Absence Alerts</option>
                  <option value="GENERAL">General Notifications</option>
                </select>

                <select
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none bg-white font-medium text-slate-600"
                >
                  <option value="">All Recipient Roles</option>
                  <option value="parent">Parent</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>

                <select
                  value={filterRead}
                  onChange={e => setFilterRead(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none bg-white font-medium text-slate-600"
                >
                  <option value="">All Read States</option>
                  <option value="true">Read Only</option>
                  <option value="false">Unread Only</option>
                </select>

                <select
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none bg-white font-medium text-slate-600"
                >
                  <option value="">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                {(filterType || filterRole || filterRead || filterPriority) && (
                  <button
                    onClick={() => {
                      setFilterType('');
                      setFilterRole('');
                      setFilterRead('');
                      setFilterPriority('');
                    }}
                    className="text-xs text-red-500 font-bold hover:underline"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Data Table */}
              <DataTable
                columns={columns}
                data={logs as any}
                isLoading={isLogsLoading}
                emptyMessage="No notification logs match the chosen filters."
                keyExtractor={(row: any) => row.id}
                pagination={{
                  page: logsPagination.page,
                  pages: logsPagination.pages,
                  total: logsPagination.total,
                  limit: logsPagination.limit,
                  onPageChange: (newPage) => fetchLogsData(newPage)
                }}
              />
            </div>
          )}

          {/* TAB 3: MANUAL SCAN RUNNER */}
          {activeTab === 'manual' && (
            <div className="max-w-2xl space-y-6">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base">Run Manual Notification reminder Scan</h3>
                    <p className="text-slate-500 text-xs leading-relaxed mt-1 font-medium">
                      Manually triggers the reminders engine to scan for overdue/pending school fees and repeated student absences.
                      Alerts will be dispatched immediately to parents if they meet configuration conditions and aren't blocked by cooldown limitations.
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 flex gap-2.5">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
                  <div>
                    <strong>Important Cooldown Notice:</strong>
                    <p className="mt-0.5 leading-relaxed">
                      Manual executions respect individual recipient cooldown durations configured in the rules tab. Parents who recently received notifications will be skipped to protect them from spam.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handleRunManualScan}
                    isLoading={isRunningScan}
                    icon={<Play className="w-4 h-4 fill-current" />}
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold"
                  >
                    Execute Reminder Scan Now
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* SCAN RESULTS MODAL */}
      <Modal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        title="Scan Execution Report"
      >
        {scanResult && (
          <div className="space-y-6 py-2">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800">
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-bold">Reminder Scan Finished Successfully</p>
                <p className="text-xs">All scans ran and notification batches have been processed.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fee Reminders Scan Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800 text-sm">Fee Pending Scan</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Scanned Invoices</span>
                    <span className="font-bold text-slate-800">{scanResult.feeReminderScan.scanned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Eligible Invoices</span>
                    <span className="font-bold text-slate-800">{scanResult.feeReminderScan.eligible ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Notifications Created</span>
                    <span className="font-bold text-emerald-600">{scanResult.feeReminderScan.created}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Skipped (Cooldown)</span>
                    <span className="font-bold text-amber-600">{scanResult.feeReminderScan.skippedCooldown}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Skipped (No Parent)</span>
                    <span className="font-bold text-slate-600">{scanResult.feeReminderScan.skippedNoParent}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-dashed border-slate-200">
                    <span className="text-slate-500 font-medium">Errors</span>
                    <span className={`font-bold ${scanResult.feeReminderScan.errors > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                      {scanResult.feeReminderScan.errors}
                    </span>
                  </div>
                </div>
              </div>

              {/* Attendance Absence Scan Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800 text-sm">Absence Alerts Scan</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Scanned Students</span>
                    <span className="font-bold text-slate-800">{scanResult.absenceReminderScan.scanned}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Threshold Crossed</span>
                    <span className="font-bold text-slate-800">{scanResult.absenceReminderScan.thresholdMet ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Notifications Created</span>
                    <span className="font-bold text-emerald-600">{scanResult.absenceReminderScan.created}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Skipped (Cooldown)</span>
                    <span className="font-bold text-amber-600">{scanResult.absenceReminderScan.skippedCooldown}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Skipped (No Parent)</span>
                    <span className="font-bold text-slate-600">{scanResult.absenceReminderScan.skippedNoParent}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-dashed border-slate-200">
                    <span className="text-slate-500 font-medium">Errors</span>
                    <span className={`font-bold ${scanResult.absenceReminderScan.errors > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                      {scanResult.absenceReminderScan.errors}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowScanModal(false)}>Close Summary</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
