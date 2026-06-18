import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { TeacherScreenHeader } from '../../components/teacher/TeacherScreenHeader';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { shadows } from '../../constants/shadows';
import { fetchTeacherNotices } from '../../api/mobileApi';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Notice {
  id: string;
  title: string;
  content: string;
  priority: string;
  publishDate: string;
  targetAudience?: string;
}

const priorityType = (p: string): any =>
  p?.toLowerCase() === 'urgent' ? 'danger'
  : p?.toLowerCase() === 'high' ? 'warning'
  : 'info';

const priorityBorderColor = (p: string): string => {
  const lp = p?.toLowerCase();
  if (lp === 'urgent') return colors.danger;
  if (lp === 'high') return colors.warning;
  return colors.teacher + '40';
};

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

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === id ? null : id);
  };

  const urgentNotices = data.filter((n) => n.priority?.toLowerCase() === 'urgent');

  return (
    <ScreenContainer>
      <TeacherScreenHeader
        title="School Notices"
        subtitle="Stay informed about school announcements"
        badge={data.length > 0 ? data.length : undefined}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.teacher} />
        }
      >
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.teacher} size="large" />
            <Text style={styles.loadingText}>Loading notices…</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.paddingWrapper}>
            <ErrorState error={error} onRetry={() => load(false)} roleTheme="teacher" />
          </View>
        )}

        {/* Urgent Banner */}
        {!loading && urgentNotices.length > 0 && (
          <View style={styles.urgentBanner}>
            <Ionicons name="alert-circle" size={18} color={colors.danger} />
            <Text style={styles.urgentBannerText}>
              {urgentNotices.length} Urgent Notice{urgentNotices.length > 1 ? 's' : ''} — Tap to read
            </Text>
          </View>
        )}

        {!loading && !error && (
          <View style={styles.listContainer}>
            {data.map((notice) => {
              const isExpanded = expanded === notice.id;
              const borderColor = priorityBorderColor(notice.priority);
              return (
                <TouchableOpacity
                  key={notice.id}
                  activeOpacity={0.85}
                  onPress={() => toggleExpand(notice.id)}
                >
                  <AppCard
                    style={[
                      styles.noticeCard,
                      { borderLeftColor: borderColor, borderLeftWidth: 4 },
                      isExpanded && styles.noticeCardExpanded,
                    ]}
                  >
                    {/* Header row */}
                    <View style={styles.cardHeader}>
                      <View style={styles.titleBlock}>
                        <Text style={styles.noticeTitle} numberOfLines={isExpanded ? undefined : 2}>
                          {notice.title}
                        </Text>
                        <View style={styles.metaRow}>
                          <Text style={styles.noticeDateText}>
                            {new Date(notice.publishDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </Text>
                          {notice.targetAudience && (
                            <>
                              <Text style={styles.metaSep}>·</Text>
                              <View style={styles.audienceChip}>
                                <Text style={styles.audienceChipText}>{notice.targetAudience}</Text>
                              </View>
                            </>
                          )}
                        </View>
                      </View>
                      <View style={styles.rightCol}>
                        <StatusBadge
                          label={notice.priority?.toUpperCase() ?? 'NORMAL'}
                          type={priorityType(notice.priority)}
                        />
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={colors.mutedText}
                          style={styles.chevron}
                        />
                      </View>
                    </View>

                    {/* Expanded content */}
                    {isExpanded && notice.content ? (
                      <View style={styles.contentBox}>
                        <Text style={styles.contentText}>{notice.content}</Text>
                      </View>
                    ) : null}
                  </AppCard>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {!loading && data.length === 0 && !error && (
          <EmptyState
            emoji="📢"
            title="No Notices Available"
            subtitle="There are no announcements posted for you at this time."
          />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
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
  paddingWrapper: {
    paddingHorizontal: spacing.xl,
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.danger + '30',
    gap: spacing.sm,
  },
  urgentBannerText: {
    ...typography.labelSmall,
    color: colors.danger,
    fontWeight: '700',
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  noticeCard: {
    marginBottom: spacing.sm,
    paddingLeft: spacing.md,
  },
  noticeCardExpanded: {
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  titleBlock: {
    flex: 1,
  },
  noticeTitle: {
    ...typography.label,
    color: colors.text,
    fontWeight: '700',
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  noticeDateText: {
    ...typography.captionSmall,
    color: colors.mutedText,
    fontWeight: '500',
  },
  metaSep: {
    ...typography.captionSmall,
    color: colors.mutedText,
  },
  audienceChip: {
    backgroundColor: colors.teacher + '12',
    borderRadius: radii.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  audienceChipText: {
    ...typography.captionSmall,
    color: colors.teacher,
    fontWeight: '700',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  chevron: {
    marginTop: spacing.xs,
  },
  contentBox: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radii.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  contentText: {
    ...typography.bodyMedium,
    color: colors.text,
    lineHeight: 22,
  },
});

export default TeacherNoticesScreen;
