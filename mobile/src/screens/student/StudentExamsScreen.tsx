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
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { StudentScreenHeader } from '../../components/student/StudentScreenHeader';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { shadows } from '../../constants/shadows';
import { fetchStudentExams, fetchStudentResults } from '../../api/mobileApi';

interface ExamSchedule {
  id: string;
  title: string;
  subjectName: string;
  date: string;
  startTime?: string;
  totalMarks: number;
}

interface ExamResult {
  id: string;
  examTitle: string;
  subjectName: string;
  marksObtained: number;
  totalMarks: number;
  grade?: string;
  percentage?: number;
  status: string;
  remarks?: string;
}

const getGradeColor = (g?: string) => {
  if (!g) return colors.mutedText;
  const grade = g.toUpperCase();
  if (['O', 'A+', 'A'].includes(grade)) return colors.success;
  if (['B+', 'B'].includes(grade)) return colors.info;
  if (['C+', 'C'].includes(grade)) return colors.warning;
  return colors.danger;
};

export const StudentExamsScreen: React.FC = () => {
  const [upcomingExams, setUpcomingExams] = useState<ExamSchedule[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'upcoming' | 'results'>('upcoming');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const [examRes, resultRes] = await Promise.all([
        fetchStudentExams(),
        fetchStudentResults(),
      ]);
      setUpcomingExams(examRes.data ?? examRes ?? []);
      setResults(resultRes.data ?? resultRes ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load exam data.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCount = tab === 'upcoming' ? upcomingExams.length : results.length;

  return (
    <ScreenContainer>
      <StudentScreenHeader
        title="Exams & Grades"
        subtitle="View schedule and academic results"
        badge={activeCount > 0 ? activeCount : undefined}
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
        {/* Tab Toggle Row */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'upcoming' && styles.tabBtnActive]}
            onPress={() => setTab('upcoming')}
            activeOpacity={0.75}
          >
            <Ionicons
              name={tab === 'upcoming' ? 'calendar' : 'calendar-outline'}
              size={15}
              color={tab === 'upcoming' ? colors.student : colors.mutedText}
            />
            <Text style={[styles.tabBtnText, tab === 'upcoming' && styles.tabBtnTextActive]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'results' && styles.tabBtnActive]}
            onPress={() => setTab('results')}
            activeOpacity={0.75}
          >
            <Ionicons
              name={tab === 'results' ? 'stats-chart' : 'stats-chart-outline'}
              size={15}
              color={tab === 'results' ? colors.student : colors.mutedText}
            />
            <Text style={[styles.tabBtnText, tab === 'results' && styles.tabBtnTextActive]}>
              Results
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.student} size="large" />
            <Text style={styles.loadingText}>Loading exams…</Text>
          </View>
        )}
        {error && !loading && (
          <View style={styles.paddingWrapper}>
            <ErrorState error={error} onRetry={() => load(false)} roleTheme="student" />
          </View>
        )}

        {/* List Content */}
        {!loading && !error && (
          <View style={styles.listContainer}>
            {tab === 'upcoming' ? (
              upcomingExams.length === 0 ? (
                <EmptyState
                  emoji="📝"
                  title="No Upcoming Exams"
                  subtitle="You have no upcoming exams or test papers scheduled."
                />
              ) : (
                upcomingExams.map((exam) => {
                  const examDate = new Date(exam.date);
                  const daysLeft = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  const isImminent = daysLeft <= 3 && daysLeft >= 0;

                  return (
                    <AppCard
                      key={exam.id}
                      style={[
                        styles.examCard,
                        isImminent ? { borderColor: colors.danger + '50', borderWidth: 1 } : undefined,
                      ]}
                    >
                      <View style={styles.rowBetween}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.examTitle}>{exam.title}</Text>
                          <Text style={styles.examSub}>{exam.subjectName}</Text>
                          {exam.startTime && (
                            <View style={styles.timeRow}>
                              <Ionicons name="time-outline" size={12} color={colors.mutedText} />
                              <Text style={styles.examMeta}>{exam.startTime}</Text>
                            </View>
                          )}
                          <Text style={styles.marksTotal}>Total Marks: {exam.totalMarks}</Text>
                        </View>
                        <View style={styles.dateBlock}>
                          <View style={[styles.dateCard, isImminent && styles.dateCardImminent]}>
                            <Text style={[styles.dateDay, isImminent && styles.dateTextImminent]}>
                              {examDate.getDate()}
                            </Text>
                            <Text style={[styles.dateMonth, isImminent && styles.dateTextImminent]}>
                              {examDate.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}
                            </Text>
                          </View>
                          {daysLeft > 0 ? (
                            <Text style={[styles.daysLeft, { color: isImminent ? colors.danger : colors.mutedText }]}>
                              {daysLeft}d left
                            </Text>
                          ) : daysLeft === 0 ? (
                            <Text style={[styles.daysLeft, { color: colors.danger }]}>Today</Text>
                          ) : null}
                        </View>
                      </View>
                    </AppCard>
                  );
                })
              )
            ) : (
              results.length === 0 ? (
                <EmptyState
                  emoji="📊"
                  title="No Results Yet"
                  subtitle="Exam results or grades have not been published yet."
                />
              ) : (
                results.map((result) => {
                  const pct = result.percentage ?? ((result.marksObtained / result.totalMarks) * 100);
                  const progressColor = pct >= 75 ? colors.success : pct >= 50 ? colors.warning : colors.danger;
                  const gColor = getGradeColor(result.grade);

                  return (
                    <AppCard key={result.id} style={styles.resultCard}>
                      <View style={styles.rowBetween}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.examTitle}>{result.examTitle}</Text>
                          <Text style={styles.examSub}>{result.subjectName}</Text>
                        </View>
                        {result.grade && (
                          <View
                            style={[
                              styles.gradeBadge,
                              { borderColor: gColor + '60', backgroundColor: gColor + '12' },
                            ]}
                          >
                            <Text style={[styles.gradeText, { color: gColor }]}>
                              {result.grade}
                            </Text>
                          </View>
                        )}
                      </View>

                      {result.remarks ? (
                        <View style={styles.remarksBox}>
                          <Text style={styles.remarksText}>Feedback: {result.remarks}</Text>
                        </View>
                      ) : null}

                      <View style={styles.scoreRow}>
                        <Text style={styles.scoreText}>
                          {result.marksObtained} / {result.totalMarks}
                        </Text>
                        <View style={styles.progressBarBg}>
                          <View
                            style={[
                              styles.progressBarFill,
                              {
                                width: `${Math.min(pct, 100)}%`,
                                backgroundColor: progressColor,
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.pctText, { color: progressColor }]}>
                          {pct.toFixed(0)}%
                        </Text>
                      </View>
                    </AppCard>
                  );
                })
              )
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
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
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tabBtnActive: {
    backgroundColor: colors.student + '12',
    borderColor: colors.student,
  },
  tabBtnText: {
    ...typography.labelSmall,
    color: colors.mutedText,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: colors.student,
  },
  listContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  examCard: {
    marginBottom: spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
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
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  examMeta: {
    ...typography.captionSmall,
    color: colors.mutedText,
    fontWeight: '500',
  },
  marksTotal: {
    ...typography.captionSmall,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  dateBlock: {
    alignItems: 'center',
    gap: spacing.xxs,
  },
  dateCard: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    minWidth: 46,
  },
  dateCardImminent: {
    backgroundColor: colors.danger + '12',
    borderColor: colors.danger + '35',
  },
  dateDay: {
    ...typography.headingMedium,
    color: colors.text,
    fontWeight: '800',
    lineHeight: 22,
  },
  dateMonth: {
    ...typography.captionSmall,
    fontSize: 9,
    color: colors.mutedText,
    fontWeight: '800',
  },
  dateTextImminent: {
    color: colors.danger,
  },
  daysLeft: {
    ...typography.captionSmall,
    fontWeight: '700',
  },
  resultCard: {
    marginBottom: spacing.sm,
  },
  gradeBadge: {
    borderRadius: radii.sm,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 38,
  },
  gradeText: {
    ...typography.label,
    fontWeight: '800',
  },
  remarksBox: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  remarksText: {
    ...typography.captionSmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  scoreText: {
    ...typography.labelSmall,
    color: colors.text,
    fontWeight: '700',
    minWidth: 60,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  pctText: {
    ...typography.captionSmall,
    fontWeight: '800',
    minWidth: 32,
    textAlign: 'right',
  },
});

export default StudentExamsScreen;
