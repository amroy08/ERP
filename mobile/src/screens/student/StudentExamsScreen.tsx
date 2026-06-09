import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { colors } from '../../constants/colors';
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
}

const gradeColor = (g?: string) => {
  if (!g) return colors.mutedText;
  if (['O', 'A+', 'A'].includes(g)) return colors.success;
  if (['B+', 'B'].includes(g)) return colors.info;
  if (['C+', 'C'].includes(g)) return colors.warning;
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

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.student} />}
      >
        <Text style={styles.pageTitle}>Exams</Text>

        {/* Tab Toggle */}
        <View style={styles.tabRow}>
          <Text onPress={() => setTab('upcoming')} style={[styles.tabBtn, tab === 'upcoming' && styles.tabBtnActive]}>
            📅  Upcoming
          </Text>
          <Text onPress={() => setTab('results')} style={[styles.tabBtn, tab === 'results' && styles.tabBtnActive]}>
            📊  Results
          </Text>
        </View>

        {loading && <ActivityIndicator color={colors.student} style={{ marginTop: 40 }} />}
        {error && !loading && <AppCard style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></AppCard>}

        {/* Upcoming Exams */}
        {!loading && tab === 'upcoming' && (
          upcomingExams.length === 0 ? (
            <AppCard><Text style={styles.emptyText}>No upcoming exams scheduled.</Text></AppCard>
          ) : (
            upcomingExams.map((exam) => {
              const examDate = new Date(exam.date);
              const daysLeft = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
              <AppCard key={exam.id} style={[styles.examCard, daysLeft <= 3 ? { borderColor: colors.danger + '55', borderWidth: 1 } : undefined]}>
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
          )
        )}

        {/* Results */}
        {!loading && tab === 'results' && (
          results.length === 0 ? (
            <AppCard><Text style={styles.emptyText}>No results published yet.</Text></AppCard>
          ) : (
            results.map((result) => {
              const pct = result.percentage ?? ((result.marksObtained / result.totalMarks) * 100);
              return (
                <AppCard key={result.id} style={styles.resultCard}>
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.examTitle}>{result.examTitle}</Text>
                      <Text style={styles.examSub}>{result.subjectName}</Text>
                    </View>
                    {result.grade && (
                      <View style={[styles.gradeBadge, { borderColor: gradeColor(result.grade) + '88', backgroundColor: gradeColor(result.grade) + '18' }]}>
                        <Text style={[styles.gradeText, { color: gradeColor(result.grade) }]}>{result.grade}</Text>
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
          )
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  pageTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 52, marginBottom: 16 },
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tabBtn: {
    flex: 1, textAlign: 'center', color: colors.mutedText, fontSize: 13, fontWeight: '700',
    paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.borderSoft, overflow: 'hidden',
  },
  tabBtnActive: { backgroundColor: colors.student + '22', borderColor: colors.student, color: colors.student },
  examCard: { marginBottom: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  examTitle: { color: colors.white, fontSize: 15, fontWeight: '700' },
  examSub: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  examMeta: { color: colors.mutedText, fontSize: 12, marginTop: 4 },
  dateBlock: { alignItems: 'center', marginLeft: 12 },
  dateDay: { color: colors.white, fontSize: 24, fontWeight: '800' },
  dateMonth: { color: colors.mutedText, fontSize: 11 },
  daysLeft: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  marksTotal: { color: colors.mutedText, fontSize: 12, marginTop: 8 },
  resultCard: { marginBottom: 10 },
  gradeBadge: { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 6 },
  gradeText: { fontSize: 18, fontWeight: '800' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  scoreText: { color: colors.white, fontSize: 14, fontWeight: '700', minWidth: 60 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: colors.borderSoft, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, borderRadius: 3 },
  pctText: { color: colors.mutedText, fontSize: 12, minWidth: 36, textAlign: 'right' },
  errorCard: { marginVertical: 16 },
  errorText: { color: colors.danger, fontSize: 14 },
  emptyText: { color: colors.mutedText, fontSize: 14 },
});

export default StudentExamsScreen;
