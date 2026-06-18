import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { SectionHeader } from '../../components/SectionHeader';
import { useAuth } from '../../store/AuthContext';
import { colors, gradients } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { shadows } from '../../constants/shadows';
import { fetchStudentDashboard } from '../../api/mobileApi';

// Sub-components
import { DashboardHero } from '../../components/dashboard/DashboardHero';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { TodayScheduleCard } from '../../components/dashboard/TodayScheduleCard';
import { NoticePreviewCard } from '../../components/dashboard/NoticePreviewCard';

interface TodayClass {
  period: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName?: string;
}

interface HomeworkItem {
  id: string;
  title: string;
  subjectName: string;
  dueDate: string;
  status: string;
}

interface ExamResult {
  id: string;
  examTitle: string;
  subjectName: string;
  marksObtained: number;
  totalMarks: number;
  grade?: string;
}

interface StudentDashboardData {
  attendancePercent: number;
  totalPresent: number;
  totalDays: number;
  todayClasses: TodayClass[];
  pendingHomework: HomeworkItem[];
  recentResults: ExamResult[];
  recentNotices: { id: string; title: string; priority: string; publishDate: string }[];
}

export const StudentHomeScreen: React.FC = () => {
  const { user, school, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await fetchStudentDashboard();
      const rawData = res.data ?? res;

      const attendancePercent = rawData.attendanceSummary?.percentage ?? 0;
      const totalPresent = rawData.attendanceSummary?.present ?? 0;
      const totalDays = rawData.attendanceSummary?.total ?? 0;

      const todayClasses = (rawData.todayTimetable || []).map((entry: any) => ({
        period: entry.period || '1',
        startTime: entry.startTime,
        endTime: entry.endTime,
        subjectName: entry.subject?.name || 'Subject',
        teacherName: entry.teacher?.user?.name,
      }));

      const pendingHomework = (rawData.pendingHomework || []).map((hw: any) => ({
        id: hw.id,
        title: hw.title,
        subjectName: hw.subject?.name || 'Subject',
        dueDate: hw.dueDate,
        status: hw.status || 'pending',
      }));

      const recentNotices = (rawData.notices || []).map((notice: any) => ({
        id: notice.id,
        title: notice.title,
        priority: notice.priority,
        publishDate: notice.publishDate,
      }));

      const recentResults: any[] = [];
      if (rawData.latestResult?.results) {
        for (const r of rawData.latestResult.results) {
          recentResults.push({
            id: r.id || Math.random().toString(),
            examTitle: rawData.latestResult.examName || 'Exam',
            subjectName: r.subjectName || r.subject?.name || 'Subject',
            marksObtained: r.marksObtained ?? 0,
            totalMarks: r.totalMarks ?? 100,
            grade: r.grade,
          });
        }
      }

      setData({
        attendancePercent,
        totalPresent,
        totalDays,
        todayClasses,
        pendingHomework,
        recentResults,
        recentNotices,
      });
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load dashboard. Pull to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const getGradeColor = (grade?: string) => {
    if (!grade) return colors.mutedText;
    if (['A+', 'A', 'O'].includes(grade)) return colors.success;
    if (['B+', 'B'].includes(grade)) return colors.info;
    if (['C', 'C+'].includes(grade)) return colors.warning;
    return colors.danger;
  };

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboard(true)}
            tintColor={colors.student}
          />
        }
      >
        {/* Curved Hero Banner */}
        <DashboardHero
          greeting="Hello,"
          name={user?.name ?? 'Student'}
          subText={school?.name}
          roleLabel="Student"
          roleType="student"
          gradientColors={gradients.heroStudent}
        />

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.student} size="large" />
            <Text style={styles.loadingText}>Loading your dashboard…</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.paddingWrapper}>
            <ErrorState error={error} onRetry={() => loadDashboard(false)} roleTheme="student" />
          </View>
        )}

        {data && !loading && (
          <View style={styles.contentContainer}>
            {/* Stat Cards Grid */}
            <View style={styles.statsRow}>
              <MetricCard
                label="Attendance"
                value={`${data.attendancePercent.toFixed(0)}%`}
                color={data.attendancePercent >= 85 ? colors.student : colors.warning}
                iconName="calendar-outline"
                onPress={() => navigation.navigate('StudentTimetable')}
              />
              <MetricCard
                label="Days Present"
                value={`${data.totalPresent}/${data.totalDays}`}
                color={colors.info}
                iconName="checkmark-circle-outline"
              />
              <MetricCard
                label="Pending HW"
                value={data.pendingHomework.length}
                color={data.pendingHomework.length > 0 ? colors.warning : colors.student}
                iconName="book-outline"
                onPress={() => navigation.navigate('StudentHomework')}
              />
            </View>

            {/* Today's Classes */}
            <View style={styles.section}>
              <SectionHeader title="Today's Schedule" />
              {data.todayClasses.length === 0 ? (
                <EmptyState
                  emoji="🎉"
                  title="No Classes Today"
                  subtitle="You have no classes scheduled for today!"
                />
              ) : (
                data.todayClasses.map((cls, i) => (
                  <TodayScheduleCard
                    key={i}
                    period={`P${cls.period}`}
                    subjectName={cls.subjectName}
                    timeRange={`${cls.startTime} - ${cls.endTime}`}
                    subText={cls.teacherName}
                    roleColor={colors.student}
                  />
                ))
              )}
            </View>

            {/* Pending Homework */}
            {data.pendingHomework.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Pending Homework" />
                {data.pendingHomework.slice(0, 4).map((hw) => (
                  <AppCard
                    key={hw.id}
                    style={styles.hwCard}
                    onPress={() => navigation.navigate('StudentHomework')}
                  >
                    <View style={styles.rowBetween}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.hwTitle}>{hw.title}</Text>
                        <Text style={styles.hwSub}>{hw.subjectName}</Text>
                      </View>
                      <View style={styles.dueDateBox}>
                        <Text style={styles.dueDateText}>
                          Due {new Date(hw.dueDate).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </Text>
                      </View>
                    </View>
                  </AppCard>
                ))}
              </View>
            )}

            {/* Recent Exam Results */}
            {data.recentResults.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Recent Exam Results" />
                {data.recentResults.slice(0, 4).map((result) => (
                  <AppCard
                    key={result.id}
                    style={styles.resultCard}
                    onPress={() => navigation.navigate('StudentExams')}
                  >
                    <View style={styles.rowBetween}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultTitle}>{result.examTitle}</Text>
                        <Text style={styles.resultSub}>{result.subjectName}</Text>
                      </View>
                      <View style={styles.scoreBox}>
                        <Text style={styles.scoreText}>
                          {result.marksObtained}/{result.totalMarks}
                        </Text>
                        {result.grade && (
                          <Text style={[styles.gradeText, { color: getGradeColor(result.grade) }]}>
                            Grade {result.grade}
                          </Text>
                        )}
                      </View>
                    </View>
                  </AppCard>
                ))}
              </View>
            )}

            {/* School Notices */}
            {data.recentNotices.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="School Notices" />
                {data.recentNotices.slice(0, 3).map((notice) => (
                  <NoticePreviewCard
                    key={notice.id}
                    title={notice.title}
                    priority={notice.priority}
                    publishDate={notice.publishDate}
                    onPress={() => navigation.navigate('StudentHome')}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.paddingWrapper}>
          <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.8}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.mutedText,
    marginTop: spacing.sm,
  },
  contentContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  paddingWrapper: {
    paddingHorizontal: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  hwCard: {
    marginBottom: spacing.xs,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hwTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
  },
  hwSub: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: 2,
  },
  dueDateBox: {
    backgroundColor: colors.warning + '15',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.warning + '50',
  },
  dueDateText: {
    color: colors.warning,
    ...typography.captionSmall,
    fontWeight: '700',
  },
  resultCard: {
    marginBottom: spacing.xs,
  },
  resultTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
  },
  resultSub: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: 2,
  },
  scoreBox: {
    alignItems: 'flex-end',
  },
  scoreText: {
    ...typography.label,
    color: colors.text,
    fontWeight: '800',
  },
  gradeText: {
    ...typography.captionSmall,
    fontWeight: '700',
    marginTop: 2,
  },
  signOutBtn: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.danger + '66',
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  signOutText: {
    color: colors.danger,
    ...typography.buttonMedium,
  },
});

export default StudentHomeScreen;
