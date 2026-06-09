import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  safe?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({ children, safe = true }) => {
  const Container = safe ? SafeAreaView : View;

  return (
    <Container style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
});
export default ScreenContainer;
