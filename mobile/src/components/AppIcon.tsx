/**
 * Vantage ERP – AppIcon Component
 * Unified icon component using @expo/vector-icons (Ionicons set).
 * Replaces emoji usage throughout the app with proper vector icons.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { radii } from '../constants/layout';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface AppIconProps {
  /** Ionicons icon name */
  name: IconName;
  /** Icon pixel size (default 22) */
  size?: number;
  /** Icon color (default colors.text) */
  color?: string;
  /** If true, renders inside a rounded container */
  contained?: boolean;
  /** Background color of the container (default: primary soft) */
  containerColor?: string;
  /** Container size multiplier (default: icon size * 1.8) */
  containerSize?: number;
  /** Extra container style */
  containerStyle?: ViewStyle;
}

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 22,
  color = colors.text,
  contained = false,
  containerColor,
  containerSize,
  containerStyle,
}) => {
  if (!contained) {
    return <Ionicons name={name} size={size} color={color} />;
  }

  const boxSize = containerSize ?? Math.round(size * 1.8);
  const bgColor = containerColor ?? colors.primarySoft;

  return (
    <View
      style={[
        styles.container,
        {
          width: boxSize,
          height: boxSize,
          borderRadius: radii.md,
          backgroundColor: bgColor,
        },
        containerStyle,
      ]}
    >
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppIcon;
