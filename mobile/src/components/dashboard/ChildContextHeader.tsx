import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { shadows } from '../../constants/shadows';

interface Child {
  id: string;
  name: string;
  className: string;
  sectionName: string;
}

interface ChildContextHeaderProps {
  childrenList: Child[];
  selectedChildId: string;
  onChildSelect: (childId: string) => void;
}

export const ChildContextHeader: React.FC<ChildContextHeaderProps> = ({
  childrenList,
  selectedChildId,
  onChildSelect,
}) => {
  if (childrenList.length <= 1) {
    return null; // Don't show switcher if there is only 1 child
  }

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {childrenList.map((child) => {
          const isSelected = child.id === selectedChildId;
          const initials = child.name.charAt(0);
          return (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.chip,
                isSelected
                  ? { borderColor: colors.parent, backgroundColor: colors.parentSoft }
                  : { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              onPress={() => onChildSelect(child.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.avatar,
                  isSelected
                    ? { backgroundColor: colors.parent }
                    : { backgroundColor: colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    isSelected ? { color: colors.white } : { color: colors.textSecondary },
                  ]}
                >
                  {initials}
                </Text>
              </View>
              <View>
                <Text
                  style={[
                    styles.name,
                    isSelected ? { color: colors.parent } : { color: colors.text },
                  ]}
                >
                  {child.name}
                </Text>
                <Text style={styles.meta}>
                  Class {child.className}–{child.sectionName}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1.5,
    ...shadows.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    ...typography.labelSmall,
    fontWeight: '800',
  },
  name: {
    ...typography.labelSmall,
    fontWeight: '700',
  },
  meta: {
    ...typography.captionSmall,
    color: colors.mutedText,
    marginTop: 1,
  },
});

export default ChildContextHeader;
