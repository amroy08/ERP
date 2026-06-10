import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { colors } from '../../constants/colors';
import { fetchStudentHomework } from '../../api/mobileApi';

interface HomeworkItem {
  id: string;
  title: string;
  description?: string;
  subjectName: string;
  assignedDate: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
}

const statusColor = (s: string) => {
  if (s === 'submitted' || s === 'graded') return colors.success;
  const due = new Date(s);
  return colors.warning;
};

export const StudentHomeworkScreen: React.FC = () => {
  const [data, setData] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await fetchStudentHomework();
      setData(res.data ?? res ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load homework.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = data.filter((hw) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return hw.status === 'pending';
    if (filter === 'submitted') return hw.status === 'submitted' || hw.status === 'graded';
    return true;
  });

  const pendingCount = data.filter((hw) => hw.status === 'pending').length;

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.student} />}
      >
        <Text style={styles.pageTitle}>Homework</Text>

        {pendingCount > 0 && !loading && (
          <View style={styles.pendingAlert}>
            <Text style={styles.pendingAlertText}>📚  {pendingCount} assignment{pendingCount !== 1 ? 's' : ''} pending</Text>
          </View>
        )}

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['all', 'pending', 'submitted'] as const).map((f) => (
            <Text
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          ))}
        </View>

        {error && !loading && <ErrorState error={error} onRetry={() => load(false)} roleTheme="student" />}

        {!loading && filtered.map((hw) => {
          const isPending = hw.status === 'pending';
          const isDueClose = isPending && new Date(hw.dueDate) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
          return (
            <AppCard
              key={hw.id}
              style={[styles.hwCard, isDueClose ? { borderColor: colors.warning + '55', borderWidth: 1 } : undefined]}
              onPress={() => setExpanded(expanded === hw.id ? null : hw.id)}
            >
              <View style={styles.hwHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hwTitle}>{hw.title}</Text>
                  <Text style={styles.hwSub}>{hw.subjectName}</Text>
                </View>
                <View style={[styles.statusBadge, {
                  backgroundColor: (hw.status === 'pending' ? colors.warning : colors.success) + '22',
                  borderColor: hw.status === 'pending' ? colors.warning : colors.success,
                }]}>
                  <Text style={[styles.statusText, { color: hw.status === 'pending' ? colors.warning : colors.success }]}>
                    {hw.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.dueText}>
                Due: {new Date(hw.dueDate).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
              </Text>
              {expanded === hw.id && hw.description && (
                <Text style={styles.descText}>{hw.description}</Text>
              )}
            </AppCard>
          );
        })}

        {!loading && filtered.length === 0 && !error && (
          <EmptyState
            emoji="📚"
            title={filter === 'pending' ? 'No Pending Homework' : 'No Homework Found'}
            subtitle={filter === 'pending' ? 'You are all caught up on your assignments!' : 'No homework entries match the active filter.'}
          />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  pageTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 12 },
  pendingAlert: {
    backgroundColor: colors.warning + '18', borderRadius: 12, borderWidth: 1,
    borderColor: colors.warning + '44', padding: 12, marginBottom: 12,
  },
  pendingAlertText: { color: colors.warning, fontSize: 13, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterPill: {
    color: colors.mutedText, fontSize: 12, fontWeight: '700',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: colors.borderSoft, overflow: 'hidden',
  },
  filterPillActive: { backgroundColor: colors.student + '22', borderColor: colors.student, color: colors.student },
  hwCard: { marginBottom: 8 },
  hwHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  hwTitle: { color: colors.white, fontSize: 15, fontWeight: '700' },
  hwSub: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  dueText: { color: colors.mutedText, fontSize: 12 },
  descText: { color: colors.border, fontSize: 14, lineHeight: 20, marginTop: 8 },
  errorCard: { marginVertical: 16 },
  errorText: { color: colors.danger, fontSize: 14 },
  emptyText: { color: colors.mutedText, fontSize: 14 },
});

export default StudentHomeworkScreen;
