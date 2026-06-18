import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { fetchParentAttendance } from '../../api/mobileApi';
import { ParentScreenHeader } from '../../components/parent/ParentScreenHeader';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { StatusBadge } from '../../components/StatusBadge';

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

const statusBadgeType = (s: string): 'success' | 'danger' | 'warning' | 'info' => {
  if (s === 'present') return 'success';
  if (s === 'absent') return 'danger';
  if (s === 'late') return 'warning';
  return 'info';
};

export const ParentAttendanceScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<AttendanceSummary[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState<number>(0);
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

  const selectedChild = data[selectedChildIndex];

  // Calculate late count dynamically
  const totalLate = selectedChild?.records?.filter(r => r.status === 'late').length ?? 0;

  return (
    <ScreenContainer>
      <ParentScreenHeader
        title="Attendance Logs"
        subtitle={selectedChild ? `Viewing logs for ${selectedChild.studentName}` : undefined}
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.parent} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading && <ActivityIndicator color={colors.parent} style={{ marginTop: 40 }} />}
        {error && !loading && <ErrorState error={error} onRetry={() => load(false)} roleTheme="parent" />}

        {!loading && !error && data.length > 0 && (
          <>
            {/* Child Selector Switcher */}
            {data.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSwitcherScroll}>
                {data.map((child, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedChildIndex(index)}
                    activeOpacity={0.8}
                    style={[
                      styles.childPill,
                      selectedChildIndex === index && styles.childPillActive,
                    ]}
                  >
                    <Text style={[styles.childPillText, selectedChildIndex === index && styles.childPillTextActive]}>
                      👶  {child.studentName.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {selectedChild && (
              <View style={styles.childSection}>
                {/* Metrics Grid */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricsRow}>
                    <MetricCard
                      label="Present Days"
                      value={selectedChild.totalPresent}
                      color={colors.success}
                      iconName="checkmark-circle-outline"
                    />
                    <MetricCard
                      label="Absent Days"
                      value={selectedChild.totalAbsent}
                      color={colors.danger}
                      iconName="close-circle-outline"
                    />
                  </View>
                  <View style={styles.metricsRow}>
                    <MetricCard
                      label="Late Days"
                      value={totalLate}
                      color={colors.warning}
                      iconName="time-outline"
                    />
                    <MetricCard
                      label="Attendance Rate"
                      value={`${selectedChild.attendancePercent.toFixed(0)}%`}
                      color={selectedChild.attendancePercent >= 85 ? colors.success : colors.warning}
                      iconName="analytics-outline"
                    />
                  </View>
                </View>

                {/* History Log Card */}
                <AppCard style={styles.historyCard}>
                  <Text style={styles.historyTitle}>Recent Logs (Last 15 Days)</Text>
                  {selectedChild.records && selectedChild.records.length > 0 ? (
                    selectedChild.records.slice(0, 15).map((rec, i) => {
                      const isLast = i === Math.min(selectedChild.records.length, 15) - 1;
                      return (
                        <View key={i} style={[styles.recordRow, !isLast && styles.recordDivider]}>
                          <Text style={styles.recordDate}>
                            {new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                          </Text>
                          <StatusBadge
                            label={rec.status.toUpperCase()}
                            type={statusBadgeType(rec.status)}
                          />
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.noLogsText}>No attendance logs recorded for this child.</Text>
                  )}
                </AppCard>
              </View>
            )}
          </>
        )}

        {!loading && data.length === 0 && !error && (
          <EmptyState emoji="📅" title="No Attendance Records" subtitle="There are no attendance logs available for your children at this time." />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  childSwitcherScroll: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
  },
  childPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  childPillActive: {
    backgroundColor: colors.parentSoft,
    borderColor: colors.parent,
  },
  childPillText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '700',
  },
  childPillTextActive: {
    color: colors.parent,
  },
  childSection: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  metricsGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  historyCard: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  historyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  recordDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  recordDate: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  noLogsText: {
    color: colors.mutedText,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});

export default ParentAttendanceScreen;
