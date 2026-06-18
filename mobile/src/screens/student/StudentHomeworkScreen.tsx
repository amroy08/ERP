import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { StudentScreenHeader } from '../../components/student/StudentScreenHeader';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { shadows } from '../../constants/shadows';
import { fetchStudentHomework, getStudentHomeworkSubmission } from '../../api/mobileApi';
import { HomeworkItem, StudentHomeworkSubmission } from '../../types/mobile.types';
import { HomeworkSubmissionModal } from './components/HomeworkSubmissionModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const getStatusBadgeType = (status: string): 'success' | 'danger' | 'warning' | 'info' => {
  const s = status?.toLowerCase();
  if (s === 'submitted' || s === 'reviewed' || s === 'graded') return 'success';
  if (s === 'late' || s === 'overdue') return 'danger';
  if (s === 'returned') return 'warning';
  return 'info';
};

const getDueDateStyle = (dueDate?: string): { color: string; label: string; urgent: boolean } => {
  if (!dueDate) return { color: colors.mutedText, label: '', urgent: false };
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diff < 0) return { color: colors.danger, label: 'Overdue', urgent: true };
  if (diff === 0) return { color: colors.warning, label: 'Due Today', urgent: true };
  if (diff <= 2) return { color: colors.warning, label: `Due in ${diff}d`, urgent: true };
  return {
    color: colors.mutedText,
    label: `Due ${due.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`,
    urgent: false,
  };
};

