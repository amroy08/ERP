import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { colors } from '../../constants/colors';
import {
  fetchParentDashboard,
  getParentChildTimetable,
  getParentChildHomework,
  getParentChildExams,
  getParentChildResults,
} from '../../api/mobileApi';
import {
  HomeworkItem,
  ExamScheduleItem,
  ExamResultItem,
} from '../../types/mobile.types';

interface ChildSummary {
  id: string;
  name: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
}

interface TimetableEntry {
  dayOfWeek: string;
  period: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName?: string;
}

type TabType = 'timetable' | 'homework' | 'exams' | 'results';

const TIMETABLE_DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getTodayDayName = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

const getGradeColor = (grade?: string) => {
  if (!grade) return colors.mutedText;
  if (['O', 'A+', 'A'].includes(grade)) return colors.success;
  if (['B+', 'B'].includes(grade)) return colors.info;
  if (['C+', 'C'].includes(grade)) return colors.warning;
  return colors.danger;
};

export const ParentAcademicsScreen: React.FC = () => {
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('timetable');

  const [timetableData, setTimetableData] = useState<Record<string, TimetableEntry[]>>({});
  const [activeTimetableDay, setActiveTimetableDay] = useState(getTodayDayName());

  const [homeworkData, setHomeworkData] = useState<HomeworkItem[]>([]);
  const [homeworkFilter, setHomeworkFilter] = useState<'all' | 'pending' | 'submitted'>('all');
  const [expandedHomeworkId, setExpandedHomeworkId] = useState<string | null>(null);

  const [examsData, setExamsData] = useState<ExamScheduleItem[]>([]);
  const [resultsData, setResultsData] = useState<ExamResultItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [subLoading, setSubLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // 1. Initial load - fetch children
  const loadChildren = useCallback(async () => {
    try {
      const res = await fetchParentDashboard();
      const rawData = res.data ?? res;
      const parsedChildren = (rawData.children || []).map((child: any) => ({
        id: child.id,
        name: child.name,
        admissionNumber: child.admissionNo,
        className: child.className,
        sectionName: child.sectionName,
      }));

      setChildren(parsedChildren);
      if (parsedChildren.length > 0) {
        setSelectedChildId(parsedChildren[0].id);
      } else {
        setLoading(false);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load child profiles.');
      setLoading(false);
    }
  }, []);

  // 2. Fetch specific tab data for selected child
  const loadAcademicsData = useCallback(async (childId: string, tab: TabType, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setSubLoading(true);
    setError('');

    try {
      if (tab === 'timetable') {
        const res = await getParentChildTimetable(childId);
        const entries: TimetableEntry[] = res.data ?? res ?? [];
        const grouped: Record<string, TimetableEntry[]> = {};
        entries.forEach((e) => {
          if (!grouped[e.dayOfWeek]) grouped[e.dayOfWeek] = [];
          grouped[e.dayOfWeek].push(e);
        });
        setTimetableData(grouped);
        // Reset active day if it isn't in the returned dataset
        const days = TIMETABLE_DAY_ORDER.filter((d) => Object.keys(grouped).includes(d));
        if (days.length > 0 && !days.includes(activeTimetableDay)) {
          setActiveTimetableDay(days[0]);
        }
      } else if (tab === 'homework') {
        const res = await getParentChildHomework(childId);
        setHomeworkData(res.data ?? res ?? []);
      } else if (tab === 'exams') {
        const res = await getParentChildExams(childId);
        setExamsData(res.data ?? res ?? []);
      } else if (tab === 'results') {
        const res = await getParentChildResults(childId);
        setResultsData(res.data ?? res ?? []);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? `Failed to load ${tab} data.`);
    } finally {
      setLoading(false);
      setSubLoading(false);
      setRefreshing(false);
    }
  }, [activeTimetableDay]);

  // Handle switching child or tab
  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    if (selectedChildId) {
      loadAcademicsData(selectedChildId, activeTab);
    }
  }, [selectedChildId, activeTab, loadAcademicsData]);

  const onRefresh = () => {
    if (selectedChildId) {
      loadAcademicsData(selectedChildId, activeTab, true);
    } else {
      loadChildren();
    }
  };

  const selectedChild = children.find(c => c.id === selectedChildId);

  // Homework calculations
  const filteredHomework = homeworkData.filter((hw) => {
    if (homeworkFilter === 'all') return true;
    if (homeworkFilter === 'pending') return hw.status === 'pending';
    if (homeworkFilter === 'submitted') return hw.status === 'submitted' || hw.status === 'graded';
    return true;
  });
  const pendingHwCount = homeworkData.filter((hw) => hw.status === 'pending').length;

  // Timetable calculations
  const timetableDays = TIMETABLE_DAY_ORDER.filter((d) => Object.keys(timetableData).includes(d));
  const activeDayEntries = timetableData[activeTimetableDay] ?? [];

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.parent} />
        }
      >
        <Text style={styles.pageTitle}>Academics</Text>

        {/* Child Selector Switcher (Horizontal scroll of children pills if > 1) */}
        {children.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSwitcherScroll}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                onPress={() => setSelectedChildId(child.id)}
                activeOpacity={0.8}
                style={[
                  styles.childPill,
                  selectedChildId === child.id && styles.childPillActive,
                ]}
              >
                <Text style={[styles.childPillText, selectedChildId === child.id && styles.childPillTextActive]}>
                  👶  {child.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Selected Child Subtitle */}
        {selectedChild && (
          <Text style={styles.childSubtitle}>
            Viewing details for: <Text style={{ fontWeight: '700', color: colors.text }}>{selectedChild.name}</Text> ({selectedChild.className} - {selectedChild.sectionName})
          </Text>
        )}

        {/* Sub-tab Selectors (Timetable, Homework, Exams, Results) */}
        <View style={styles.tabBar}>
          {(['timetable', 'homework', 'exams', 'results'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
              style={[
                styles.tabItem,
                activeTab === tab && styles.tabItemActive,
              ]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.parent} size="large" />
            <Text style={styles.loadingText}>Loading profiles…</Text>
          </View>
        )}

        {error && !loading && (
          <ErrorState error={error} onRetry={onRefresh} roleTheme="parent" />
        )}

        {subLoading && !loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.parent} size="large" />
            <Text style={styles.loadingText}>Loading {activeTab}…</Text>
          </View>
        )}

        {/* Tab content areas */}
        {!loading && !subLoading && !error && selectedChildId && (
          <View style={styles.contentContainer}>
            {/* 1. TIMETABLE TAB */}
            {activeTab === 'timetable' && (
              <>
                {/* Timetable Days bar */}
                {timetableDays.length > 0 ? (
                  <>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayTabsScroll}>
                      {timetableDays.map((day) => (
                        <Text
                          key={day}
                          onPress={() => setActiveTimetableDay(day)}
                          style={[
                            styles.dayTab,
                            activeTimetableDay === day && styles.dayTabActive,
                            day === getTodayDayName() && { borderColor: colors.parent + '55' },
                          ]}
                        >
                          {day.slice(0, 3)}
                          {day === getTodayDayName() ? ' •' : ''}
                        </Text>
                      ))}
                    </ScrollView>

                    {activeDayEntries.length === 0 ? (
                      <EmptyState emoji="📅" title="No Classes Scheduled" subtitle={`No academic classes scheduled on ${activeTimetableDay}.`} />
                    ) : (
                      activeDayEntries.map((entry, i) => (
                        <AppCard key={i} style={styles.card}>
                          <View style={styles.timetableRow}>
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
                ) : (
                  <EmptyState emoji="📅" title="No Timetable Released" subtitle="No active timetable exists for this child's class and section." />
                )}
              </>
            )}

            {/* 2. HOMEWORK TAB */}
            {activeTab === 'homework' && (
              <>
                {pendingHwCount > 0 && (
                  <View style={styles.pendingAlert}>
                    <Text style={styles.pendingAlertText}>📚  {pendingHwCount} assignment{pendingHwCount !== 1 ? 's' : ''} pending</Text>
                  </View>
                )}

                {/* Homework Filter Pills */}
                <View style={styles.filterRow}>
                  {(['all', 'pending', 'submitted'] as const).map((f) => (
                    <Text
                      key={f}
                      onPress={() => setHomeworkFilter(f)}
                      style={[styles.filterPill, homeworkFilter === f && styles.filterPillActive]}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  ))}
                </View>

                {filteredHomework.length === 0 ? (
                  <EmptyState
                    emoji="📚"
                    title={homeworkFilter === 'pending' ? 'No Pending Homework' : 'No Homework Found'}
                    subtitle={homeworkFilter === 'pending' ? 'Your child has no pending homework assignments!' : 'No homework records exist.'}
                  />
                ) : (
                  filteredHomework.map((hw) => {
                    const isPending = hw.status === 'pending';
                    const isDueClose = isPending && new Date(hw.dueDate) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
                    return (
                      <AppCard
                        key={hw.id}
                        style={[styles.card, isDueClose ? { borderColor: colors.warning + '55', borderWidth: 1 } : undefined]}
                        onPress={() => setExpandedHomeworkId(expandedHomeworkId === hw.id ? null : hw.id)}
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
                        {expandedHomeworkId === hw.id && hw.description && (
                          <Text style={styles.descText}>{hw.description}</Text>
                        )}
                      </AppCard>
                    );
                  })
                )}
              </>
            )}

            {/* 3. EXAMS TAB */}
            {activeTab === 'exams' && (
              <>
                {examsData.length === 0 ? (
                  <EmptyState emoji="📝" title="No Upcoming Exams" subtitle="No upcoming exam papers scheduled for this class." />
                ) : (
                  examsData.map((exam) => {
                    const examDate = new Date(exam.date);
                    const daysLeft = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    return (
                      <AppCard key={exam.id} style={[styles.card, daysLeft <= 3 ? { borderColor: colors.danger + '55', borderWidth: 1 } : undefined]}>
                        <View style={styles.rowBetween}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.examTitle}>{exam.title}</Text>
                            <Text style={styles.examSub}>{exam.subjectName}</Text>
                            {exam.startTime && <Text style={styles.examMeta}>🕐 {exam.startTime}</Text>}
                          </View>
                          <View style={styles.dateBlock}>
                            <Text style={styles.dateDay}>{examDate.getDate()}</Text>
                            <Text style={styles.dateMonth}>{examDate.toLocaleDateString('en-IN', { month: 'short' })}</Text>
                            {daysLeft > 0 && (
                              <Text style={[styles.daysLeft, { color: daysLeft <= 3 ? colors.danger : colors.mutedText }]}>
                                {daysLeft}d left
                              </Text>
                            )}
                          </View>
                        </View>
                        <Text style={styles.marksTotal}>Total Marks: {exam.totalMarks}</Text>
                      </AppCard>
                    );
                  })
                )}
              </>
            )}

            {/* 4. RESULTS TAB */}
            {activeTab === 'results' && (
              <>
                {resultsData.length === 0 ? (
                  <EmptyState emoji="📊" title="No Results Yet" subtitle="No exams result sheets or grades published for this child." />
                ) : (
                  resultsData.map((result) => {
                    const pct = result.percentage ?? ((result.marksObtained / result.totalMarks) * 100);
                    return (
                      <AppCard key={result.id} style={styles.card}>
                        <View style={styles.rowBetween}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.examTitle}>{result.examTitle}</Text>
                            <Text style={styles.examSub}>{result.subjectName}</Text>
                          </View>
                          {result.grade && (
                            <View style={[styles.gradeBadge, { borderColor: getGradeColor(result.grade) + '88', backgroundColor: getGradeColor(result.grade) + '18' }]}>
                              <Text style={[styles.gradeText, { color: getGradeColor(result.grade) }]}>{result.grade}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.scoreRow}>
                          <Text style={styles.scoreText}>
                            {result.marksObtained} / {result.totalMarks}
                          </Text>
                          <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, {
                              width: `${Math.min(pct, 100)}%` as any,
                              backgroundColor: pct >= 75 ? colors.success : pct >= 50 ? colors.warning : colors.danger,
                            }]} />
                          </View>
                          <Text style={styles.pctText}>{pct.toFixed(0)}%</Text>
                        </View>
                      </AppCard>
                    );
                  })
                )}
              </>
            )}
          </View>
        )}

        {children.length === 0 && !loading && !error && (
          <EmptyState emoji="👶" title="No Children" subtitle="There are no child records linked to this parent account." />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  pageTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 12 },
  childSubtitle: { color: colors.mutedText, fontSize: 13, marginBottom: 16 },
  childSwitcherScroll: { marginBottom: 16, flexDirection: 'row' },
  childPill: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    marginRight: 8, backgroundColor: colors.background,
  },
  childPillActive: {
    backgroundColor: colors.parent + '22',
    borderColor: colors.parent,
  },
  childPillText: { color: colors.mutedText, fontSize: 13, fontWeight: '700' },
  childPillTextActive: { color: colors.parent },
  tabBar: { flexDirection: 'row', gap: 6, backgroundColor: colors.surfaceSoft, borderRadius: 12, padding: 4, marginBottom: 16 },
  tabItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabItemActive: { backgroundColor: colors.surface, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  tabText: { color: colors.mutedText, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tabTextActive: { color: colors.parent },
  centered: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: colors.mutedText, marginTop: 12, fontSize: 14 },
  contentContainer: { marginTop: 4 },
  dayTabsScroll: { marginBottom: 12 },
  dayTab: {
    color: colors.mutedText, fontSize: 13, fontWeight: '700',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    marginRight: 8, overflow: 'hidden',
  },
  dayTabActive: { backgroundColor: colors.parent + '22', borderColor: colors.parent, color: colors.parent },
  card: { marginBottom: 8 },
  timetableRow: { flexDirection: 'row', alignItems: 'stretch', gap: 14 },
  timeBlock: { alignItems: 'center', width: 48 },
  startTime: { color: colors.mutedText, fontSize: 11, fontWeight: '600' },
  timeLine: { flex: 1, width: 1, backgroundColor: colors.border, marginVertical: 4 },
  endTime: { color: colors.mutedText, fontSize: 11, fontWeight: '600' },
  subjectBlock: { flex: 1, justifyContent: 'center' },
  periodPill: {
    backgroundColor: colors.parent + '22', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4,
  },
  periodText: { color: colors.parent, fontSize: 10, fontWeight: '700' },
  subjectName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  teacherName: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  pendingAlert: {
    backgroundColor: colors.warning + '18', borderRadius: 12, borderWidth: 1,
    borderColor: colors.warning + '44', padding: 12, marginBottom: 12,
  },
  pendingAlertText: { color: colors.warning, fontSize: 13, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterPill: {
    color: colors.mutedText, fontSize: 12, fontWeight: '700',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  filterPillActive: { backgroundColor: colors.parent + '22', borderColor: colors.parent, color: colors.parent },
  hwHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  hwTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  hwSub: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  dueText: { color: colors.mutedText, fontSize: 12 },
  descText: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  examTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  examSub: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  examMeta: { color: colors.mutedText, fontSize: 12, marginTop: 4 },
  dateBlock: { alignItems: 'center', marginLeft: 12 },
  dateDay: { color: colors.text, fontSize: 24, fontWeight: '800' },
  dateMonth: { color: colors.mutedText, fontSize: 11 },
  daysLeft: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  marksTotal: { color: colors.mutedText, fontSize: 12, marginTop: 8 },
  gradeBadge: { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 6 },
  gradeText: { fontSize: 18, fontWeight: '800' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  scoreText: { color: colors.text, fontSize: 14, fontWeight: '700', minWidth: 60 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, borderRadius: 3 },
  pctText: { color: colors.mutedText, fontSize: 12, minWidth: 36, textAlign: 'right' },
});

export default ParentAcademicsScreen;
