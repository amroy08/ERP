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
import { fetchParentDashboard } from '../../api/mobileApi';

interface ChildSummary {
  id: string;
  name: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  attendancePercent: number;
  feeDue: number;
}

interface ParentDashboardData {
  children: ChildSummary[];
  recentNotices: { id: string; title: string; priority: string; publishDate: string }[];
  upcomingExams: { id: string; title: string; date: string; className: string }[];
}

const AttendanceBadge: React.FC<{ percent: number }> = ({ percent }) => {
  const color =
    percent >= 85 ? colors.success : percent >= 70 ? colors.warning : colors.danger;
  return (
    <View style={[styles.attendancePill, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.attendancePillText, { color }]}>{percent.toFixed(0)}% attendance</Text>
    </View>
  );
};

export const ParentHomeScreen: React.FC = () => {
  const { user, school, signOut } = useAuth();
  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await fetchParentDashboard();
      setData(res.data ?? res);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load dashboard. Pull to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} tintColor={colors.parent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.name}>{user?.name ?? 'Parent'}</Text>
            {school && <Text style={styles.schoolName}>{school.name}</Text>}
          </View>
          <StatusBadge label="Parent" type="parent" />
        </View>

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.parent} size="large" />
            <Text style={styles.loadingText}>Loading dashboard…</Text>
          </View>
        )}

        {error && !loading && (
          <ErrorState error={error} onRetry={() => loadDashboard(false)} roleTheme="parent" />
        )}

        {data && !loading && (
          <>
            {/* Children */}
            <Text style={styles.sectionTitle}>My Children</Text>
            {data.children.length === 0 && (
              <EmptyState emoji="👶" title="No children linked" subtitle="There are no active children associated with this parent account." />
            )}
            {data.children.map((child) => (
              <AppCard key={child.id} style={styles.childCard}>
                <View style={styles.childRow}>
                  <View style={styles.childAvatar}>
                    <Text style={styles.childAvatarText}>{child.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Text style={styles.childMeta}>
                      {child.className} – {child.sectionName} · {child.admissionNumber}
                    </Text>
                    <AttendanceBadge percent={child.attendancePercent} />
                  </View>
                  {child.feeDue > 0 && (
                    <View style={styles.feeDueBadge}>
                      <Text style={styles.feeDueAmount}>₹{child.feeDue.toLocaleString('en-IN')}</Text>
                      <Text style={styles.feeDueLabel}>Due</Text>
                    </View>
                  )}
                </View>
              </AppCard>
            ))}

            {/* Upcoming Exams */}
            {data.upcomingExams.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Upcoming Exams</Text>
                {data.upcomingExams.slice(0, 3).map((exam) => (
                  <AppCard key={exam.id} style={styles.compactCard}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.compactTitle}>{exam.title}</Text>
                      <Text style={styles.compactMeta}>{new Date(exam.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
                    </View>
                    <Text style={styles.compactSub}>{exam.className}</Text>
                  </AppCard>
                ))}
              </>
            )}

            {/* Recent Notices */}
            {data.recentNotices.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Recent Notices</Text>
                {data.recentNotices.slice(0, 3).map((notice) => (
                  <AppCard key={notice.id} style={styles.compactCard}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.compactTitle}>{notice.title}</Text>
                      <StatusBadge label={notice.priority} type={notice.priority === 'urgent' ? 'danger' : 'info'} />
                    </View>
                    <Text style={styles.compactSub}>{new Date(notice.publishDate).toLocaleDateString('en-IN')}</Text>
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
  schoolName: { color: colors.parent, fontSize: 13, marginTop: 3, fontWeight: '600' },
  sectionTitle: { color: colors.mutedText, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  centered: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: colors.mutedText, marginTop: 12, fontSize: 14 },
  errorCard: { marginVertical: 16 },
  errorText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  childCard: { marginBottom: 12 },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  childAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.parent + '33',
    justifyContent: 'center', alignItems: 'center',
  },
  childAvatarText: { color: colors.parent, fontSize: 20, fontWeight: '800' },
  childName: { color: colors.white, fontSize: 16, fontWeight: '700' },
  childMeta: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  attendancePill: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 6 },
  attendancePillText: { fontSize: 11, fontWeight: '700' },
  feeDueBadge: { alignItems: 'center', backgroundColor: colors.danger + '22', borderRadius: 10, padding: 8, borderWidth: 1, borderColor: colors.danger },
  feeDueAmount: { color: colors.danger, fontSize: 14, fontWeight: '800' },
  feeDueLabel: { color: colors.danger, fontSize: 10 },
  compactCard: { marginBottom: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compactTitle: { color: colors.white, fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 },
  compactMeta: { color: colors.mutedText, fontSize: 12 },
  compactSub: { color: colors.mutedText, fontSize: 12, marginTop: 4 },
  emptyText: { color: colors.mutedText, fontSize: 14 },
  signOutBtn: { marginTop: 24, borderWidth: 1, borderColor: colors.danger + '66', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  signOutText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
});

export default ParentHomeScreen;
