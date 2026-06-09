import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { colors } from '../../constants/colors';
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

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await fetchStudentTimetable();
      const entries: TimetableEntry[] = res.data ?? res ?? [];
      // Group by day
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

  const days = DAY_ORDER.filter((d) => Object.keys(data).includes(d));
  const activeDayEntries = data[activeDay] ?? [];

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.student} />}
      >
        <Text style={styles.pageTitle}>My Timetable</Text>

        {loading && <ActivityIndicator color={colors.student} style={{ marginTop: 40 }} />}
        {error && !loading && <AppCard style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></AppCard>}

        {!loading && !error && (
          <>
            {/* Day Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabsScroll}>
              {days.map((day) => (
                <Text
                  key={day}
                  onPress={() => setActiveDay(day)}
                  style={[
                    styles.dayTab,
                    activeDay === day && styles.dayTabActive,
                    day === todayName() && { borderColor: colors.student + '55' },
                  ]}
                >
                  {day.slice(0, 3)}
                  {day === todayName() ? ' •' : ''}
                </Text>
              ))}
            </ScrollView>

            {activeDayEntries.length === 0 ? (
              <AppCard style={{ marginTop: 12 }}>
                <Text style={styles.emptyText}>No classes on {activeDay}.</Text>
              </AppCard>
            ) : (
              activeDayEntries.map((entry, i) => (
                <AppCard key={i} style={styles.entryCard}>
                  <View style={styles.entryRow}>
                    <View style={styles.timeBlock}>
                      <Text style={styles.startTime}>{entry.startTime}</Text>
                      <View style={styles.timeLine} />
                      <Text style={styles.endTime}>{entry.endTime}</Text>
                    </View>
                    <View style={styles.subjectBlock}>
                      <View style={styles.periodPill}>
                        <Text style={styles.periodText}>Period {entry.period}</Text>
                      </View>
                      <Text style={styles.subjectName}>{entry.subjectName}</Text>
                      {entry.teacherName && <Text style={styles.teacherName}>{entry.teacherName}</Text>}
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
  pageTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 52, marginBottom: 16 },
  dayTabsScroll: { marginBottom: 8 },
  dayTab: {
    color: colors.mutedText, fontSize: 13, fontWeight: '700',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: colors.borderSoft,
    marginRight: 8, overflow: 'hidden',
  },
  dayTabActive: { backgroundColor: colors.student + '22', borderColor: colors.student, color: colors.student },
  entryCard: { marginBottom: 8 },
  entryRow: { flexDirection: 'row', alignItems: 'stretch', gap: 14 },
  timeBlock: { alignItems: 'center', width: 48 },
  startTime: { color: colors.mutedText, fontSize: 11, fontWeight: '600' },
  timeLine: { flex: 1, width: 1, backgroundColor: colors.borderSoft, marginVertical: 4 },
  endTime: { color: colors.mutedText, fontSize: 11, fontWeight: '600' },
  subjectBlock: { flex: 1, justifyContent: 'center' },
  periodPill: {
    backgroundColor: colors.student + '22', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4,
  },
  periodText: { color: colors.student, fontSize: 10, fontWeight: '700' },
  subjectName: { color: colors.white, fontSize: 16, fontWeight: '700' },
  teacherName: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  errorCard: { marginVertical: 16 },
  errorText: { color: colors.danger, fontSize: 14 },
  emptyText: { color: colors.mutedText, fontSize: 14 },
});

export default StudentTimetableScreen;
