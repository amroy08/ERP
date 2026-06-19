import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { getUnreadCount } from '../../services/notificationService';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/layout';

interface NotificationBellProps {
  roleType: 'teacher' | 'student' | 'parent';
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ roleType }) => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.warn('[NotificationBell] Failed to fetch unread count:', error);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchCount();
    }
  }, [isFocused]);

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Notifications')}
      style={styles.container}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
    >
      <Ionicons name="notifications-outline" size={24} color={colors.white} />
      {unreadCount > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.danger }]}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xs,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    zIndex: 10,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 10,
    textAlign: 'center',
  },
});

export default NotificationBell;
