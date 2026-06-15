import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { colors } from '../../../constants/colors';
import { AppCard } from '../../../components/AppCard';
import { AppButton } from '../../../components/AppButton';
import { StatusBadge } from '../../../components/StatusBadge';
import { EmptyState } from '../../../components/EmptyState';
import { getTeacherHomeworkSubmissions } from '../../../api/mobileApi';
import { TeacherHomeworkSubmissionListItem } from '../../../types/mobile.types';
import HomeworkReviewModal from './HomeworkReviewModal';

interface TeacherHomeworkSubmissionsViewProps {
  homeworkId: string;
  onBack: () => void;
}

type FilterType = 'all' | 'pending' | 'submitted' | 'late' | 'reviewed' | 'returned';

export const TeacherHomeworkSubmissionsView: React.FC<TeacherHomeworkSubmissionsViewProps> = ({
  homeworkId,
  onBack,
}) => {
  const [data, setData] = useState<{
    homework: any;
    students: TeacherHomeworkSubmissionListItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  
  // Review Modal State
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadSubmissions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await getTeacherHomeworkSubmissions(homeworkId);
      setData(res.data ?? res);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load submissions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [homeworkId]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const getFilteredStudents = () => {
    if (!data?.students) return [];
    return data.students.filter(student => {
      switch (filter) {
        case 'pending':
          return student.status === 'pending';
        case 'submitted':
          return ['submitted', 'late'].includes(student.status);
        case 'late':
          return student.status === 'late';
        case 'reviewed':
          return student.status === 'reviewed';
        case 'returned':
          return student.status === 'returned';
        case 'all':
        default:
          return true;
      }
    });
  };

  const getStatusType = (status: string): 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'reviewed': return 'success';
      case 'returned': return 'danger';
      case 'submitted': return 'info';
      case 'late': return 'warning';
      default: return 'info';
    }
  };

  const renderStudentItem = ({ item }: { item: TeacherHomeworkSubmissionListItem }) => {
    const isPending = item.status === 'pending';

    return (
      <AppCard style={styles.studentCard}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.studentName}>{item.studentName}</Text>
            <Text style={styles.studentMeta}>
              Roll No: {item.rollNo ?? 'N/A'} • Adm: {item.admissionNo ?? 'N/A'}
            </Text>
            
            {/* Indicators */}
            {!isPending && (
              <View style={styles.indicatorRow}>
                {item.hasText && <Text style={styles.indicatorText}>📝 Text answer</Text>}
                {item.hasFile && <Text style={styles.indicatorText}>📁 Attached file</Text>}
              </View>
            )}

            {item.status === 'reviewed' && item.marks !== null && (
              <Text style={styles.marksText}>Score: {item.marks} / 10</Text>
            )}
          </View>

          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <StatusBadge label={item.status} type={getStatusType(item.status)} />
            {!isPending && item.submissionId && (
              <AppButton
                title="Review"
                onPress={() => {
                  setSelectedSubmissionId(item.submissionId!);
                  setModalVisible(true);
                }}
                variant="teacher"
                style={styles.reviewBtn}
                textStyle={{ fontSize: 13 }}
              />
            )}
            {isPending && <Text style={styles.pendingText}>No submission</Text>}
          </View>
        </View>
      </AppCard>
    );
  };

  const renderFilterButton = (label: string, type: FilterType) => {
    const active = filter === type;
    return (
      <TouchableOpacity
        style={[styles.filterBtn, active ? styles.filterBtnActive : null]}
        onPress={() => setFilter(type)}
        activeOpacity={0.8}
      >
        <Text style={[styles.filterBtnText, active ? styles.filterBtnTextActive : null]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Submissions</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.teacher} size="large" />
          <Text style={styles.loadingText}>Loading submissions…</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <AppButton title="Retry" onPress={() => loadSubmissions(false)} variant="teacher" style={{ width: 120 }} />
        </View>
      ) : data ? (
        <View style={{ flex: 1 }}>
          {/* Homework Detail Card */}
          <View style={styles.homeworkDetailCard}>
            <Text style={styles.homeworkTitle}>{data.homework.title}</Text>
            <Text style={styles.homeworkMeta}>
              {data.homework.className} {data.homework.sectionName ?? ''} • {data.homework.subjectName}
            </Text>
            {data.homework.dueDate && (
              <Text style={styles.dueDateText}>
                Due: {new Date(data.homework.dueDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            )}
          </View>

          {/* Filter Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
            style={styles.filterBar}
          >
            {renderFilterButton('All', 'all')}
            {renderFilterButton('Pending', 'pending')}
            {renderFilterButton('Submitted', 'submitted')}
            {renderFilterButton('Late', 'late')}
            {renderFilterButton('Reviewed', 'reviewed')}
            {renderFilterButton('Returned', 'returned')}
          </ScrollView>

          {/* List of student submissions */}
          <FlatList
            data={getFilteredStudents()}
            keyExtractor={item => item.studentId}
            renderItem={renderStudentItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadSubmissions(true)}
                tintColor={colors.teacher}
              />
            }
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                emoji="📝"
                title="No Submissions Found"
                subtitle={`No students match the "${filter}" filter.`}
              />
            }
          />
        </View>
      ) : null}

      {/* Review Modal */}
      {selectedSubmissionId && (
        <HomeworkReviewModal
          visible={modalVisible}
          submissionId={selectedSubmissionId}
          onClose={() => {
            setModalVisible(false);
            setSelectedSubmissionId(null);
          }}
          onSuccess={() => loadSubmissions(true)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.surfaceSoft,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.teacher,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
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
  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  homeworkDetailCard: {
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  homeworkTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  homeworkMeta: {
    fontSize: 13,
    color: colors.mutedText,
    fontWeight: '600',
    marginTop: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '700',
    marginTop: 6,
  },
  filterBar: {
    maxHeight: 48,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  filterScroll: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.teacher,
    borderColor: colors.teacher,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedText,
  },
  filterBtnTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  studentCard: {
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  indicatorRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  indicatorText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.teacher,
    backgroundColor: colors.teacher + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  marksText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
    marginTop: 6,
  },
  reviewBtn: {
    height: 32,
    marginVertical: 0,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  pendingText: {
    fontSize: 11,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
});
export default TeacherHomeworkSubmissionsView;
