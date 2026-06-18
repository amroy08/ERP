import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { TodayScheduleCard } from '../../components/dashboard/TodayScheduleCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { StudentScreenHeader } from '../../components/student/StudentScreenHeader';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { fetchStudentTimetable } from '../../api/mobileApi';

interface TimetableEntry {
  dayOfWeek: string;
  period: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName?: string;
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBR: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
};

const todayName = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

export const StudentTimetableScreen: React.FC = () => {
  const [data, setData] = useState<Record<string, TimetableEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeDay, setActiveDay] = useState(todayName());
  const tabScrollRef = useRef<ScrollView>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await fetchStudentTimetable();
      const entries: TimetableEntry[] = res.data ?? res ?? [];
      
      const grouped: Record<string, TimetableEntry[]> = {};
      entries.forEach((e) => {
        if (!grouped[e.dayOfWeek]) grouped[e.dayOfWeek] = [];
        grouped[e.dayOfWeek].push(e);
      });
      setData(grouped);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load timetable.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = todayName();
  const days = DAY_ORDER.filter((d) => Object.keys(data).length === 0 || Object.keys(data).includes(d));
  const activeDayEntries = data[activeDay] ?? [];
  const activePeriodCount = activeDayEntries.length;

  return (
    <ScreenContainer>
      <StudentScreenHeader
        title="My Timetable"
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        badge={activeDay === today ? `${activePeriodCount} Today` : undefined}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.student} />
        }
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.student} size="large" />
            <Text style={styles.loadingText}>Loading timetable…</Text>
          </View>
        )}
        {error && !loading && (
          <View style={styles.paddingWrapper}>
            <ErrorState error={error} onRetry={() => load(false)} roleTheme="student" />
          </View>
        )}

        {!loading && !error && (
          <>
            {/* Day Tab Strip */}
            <ScrollView
              ref={tabScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayTabRow}
              style={styles.dayTabScroll}
            >
              {days.map((day) => {
                const isActive = activeDay === day;
                const isToday = day === today;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayTab,
                      isActive && styles.dayTabActive,
                      !isActive && isToday && styles.dayTabToday,
                    ]}
                    onPress={() => setActiveDay(day)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.dayTabText,
                        isActive && styles.dayTabTextActive,
                        !isActive && isToday && styles.dayTabTextToday,
                      ]}
                    >
                      {DAY_ABBR[day] ?? day.slice(0, 3)}
                    </Text>
                    {isToday && <View style={[styles.todayDot, isActive && styles.todayDotActive]} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Today context banner */}
            {activeDay === today && activePeriodCount > 0 && (
              <View style={styles.todayBanner}>
                <Ionicons name="calendar" size={14} color={colors.student} />
                <Text style={styles.todayBannerText}>
                  Today's Schedule — {activePeriodCount} class{activePeriodCount !== 1 ? 'es' : ''}
                </Text>
              </View>
            )}

            {/* Period Cards */}
            <View style={styles.listContainer}>
              {activeDayEntries.length === 0 ? (
                <EmptyState
                  emoji="📅"
                  title="No Classes Scheduled"
                  subtitle={`You have no classes scheduled on ${activeDay}.`}
                />
              ) : (
                activeDayEntries.map((entry, i) => (
                  <TodayScheduleCard
                    key={i}
                    period={`P${entry.period}`}
                    subjectName={entry.subjectName}
                    timeRange={`${entry.startTime} – ${entry.endTime}`}
                    subText={entry.teacherName}
                    roleColor={colors.student}
                  />
                ))
              )}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.huge,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.mutedText,
    marginTop: spacing.sm,
  },
  paddingWrapper: {
    paddingHorizontal: spacing.xl,
  },
  dayTabScroll: {
    marginTop: spacing.md,
  },
  dayTabRow: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  dayTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    minWidth: 52,
  },
  dayTabActive: {
    backgroundColor: colors.student,
    borderColor: colors.student,
  },
  dayTabToday: {
    backgroundColor: colors.student + '12',
    borderColor: colors.student + '50',
  },
  dayTabText: {
    ...typography.labelSmall,
    color: colors.mutedText,
    fontWeight: '700',
  },
  dayTabTextActive: {
    color: colors.white,
  },
  dayTabTextToday: {
    color: colors.student,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.student,
    marginTop: 3,
  },
  todayDotActive: {
    backgroundColor: colors.white,
  },
  todayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.student + '10',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.student + '25',
  },
  todayBannerText: {
    ...typography.labelSmall,
    color: colors.student,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
});

export default StudentTimetableScreen;
