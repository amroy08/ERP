import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../store/AuthContext';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  Notification,
} from '../../services/notificationService';
import { NotificationCard } from '../../components/notifications/NotificationCard';
import { NotificationEmptyState } from '../../components/notifications/NotificationEmptyState';
import { ErrorState } from '../../components/ErrorState';
import { ScreenContainer } from '../../components/ScreenContainer';
import TeacherScreenHeader from '../../components/teacher/TeacherScreenHeader';
import StudentScreenHeader from '../../components/student/StudentScreenHeader';
import ParentScreenHeader from '../../components/parent/ParentScreenHeader';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { shadows } from '../../constants/shadows';

export const NotificationListScreen: React.FC = () => {
  const { role } = useAuth();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const roleTheme = role === 'teacher' || role === 'student' || role === 'parent' ? role : 'parent';

  const themeColor =
    roleTheme === 'student' ? colors.student
    : roleTheme === 'teacher' ? colors.teacher
    : colors.parent;

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [list, count] = await Promise.all([
        getNotifications({ limit: 100 }),
        getUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (e: any) {
      console.error('[NotificationListScreen] fetch error:', e);
      setError(e?.response?.data?.message || 'Failed to retrieve notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused, loadData]);

  const handleMarkRead = async (id: string) => {
    try {
      setNotifications(prev =>
        prev.map(item => (item.id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      await markNotificationRead(id);
    } catch (e) {
      console.error('[NotificationListScreen] mark read fail:', e);
      loadData(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      setNotifications(prev =>
        prev.map(item => ({ ...item, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      await markAllNotificationsRead();
    } catch (e) {
      console.error('[NotificationListScreen] mark all read fail:', e);
      loadData(false);
    }
  };

  const renderHeader = () => {
    const headerProps = {
      title: 'Notifications',
      subtitle: unreadCount > 0 ? `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'No unread messages',
      badge: unreadCount > 0 ? unreadCount : undefined,
      onBack: () => navigation.goBack(),
    };

    if (roleTheme === 'teacher') return <TeacherScreenHeader {...headerProps} />;
    if (roleTheme === 'student') return <StudentScreenHeader {...headerProps} />;
    return <ParentScreenHeader {...headerProps} />;
  };

  return (
    <ScreenContainer>
      {renderHeader()}

      {unreadCount > 0 && !loading && !error && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.markAllBtn, { borderColor: themeColor }]}
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
          >
            <Text style={[styles.markAllText, { color: themeColor }]}>Mark All as Read</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={themeColor} size="large" />
          <Text style={styles.loadingText}>Retrieving notifications…</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.paddingWrapper}>
          <ErrorState error={error} onRetry={() => loadData(false)} roleTheme={roleTheme} />
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={handleMarkRead}
              roleTheme={roleTheme}
            />
          )}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor={themeColor}
            />
          }
          ListEmptyComponent={
            <NotificationEmptyState roleTheme={roleTheme} />
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
    paddingTop: spacing.md,
  },
  actionRow: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    alignItems: 'flex-end',
  },
  markAllBtn: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  markAllText: {
    ...typography.labelSmall,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
});

export default NotificationListScreen;
