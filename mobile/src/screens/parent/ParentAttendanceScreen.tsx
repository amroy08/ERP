import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { colors } from '../../constants/colors';
import { fetchParentAttendance } from '../../api/mobileApi';

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'holiday';
  studentName: string;
}

interface AttendanceSummary {
  studentName: string;
  attendancePercent: number;
  totalPresent: number;
  totalAbsent: number;
  totalDays: number;
  records: AttendanceRecord[];
}

const statusColor = (s: string) => {
  if (s === 'present') return colors.success;
  if (s === 'absent') return colors.danger;
  if (s === 'late') return colors.warning;
  return colors.mutedText;
};

const statusEmoji = (s: string) => {
  if (s === 'present') return '✅';
  if (s === 'absent') return '❌';
  if (s === 'late') return '⚠️';
  return '🏖';
};

export const ParentAttendanceScreen: React.FC = () => {
  const [data, setData] = useState<AttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await fetchParentAttendance();
      setData(res.data ?? res ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load attendance.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.parent} />}
      >
        <Text style={styles.pageTitle}>Children's Attendance</Text>

        {loading && <ActivityIndicator color={colors.parent} style={{ marginTop: 40 }} />}
        {error && !loading && <ErrorState error={error} onRetry={() => load(false)} roleTheme="parent" />}

        {!loading && data.map((child, ci) => (
          <View key={ci}>
            <AppCard style={styles.summaryCard}>
              <Text style={styles.childName}>{child.studentName}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: colors.success }]}>{child.totalPresent}</Text>
                  <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: colors.danger }]}>{child.totalAbsent}</Text>
                  <Text style={styles.statLabel}>Absent</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statVal, { color: child.attendancePercent >= 85 ? colors.success : colors.warning }]}>
                    {child.attendancePercent.toFixed(0)}%
                  </Text>
                  <Text style={styles.statLabel}>Rate</Text>
                </View>
              </View>
            </AppCard>
            {child.records?.slice(0, 15).map((rec, i) => (
              <AppCard key={i} style={styles.recordCard}>
                <View style={styles.recordRow}>
                  <Text style={styles.recordEmoji}>{statusEmoji(rec.status)}</Text>
                  <Text style={styles.recordDate}>
                    {new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                  </Text>
                  <Text style={[styles.recordStatus, { color: statusColor(rec.status) }]}>
                    {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                  </Text>
                </View>
              </AppCard>
            ))}
          </View>
        ))}
        {!loading && data.length === 0 && !error && (
          <EmptyState emoji="📅" title="No Attendance Records" subtitle="There are no attendance logs available for your children at this time." />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  pageTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 20 },
  summaryCard: { marginBottom: 12, borderColor: colors.parent + '44', borderWidth: 1 },
  childName: { color: colors.white, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.mutedText, fontSize: 11, marginTop: 2 },
  recordCard: { marginBottom: 6, paddingVertical: 10 },
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recordEmoji: { fontSize: 18 },
  recordDate: { color: colors.white, fontSize: 14, flex: 1 },
  recordStatus: { fontSize: 13, fontWeight: '700' },
  errorCard: { marginVertical: 16 },
  errorText: { color: colors.danger, fontSize: 14 },
  emptyText: { color: colors.mutedText, fontSize: 14 },
});

export default ParentAttendanceScreen;
