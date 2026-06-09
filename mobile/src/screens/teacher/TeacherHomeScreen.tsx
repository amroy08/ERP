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
import { useAuth } from '../../store/AuthContext';
import { colors } from '../../constants/colors';
import { fetchTeacherDashboard } from '../../api/mobileApi';

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
      setData(res.data ?? res);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load dashboard. Pull to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

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
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{timeGreeting},</Text>
            <Text style={styles.name}>{user?.name ?? 'Teacher'}</Text>
            {school && <Text style={styles.schoolName}>{school.name}</Text>}
          </View>
          <StatusBadge label="Teacher" type="teacher" />
        </View>

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.teacher} size="large" />
            <Text style={styles.loadingText}>Loading dashboard…</Text>
          </View>
        )}

        {error && !loading && (
          <AppCard style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </AppCard>
        )}

        {data && !loading && (
          <>
            {/* Summary strip */}
            <View style={styles.summaryStrip}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.teacher }]}>
                  {data.todayClasses.length}
                </Text>
                <Text style={styles.summaryLabel}>Classes Today</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: data.pendingAttendance.length > 0 ? colors.warning : colors.success }]}>
                  {data.pendingAttendance.length}
                </Text>
                <Text style={styles.summaryLabel}>Pending Attendance</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.info }]}>
                  {data.totalStudentsCount}
                </Text>
                <Text style={styles.summaryLabel}>My Students</Text>
              </View>
            </View>

            {/* Pending Attendance Alert */}
            {data.pendingAttendance.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>⚠️  Attendance Not Marked</Text>
                {data.pendingAttendance.map((pa) => (
                  <AppCard key={pa.classId} style={styles.alertCard}>
                    <View style={styles.rowBetween}>
                      <View>
                        <Text style={styles.alertTitle}>{pa.className} – {pa.sectionName}</Text>
                        <Text style={styles.alertSub}>
                          {new Date(pa.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </Text>
                      </View>
                      <View style={styles.markBadge}>
                        <Text style={styles.markBadgeText}>Mark Now</Text>
                      </View>
                    </View>
                  </AppCard>
                ))}
              </>
            )}

            {/* Today's Classes */}
            <Text style={styles.sectionTitle}>Today's Classes</Text>
            {data.todayClasses.length === 0 ? (
              <AppCard>
                <Text style={styles.emptyText}>🎉 No classes scheduled today!</Text>
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
                      <Text style={styles.classMeta}>
                        {cls.className} – {cls.sectionName}
                      </Text>
                    </View>
                    <Text style={styles.classTime}>
                      {cls.startTime}{'\n'}{cls.endTime}
                    </Text>
                  </View>
                </AppCard>
              ))
            )}

            {/* Upcoming Exams */}
            {data.upcomingExams.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Upcoming Exams</Text>
                {data.upcomingExams.slice(0, 3).map((exam) => (
                  <AppCard key={exam.id} style={styles.compactCard}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.compactTitle}>{exam.title}</Text>
                      <Text style={styles.compactDate}>
                        {new Date(exam.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </Text>
                    </View>
                    <Text style={styles.compactSub}>{exam.className}</Text>
                  </AppCard>
                ))}
              </>
            )}

            {/* Recent Notices */}
            {data.recentNotices.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>School Notices</Text>
                {data.recentNotices.slice(0, 3).map((notice) => (
                  <AppCard key={notice.id} style={styles.compactCard}>
                    <View style={styles.rowBetween}>
                      <Text style={[styles.compactTitle, { flex: 1, marginRight: 8 }]}>{notice.title}</Text>
                      <StatusBadge
                        label={notice.priority}
                        type={notice.priority === 'urgent' ? 'danger' : 'info'}
                      />
                    </View>
                    <Text style={styles.compactSub}>
                      {new Date(notice.publishDate).toLocaleDateString('en-IN')}
                    </Text>
                  </AppCard>
                ))}
              </>
            )}
          </>
        )}

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
    marginTop: 52,
    marginBottom: 20,
  },
  greeting: { color: colors.mutedText, fontSize: 15 },
  name: { color: colors.white, fontSize: 26, fontWeight: '800' },
  schoolName: { color: colors.teacher, fontSize: 13, marginTop: 3, fontWeight: '600' },
  centered: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: colors.mutedText, marginTop: 12, fontSize: 14 },
  errorCard: { marginVertical: 16 },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 16,
    marginBottom: 8,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { color: colors.mutedText, fontSize: 11, textAlign: 'center', marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: colors.borderSoft, marginHorizontal: 8 },
  sectionTitle: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },
  alertCard: { marginBottom: 8, borderColor: colors.warning + '55', borderWidth: 1 },
  alertTitle: { color: colors.white, fontSize: 15, fontWeight: '700' },
  alertSub: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  markBadge: {
    backgroundColor: colors.warning + '22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  markBadgeText: { color: colors.warning, fontSize: 12, fontWeight: '700' },
  classCard: { marginBottom: 8 },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  periodBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.teacher + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  periodText: { color: colors.teacher, fontSize: 13, fontWeight: '800' },
  subjectName: { color: colors.white, fontSize: 15, fontWeight: '700' },
  classMeta: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  classTime: { color: colors.mutedText, fontSize: 11, textAlign: 'right' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compactCard: { marginBottom: 8 },
  compactTitle: { color: colors.white, fontSize: 14, fontWeight: '600' },
  compactDate: { color: colors.mutedText, fontSize: 12 },
  compactSub: { color: colors.mutedText, fontSize: 12, marginTop: 4 },
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

export default TeacherHomeScreen;
