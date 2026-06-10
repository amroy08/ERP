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
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { useAuth } from '../../store/AuthContext';
import { colors } from '../../constants/colors';
import { fetchStudentDashboard } from '../../api/mobileApi';

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

const StatCard: React.FC<{ label: string; value: string | number; color: string; emoji: string }> = ({
  label, value, color, emoji,
}) => (
  <View style={[styles.statCard, { borderColor: color + '44', backgroundColor: color + '11' }]}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const StudentHomeScreen: React.FC = () => {
  const { user, school, signOut } = useAuth();
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
      setData(res.data ?? res);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load dashboard. Pull to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.name}>{user?.name ?? 'Student'}</Text>
            {school && <Text style={styles.schoolName}>{school.name}</Text>}
          </View>
          <StatusBadge label="Student" type="student" />
        </View>

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.student} size="large" />
            <Text style={styles.loadingText}>Loading your dashboard…</Text>
          </View>
        )}

        {error && !loading && (
          <ErrorState error={error} onRetry={() => loadDashboard(false)} roleTheme="student" />
        )}

        {data && !loading && (
          <>
            {/* Stat Cards */}
            <View style={styles.statsRow}>
              <StatCard
                label="Attendance"
                value={`${data.attendancePercent.toFixed(0)}%`}
                color={data.attendancePercent >= 85 ? colors.success : colors.warning}
                emoji="📅"
              />
              <StatCard
                label="Days Present"
                value={`${data.totalPresent}/${data.totalDays}`}
                color={colors.info}
                emoji="✅"
              />
              <StatCard
                label="Pending HW"
                value={data.pendingHomework.length}
                color={data.pendingHomework.length > 0 ? colors.warning : colors.success}
                emoji="📚"
              />
            </View>

            {/* Today's Classes */}
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            {data.todayClasses.length === 0 ? (
              <AppCard>
                <Text style={styles.emptyText}>🎉 No classes today!</Text>
              </AppCard>
            ) : (
              data.todayClasses.map((cls, i) => (
                <AppCard key={i} style={styles.classCard}>
                  <View style={styles.classRow}>
                    <View style={styles.periodBox}>
                      <Text style={styles.periodText}>P{cls.period}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subjectName}>{cls.subjectName}</Text>
                      {cls.teacherName && (
                        <Text style={styles.teacherName}>{cls.teacherName}</Text>
                      )}
                    </View>
                    <Text style={styles.classTime}>
                      {cls.startTime} – {cls.endTime}
                    </Text>
                  </View>
                </AppCard>
              ))
            )}

            {/* Pending Homework */}
            {data.pendingHomework.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Pending Homework</Text>
                {data.pendingHomework.slice(0, 4).map((hw) => (
                  <AppCard key={hw.id} style={styles.hwCard}>
                    <View style={styles.rowBetween}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.hwTitle}>{hw.title}</Text>
                        <Text style={styles.hwSub}>{hw.subjectName}</Text>
                      </View>
                      <View style={styles.dueDateBox}>
                        <Text style={styles.dueDateText}>
                          Due {new Date(hw.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </Text>
                      </View>
                    </View>
                  </AppCard>
                ))}
              </>
            )}

            {/* Recent Results */}
            {data.recentResults.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Recent Exam Results</Text>
                {data.recentResults.slice(0, 4).map((result) => (
                  <AppCard key={result.id} style={styles.resultCard}>
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
                            {result.grade}
                          </Text>
                        )}
                      </View>
                    </View>
                  </AppCard>
                ))}
              </>
            )}

            {/* Recent Notices */}
            {data.recentNotices.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>School Notices</Text>
                {data.recentNotices.slice(0, 3).map((notice) => (
                  <AppCard key={notice.id} style={styles.noticeCard}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.noticeTitle}>{notice.title}</Text>
                      <StatusBadge
                        label={notice.priority}
                        type={notice.priority === 'urgent' ? 'danger' : 'info'}
                      />
                    </View>
                    <Text style={styles.noticeMeta}>
                      {new Date(notice.publishDate).toLocaleDateString('en-IN')}
                    </Text>
                  </AppCard>
                ))}
              </>
            )}
          </>
        )}

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 16,
    marginBottom: 24,
  },
  greeting: { color: colors.mutedText, fontSize: 15 },
  name: { color: colors.white, fontSize: 26, fontWeight: '800' },
  schoolName: { color: colors.student, fontSize: 13, marginTop: 3, fontWeight: '600' },
  centered: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: colors.mutedText, marginTop: 12, fontSize: 14 },
  errorCard: { marginVertical: 16 },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.mutedText, fontSize: 10, textAlign: 'center', marginTop: 2 },
  sectionTitle: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  classCard: { marginBottom: 8 },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  periodBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.student + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  periodText: { color: colors.student, fontSize: 12, fontWeight: '800' },
  subjectName: { color: colors.white, fontSize: 15, fontWeight: '700' },
  teacherName: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  classTime: { color: colors.mutedText, fontSize: 11 },
  hwCard: { marginBottom: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hwTitle: { color: colors.white, fontSize: 14, fontWeight: '600' },
  hwSub: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  dueDateBox: {
    backgroundColor: colors.warning + '22',
    borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: colors.warning + '55',
  },
  dueDateText: { color: colors.warning, fontSize: 11, fontWeight: '700' },
  resultCard: { marginBottom: 8 },
  resultTitle: { color: colors.white, fontSize: 14, fontWeight: '600' },
  resultSub: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  scoreBox: { alignItems: 'flex-end' },
  scoreText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  gradeText: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  noticeCard: { marginBottom: 8 },
  noticeTitle: { color: colors.white, fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 },
  noticeMeta: { color: colors.mutedText, fontSize: 12, marginTop: 4 },
  emptyText: { color: colors.mutedText, fontSize: 14 },
  signOutBtn: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.danger + '66',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
});

export default StudentHomeScreen;
