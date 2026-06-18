import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, ActivityIndicator, Text,
  FlatList, RefreshControl,
} from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { TeacherScreenHeader } from '../../components/teacher/TeacherScreenHeader';
import { HomeworkManagementCard } from '../../components/teacher/HomeworkManagementCard';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { getTeacherHomework } from '../../api/mobileApi';
import { TeacherHomeworkItem } from '../../types/mobile.types';
import TeacherHomeworkSubmissionsView from './components/TeacherHomeworkSubmissionsView';

export const TeacherHomeworkScreen: React.FC = () => {
  const [homeworkList, setHomeworkList] = useState<TeacherHomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<string | null>(null);

  const loadHomework = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await getTeacherHomework();
      const list = res.data ?? res;
      setHomeworkList(list);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load assigned homework list.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHomework();
  }, [loadHomework]);

  // Submissions sub-view
  if (selectedHomeworkId) {
    return (
      <ScreenContainer>
        <TeacherHomeworkSubmissionsView
          homeworkId={selectedHomeworkId}
          onBack={() => {
            setSelectedHomeworkId(null);
            loadHomework(true);
          }}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <TeacherScreenHeader
        title="Assigned Homework"
        subtitle="Review and grade student submissions"
        badge={homeworkList.length > 0 ? homeworkList.length : undefined}
      />

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.teacher} size="large" />
          <Text style={styles.loadingText}>Loading assigned homework…</Text>
        </View>
      ) : error ? (
        <View style={styles.paddingWrapper}>
          <ErrorState error={error} onRetry={() => loadHomework(false)} roleTheme="teacher" />
        </View>
      ) : (
        <FlatList
          data={homeworkList}
          keyExtractor={(item) => item.homeworkId}
          renderItem={({ item }) => (
            <HomeworkManagementCard
              title={item.title}
              subjectName={item.subjectName ?? ''}
              className={item.className ?? ''}
              sectionName={item.sectionName ?? undefined}
              dueDate={item.dueDate ?? undefined}
              totalStudents={item.totalStudents}
              submittedCount={item.submittedCount}
              pendingCount={item.pendingCount}
              reviewedCount={item.reviewedCount}
              description={item.description ?? undefined}
              onReview={() => setSelectedHomeworkId(item.homeworkId)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadHomework(true)}
              tintColor={colors.teacher}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              emoji="📚"
              title="No Homework Found"
              subtitle="You have not assigned any homework yet."
            />
          }
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
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
});

export default TeacherHomeworkScreen;
