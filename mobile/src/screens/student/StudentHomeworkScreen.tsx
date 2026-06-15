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
import { fetchStudentHomework, getStudentHomeworkSubmission } from '../../api/mobileApi';
import { HomeworkItem, StudentHomeworkSubmission } from '../../types/mobile.types';
import { HomeworkSubmissionModal } from './components/HomeworkSubmissionModal';

const getStatusColorInfo = (status: string) => {
  const s = status?.toLowerCase();
  if (s === 'submitted' || s === 'reviewed' || s === 'graded') {
    return { bg: colors.success + '18', border: colors.success, text: colors.success };
  }
  if (s === 'late' || s === 'overdue') {
    return { bg: colors.danger + '18', border: colors.danger, text: colors.danger };
  }
  if (s === 'returned') {
    return { bg: colors.warning + '18', border: colors.warning, text: colors.warning };
  }
  return { bg: colors.warning + '18', border: colors.warning, text: colors.warning };
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
        <Text style={styles.pageTitle}>Homework</Text>

        {pendingCount > 0 && !loading && (
          <View style={styles.pendingAlert}>
            <Text style={styles.pendingAlertText}>
              📚  {pendingCount} assignment{pendingCount !== 1 ? 's' : ''} pending
            </Text>
          </View>
        )}

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {(['all', 'pending', 'submitted'] as const).map((f) => (
            <Text
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterPill, filter === f && styles.filterPillActive]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          ))}
        </View>

        {error && !loading && (
          <ErrorState error={error} onRetry={() => load(false)} roleTheme="student" />
        )}

        {!loading &&
          filtered.map((hw) => {
            const hasSub = hw.hasSubmission;
            const subStatus = hw.submissionStatus || 'pending';
            const badge = getStatusColorInfo(subStatus);
            const isPending = !hasSub;
            const isDueClose =
              isPending &&
              new Date(hw.dueDate) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

            return (
              <AppCard
                key={hw.id}
                style={[
                  styles.hwCard,
                  isDueClose ? { borderColor: colors.warning + '55', borderWidth: 1 } : undefined,
                ]}
                onPress={() => handleExpandCard(hw.id)}
              >
                <View style={styles.hwHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.hwTitle}>{hw.title}</Text>
                    <Text style={styles.hwSub}>{hw.subjectName}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: badge.bg,
                        borderColor: badge.border,
                      },
                    ]}
                  >
                    <Text style={[styles.statusText, { color: badge.text }]}>{subStatus}</Text>
                  </View>
                </View>
                <Text style={styles.dueText}>
                  Due:{' '}
                  {new Date(hw.dueDate).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                  })}
                </Text>

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
                            style={{ marginVertical: 8 }}
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
                              {new Date(submissions[hw.id].submittedAt!).toLocaleString('en-IN')}
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
                      {isPending && hw.canSubmit && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.submitBtn]}
                          onPress={() => {
                            setSelectedHomework(hw);
                            setModalVisible(true);
                          }}
                        >
                          <Text style={styles.actionBtnText}>Submit Homework</Text>
                        </TouchableOpacity>
                      )}

                      {hasSub && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.viewBtn]}
                          onPress={() => handleForceFetchSubmission(hw.id)}
                        >
                          <Text style={styles.viewBtnText}>View Submission</Text>
                        </TouchableOpacity>
                      )}

                      {hw.canResubmit && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.resubmitBtn]}
                          onPress={() => {
                            setSelectedHomework(hw);
                            setModalVisible(true);
                          }}
                        >
                          <Text style={styles.actionBtnText}>Resubmit</Text>
                        </TouchableOpacity>
                      )}

                      {hasSub && !hw.canResubmit && (
                        <View style={[styles.actionBtn, styles.disabledBtn]}>
                          <Text style={styles.disabledBtnText}>Resubmit Locked</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </AppCard>
            );
          })}

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
  pageTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 12 },
  pendingAlert: {
    backgroundColor: colors.warning + '18',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning + '44',
    padding: 12,
    marginBottom: 12,
  },
  pendingAlertText: { color: colors.warning, fontSize: 13, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterPill: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  filterPillActive: { backgroundColor: colors.student + '22', borderColor: colors.student, color: colors.student },
  hwCard: { marginBottom: 8 },
  hwHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  hwTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  hwSub: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  dueText: { color: colors.mutedText, fontSize: 12 },
  expandedContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  detailSection: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.mutedText,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  descText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  subDetails: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  subDetailText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  highlightText: {
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  feedbackBox: {
    marginTop: 6,
    padding: 10,
    backgroundColor: colors.warning + '12',
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    borderRadius: 6,
  },
  feedbackTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
    marginBottom: 2,
  },
  feedbackText: {
    fontSize: 13,
    color: colors.text,
  },
  marksText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    minWidth: 120,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
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
    borderColor: colors.border,
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  disabledBtn: {
    backgroundColor: colors.border,
  },
  disabledBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mutedText,
  },
});

export default StudentHomeworkScreen;
