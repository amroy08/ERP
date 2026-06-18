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
import { Ionicons } from '@expo/vector-icons';
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
import { fetchParentDashboard } from '../../api/mobileApi';

// Sub-components
import { DashboardHero } from '../../components/dashboard/DashboardHero';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { ChildContextHeader } from '../../components/dashboard/ChildContextHeader';
import { NoticePreviewCard } from '../../components/dashboard/NoticePreviewCard';

interface ChildSummary {
  id: string;
  name: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  attendancePercent: number;
  feeDue: number;
  todayPeriodsCount: number;
  pendingHomeworkCount: number;
  upcomingExamsCount: number;
  latestResultSummary?: string | null;
  recentNotices: { id: string; title: string; priority: string; publishDate: string }[];
  upcomingExams: { id: string; title: string; date: string; className: string }[];
}

interface ParentDashboardData {
  children: ChildSummary[];
}

export const ParentHomeScreen: React.FC = () => {
  const { user, school, signOut } = useAuth();
  const navigation = useNavigation<any>();
  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await fetchParentDashboard();
      const rawData = res.data ?? res;

      const children = (rawData.children || []).map((child: any) => ({
        id: child.id,
        name: child.name,
        admissionNumber: child.admissionNo,
        className: child.className,
        sectionName: child.sectionName,
        attendancePercent: child.attendanceSummary?.percentage ?? 0,
        feeDue: child.pendingFees ?? 0,
        todayPeriodsCount: child.todayPeriodsCount ?? 0,
        pendingHomeworkCount: child.pendingHomeworkCount ?? 0,
        upcomingExamsCount: child.upcomingExamsCount ?? 0,
        latestResultSummary: child.latestResultSummary ?? null,
        recentNotices: child.latestNotices || [],
        upcomingExams: (child.upcomingExams || []).map((exam: any) => ({
          id: exam.id,
          title: exam.name,
          date: exam.startDate,
          className: child.className,
        })),
      }));

      setData({ children });
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

  // Set initial selected child once data loads
  useEffect(() => {
    if (data && data.children.length > 0 && !selectedChildId) {
      setSelectedChildId(data.children[0].id);
    }
  }, [data, selectedChildId]);

  const selectedChild = data?.children.find((c) => c.id === selectedChildId) || data?.children[0];

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboard(true)}
            tintColor={colors.parent}
          />
        }
      >
        {/* Curved Hero Banner */}
        <DashboardHero
          greeting="Good day,"
          name={user?.name ?? 'Parent'}
          subText={school?.name}
          roleLabel="Parent"
          roleType="parent"
          gradientColors={gradients.heroParent}
        />

        {/* Child Context Switcher */}
        {data && data.children.length > 1 && selectedChildId && (
          <ChildContextHeader
            childrenList={data.children.map((c) => ({
              id: c.id,
              name: c.name,
              className: c.className,
              sectionName: c.sectionName,
            }))}
            selectedChildId={selectedChildId}
            onChildSelect={(id) => setSelectedChildId(id)}
          />
        )}

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.parent} size="large" />
            <Text style={styles.loadingText}>Loading dashboard…</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.paddingWrapper}>
            <ErrorState error={error} onRetry={() => loadDashboard(false)} roleTheme="parent" />
          </View>
        )}

        {data && !loading && selectedChild && (
          <View style={styles.contentContainer}>
            {/* Selected Child Info Summary Card */}
            <AppCard style={styles.childSummaryCard}>
              <View style={styles.childSummaryRow}>
                <View style={styles.childAvatar}>
                  <Text style={styles.childAvatarText}>{selectedChild.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.childName}>{selectedChild.name}</Text>
                  <Text style={styles.childMeta}>
                    Class {selectedChild.className}–{selectedChild.sectionName}  ·  Admn No: {selectedChild.admissionNumber}
                  </Text>
                </View>
              </View>
            </AppCard>

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricsRow}>
                <MetricCard
                  label="Attendance"
                  value={`${selectedChild.attendancePercent.toFixed(0)}%`}
                  color={selectedChild.attendancePercent >= 85 ? colors.success : colors.warning}
                  iconName="calendar-outline"
                  onPress={() => navigation.navigate('ParentAttendance')}
                />
                <MetricCard
                  label="Fees Due"
                  value={selectedChild.feeDue > 0 ? `₹${selectedChild.feeDue.toLocaleString('en-IN')}` : 'Paid'}
                  color={selectedChild.feeDue > 0 ? colors.danger : colors.success}
                  iconName="wallet-outline"
                  onPress={() => navigation.navigate('ParentFees')}
                />
              </View>
              <View style={styles.metricsRow}>
                <MetricCard
                  label="Homework"
                  value={`${selectedChild.pendingHomeworkCount} Pending`}
                  color={selectedChild.pendingHomeworkCount > 0 ? colors.warning : colors.success}
                  iconName="book-outline"
                  onPress={() => navigation.navigate('ParentAcademics')}
                />
                <MetricCard
                  label="Today Periods"
                  value={`${selectedChild.todayPeriodsCount}`}
                  color={colors.parent}
                  iconName="time-outline"
                  onPress={() => navigation.navigate('ParentAcademics')}
                />
              </View>
            </View>

            {/* Latest Result / Academics summary */}
            {selectedChild.latestResultSummary && (
              <View style={styles.section}>
                <SectionHeader title="Latest Exam Result" />
                <AppCard
                  style={styles.resultCard}
                  onPress={() => navigation.navigate('ParentAcademics')}
                >
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                      <Text style={styles.resultTitle}>Recent Performance Summary</Text>
                      <Text style={styles.resultSummaryText}>
                        {selectedChild.latestResultSummary}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
                  </View>
                </AppCard>
              </View>
            )}

            {/* Upcoming Exams */}
            {selectedChild.upcomingExams.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="Upcoming Exams" />
                {selectedChild.upcomingExams.slice(0, 3).map((exam) => (
                  <AppCard
                    key={exam.id}
                    style={styles.examCard}
                    onPress={() => navigation.navigate('ParentAcademics')}
                  >
                    <View style={styles.rowBetween}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.examTitle}>{exam.title}</Text>
                        <Text style={styles.examSub}>Class {exam.className}</Text>
                      </View>
                      <View style={styles.examDateBox}>
                        <Text style={styles.examDateText}>
                          {new Date(exam.date).toLocaleDateString('en-IN', {
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

            {/* School Notices */}
            {selectedChild.recentNotices.length > 0 && (
              <View style={styles.section}>
                <SectionHeader title="School Notices" />
                {selectedChild.recentNotices.slice(0, 3).map((notice) => (
                  <NoticePreviewCard
                    key={notice.id}
                    title={notice.title}
                    priority={notice.priority}
                    publishDate={notice.publishDate}
                    onPress={() => navigation.navigate('ParentNotices')}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {data && data.children.length === 0 && !loading && (
          <View style={styles.paddingWrapper}>
            <EmptyState
              emoji="👶"
              title="No children linked"
              subtitle="There are no active children associated with this parent account."
            />
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
  childSummaryCard: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  childSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  childAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.parentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  childAvatarText: {
    color: colors.parent,
    ...typography.headingMedium,
    fontWeight: '800',
  },
  childName: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
  },
  childMeta: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: 2,
  },
  metricsGrid: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  section: {
    marginBottom: spacing.lg,
  },
  resultCard: {
    marginBottom: spacing.xs,
  },
  resultTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
  },
  resultSummaryText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  examCard: {
    marginBottom: spacing.xs,
  },
  examTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
  },
  examSub: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: 2,
  },
  examDateBox: {
    backgroundColor: colors.parentSoft,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.parent + '20',
  },
  examDateText: {
    color: colors.parent,
    ...typography.captionSmall,
    fontWeight: '700',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

export default ParentHomeScreen;