export const StudentHomeworkScreen: React.FC = () => {
  const [data, setData] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');

  // Cache for full submission details
  const [submissions, setSubmissions] = useState<Record<string, StudentHomeworkSubmission>>({});
  const [loadingSubmissions, setLoadingSubmissions] = useState<Record<string, boolean>>({});

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<HomeworkItem | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await fetchStudentHomework();
      setData(res.data ?? res ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load homework.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleExpandCard = async (homeworkId: string) => {
    const isCurrentlyExpanded = expanded === homeworkId;
    const targetHw = data.find((h) => h.id === homeworkId);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isCurrentlyExpanded) {
      setExpanded(null);
    } else {
      setExpanded(homeworkId);
      if (targetHw?.hasSubmission && !submissions[homeworkId] && !loadingSubmissions[homeworkId]) {
        setLoadingSubmissions((prev) => ({ ...prev, [homeworkId]: true }));
        try {
          const res = await getStudentHomeworkSubmission(homeworkId);
          if (res.data) {
            setSubmissions((prev) => ({ ...prev, [homeworkId]: res.data }));
          }
        } catch (err) {
          console.error('[StudentHomeworkScreen] Error loading submission:', err);
        } finally {
          setLoadingSubmissions((prev) => ({ ...prev, [homeworkId]: false }));
        }
      }
    }
  };

  const handleForceFetchSubmission = async (homeworkId: string) => {
    setLoadingSubmissions((prev) => ({ ...prev, [homeworkId]: true }));
    try {
      const res = await getStudentHomeworkSubmission(homeworkId);
      if (res.data) {
        setSubmissions((prev) => ({ ...prev, [homeworkId]: res.data }));
      }
    } catch (err) {
      console.error('[StudentHomeworkScreen] Error reloading submission:', err);
    } finally {
      setLoadingSubmissions((prev) => ({ ...prev, [homeworkId]: false }));
    }
  };

  const handleSubmitSuccess = () => {
    load(false);
    if (selectedHomework) {
      setSubmissions((prev) => {
        const next = { ...prev };
        delete next[selectedHomework.id];
        return next;
      });
    }
  };

  const filtered = data.filter((hw) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !hw.hasSubmission;
    if (filter === 'submitted') return hw.hasSubmission;
    return true;
  });

  const pendingCount = data.filter((hw) => !hw.hasSubmission).length;

  return (
    <ScreenContainer>
      <StudentScreenHeader
        title="My Homework"
        subtitle="Track assignments and view grades"
        badge={pendingCount > 0 ? `${pendingCount} Pending` : undefined}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.student}
          />
        }
      >
        {/* Urgent/Pending Banner */}
        {!loading && pendingCount > 0 && (
          <View style={styles.pendingAlert}>
            <Ionicons name="book" size={18} color={colors.warning} />
            <Text style={styles.pendingAlertText}>
              You have {pendingCount} homework assignment{pendingCount !== 1 ? 's' : ''} to submit.
            </Text>
          </View>
        )}

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['all', 'pending', 'submitted'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                filter === f && styles.filterPillActive,
              ]}
              onPress={() => setFilter(f)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filter === f && styles.filterPillTextActive,
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.student} size="large" />
            <Text style={styles.loadingText}>Loading assigned homework…</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.paddingWrapper}>
            <ErrorState error={error} onRetry={() => load(false)} roleTheme="student" />
          </View>
        )}

        {!loading && !error && (
          <View style={styles.listContainer}>
            {filtered.map((hw) => {
              const hasSub = hw.hasSubmission;
              const subStatus = hw.submissionStatus || 'pending';
              const badgeType = getStatusBadgeType(subStatus);
              const dueInfo = getDueDateStyle(hw.dueDate);

              return (
                <TouchableOpacity
                  key={hw.id}
                  activeOpacity={0.85}
                  onPress={() => handleExpandCard(hw.id)}
                >
                  <AppCard
                    style={[
                      styles.hwCard,
                      dueInfo.urgent && !hasSub
                        ? { borderColor: colors.warning + '50', borderWidth: 1 }
                        : undefined,
                      expanded === hw.id && styles.hwCardExpanded,
                    ]}
                  >
                    <View style={styles.hwHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.hwTitle} numberOfLines={expanded === hw.id ? undefined : 2}>
                          {hw.title}
                        </Text>
                        <Text style={styles.hwSub}>{hw.subjectName}</Text>
                      </View>
                      <View style={styles.rightCol}>
                        <StatusBadge
                          label={subStatus.toUpperCase()}
                          type={badgeType}
                        />
                        <Ionicons
                          name={expanded === hw.id ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={colors.mutedText}
                          style={styles.chevron}
                        />
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={[styles.dueBadge, { borderColor: dueInfo.color + '35' }]}>
                        <Ionicons name="time-outline" size={11} color={dueInfo.color} />
                        <Text style={[styles.dueText, { color: dueInfo.color }]}>
                          {dueInfo.label}
                        </Text>
                      </View>
                    </View>

                    {expanded === hw.id && (
                      <View style={styles.expandedContainer}>
                        {hw.description ? (
                          <View style={styles.detailSection}>
                            <Text style={styles.sectionLabel}>Description</Text>
                            <Text style={styles.descText}>{hw.description}</Text>
                          </View>
                        ) : null}

                        {hasSub && (
                          <View style={styles.detailSection}>
                            <Text style={styles.sectionLabel}>Submission Details</Text>
                            {loadingSubmissions[hw.id] ? (
                              <ActivityIndicator
                                size="small"
                                color={colors.student}
                                style={{ marginVertical: spacing.sm }}
                              />
                            ) : submissions[hw.id] ? (
                              <View style={styles.subDetails}>
                                <Text style={styles.subDetailText}>
                                  Status:{' '}
                                  <Text style={styles.highlightText}>
                                    {submissions[hw.id].status}
                                  </Text>
                                </Text>
                                <Text style={styles.subDetailText}>
                                  Submitted At:{' '}
                                  {new Date(submissions[hw.id].submittedAt!).toLocaleString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Text>
                                {submissions[hw.id].submissionText ? (
                                  <Text style={styles.subDetailText}>
                                    Answer: "{submissions[hw.id].submissionText}"
                                  </Text>
                                ) : null}
                                {submissions[hw.id].fileName ? (
                                  <Text style={styles.subDetailText}>
                                    File: 📄 {submissions[hw.id].fileName}
                                  </Text>
                                ) : null}
                                {submissions[hw.id].teacherFeedback ? (
                                  <View style={styles.feedbackBox}>
                                    <Text style={styles.feedbackTitle}>Teacher Feedback:</Text>
                                    <Text style={styles.feedbackText}>
                                      {submissions[hw.id].teacherFeedback}
                                    </Text>
                                  </View>
                                ) : null}
                                {submissions[hw.id].marks !== null &&
                                submissions[hw.id].marks !== undefined ? (
                                  <Text style={styles.marksText}>
                                    Marks:{' '}
                                    <Text style={{ color: colors.student, fontWeight: '800' }}>
                                      {submissions[hw.id].marks}
                                    </Text>
                                  </Text>
                                ) : null}
                                {submissions[hw.id].reviewedAt ? (
                                  <Text style={styles.subDetailText}>
                                    Reviewed At:{' '}
                                    {new Date(submissions[hw.id].reviewedAt!).toLocaleString('en-IN')}
                                  </Text>
                                ) : null}
                              </View>
                            ) : (
                              <Text style={styles.infoText}>Failed to load submission details.</Text>
                            )}
                          </View>
                        )}

                        <View style={styles.actionRow}>
                          {!hasSub && hw.canSubmit && (
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.submitBtn]}
                              onPress={() => {
                                setSelectedHomework(hw);
                                setModalVisible(true);
                              }}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="cloud-upload-outline" size={14} color={colors.white} />
                              <Text style={styles.actionBtnText}>Submit Homework</Text>
                            </TouchableOpacity>
                          )}

                          {hasSub && (
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.viewBtn]}
                              onPress={() => handleForceFetchSubmission(hw.id)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="refresh-outline" size={14} color={colors.student} />
                              <Text style={styles.viewBtnText}>Refresh Submission</Text>
                            </TouchableOpacity>
                          )}

                          {hw.canResubmit && (
                            <TouchableOpacity
                              style={[styles.actionBtn, styles.resubmitBtn]}
                              onPress={() => {
                                setSelectedHomework(hw);
                                setModalVisible(true);
                              }}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="repeat-outline" size={14} color={colors.white} />
                              <Text style={styles.actionBtnText}>Resubmit</Text>
                            </TouchableOpacity>
                          )}

                          {hasSub && !hw.canResubmit && (
                            <View style={[styles.actionBtn, styles.disabledBtn]}>
                              <Ionicons name="lock-closed-outline" size={14} color={colors.mutedText} />
                              <Text style={styles.disabledBtnText}>Resubmit Locked</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
                  </AppCard>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {!loading && filtered.length === 0 && !error && (
          <EmptyState
            emoji="📚"
            title={filter === 'pending' ? 'No Pending Homework' : 'No Homework Found'}
            subtitle={
              filter === 'pending'
                ? 'You are all caught up on your assignments!'
                : 'No homework entries match the active filter.'
            }
          />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <HomeworkSubmissionModal
        visible={modalVisible}
        homework={selectedHomework}
        onClose={() => setModalVisible(false)}
        onSubmitSuccess={handleSubmitSuccess}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  centered: {
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
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '12',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning + '30',
    gap: spacing.sm,
  },
  pendingAlertText: {
    ...typography.labelSmall,
    color: colors.warning,
    fontWeight: '700',
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterPillActive: {
    backgroundColor: colors.student,
    borderColor: colors.student,
  },
  filterPillText: {
    ...typography.labelSmall,
    color: colors.mutedText,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: colors.white,
  },
  listContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  hwCard: {
    marginBottom: spacing.sm,
  },
  hwCardExpanded: {
    ...shadows.md,
  },
  hwHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  hwTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
    lineHeight: 20,
  },
  hwSub: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: spacing.xxs,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  chevron: {
    marginTop: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dueText: {
    ...typography.captionSmall,
    fontWeight: '700',
  },
  expandedContainer: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  detailSection: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    ...typography.captionSmall,
    fontWeight: '800',
    color: colors.mutedText,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  descText: {
    ...typography.bodyMedium,
    color: colors.text,
    lineHeight: 20,
  },
  subDetails: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  subDetailText: {
    ...typography.bodySmall,
    color: colors.text,
    lineHeight: 18,
  },
  highlightText: {
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  feedbackBox: {
    marginTop: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.warning + '10',
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    borderRadius: radii.sm,
  },
  feedbackTitle: {
    ...typography.captionSmall,
    fontWeight: '700',
    color: colors.warning,
    marginBottom: 2,
  },
  feedbackText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  marksText: {
    ...typography.label,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xxs,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtn: {
    flex: 1,
    minWidth: 120,
    height: 38,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionBtnText: {
    ...typography.buttonSmall,
    color: colors.white,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: colors.student,
  },
  resubmitBtn: {
    backgroundColor: colors.warning,
  },
  viewBtn: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.student + '40',
  },
  viewBtnText: {
    ...typography.buttonSmall,
    color: colors.student,
    fontWeight: '700',
  },
  disabledBtn: {
    backgroundColor: colors.border,
  },
  disabledBtnText: {
    ...typography.buttonSmall,
    color: colors.mutedText,
    fontWeight: '700',
  },
});

export default StudentHomeworkScreen;
