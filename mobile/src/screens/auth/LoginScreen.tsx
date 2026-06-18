/**
 * Vantage ERP – LoginScreen (Premium Design System)
 * Modern login screen with gradient branding, Ionicons, premium card layout.
 */
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppButton } from '../../components/AppButton';
import { AppInput } from '../../components/AppInput';
import { AppIcon } from '../../components/AppIcon';
import { useAuth } from '../../store/AuthContext';
import { colors, gradients } from '../../constants/colors';
import { spacing, radii, sizing } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { shadows } from '../../constants/shadows';

const QUICK_LOGINS = [
  { label: 'Parent', email: 'parent@school.com', password: 'Admin@123', color: colors.parent, icon: 'people' as const },
  { label: 'Student', email: 'student@school.com', password: 'Admin@123', color: colors.student, icon: 'school' as const },
  { label: 'Teacher', email: 'teacher@school.com', password: 'Admin@123', color: colors.teacher, icon: 'person' as const },
];

export const LoginScreen: React.FC = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (overrideEmail?: string, overridePassword?: string) => {
    const loginEmail = overrideEmail ?? email;
    const loginPassword = overridePassword ?? password;

    if (!loginEmail || !loginPassword) {
      setError('Please fill in your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
    } catch (e: any) {
      const message =
        e?.response?.data?.message || e?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer noPadding>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero / Brand Section */}
          <LinearGradient
            colors={gradients.dark}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.logoBox}>
              <Ionicons name="school" size={32} color={colors.white} />
            </View>
            <Text style={styles.appTitle}>Vantage ERP</Text>
            <Text style={styles.appSubtitle}>School Management Portal</Text>
          </LinearGradient>

          {/* Form Card */}
          <View style={styles.formWrapper}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Welcome Back</Text>
              <Text style={styles.formSubtitle}>Sign in to your account</Text>

              {error ? (
                <View style={styles.errorBox}>
                  <AppIcon name="alert-circle" size={16} color={colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <AppInput
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              <AppInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />

              <AppButton
                title={loading ? 'Signing in…' : 'Sign In'}
                onPress={() => handleLogin()}
                loading={loading}
                gradient
                style={styles.signInBtn}
                icon={!loading ? <Ionicons name="log-in-outline" size={20} color={colors.white} /> : undefined}
              />
            </View>

            {/* Quick Demo Access */}
            <View style={styles.quickSection}>
              <Text style={styles.quickTitle}>Quick Demo Access</Text>
              <View style={styles.quickRow}>
                {QUICK_LOGINS.map((q) => (
                  <TouchableOpacity
                    key={q.label}
                    style={[styles.quickChip, { borderColor: q.color + '40', backgroundColor: q.color + '08' }]}
                    onPress={() => handleLogin(q.email, q.password)}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={q.icon} size={16} color={q.color} style={{ marginRight: spacing.xs }} />
                    <Text style={[styles.quickChipText, { color: q.color }]}>
                      {q.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.footer}>
              <View style={styles.footerDivider} />
              <Text style={styles.footerNote}>
                Secure access · Vantage ERP © 2026
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  hero: {
    paddingTop: spacing.massive + spacing.xxl,
    paddingBottom: spacing.xxxl + spacing.lg,
    paddingHorizontal: spacing.screenPadding,
    alignItems: 'center',
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  appTitle: {
    ...typography.displayMedium,
    color: colors.white,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    ...typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: spacing.xs,
  },
  formWrapper: {
    marginTop: -spacing.xxl,
    paddingHorizontal: spacing.screenPadding,
    flex: 1,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xxl,
    ...shadows.lg,
  },
  formTitle: {
    ...typography.headingLarge,
    marginBottom: spacing.xxs,
  },
  formSubtitle: {
    ...typography.bodySmall,
    color: colors.mutedText,
    marginBottom: spacing.xl,
  },
  errorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.danger + '30',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    fontWeight: '600',
    flex: 1,
  },
  signInBtn: {
    marginTop: spacing.md,
  },
  quickSection: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  quickTitle: {
    ...typography.overline,
    marginBottom: spacing.md,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  quickChip: {
    borderWidth: 1.5,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickChipText: {
    ...typography.labelSmall,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  footerDivider: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  footerNote: {
    ...typography.captionSmall,
    color: colors.mutedText,
  },
});

export default LoginScreen;
