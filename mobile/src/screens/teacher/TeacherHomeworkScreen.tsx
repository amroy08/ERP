import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { AppButton } from '../../components/AppButton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { colors } from '../../constants/colors';
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

  const renderHomeworkItem = ({ item }: { item: TeacherHomeworkItem }) => {
    return (
      <AppCard style={styles.hwCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.hwTitle}>{item.title}</Text>
          <Text style={styles.classBadge}>
            {item.className} {item.sectionName ?? ''}
          </Text>
        </View>

        <Text style={styles.subjectName}>{item.subjectName}</Text>
        
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        ) : null}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{item.totalStudents ?? 0}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.info }]}>{item.submittedCount ?? 0}</Text>
            <Text style={styles.statLabel}>Submitted</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{item.pendingCount ?? 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.success }]}>{item.reviewedCount ?? 0}</Text>
            <Text style={styles.statLabel}>Reviewed</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {item.dueDate ? (
            <Text style={styles.dueDateText}>
              Due: {new Date(item.dueDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
              })}
            </Text>
          ) : <View />}

          <AppButton
            title="Submissions"
            onPress={() => setSelectedHomeworkId(item.homeworkId)}
            variant="teacher"
            style={styles.actionBtn}
            textStyle={{ fontSize: 13 }}
          />
        </View>
      </AppCard>
    );
  };

  if (selectedHomeworkId) {
    return (
      <ScreenContainer>
        <TeacherHomeworkSubmissionsView
          homeworkId={selectedHomeworkId}
          onBack={() => {
            setSelectedHomeworkId(null);
            loadHomework(true); // reload counters after coming back
          }}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Assigned Homework</Text>
          <Text style={styles.headerSub}>Review and grade student submissions</Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.teacher} size="large" />
            <Text style={styles.loadingText}>Loading assigned homework…</Text>
          </View>
        ) : error ? (
          <ErrorState error={error} onRetry={() => loadHomework(false)} roleTheme="teacher" />
        ) : (
          <FlatList
            data={homeworkList}
            keyExtractor={item => item.homeworkId}
            renderItem={renderHomeworkItem}
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
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },
  headerSub: {
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 4,
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
    paddingBottom: 40,
  },
  hwCard: {
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  hwTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },
  classBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.teacher,
    backgroundColor: colors.teacher + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mutedText,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: colors.text,
    marginTop: 8,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSoft,
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    gap: 4,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
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
  dueDateText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '700',
  },
  actionBtn: {
    height: 36,
    marginVertical: 0,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
});
export default TeacherHomeworkScreen;
