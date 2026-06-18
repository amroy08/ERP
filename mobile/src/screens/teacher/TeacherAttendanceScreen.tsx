import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { TeacherScreenHeader } from '../../components/teacher/TeacherScreenHeader';
import { colors } from '../../constants/colors';
import { spacing, radii, sizing } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { shadows } from '../../constants/shadows';
import apiClient from '../../api/apiClient';

interface ClassSection {
  classId: string;
  className: string;
  sectionName: string;
  studentCount: number;
  attendanceMarked: boolean;
}

interface StudentAttendance {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  status: 'present' | 'absent' | 'late';
}

type AttendanceStatus = 'present' | 'absent' | 'late';

const STATUS_CONFIG: Record<AttendanceStatus, { color: string; icon: any; label: string }> = {
  present: { color: colors.success, icon: 'checkmark-circle', label: 'Present' },
  absent: { color: colors.danger, icon: 'close-circle', label: 'Absent' },
  late: { color: colors.warning, icon: 'time', label: 'Late' },
};

export const TeacherAttendanceScreen: React.FC = () => {
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState<ClassSection | null>(null);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadClasses = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/mobile/teacher/attendance-classes');
      setClasses(res.data?.data ?? res.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load classes.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  const openClass = async (cls: ClassSection) => {
    setSelectedClass(cls);
    setStudentsLoading(true);
    try {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const res = await apiClient.get(
        `/mobile/teacher/attendance-students?classId=${cls.classId}&date=${today}`
      );
      const raw: any[] = res.data?.data ?? res.data ?? [];
      setStudents(raw.map((s: any) => ({
        studentId: s.studentId ?? s.id,
        studentName: s.studentName ?? s.name,
        admissionNumber: s.admissionNumber ?? '',
        status: s.status ?? 'present',
      })));
    } catch {
      Alert.alert('Error', 'Could not load students for this class.');
      setSelectedClass(null);
    } finally {
      setStudentsLoading(false);
    }
  };

  const toggleStatus = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.studentId !== studentId) return s;
        const next: AttendanceStatus =
          s.status === 'present' ? 'absent' : s.status === 'absent' ? 'late' : 'present';
        return { ...s, status: next };
      })
    );
  };

  const setStudentStatus = (studentId: string, status: AttendanceStatus) => {
    setStudents((prev) => prev.map((s) => s.studentId === studentId ? { ...s, status } : s));
  };

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'present' })));
  };

  const resetAll = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: 'present' })));
  };

  const submitAttendance = async () => {
    if (!selectedClass || saving) return;
    setSaving(true);
    try {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      await apiClient.post('/mobile/teacher/attendance-submit', {
        classId: selectedClass.classId,
        date: today,
        records: students.map((s) => ({ studentId: s.studentId, status: s.status })),
      });
      Alert.alert('✅ Saved', 'Attendance submitted successfully.');
      setSelectedClass(null);
      loadClasses();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message ?? 'Failed to submit attendance.');
    } finally {
      setSaving(false);
    }
  };

  // Summary counts
  const presentCount = students.filter((s) => s.status === 'present').length;
  const absentCount = students.filter((s) => s.status === 'absent').length;
  const lateCount = students.filter((s) => s.status === 'late').length;

  // ── Student Marking View ────────────────────────────────────
  if (selectedClass) {
    return (
      <ScreenContainer>
        <TeacherScreenHeader
          title={`${selectedClass.className} – ${selectedClass.sectionName}`}
          subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })}
          onBack={() => setSelectedClass(null)}
          backLabel="All Classes"
          badge={`${students.length} Students`}
        />

        {/* Quick action row */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={markAllPresent} activeOpacity={0.75}>
            <Ionicons name="checkmark-done-outline" size={15} color={colors.success} />
            <Text style={[styles.quickActionText, { color: colors.success }]}>Mark All Present</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={resetAll} activeOpacity={0.75}>
            <Ionicons name="refresh-outline" size={15} color={colors.mutedText} />
            <Text style={[styles.quickActionText, { color: colors.mutedText }]}>Reset</Text>
          </TouchableOpacity>
        </View>

        {studentsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.teacher} size="large" />
            <Text style={styles.loadingText}>Loading student list…</Text>
          </View>
        ) : (
          <>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.studentListContent}>
              {students.map((s) => {
                const cfg = STATUS_CONFIG[s.status];
                return (
                  <AppCard key={s.studentId} style={[styles.studentCard, { borderLeftColor: cfg.color, borderLeftWidth: 3 }]}>
                    <View style={styles.studentRow}>
                      {/* Name + adm */}
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{s.studentName}</Text>
                        <Text style={styles.studentAdm}>{s.admissionNumber}</Text>
                      </View>
                      {/* Status segmented toggle */}
                      <View style={styles.segmentedControl}>
                        {(['present', 'absent', 'late'] as AttendanceStatus[]).map((st) => {
                          const c = STATUS_CONFIG[st];
                          const isActive = s.status === st;
                          return (
                            <TouchableOpacity
                              key={st}
                              style={[
                                styles.segment,
                                isActive
                                  ? { backgroundColor: c.color, borderColor: c.color }
                                  : { backgroundColor: colors.surface, borderColor: colors.border },
                              ]}
                              onPress={() => setStudentStatus(s.studentId, st)}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name={c.icon}
                                size={14}
                                color={isActive ? colors.white : colors.mutedText}
                              />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </AppCard>
                );
              })}
              <View style={{ height: 160 }} />
            </ScrollView>

            {/* Summary + submit sticky footer */}
            <View style={styles.stickyFooter}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryChip}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  <Text style={[styles.summaryCount, { color: colors.success }]}>{presentCount}</Text>
                  <Text style={styles.summaryLabel}>Present</Text>
                </View>
                <View style={styles.summaryChip}>
                  <Ionicons name="close-circle" size={13} color={colors.danger} />
                  <Text style={[styles.summaryCount, { color: colors.danger }]}>{absentCount}</Text>
                  <Text style={styles.summaryLabel}>Absent</Text>
                </View>
                <View style={styles.summaryChip}>
                  <Ionicons name="time" size={13} color={colors.warning} />
                  <Text style={[styles.summaryCount, { color: colors.warning }]}>{lateCount}</Text>
                  <Text style={styles.summaryLabel}>Late</Text>
                </View>
                <View style={[styles.summaryChip, styles.totalChip]}>
                  <Text style={styles.totalCount}>{students.length}</Text>
                  <Text style={styles.summaryLabel}>Total</Text>
                </View>
              </View>
              <AppButton
                title={saving ? 'Submitting…' : 'Submit Attendance'}
                onPress={submitAttendance}
                loading={saving}
                gradient
                variant="teacher"
                icon={!saving ? <Ionicons name="checkmark-done-outline" size={18} color={colors.white} /> : undefined}
              />
            </View>
          </>
        )}
      </ScreenContainer>
    );
  }

  // ── Class List View ────────────────────────────────────────
  return (
    <ScreenContainer>
      <TeacherScreenHeader
        title="Mark Attendance"
        subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        badge={classes.length > 0 ? `${classes.length} Class${classes.length > 1 ? 'es' : ''}` : undefined}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadClasses(true)} tintColor={colors.teacher} />
        }
        contentContainerStyle={styles.listContent}
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.teacher} size="large" />
            <Text style={styles.loadingText}>Loading assigned classes…</Text>
          </View>
        )}
        {error && !loading && (
          <ErrorState error={error} onRetry={() => loadClasses(false)} roleTheme="teacher" />
        )}

        {!loading && !error && classes.map((cls) => (
          <AppCard
            key={cls.classId}
            style={[
              styles.classCard,
              cls.attendanceMarked
                ? { borderColor: colors.success + '50', borderWidth: 1 }
                : { borderColor: colors.teacher + '30', borderWidth: 1 },
            ]}
            onPress={() => openClass(cls)}
          >
            <View style={styles.classRow}>
              <View style={styles.classIconBox}>
                <Ionicons
                  name={cls.attendanceMarked ? 'checkmark-circle' : 'people-outline'}
                  size={22}
                  color={cls.attendanceMarked ? colors.success : colors.teacher}
                />
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{cls.className} – {cls.sectionName}</Text>
                <Text style={styles.classMeta}>{cls.studentCount} students</Text>
              </View>
              {cls.attendanceMarked ? (
                <StatusBadge label="Done" type="success" />
              ) : (
                <View style={styles.markNowBadge}>
                  <Text style={styles.markNowText}>Mark Now</Text>
                  <Ionicons name="chevron-forward" size={13} color={colors.teacher} />
                </View>
              )}
            </View>
          </AppCard>
        ))}

        {!loading && classes.length === 0 && !error && (
          <EmptyState
            emoji="🏫"
            title="No Assigned Classes"
            subtitle="You have no assigned classes or sections to mark attendance for today."
          />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
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
  classCard: {
    marginBottom: spacing.sm,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  classIconBox: {
    width: sizing.iconBoxSmall,
    height: sizing.iconBoxSmall,
    borderRadius: radii.md,
    backgroundColor: colors.teacher + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
  },
  classMeta: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: spacing.xxs,
  },
  markNowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.teacher + '12',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.teacher + '30',
  },
  markNowText: {
    ...typography.captionSmall,
    color: colors.teacher,
    fontWeight: '700',
  },
  // Marking view
  quickActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionText: {
    ...typography.captionSmall,
    fontWeight: '700',
  },
  studentListContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  studentCard: {
    marginBottom: spacing.sm,
    paddingLeft: spacing.md,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
  },
  studentAdm: {
    ...typography.captionSmall,
    color: colors.mutedText,
    marginTop: spacing.xxs,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    ...shadows.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryChip: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
  },
  totalChip: {
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  summaryCount: {
    ...typography.headingMedium,
    fontWeight: '800',
  },
  totalCount: {
    ...typography.headingMedium,
    color: colors.text,
    fontWeight: '800',
  },
  summaryLabel: {
    ...typography.captionSmall,
    color: colors.mutedText,
    fontWeight: '600',
  },
});

export default TeacherAttendanceScreen;
