import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity, Alert,
} from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { colors } from '../../constants/colors';
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
      const today = new Date().toISOString().slice(0, 10);
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
        const next: StudentAttendance['status'] =
          s.status === 'present' ? 'absent' : s.status === 'absent' ? 'late' : 'present';
        return { ...s, status: next };
      })
    );
  };

  const submitAttendance = async () => {
    if (!selectedClass) return;
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
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

  const statusColor = (s: string) => {
    if (s === 'present') return colors.success;
    if (s === 'absent') return colors.danger;
    return colors.warning;
  };
  const statusEmoji = (s: string) => s === 'present' ? '✅' : s === 'absent' ? '❌' : '⚠️';

  // ── Student marking view ──────────────────────────────────
  if (selectedClass) {
    return (
      <ScreenContainer>
        <View style={styles.markingHeader}>
          <TouchableOpacity onPress={() => setSelectedClass(null)}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.markingTitle}>{selectedClass.className} – {selectedClass.sectionName}</Text>
            <Text style={styles.markingDate}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })}</Text>
          </View>
        </View>

        {studentsLoading ? (
          <ActivityIndicator color={colors.teacher} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.tapHint}>Tap a student to toggle Present → Absent → Late</Text>
            {students.map((s) => (
              <TouchableOpacity key={s.studentId} onPress={() => toggleStatus(s.studentId)} activeOpacity={0.75}>
                <AppCard style={[styles.studentCard, { borderColor: statusColor(s.status) + '55', borderWidth: 1 }]}>
                  <View style={styles.studentRow}>
                    <View style={[styles.statusCircle, { backgroundColor: statusColor(s.status) + '22', borderColor: statusColor(s.status) }]}>
                      <Text style={{ fontSize: 16 }}>{statusEmoji(s.status)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentName}>{s.studentName}</Text>
                      <Text style={styles.studentAdm}>{s.admissionNumber}</Text>
                    </View>
                    <Text style={[styles.statusLabel, { color: statusColor(s.status) }]}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </Text>
                  </View>
                </AppCard>
              </TouchableOpacity>
            ))}

            {/* Summary */}
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryChip, { color: colors.success, borderColor: colors.success + '66' }]}>
                ✅ {students.filter((s) => s.status === 'present').length} Present
              </Text>
              <Text style={[styles.summaryChip, { color: colors.danger, borderColor: colors.danger + '66' }]}>
                ❌ {students.filter((s) => s.status === 'absent').length} Absent
              </Text>
              <Text style={[styles.summaryChip, { color: colors.warning, borderColor: colors.warning + '66' }]}>
                ⚠️ {students.filter((s) => s.status === 'late').length} Late
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, saving ? { opacity: 0.6 } : undefined]}
              onPress={submitAttendance}
              disabled={saving}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>{saving ? 'Submitting…' : 'Submit Attendance'}</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </ScreenContainer>
    );
  }

  // ── Class list view ───────────────────────────────────────
  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadClasses(true)} tintColor={colors.teacher} />}
      >
        <Text style={styles.pageTitle}>Mark Attendance</Text>
        <Text style={styles.pageDate}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </Text>

        {loading && <ActivityIndicator color={colors.teacher} style={{ marginTop: 40 }} />}
        {error && !loading && <AppCard style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></AppCard>}

        {!loading && classes.map((cls) => (
          <AppCard
            key={cls.classId}
            style={[styles.classCard, cls.attendanceMarked ? { borderColor: colors.success + '44', borderWidth: 1 } : undefined]}
            onPress={() => openClass(cls)}
          >
            <View style={styles.classRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.className}>{cls.className} – {cls.sectionName}</Text>
                <Text style={styles.classMeta}>{cls.studentCount} students</Text>
              </View>
              {cls.attendanceMarked ? (
                <View style={styles.doneBadge}>
                  <Text style={styles.doneBadgeText}>✅ Done</Text>
                </View>
              ) : (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>Mark →</Text>
                </View>
              )}
            </View>
          </AppCard>
        ))}

        {!loading && classes.length === 0 && !error && (
          <AppCard><Text style={styles.emptyText}>No classes assigned for today.</Text></AppCard>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  pageTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 52, marginBottom: 4 },
  pageDate: { color: colors.mutedText, fontSize: 13, marginBottom: 16 },
  classCard: { marginBottom: 10 },
  classRow: { flexDirection: 'row', alignItems: 'center' },
  className: { color: colors.white, fontSize: 16, fontWeight: '700' },
  classMeta: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  doneBadge: { backgroundColor: colors.success + '22', borderRadius: 8, borderWidth: 1, borderColor: colors.success, paddingHorizontal: 10, paddingVertical: 5 },
  doneBadgeText: { color: colors.success, fontSize: 12, fontWeight: '700' },
  pendingBadge: { backgroundColor: colors.teacher + '22', borderRadius: 8, borderWidth: 1, borderColor: colors.teacher, paddingHorizontal: 10, paddingVertical: 5 },
  pendingBadgeText: { color: colors.teacher, fontSize: 12, fontWeight: '700' },
  // Marking view
  markingHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 52, marginBottom: 16 },
  backBtn: { color: colors.teacher, fontSize: 15, fontWeight: '700', paddingRight: 4 },
  markingTitle: { color: colors.white, fontSize: 18, fontWeight: '800' },
  markingDate: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  tapHint: { color: colors.mutedText, fontSize: 12, marginBottom: 12, fontStyle: 'italic' },
  studentCard: { marginBottom: 6 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  studentName: { color: colors.white, fontSize: 15, fontWeight: '600' },
  studentAdm: { color: colors.mutedText, fontSize: 11, marginTop: 1 },
  statusLabel: { fontSize: 12, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  summaryChip: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', borderWidth: 1, borderRadius: 10, paddingVertical: 8, overflow: 'hidden' },
  submitBtn: { backgroundColor: colors.teacher, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 8 },
  submitBtnText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  errorCard: { marginVertical: 16 },
  errorText: { color: colors.danger, fontSize: 14 },
  emptyText: { color: colors.mutedText, fontSize: 14 },
});

export default TeacherAttendanceScreen;
