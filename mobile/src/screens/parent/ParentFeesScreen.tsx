import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { colors } from '../../constants/colors';
import { spacing, radii } from '../../constants/layout';
import { typography } from '../../constants/typography';
import { fetchParentFees } from '../../api/mobileApi';
import { ParentScreenHeader } from '../../components/parent/ParentScreenHeader';
import { StatusBadge } from '../../components/StatusBadge';

interface FeeRecord {
  id: string;
  studentName: string;
  feeStructureName: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  dueDate?: string;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
}

const statusBadgeType = (s: string): 'success' | 'warning' | 'danger' | 'info' => {
  if (s === 'paid') return 'success';
  if (s === 'partial') return 'warning';
  if (s === 'overdue') return 'danger';
  return 'info';
};

export const ParentFeesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<FeeRecord[]>([]);
  const [selectedStudentName, setSelectedStudentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await fetchParentFees();
      const records: FeeRecord[] = res.data ?? res ?? [];
      setData(records);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load fee records.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const uniqueStudentNames = Array.from(new Set(data.map((r) => r.studentName)));

  const filteredRecords = selectedStudentName
    ? data.filter((r) => r.studentName === selectedStudentName)
    : data;

  const totalAmount = filteredRecords.reduce((sum, r) => sum + (r.totalAmount ?? 0), 0);
  const totalPaid = filteredRecords.reduce((sum, r) => sum + (r.paidAmount ?? 0), 0);
  const totalDue = filteredRecords.reduce((sum, r) => sum + (r.dueAmount ?? 0), 0);

  return (
    <ScreenContainer>
      <ParentScreenHeader
        title="Fee Ledger"
        subtitle={selectedStudentName ? `Viewing invoices for ${selectedStudentName}` : "All outstanding school invoices"}
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.parent} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading && <ActivityIndicator color={colors.parent} style={{ marginTop: 40 }} />}
        {error && !loading && <ErrorState error={error} onRetry={() => load(false)} roleTheme="parent" />}

        {!loading && !error && data.length > 0 && (
          <>
            {/* Child Filter switcher */}
            {uniqueStudentNames.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSwitcherScroll}>
                <TouchableOpacity
                  onPress={() => setSelectedStudentName(null)}
                  activeOpacity={0.8}
                  style={[
                    styles.childPill,
                    selectedStudentName === null && styles.childPillActive,
                  ]}
                >
                  <Text style={[styles.childPillText, selectedStudentName === null && styles.childPillTextActive]}>
                    👥  All Children
                  </Text>
                </TouchableOpacity>
                {uniqueStudentNames.map((name, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setSelectedStudentName(name)}
                    activeOpacity={0.8}
                    style={[
                      styles.childPill,
                      selectedStudentName === name && styles.childPillActive,
                    ]}
                  >
                    <Text style={[styles.childPillText, selectedStudentName === name && styles.childPillTextActive]}>
                      👶  {name.split(' ')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Billing Summary Banner Card */}
            <View style={styles.summaryWrapper}>
              <AppCard style={styles.summaryCardHero}>
                <Text style={styles.heroLabel}>Total Outstanding Balance</Text>
                <Text style={styles.heroValue}>₹{totalDue.toLocaleString('en-IN')}</Text>
                <View style={styles.heroRow}>
                  <View style={styles.heroCol}>
                    <Text style={styles.heroMiniLabel}>Total Invoiced</Text>
                    <Text style={styles.heroMiniValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.heroColDivider} />
                  <View style={styles.heroCol}>
                    <Text style={styles.heroMiniLabel}>Total Paid</Text>
                    <Text style={[styles.heroMiniValue, { color: colors.success }]}>₹{totalPaid.toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              </AppCard>
            </View>

            {/* Fee Invoices ledger listing */}
            <View style={styles.ledgerList}>
              {filteredRecords.map((fee) => (
                <AppCard key={fee.id} style={styles.feeCard}>
                  <View style={styles.feeHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.studentName}>{fee.studentName}</Text>
                      <Text style={styles.feeName}>{fee.feeStructureName}</Text>
                    </View>
                    <StatusBadge
                      label={fee.status.toUpperCase()}
                      type={statusBadgeType(fee.status)}
                    />
                  </View>
                  
                  <View style={styles.amountRow}>
                    <View style={styles.amountItem}>
                      <Text style={styles.amountLabel}>Total</Text>
                      <Text style={styles.amountValue}>₹{fee.totalAmount.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.amountItem}>
                      <Text style={styles.amountLabel}>Paid</Text>
                      <Text style={[styles.amountValue, { color: colors.success }]}>₹{fee.paidAmount.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.amountItem}>
                      <Text style={styles.amountLabel}>Outstanding</Text>
                      <Text style={[styles.amountValue, { color: fee.dueAmount > 0 ? colors.danger : colors.success }]}>
                        ₹{fee.dueAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                  
                  {fee.dueDate && (
                    <View style={styles.dueDateRow}>
                      <Text style={styles.dueDateText}>
                        📅 Due by: {new Date(fee.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                  )}
                </AppCard>
              ))}
            </View>
          </>
        )}

        {!loading && data.length === 0 && !error && (
          <EmptyState emoji="₹" title="No Dues Found" subtitle="There are no outstanding fee transactions or invoices recorded for your linked children." />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  childSwitcherScroll: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
  },
  childPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    backgroundColor: colors.surface,
  },
  childPillActive: {
    backgroundColor: colors.parentSoft,
    borderColor: colors.parent,
  },
  childPillText: {
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '700',
  },
  childPillTextActive: {
    color: colors.parent,
  },
  summaryWrapper: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  summaryCardHero: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  heroLabel: {
    ...typography.caption,
    color: colors.mutedText,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroValue: {
    color: colors.danger,
    fontSize: 32,
    fontWeight: '800',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  heroCol: {
    flex: 1,
  },
  heroColDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.borderSoft,
    marginHorizontal: spacing.md,
  },
  heroMiniLabel: {
    ...typography.captionSmall,
    color: colors.mutedText,
    fontWeight: '600',
  },
  heroMiniValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  ledgerList: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  feeCard: {
    padding: spacing.md,
  },
  feeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  studentName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  feeName: {
    color: colors.mutedText,
    fontSize: 12,
    marginTop: 2,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: spacing.sm,
  },
  amountItem: {
    alignItems: 'center',
    flex: 1,
  },
  amountLabel: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '500',
  },
  amountValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  dueDateRow: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  dueDateText: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ParentFeesScreen;
