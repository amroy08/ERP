import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { StatusBadge } from '../../components/StatusBadge';
import { colors } from '../../constants/colors';
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

  // Loading and refreshing states
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

  // ── 1. Fetch Exams ─────────────────────────────────────────────────────────
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

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  // ── 2. Fetch Subjects ──────────────────────────────────────────────────────
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

  // ── 3. Fetch Students & Marks ──────────────────────────────────────────────
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

      // Pre-fill existing marks and remarks
      const initialMarks: typeof marksState = {};
      studentList.forEach(s => {
        initialMarks[s.studentId] = {
          marksObtained: s.marksObtained !== null && s.marksObtained !== undefined ? String(s.marksObtained) : '',
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

  // ── 4. Live Input Validations ──────────────────────────────────────────────
  const handleMarksChange = (studentId: string, val: string, currentMax: number) => {
    setMarksState(prev => {
      const entry = prev[studentId] || { marksObtained: '', remarks: '' };
      const updated = { ...entry, marksObtained: val };

      // Validate input value
      if (val.trim() === '') {
        updated.error = undefined;
      } else {
        const parsed = parseInt(val, 10);
        if (isNaN(parsed) || parsed < 0) {
          updated.error = 'Must be ≥ 0';
        } else if (parsed > currentMax) {
          updated.error = `Max is ${currentMax}`;
        } else {
          updated.error = undefined;
        }
      }

      return { ...prev, [studentId]: updated };
    });
  };

  const handleRemarksChange = (studentId: string, val: string) => {
    setMarksState(prev => {
      const entry = prev[studentId] || { marksObtained: '', remarks: '' };
      return { ...prev, [studentId]: { ...entry, remarks: val } };
    });
  };

  // Re-validate all student marks if maxMarks changes
  const handleMaxMarksChange = (val: string) => {
    setMaxMarks(val);
    const parsedMax = parseInt(val, 10) || 100;
    setMarksState(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        const entry = updated[id];
        if (entry.marksObtained.trim() !== '') {
          const parsed = parseInt(entry.marksObtained, 10);
          if (isNaN(parsed) || parsed < 0) {
            entry.error = 'Must be ≥ 0';
          } else if (parsed > parsedMax) {
            entry.error = `Max is ${parsedMax}`;
          } else {
            entry.error = undefined;
          }
        }
      });
      return updated;
    });
  };

  // ── 5. Save/Submit Marks ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedExam || !selectedSubject || saving) return;

    const parsedMax = parseInt(maxMarks, 10);
    if (isNaN(parsedMax) || parsedMax <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive integer for Maximum Marks.');
      return;
    }

    // Assemble payload
    const finalMarks: Array<{ studentId: string; marksObtained: number; remarks?: string }> = [];
    let hasValidationError = false;

    Object.keys(marksState).forEach(studentId => {
      const entry = marksState[studentId];
      if (entry.error) {
        hasValidationError = true;
      }
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
      
      // Refresh current student list view
      loadStudents(selectedSubject);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to save marks. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── 6. Render Sub-views ────────────────────────────────────────────────────

  // Render 1: Exam List View
  const renderExamItem = ({ item }: { item: TeacherMarksExam }) => (
    <AppCard style={styles.card} onPress={() => loadSubjects(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.examTitle}>{item.examName}</Text>
        <Text style={styles.classBadge}>{item.className}</Text>
      </View>
      <Text style={styles.examDate}>Date: {item.examDate ?? 'N/A'}</Text>
      
      <View style={styles.statsStrip}>
        <View style={styles.statCell}>
          <Text style={styles.statVal}>{item.totalSubjects ?? 0}</Text>
          <Text style={styles.statLabel}>Subjects</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statVal}>{item.totalStudents ?? 0}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={[styles.statVal, { color: colors.teacher }]}>
            {item.marksEnteredCount ?? 0}
          </Text>
          <Text style={styles.statLabel}>Marks Entered</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <StatusBadge label={item.status ?? 'scheduled'} type={item.status === 'completed' ? 'success' : 'info'} />
        <Text style={styles.actionLinkText}>Manage Marks →</Text>
      </View>
    </AppCard>
  );

  // Render 2: Subject List View
  const renderSubjectItem = ({ item }: { item: TeacherMarksSubject }) => (
    <AppCard style={styles.card} onPress={() => loadStudents(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.subjTitle}>{item.subjectName}</Text>
        <Text style={styles.classBadge}>Max: {item.maxMarks ?? 100}</Text>
      </View>
      <Text style={styles.subjMeta}>Sections: {item.sectionName ?? 'N/A'}</Text>
      
      <View style={styles.statsStrip}>
        <View style={styles.statCell}>
          <Text style={styles.statVal}>{item.totalStudents ?? 0}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={[styles.statVal, { color: colors.teacher }]}>
            {item.marksEnteredCount ?? 0}
          </Text>
          <Text style={styles.statLabel}>Graded</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View />
        <Text style={styles.actionLinkText}>Enter Marks →</Text>
      </View>
    </AppCard>
  );

  // Render 3: Student Row in Entry List
  const renderStudentRow = ({ item }: { item: TeacherMarksStudent }) => {
    const state = marksState[item.studentId] || { marksObtained: '', remarks: '' };
    return (
      <View style={styles.studentRow}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName} numberOfLines={1}>{item.studentName}</Text>
          <Text style={styles.studentMeta}>
            Roll: {item.rollNo || 'N/A'} {item.admissionNo ? ` · Adm: ${item.admissionNo}` : ''}
          </Text>
          {item.grade ? (
            <Text style={styles.gradeText}>Existing Grade: {item.grade}</Text>
          ) : null}
        </View>

        <View style={styles.inputsContainer}>
          <View style={styles.inputBoxContainer}>
            <TextInput
              style={[styles.scoreInput, state.error ? styles.scoreInputError : null]}
              placeholder="Score"
              value={state.marksObtained}
              keyboardType="number-pad"
              onChangeText={val => handleMarksChange(item.studentId, val, parseInt(maxMarks, 10) || 100)}
            />
            {state.error ? (
              <Text style={styles.fieldError} numberOfLines={1}>{state.error}</Text>
            ) : null}
          </View>

          <TextInput
            style={styles.remarkInput}
            placeholder="Remark"
            value={state.remarks}
            onChangeText={val => handleRemarksChange(item.studentId, val)}
          />
        </View>
      </View>
    );
  };

  // ── 7. Page Routing ────────────────────────────────────────────────────────

  // Case A: Student Marks Entry Screen
  if (selectedExam && selectedSubject) {
    return (
      <ScreenContainer>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flexContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                setSelectedSubject(null);
                loadSubjects(selectedExam);
              }}
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>← Back to Subjects</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{selectedSubject.subjectName}</Text>
            <Text style={styles.headerSub}>
              {selectedExam.examName} ({selectedSubject.className})
            </Text>

            <View style={styles.maxMarksWrapper}>
              <Text style={styles.maxMarksLabel}>Max Marks for Exam:</Text>
              <TextInput
                style={styles.maxMarksInput}
                keyboardType="number-pad"
                value={maxMarks}
                onChangeText={handleMaxMarksChange}
              />
            </View>
          </View>

          {studentsLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.teacher} size="large" />
              <Text style={styles.loadingText}>Loading students for marking…</Text>
            </View>
          ) : studentsError ? (
            <ErrorState
              error={studentsError}
              onRetry={() => loadStudents(selectedSubject)}
              roleTheme="teacher"
            />
          ) : (
            <FlatList
              data={students}
              keyExtractor={item => item.studentId}
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

          {/* Save/Cancel Sticky Footer */}
          {!studentsLoading && students.length > 0 && (
            <View style={styles.footerContainer}>
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
                loading={saving}
                onPress={handleSubmit}
                style={styles.footerBtn}
              />
            </View>
          )}
        </KeyboardAvoidingView>
      </ScreenContainer>
    );
  }

  // Case B: Subject List View
  if (selectedExam) {
    return (
      <ScreenContainer>
        <View style={styles.flexContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                setSelectedExam(null);
                loadExams(true);
              }}
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>← Back to Exams</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{selectedExam.examName}</Text>
            <Text style={styles.headerSub}>Select subject to enter student marks</Text>
          </View>

          {subjectsLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.teacher} size="large" />
              <Text style={styles.loadingText}>Loading exam subjects…</Text>
            </View>
          ) : subjectsError ? (
            <ErrorState
              error={subjectsError}
              onRetry={() => loadSubjects(selectedExam)}
              roleTheme="teacher"
            />
          ) : (
            <FlatList
              data={subjects}
              keyExtractor={item => item.subjectId}
              renderItem={renderSubjectItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <EmptyState
                  emoji="📚"
                  title="No Subjects"
                  subtitle="No subjects found in your assigned class context."
                />
              }
            />
          )}
        </View>
      </ScreenContainer>
    );
  }

  // Case C: Exam List View
  return (
    <ScreenContainer>
      <View style={styles.flexContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Exam Marks Entry</Text>
          <Text style={styles.headerSub}>View exams and submit student scores</Text>
        </View>

        {examsLoading && !examsRefreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.teacher} size="large" />
            <Text style={styles.loadingText}>Loading exams…</Text>
          </View>
        ) : examsError ? (
          <ErrorState error={examsError} onRetry={() => loadExams(false)} roleTheme="teacher" />
        ) : (
          <FlatList
            data={exams}
            keyExtractor={item => item.examId}
            renderItem={renderExamItem}
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
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  headerSub: {
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 4,
  },
  backBtn: {
    marginBottom: 8,
  },
  backBtnText: {
    color: colors.teacher,
    fontWeight: '700',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: colors.mutedText,
    marginTop: 12,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  studentListContent: {
    paddingHorizontal: 16,
    paddingBottom: 120, // offset for sticky buttons footer
  },
  card: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  examTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  subjTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  classBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.teacher,
    backgroundColor: colors.teacher + '12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  examDate: {
    fontSize: 13,
    color: colors.mutedText,
    marginTop: 4,
    fontWeight: '500',
  },
  subjMeta: {
    fontSize: 13,
    color: colors.mutedText,
    marginTop: 4,
  },
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSoft,
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    gap: 4,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.mutedText,
    marginTop: 2,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
  },
  actionLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.teacher,
  },
  maxMarksWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  maxMarksLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  maxMarksInput: {
    width: 60,
    height: 30,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 6,
    textAlign: 'center',
    fontWeight: '700',
    color: colors.teacher,
    fontSize: 14,
    padding: 0,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1.2,
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  studentMeta: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  gradeText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  inputsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  inputBoxContainer: {
    flex: 1,
    alignItems: 'stretch',
  },
  scoreInput: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreInputError: {
    borderColor: colors.danger,
    backgroundColor: colors.danger + '06',
  },
  fieldError: {
    color: colors.danger,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '600',
  },
  remarkInput: {
    flex: 1.5,
    backgroundColor: colors.surfaceSoft,
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 8,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 8,
  },
  footerBtn: {
    flex: 1,
    marginVertical: 0,
  },
});

export default TeacherMarksScreen;
