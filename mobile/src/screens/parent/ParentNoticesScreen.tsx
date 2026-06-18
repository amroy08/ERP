import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { fetchParentNotices } from '../../api/mobileApi';
import { ParentScreenHeader } from '../../components/parent/ParentScreenHeader';

interface Notice {
  id: string;
  title: string;
  content: string;
  priority: string;
  publishDate: string;
  targetAudience?: string;
}

const priorityType = (p: string): 'danger' | 'warning' | 'info' =>
  p === 'urgent' ? 'danger' : p === 'high' ? 'warning' : 'info';

export const ParentNoticesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await fetchParentNotices();
      setData(res.data ?? res ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load notices.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <ScreenContainer>
      <ParentScreenHeader
        title="Notices"
        badge={data.filter(n => n.priority === 'urgent' || n.priority === 'high').length || undefined}
        subtitle="School alerts and bulletin circulars"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.parent} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading && <ActivityIndicator color={colors.parent} style={{ marginTop: 40 }} />}
        {error && !loading && <ErrorState error={error} onRetry={() => load(false)} roleTheme="parent" />}

        {!loading && !error && data.map((notice) => (
          <AppCard
            key={notice.id}
            style={[
              styles.noticeCard,
              expanded === notice.id ? { borderColor: colors.parent + '40', borderWidth: 1.5 } : undefined
            ]}
            onPress={() => setExpanded(expanded === notice.id ? null : notice.id)}
          >
            <View style={styles.noticeHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.noticeTitle}>📢  {notice.title}</Text>
                <Text style={styles.noticeMeta}>
                  📅 {new Date(notice.publishDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {notice.targetAudience ? `  ·  👥 ${notice.targetAudience}` : ''}
                </Text>
              </View>
              <StatusBadge label={notice.priority.toUpperCase()} type={priorityType(notice.priority)} />
            </View>
            {expanded === notice.id && notice.content && (
              <View style={styles.noticeBody}>
                <Text style={styles.noticeContent}>{notice.content}</Text>
              </View>
            )}
            <View style={styles.tapHintRow}>
              <Text style={styles.tapHint}>
                {expanded === notice.id ? 'Tap to collapse' : 'Tap to read description'}
              </Text>
              <Ionicons
                name={expanded === notice.id ? "chevron-up" : "chevron-down"}
                size={12}
                color={colors.mutedText}
              />
            </View>
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
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  noticeCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: spacing.sm,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    lineHeight: 20,
  },
  noticeMeta: {
    color: colors.mutedText,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  noticeBody: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: spacing.sm,
  },
  noticeContent: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  tapHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    justifyContent: 'flex-start',
  },
  tapHint: {
    color: colors.mutedText,
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});

export default ParentNoticesScreen;
