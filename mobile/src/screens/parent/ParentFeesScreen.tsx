import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { AppCard } from '../../components/AppCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { colors } from '../../constants/colors';
import { fetchParentFees } from '../../api/mobileApi';

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

const statusColor = (s: string) => {
  if (s === 'paid') return colors.success;
  if (s === 'partial') return colors.warning;
  if (s === 'overdue') return colors.danger;
  return colors.info;
};

export const ParentFeesScreen: React.FC = () => {
  const [data, setData] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [totalDue, setTotalDue] = useState(0);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await fetchParentFees();
      const records: FeeRecord[] = res.data ?? res ?? [];
      setData(records);
      setTotalDue(records.reduce((sum, r) => sum + (r.dueAmount ?? 0), 0));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load fee records.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.parent} />}
      >
        <Text style={styles.pageTitle}>Fee Summary</Text>

        {!loading && totalDue > 0 && (
          <View style={styles.dueAlert}>
            <Text style={styles.dueAlertEmoji}>💳</Text>
            <View>
              <Text style={styles.dueAlertLabel}>Total Outstanding</Text>
              <Text style={styles.dueAlertAmount}>₹{totalDue.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        )}

        {loading && <ActivityIndicator color={colors.parent} style={{ marginTop: 40 }} />}
        {error && !loading && <ErrorState error={error} onRetry={() => load(false)} roleTheme="parent" />}

        {!loading && data.map((fee) => (
          <AppCard key={fee.id} style={styles.feeCard}>
            <View style={styles.feeHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentName}>{fee.studentName}</Text>
                <Text style={styles.feeName}>{fee.feeStructureName}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor(fee.status) + '22', borderColor: statusColor(fee.status) }]}>
                <Text style={[styles.statusText, { color: statusColor(fee.status) }]}>
                  {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                </Text>
              </View>
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
                <Text style={styles.amountLabel}>Due</Text>
                <Text style={[styles.amountValue, { color: fee.dueAmount > 0 ? colors.danger : colors.success }]}>
                  ₹{fee.dueAmount.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>
            {fee.dueDate && (
              <Text style={styles.dueDateText}>
                Due by: {new Date(fee.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
            )}
          </AppCard>
        ))}
        {!loading && data.length === 0 && !error && (
          <EmptyState emoji="₹" title="No Dues Found" subtitle="There are no outstanding fee transactions or invoices recorded for your linked children." />
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  pageTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 16 },
  dueAlert: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.danger + '15',
    borderRadius: 16, borderWidth: 1, borderColor: colors.danger + '44',
    padding: 16, marginBottom: 16,
  },
  dueAlertEmoji: { fontSize: 32 },
  dueAlertLabel: { color: colors.mutedText, fontSize: 12, fontWeight: '600' },
  dueAlertAmount: { color: colors.danger, fontSize: 24, fontWeight: '800' },
  feeCard: { marginBottom: 12 },
  feeHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  studentName: { color: colors.white, fontSize: 15, fontWeight: '700' },
  feeName: { color: colors.mutedText, fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingTop: 12 },
  amountItem: { alignItems: 'center' },
  amountLabel: { color: colors.mutedText, fontSize: 11 },
  amountValue: { color: colors.white, fontSize: 15, fontWeight: '700', marginTop: 2 },
  dueDateText: { color: colors.mutedText, fontSize: 12, marginTop: 10 },
  errorCard: { marginVertical: 16 },
  errorText: { color: colors.danger, fontSize: 14 },
  emptyText: { color: colors.mutedText, fontSize: 14 },
});

export default ParentFeesScreen;
