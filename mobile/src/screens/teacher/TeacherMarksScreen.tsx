import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, ActivityIndicator,
  RefreshControl, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { TeacherScreenHeader } from '../../components/teacher/TeacherScreenHeader';
import { MarksExamCard } from '../../components/teacher/MarksExamCard';
import { MarksSubjectCard } from '../../components/teacher/MarksSubjectCard';
import { colors } from '../../constants/colors';
import { spacing, radii, sizing } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { shadows } from '../../constants/shadows';
import {
  getTeacherMarksExams,
  getTeacherMarksExamSubjects,
  getTeacherMarksExamStudents,
  saveTeacherMarks,
} from '../../api/mobileApi';
import {
  TeacherMarksExam,
  TeacherMarksSubject,
  TeacherMarksStudent,
} from '../../types/mobile.types';

export const TeacherMarksScreen: React.FC = () => {
  // Navigation states
  const [exams, setExams] = useState<TeacherMarksExam[]>([]);
  const [selectedExam, setSelectedExam] = useState<TeacherMarksExam | null>(null);
  const [subjects, setSubjects] = useState<TeacherMarksSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<TeacherMarksSubject | null>(null);
  const [students, setStudents] = useState<TeacherMarksStudent[]>([]);

  // Loading states
  const [examsLoading, setExamsLoading] = useState(true);
  const [examsRefreshing, setExamsRefreshing] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Errors
  const [examsError, setExamsError] = useState('');
  const [subjectsError, setSubjectsError] = useState('');
  const [studentsError, setStudentsError] = useState('');

  // Form states
  const [maxMarks, setMaxMarks] = useState('100');
  const [marksState, setMarksState] = useState<
    Record<string, { marksObtained: string; remarks: string; error?: string }>
  >({});

  // ── 1. Fetch Exams ─────────────────────────────────────────────
  const loadExams = useCallback(async (isRefresh = false) => {
    if (isRefresh) setExamsRefreshing(true);
    else setExamsLoading(true);
    setExamsError('');
    try {
      const res = await getTeacherMarksExams();
      setExams(res.data ?? res ?? []);
    } catch (e: any) {
      setExamsError(e?.response?.data?.message ?? 'Failed to load exams list.');
    } finally {
      setExamsLoading(false);
      setExamsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadExams(); }, [loadExams]);

  // ── 2. Fetch Subjects ──────────────────────────────────────────
  const loadSubjects = async (exam: TeacherMarksExam) => {
    setSelectedExam(exam);
    setSubjectsLoading(true);
    setSubjectsError('');
    try {
      const res = await getTeacherMarksExamSubjects(exam.examId);
      setSubjects(res.data ?? res ?? []);
    } catch (e: any) {
      setSubjectsError(e?.response?.data?.message ?? 'Failed to load exam subjects.');
    } finally {
      setSubjectsLoading(false);
    }
  };

  // ── 3. Fetch Students & Marks ──────────────────────────────────
  const loadStudents = async (subj: TeacherMarksSubject) => {
    if (!selectedExam) return;
    setSelectedSubject(subj);
    setStudentsLoading(true);
    setStudentsError('');
    setMarksState({});
    try {
      const res = await getTeacherMarksExamStudents(selectedExam.examId, subj.subjectId);
      const data = res.data ?? res;
      const studentList: TeacherMarksStudent[] = data.students ?? [];
      setStudents(studentList);

      const defaultMaxMarks = String(data.maxMarks ?? subj.maxMarks ?? 100);
      setMaxMarks(defaultMaxMarks);

      const initialMarks: typeof marksState = {};
      studentList.forEach((s) => {
        initialMarks[s.studentId] = {
          marksObtained:
            s.marksObtained !== null && s.marksObtained !== undefined
              ? String(s.marksObtained)
              : '',
          remarks: s.remarks ?? '',
        };
      });
      setMarksState(initialMarks);
    } catch (e: any) {
      setStudentsError(e?.response?.data?.message ?? 'Failed to load student list.');
    } finally {
      setStudentsLoading(false);
    }
  };

  // ── 4. Validations ─────────────────────────────────────────────
  const handleMarksChange = (studentId: string, val: string, currentMax: number) => {
    setMarksState((prev) => {
      const entry = prev[studentId] || { marksObtained: '', remarks: '' };
      const updated = { ...entry, marksObtained: val };
      if (val.trim() === '') {
        updated.error = undefined;
      } else {
        const parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed < 0) updated.error = 'Must be ≥ 0';
        else if (parsed > currentMax) updated.error = `Max is ${currentMax}`;
        else updated.error = undefined;
      }
      return { ...prev, [studentId]: updated };
    });
  };

  const handleRemarksChange = (studentId: string, val: string) => {
    setMarksState((prev) => {
      const entry = prev[studentId] || { marksObtained: '', remarks: '' };
      return { ...prev, [studentId]: { ...entry, remarks: val } };
    });
  };

  const handleMaxMarksChange = (val: string) => {
    setMaxMarks(val);
    const parsedMax = parseInt(val, 10) || 100;
    setMarksState((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        const entry = updated[id];
        if (entry.marksObtained.trim() !== '') {
          const parsed = parseInt(entry.marksObtained, 10);
          if (isNaN(parsed) || parsed < 0) entry.error = 'Must be ≥ 0';
          else if (parsed > parsedMax) entry.error = `Max is ${parsedMax}`;
          else entry.error = undefined;
        }
      });
      return updated;
    });
  };

  // ── 5. Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedExam || !selectedSubject || saving) return;
    const parsedMax = parseInt(maxMarks, 10);
    if (isNaN(parsedMax) || parsedMax <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive integer for Maximum Marks.');
      return;
    }
    const finalMarks: Array<{ studentId: string; marksObtained: number; remarks?: string }> = [];
    let hasValidationError = false;
    Object.keys(marksState).forEach((studentId) => {
      const entry = marksState[studentId];
      if (entry.error) hasValidationError = true;
      if (entry.marksObtained.trim() !== '') {
        const parsedScore = parseInt(entry.marksObtained, 10);
        if (!isNaN(parsedScore)) {
          finalMarks.push({
            studentId,
            marksObtained: parsedScore,
            remarks: entry.remarks.trim() || undefined,
          });
        }
      }
    });
    if (hasValidationError) {
      Alert.alert('Validation Error', 'Please fix all error highlights before saving.');
      return;
    }
    if (finalMarks.length === 0) {
      Alert.alert('Information', 'Please enter marks for at least one student.');
      return;
    }
    setSaving(true);
    try {
      await saveTeacherMarks(selectedExam.examId, {
        subjectId: selectedSubject.subjectId,
        maxMarks: parsedMax,
        marks: finalMarks,
      });
      Alert.alert('✅ Saved', 'Marks saved successfully.');
      loadStudents(selectedSubject);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save marks. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── 6. Student Row ─────────────────────────────────────────────
  const renderStudentRow = ({ item }: { item: TeacherMarksStudent }) => {
    const state = marksState[item.studentId] || { marksObtained: '', remarks: '' };
    const hasError = !!state.error;
    return (
      <AppCard style={styles.studentRowCard}>
        <View style={styles.studentTopRow}>
          <View style={styles.studentIconBox}>
            <Ionicons name="person" size={15} color={colors.teacher} />
          </View>
          <View style={styles.studentInfoBlock}>
            <Text style={styles.studentName} numberOfLines={1}>{item.studentName}</Text>
            <Text style={styles.studentMeta}>
              Roll: {item.rollNo || 'N/A'}
              {item.admissionNo ? ` · Adm: ${item.admissionNo}` : ''}
            </Text>
            {item.grade ? (
              <Text style={styles.existingGrade}>Grade: {item.grade}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.scoreWrapper}>
            <TextInput
              style={[styles.scoreInput, hasError && styles.scoreInputError]}
              placeholder="Score"
              placeholderTextColor={colors.mutedText}
              value={state.marksObtained}
              keyboardType="number-pad"
              onChangeText={(val) =>
                handleMarksChange(item.studentId, val, parseInt(maxMarks, 10) || 100)
              }
            />
            {hasError ? (
              <Text style={styles.fieldError} numberOfLines={1}>{state.error}</Text>
            ) : null}
          </View>
          <TextInput
            style={styles.remarkInput}
            placeholder="Remarks (optional)"
            placeholderTextColor={colors.mutedText}
            value={state.remarks}
            onChangeText={(val) => handleRemarksChange(item.studentId, val)}
          />
        </View>
      </AppCard>
    );
  };

  // ── 7. Page Routing ────────────────────────────────────────────

  // Case A: Student Marks Entry
  if (selectedExam && selectedSubject) {
    return (
      <ScreenContainer>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <TeacherScreenHeader
            title={selectedSubject.subjectName}
            subtitle={`${selectedExam.examName} · ${selectedSubject.className ?? ''}`}
            onBack={() => {
              setSelectedSubject(null);
              loadSubjects(selectedExam);
            }}
            backLabel="Back to Subjects"
          />

          {/* Max Marks row */}
          <View style={styles.maxMarksRow}>
            <Text style={styles.maxMarksLabel}>Max Marks:</Text>
            <TextInput
              style={styles.maxMarksInput}
              keyboardType="number-pad"
              value={maxMarks}
              onChangeText={handleMaxMarksChange}
              placeholderTextColor={colors.mutedText}
            />
          </View>

          {studentsLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.teacher} size="large" />
              <Text style={styles.loadingText}>Loading students…</Text>
            </View>
          ) : studentsError ? (
            <View style={styles.paddingWrapper}>
              <ErrorState
                error={studentsError}
                onRetry={() => loadStudents(selectedSubject)}
                roleTheme="teacher"
              />
            </View>
          ) : (
            <FlatList
              data={students}
              keyExtractor={(item) => item.studentId}
              renderItem={renderStudentRow}
              contentContainerStyle={styles.studentListContent}
              ListEmptyComponent={
                <EmptyState
                  emoji="👥"
                  title="No Students Available"
                  subtitle="No students found in your assigned sections."
                />
              }
            />
          )}

          {/* Sticky footer */}
          {!studentsLoading && students.length > 0 && (
            <View style={styles.footer}>
              <AppButton
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setSelectedSubject(null);
                  loadSubjects(selectedExam);
                }}
                style={styles.footerBtn}
              />
              <AppButton
                title="Save Marks"
                variant="teacher"
                gradient
                loading={saving}
                onPress={handleSubmit}
                style={styles.footerBtn}
                icon={!saving ? <Ionicons name="checkmark-done-outline" size={16} color={colors.white} /> : undefined}
              />
            </View>
          )}
        </KeyboardAvoidingView>
      </ScreenContainer>
    );
  }

  // Case B: Subject List
  if (selectedExam) {
    return (
      <ScreenContainer>
        <TeacherScreenHeader
          title={selectedExam.examName}
          subtitle="Select subject to enter student marks"
          onBack={() => {
            setSelectedExam(null);
            loadExams(true);
          }}
          backLabel="Back to Exams"
        />

        {subjectsLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.teacher} size="large" />
            <Text style={styles.loadingText}>Loading subjects…</Text>
          </View>
        ) : subjectsError ? (
          <View style={styles.paddingWrapper}>
            <ErrorState error={subjectsError} onRetry={() => loadSubjects(selectedExam)} roleTheme="teacher" />
          </View>
        ) : (
          <FlatList
            data={subjects}
            keyExtractor={(item) => item.subjectId}
            renderItem={({ item }) => (
              <MarksSubjectCard
                subjectName={item.subjectName}
                sectionName={item.sectionName ?? undefined}
                className={item.className ?? undefined}
                maxMarks={item.maxMarks}
                totalStudents={item.totalStudents}
                marksEnteredCount={item.marksEnteredCount}
                onPress={() => loadStudents(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState emoji="📚" title="No Subjects" subtitle="No subjects found for this exam." />
            }
          />
        )}
      </ScreenContainer>
    );
  }

  // Case C: Exam List
  return (
    <ScreenContainer>
      <TeacherScreenHeader
        title="Exam Marks Entry"
        subtitle="View exams and submit student scores"
        badge={exams.length > 0 ? exams.length : undefined}
      />

      {examsLoading && !examsRefreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.teacher} size="large" />
          <Text style={styles.loadingText}>Loading exams…</Text>
        </View>
      ) : examsError ? (
        <View style={styles.paddingWrapper}>
          <ErrorState error={examsError} onRetry={() => loadExams(false)} roleTheme="teacher" />
        </View>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(item) => item.examId}
          renderItem={({ item }) => (
            <MarksExamCard
              examName={item.examName}
              className={item.className ?? ''}
              examDate={item.examDate ?? undefined}
              totalSubjects={item.totalSubjects}
              totalStudents={item.totalStudents}
              marksEnteredCount={item.marksEnteredCount}
              status={item.status}
              onPress={() => loadSubjects(item)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={examsRefreshing}
              onRefresh={() => loadExams(true)}
              tintColor={colors.teacher}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              emoji="📝"
              title="No Exams Scheduled"
              subtitle="There are no active exams associated with your class context."
            />
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.mutedText,
    marginTop: spacing.sm,
  },
  paddingWrapper: {
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  // Max marks row
  maxMarksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  maxMarksLabel: {
    ...typography.label,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  maxMarksInput: {
    width: 72,
    height: 36,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.teacher + '40',
    textAlign: 'center',
    ...typography.label,
    color: colors.teacher,
    fontWeight: '800',
  },
  // Student list
  studentListContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 140,
  },
  studentRowCard: {
    marginBottom: spacing.sm,
  },
  studentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  studentIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.teacher + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInfoBlock: {
    flex: 1,
  },
  studentName: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
  },
  studentMeta: {
    ...typography.captionSmall,
    color: colors.mutedText,
    marginTop: spacing.xxs,
  },
  existingGrade: {
    ...typography.captionSmall,
    color: colors.success,
    fontWeight: '700',
    marginTop: spacing.xxs,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  scoreWrapper: {
    width: 72,
  },
  scoreInput: {
    height: 40,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
  },
  scoreInputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  fieldError: {
    ...typography.captionSmall,
    color: colors.danger,
    fontWeight: '700',
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  remarkInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    ...typography.bodySmall,
    color: colors.text,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    ...shadows.md,
  },
  footerBtn: {
    flex: 1,
    marginVertical: 0,
  },
});

export default TeacherMarksScreen;
