import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { colors } from '../../constants/colors';
import { fetchTeacherTimetable } from '../../api/mobileApi';

interface TimetableEntry {
  dayOfWeek: string;
  period: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  className: string;
  sectionName: string;
}

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const todayName = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

export const TeacherTimetableScreen: React.FC = () => {
  const [data, setData] = useState<Record<string, TimetableEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [activeDay, setActiveDay] = useState(todayName());

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await fetchTeacherTimetable();
      const grouped: Record<string, TimetableEntry[]> = {};
      const rawDays = res.data?.days ?? res?.days ?? [];
      rawDays.forEach((d: any) => {
        const dayName = d.day;
        grouped[dayName] = (d.periods || []).map((p: any) => ({
          dayOfWeek: dayName,
          period: p.period || '1',
          startTime: p.startTime,
          endTime: p.endTime,
          subjectName: p.subjectName,
          className: p.className,
          sectionName: p.sectionName,
        }));
      });
      setData(grouped);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load timetable.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const days = DAY_ORDER.filter((d) => Object.keys(data).includes(d));
  const activeDayEntries = data[activeDay] ?? [];

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.teacher} />}
      >
        <Text style={styles.pageTitle}>My Timetable</Text>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.teacher} size="large" />
            <Text style={styles.loadingText}>Loading timetable…</Text>
          </View>
        )}
        {error && !loading && <ErrorState error={error} onRetry={() => load(false)} roleTheme="teacher" />}

        {!loading && !error && (
          <>
            {/* Day Tab Row */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScrollRow}>
              {(days.length > 0 ? days : DAY_ORDER).map((day) => (
                <Text
                  key={day}
                  onPress={() => setActiveDay(day)}
                  style={[
                    styles.dayTab,
                    activeDay === day && styles.dayTabActive,
                    day === todayName() && { borderColor: colors.teacher + '55' },
                  ]}
                >
                  {day.slice(0, 3)}{day === todayName() ? ' •' : ''}
                </Text>
              ))}
            </ScrollView>

            {activeDayEntries.length === 0 ? (
              <EmptyState emoji="📅" title="No Classes Scheduled" subtitle={`You have no classes scheduled on ${activeDay}.`} />
            ) : (
              activeDayEntries.map((entry, i) => (
                <AppCard key={i} style={styles.entryCard}>
                  <View style={styles.entryRow}>
                    <View style={styles.timeBlock}>
                      <Text style={styles.timeText}>{entry.startTime}</Text>
                      <View style={styles.timeLine} />
                      <Text style={styles.timeText}>{entry.endTime}</Text>
                    </View>
                    <View style={styles.classBlock}>
                      <View style={styles.periodPill}>
                        <Text style={styles.periodText}>Period {entry.period}</Text>
                      </View>
                      <Text style={styles.subjectName}>{entry.subjectName}</Text>
                      <Text style={styles.classMeta}>{entry.className} – {entry.sectionName}</Text>
                    </View>
                  </View>
                </AppCard>
              ))
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  pageTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 16 },
  dayScrollRow: { marginBottom: 8 },
  dayTab: {
    color: colors.mutedText, fontSize: 13, fontWeight: '700',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    marginRight: 8, overflow: 'hidden',
  },
  dayTabActive: { backgroundColor: colors.teacher + '22', borderColor: colors.teacher, color: colors.teacher },
  entryCard: { marginBottom: 8 },
  entryRow: { flexDirection: 'row', alignItems: 'stretch', gap: 14 },
  timeBlock: { alignItems: 'center', width: 50 },
  timeText: { color: colors.mutedText, fontSize: 11, fontWeight: '600' },
  timeLine: { flex: 1, width: 1, backgroundColor: colors.border, marginVertical: 4 },
  classBlock: { flex: 1, justifyContent: 'center' },
  periodPill: {
    backgroundColor: colors.teacher + '22', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4,
  },
  periodText: { color: colors.teacher, fontSize: 10, fontWeight: '700' },
  subjectName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  classMeta: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  errorCard: { marginVertical: 16 },
  errorText: { color: colors.danger, fontSize: 14 },
  emptyText: { color: colors.mutedText, fontSize: 14 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { color: colors.mutedText, marginTop: 12, fontSize: 14 },
});

export default TeacherTimetableScreen;
