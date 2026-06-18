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
import { fetchTeacherDashboard } from '../../api/mobileApi';

// Sub-components
import { DashboardHero } from '../../components/dashboard/DashboardHero';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { QuickActionButton } from '../../components/dashboard/QuickActionButton';
import { TodayScheduleCard } from '../../components/dashboard/TodayScheduleCard';
import { NoticePreviewCard } from '../../components/dashboard/NoticePreviewCard';

interface TeacherClass {
  period: string;
  startTime: string;
  endTime: string;
  className: string;
  sectionName: string;
  subjectName: string;
}

interface PendingAttendance {
  classId: string;
  className: string;
  sectionName: string;
  date: string;
}

interface TeacherDashboardData {
  todayClasses: TeacherClass[];
  pendingAttendance: PendingAttendance[];
  totalStudentsCount: number;
  recentNotices: { id: string; title: string; priority: string; publishDate: string }[];
  upcomingExams: { id: string; title: string; date: string; className: string }[];
}

export const TeacherHomeScreen: React.FC = () => {
  const { user, school, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await fetchTeacherDashboard();
      const rawData = res.data ?? res;

      const todayClasses = (rawData.todayTimetable || []).map((entry: any) => ({
        period: entry.period || '1',
        startTime: entry.startTime,
        endTime: entry.endTime,
        className: entry.className,
        sectionName: entry.sectionName,
        subjectName: entry.subjectName,
      }));

      const pendingAttendance = (rawData.pendingAttendanceClasses || []).map((pa: any) => ({
        classId: pa.classId + '_' + pa.sectionId,
        className: pa.className,
        sectionName: pa.sectionName,
        date: new Date().toISOString(),
      }));

      const totalStudentsCount = rawData.quickStats?.totalStudents ?? 0;
      const recentNotices = (rawData.recentNotices || []).map((notice: any) => ({
        id: notice.id,
        title: notice.title,
        priority: notice.priority,
        publishDate: notice.publishDate,
      }));

      const upcomingExams = (rawData.upcomingExams || []).map((exam: any) => ({
        id: exam.id,
        title: exam.title,
        date: exam.date,
        className: exam.className,
      }));

      setData({
        todayClasses,
        pendingAttendance,
        totalStudentsCount,
        recentNotices,
        upcomingExams,
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

  const now = new Date();
  const timeGreeting =
    now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboard(true)}
            tintColor={colors.teacher}
          />
        }
      >
        {/* Curved Hero Banner */}
        <DashboardHero
          greeting={timeGreeting}
          name={user?.name ?? 'Teacher'}
          subText={school?.name}
          roleLabel="Teacher"
          roleType="teacher"
          gradientColors={gradients.heroTeacher}
        />

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.teacher} size="large" />
            <Text style={styles.loadingText}>Loading dashboard…</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.paddingWrapper}>
            <ErrorState error={error} onRetry={() => loadDashboard(false)} roleTheme="teacher" />
          </View>
        )}

        {data && !loading && (
          <View style={styles.contentContainer}>
            {/* Metric Cards Grid */}
            <View style={styles.metricsRow}>
              <MetricCard
                label="Classes Today"
                value={data.todayClasses.length}
                color={colors.teacher}
                iconName="calendar-outline"
                onPress={() => navigation.navigate('TeacherTimetable')}
              />
              <MetricCard
                label="Pending Attd"
                value={data.pendingAttendance.length}
                color={data.pendingAttendance.length > 0 ? colors.warning : colors.success}
                iconName="checkmark-circle-outline"
                onPress={() => navigation.navigate('TeacherAttendance')}
              />
              <MetricCard
                label="My Students"
                value={data.totalStudentsCount}
                color={colors.info}
                iconName="people-outline"
              />
            </View>

            {/* Quick Actions Grid */}
            <SectionHeader title="Quick Actions" />
            <View style={styles.actionGrid}>
              <View style={styles.actionRow}>
                <QuickActionButton
                  title="Take Attendance"
                  iconName="checkbox-outline"
                  color={colors.teacher}
                  onPress={() => navigation.navigate('TeacherAttendance')}
                />
                <QuickActionButton
                  title="Assign Homework"
                  iconName="book-outline"
                  color={colors.teacher}
                  onPress={() => navigation.navigate('TeacherHomework')}
                />
              </View>
              <View style={styles.actionRow}>
                <QuickActionButton
                  title="Enter Marks"
                  iconName="create-outline"
                  color={colors.teacher}
                  onPress={() => navigation.navigate('TeacherMarks')}
                />
                <QuickActionButton
                  title="School Notices"
                  iconName="megaphone-outline"
                  color={colors.teacher}
                  onPress={() => navigation.navigate('TeacherNotices')}
                />
              </View>
            </View>

            {/* Pending Attendance Alerts */}
            {data.pendingAttendance.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="⚠️  Attendance Not Marked" />
                {data.pendingAttendance.map((pa) => (
                  <AppCard
                    key={pa.classId}
                    style={styles.alertCard}
                    onPress={() => navigation.navigate('TeacherAttendance')}
                  >
                    <View style={styles.rowBetween}>
                      <View>
                        <Text style={styles.alertTitle}>
                          {pa.className} – {pa.sectionName}
                        </Text>
                        <Text style={styles.alertSub}>
                          {new Date(pa.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                          })}
                        </Text>
                      </View>
                      <View style={styles.markBadge}>
                        <Text style={styles.markBadgeText}>Mark Now</Text>
                      </View>
                    </View>
                  </AppCard>
                ))}
              </View>
            )}

            {/* Today's Schedule */}
            <View style={styles.section}>
              <SectionHeader title="Today's Classes" />
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
                    subText={`${cls.className} – ${cls.sectionName}`}
                    roleColor={colors.teacher}
                  />
                ))
              )}
            </View>

            {/* Recent School Notices */}
            {data.recentNotices.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="School Notices" />
                {data.recentNotices.slice(0, 3).map((notice) => (
                  <NoticePreviewCard
                    key={notice.id}
                    title={notice.title}
                    priority={notice.priority}
                    publishDate={notice.publishDate}
                    onPress={() => navigation.navigate('TeacherNotices')}
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
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionGrid: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  alertCard: {
    marginBottom: spacing.xs,
    borderColor: colors.warning + '55',
    borderWidth: 1,
  },
  alertTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
  },
  alertSub: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  markBadge: {
    backgroundColor: colors.warning + '15',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  markBadgeText: {
    color: colors.warning,
    ...typography.labelSmall,
    fontWeight: '700',
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

export default TeacherHomeScreen;
