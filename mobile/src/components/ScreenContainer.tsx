/**
 * Vantage ERP – ScreenContainer (Premium Design System)
 * Full-screen wrapper with SafeArea, StatusBar, and consistent padding.
 */
import React from 'react';
import { StyleSheet, View, StatusBar, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { spacing } from '../constants/layout';

interface ScreenContainerProps {
  children: React.ReactNode;
  /** Use SafeAreaView (default true) */
  safe?: boolean;
  /** Override background color */
  backgroundColor?: string;
  /** Extra container style */
  style?: ViewStyle;
  /** Remove horizontal padding (for edge-to-edge content) */
  noPadding?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  safe = true,
  backgroundColor,
  style,
  noPadding = false,
}) => {
  const Container = safe ? SafeAreaView : View;
  const bg = backgroundColor ?? colors.background;

  return (
    <Container
      style={[
        styles.container,
        { backgroundColor: bg },
        noPadding && styles.noPadding,
        style,
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={bg} />
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  noPadding: {
    paddingHorizontal: 0,
  },
});

export default ScreenContainer;
