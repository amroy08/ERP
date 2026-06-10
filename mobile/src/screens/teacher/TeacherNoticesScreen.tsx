import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { colors } from '../../constants/colors';
import { fetchTeacherNotices } from '../../api/mobileApi';

interface Notice {
  id: string;
  title: string;
  content: string;
  priority: string;
  publishDate: string;
  targetAudience?: string;
}

const priorityType = (p: string): any =>
  p === 'urgent' ? 'danger' : p === 'high' ? 'warning' : 'info';

export const TeacherNoticesScreen: React.FC = () => {
  const [data, setData] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await fetchTeacherNotices();
      setData(res.data ?? res ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load notices.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.teacher} />}
      >
        <Text style={styles.pageTitle}>School Notices</Text>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.teacher} size="large" />
            <Text style={styles.loadingText}>Loading notices…</Text>
          </View>
        )}
        {error && !loading && <ErrorState error={error} onRetry={() => load(false)} roleTheme="teacher" />}

        {!loading && data.map((notice) => (
          <AppCard
            key={notice.id}
            style={[styles.card, expanded === notice.id ? { borderColor: colors.teacher + '55', borderWidth: 1 } : undefined]}
            onPress={() => setExpanded(expanded === notice.id ? null : notice.id)}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>{notice.title}</Text>
                <Text style={styles.noticeMeta}>
                  {new Date(notice.publishDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {notice.targetAudience ? ` · ${notice.targetAudience}` : ''}
                </Text>
              </View>
              <StatusBadge label={notice.priority} type={priorityType(notice.priority)} />
            </View>
            {expanded === notice.id && notice.content && (
              <Text style={styles.content}>{notice.content}</Text>
            )}
            <Text style={styles.tapHint}>{expanded === notice.id ? 'Tap to collapse ↑' : 'Tap to read ↓'}</Text>
          </AppCard>
        ))}

        {!loading && data.length === 0 && !error && (
          <EmptyState emoji="📢" title="No Notices Available" subtitle="There are no announcements or notices posted for you at this time." />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  pageTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 20 },
  card: { marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 4 },
  noticeTitle: { color: colors.white, fontSize: 15, fontWeight: '700', flex: 1 },
  noticeMeta: { color: colors.mutedText, fontSize: 11, marginTop: 3 },
  content: { color: colors.border, fontSize: 14, lineHeight: 22, marginTop: 10, marginBottom: 4 },
  tapHint: { color: colors.mutedText, fontSize: 11, marginTop: 6, fontStyle: 'italic' },
  errorCard: { marginVertical: 16 },
  errorText: { color: colors.danger, fontSize: 14 },
  emptyText: { color: colors.mutedText, fontSize: 14 },
  loadingContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { color: colors.mutedText, marginTop: 12, fontSize: 14 },
});

export default TeacherNoticesScreen;
