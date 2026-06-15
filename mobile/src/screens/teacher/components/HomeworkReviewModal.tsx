import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { colors } from '../../../constants/colors';
import { AppCard } from '../../../components/AppCard';
import { AppButton } from '../../../components/AppButton';
import { AppInput } from '../../../components/AppInput';
import { StatusBadge } from '../../../components/StatusBadge';
import {
  getTeacherHomeworkSubmissionDetail,
  reviewTeacherHomeworkSubmission,
} from '../../../api/mobileApi';
import { TeacherHomeworkSubmissionDetail } from '../../../types/mobile.types';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getAccessToken } from '../../../utils/secureStorage';
import { API_BASE_URL } from '../../../constants/config';

interface HomeworkReviewModalProps {
  visible: boolean;
  submissionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const HomeworkReviewModal: React.FC<HomeworkReviewModalProps> = ({
  visible,
  submissionId,
  onClose,
  onSuccess,
}) => {
  const [detail, setDetail] = useState<TeacherHomeworkSubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && submissionId) {
      loadDetail();
    }
  }, [visible, submissionId]);

  const loadDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getTeacherHomeworkSubmissionDetail(submissionId);
      const data = res.data ?? res;
      setDetail(data);
      setMarks(data.marks !== null && data.marks !== undefined ? String(data.marks) : '');
      setFeedback(data.teacherFeedback ?? '');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load submission details.');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: 'reviewed' | 'returned') => {
    setError('');
    setSubmitting(true);
    try {
      const parsedMarks = marks.trim() !== '' ? Number(marks) : undefined;
      if (parsedMarks !== undefined && (isNaN(parsedMarks) || parsedMarks < 0)) {
        setError('Marks must be a non-negative number.');
        setSubmitting(false);
        return;
      }

      await reviewTeacherHomeworkSubmission(submissionId, {
        status,
        teacherFeedback: feedback.trim(),
        marks: parsedMarks,
      });

      if (Platform.OS === 'web') {
        alert(status === 'reviewed' ? 'Homework reviewed successfully!' : 'Homework returned for resubmission.');
      } else {
        Alert.alert(
          'Success',
          status === 'reviewed' ? 'Homework reviewed successfully!' : 'Homework returned for resubmission.'
        );
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!detail?.fileName) return;
    setDownloading(true);
    try {
      const token = await getAccessToken();
      const downloadUrl = `${API_BASE_URL}/mobile/teacher/homework/submissions/${submissionId}/download`;

      if (Platform.OS === 'web') {
        const response = await fetch(downloadUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = detail.fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const fileUri = `${FileSystem.documentDirectory}${detail.fileName}`;
        const { uri } = await FileSystem.downloadAsync(downloadUrl, fileUri, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri);
        } else {
          Alert.alert('Info', 'Preview/Sharing is not available on this device');
        }
      }
    } catch (e: any) {
      if (Platform.OS === 'web') {
        alert('Failed to download file.');
      } else {
        Alert.alert('Error', 'Failed to download file.');
      }
    } finally {
      setDownloading(false);
    }
  };

  const getStatusType = (status?: string): 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'reviewed': return 'success';
      case 'returned': return 'danger';
      case 'submitted': return 'info';
      case 'late': return 'warning';
      default: return 'info';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Review Submission</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.teacher} size="large" />
              <Text style={styles.loadingText}>Loading details…</Text>
            </View>
          ) : error && !detail ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{error}</Text>
              <AppButton title="Retry" onPress={loadDetail} variant="teacher" style={{ width: 120 }} />
            </View>
          ) : detail ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Student info */}
              <AppCard style={styles.card}>
                <View style={styles.rowBetween}>
                  <View>
                    <Text style={styles.studentName}>{detail.studentName ?? 'Student'}</Text>
                    <Text style={styles.homeworkTitle}>{detail.homeworkTitle}</Text>
                  </View>
                  <StatusBadge
                    label={detail.status ?? 'pending'}
                    type={getStatusType(detail.status)}
                  />
                </View>
                {detail.submittedAt && (
                  <Text style={styles.metaText}>
                    Submitted: {new Date(detail.submittedAt).toLocaleString('en-IN')}
                  </Text>
                )}
              </AppCard>

              {/* Text answer */}
              <Text style={styles.sectionLabel}>Student Text Answer</Text>
              <AppCard style={styles.card}>
                {detail.submissionText ? (
                  <Text style={styles.answerText}>{detail.submissionText}</Text>
                ) : (
                  <Text style={styles.emptyText}>No text response provided.</Text>
                )}
              </AppCard>

              {/* File details */}
              {detail.fileName && (
                <>
                  <Text style={styles.sectionLabel}>Attached File</Text>
                  <AppCard style={styles.card}>
                    <View style={styles.rowBetween}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.fileName}>{detail.fileName}</Text>
                        {detail.fileSize && (
                          <Text style={styles.metaText}>
                            {(detail.fileSize / 1024).toFixed(1)} KB • {detail.mimeType ?? 'Unknown'}
                          </Text>
                        )}
                      </View>
                      {detail.canDownload && (
                        <AppButton
                          title="Open File"
                          onPress={handleDownload}
                          variant="secondary"
                          loading={downloading}
                          style={styles.downloadBtn}
                          textStyle={{ fontSize: 13 }}
                        />
                      )}
                    </View>
                  </AppCard>
                </>
              )}

              {/* Review inputs */}
              <Text style={styles.sectionLabel}>Review Comments & Marks</Text>
              <AppInput
                label="Feedback / Comments"
                placeholder="Enter feedback for student..."
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />

              <AppInput
                label="Marks Obtained"
                placeholder="Enter marks (e.g. 8)"
                value={marks}
                onChangeText={setMarks}
                keyboardType="numeric"
              />

              {error ? <Text style={styles.inlineError}>{error}</Text> : null}

              {/* Actions */}
              <View style={styles.actionRow}>
                <AppButton
                  title="Return"
                  onPress={() => handleReview('returned')}
                  variant="danger"
                  loading={submitting}
                  style={styles.actionBtn}
                />
                <AppButton
                  title="Submit Review"
                  onPress={() => handleReview('reviewed')}
                  variant="teacher"
                  loading={submitting}
                  style={styles.actionBtn}
                />
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.mutedText,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: colors.mutedText,
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  card: {
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  homeworkTitle: {
    fontSize: 13,
    color: colors.teacher,
    fontWeight: '600',
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 6,
  },
  sectionLabel: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  answerText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  emptyText: {
    fontSize: 14,
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  downloadBtn: {
    height: 38,
    marginVertical: 0,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inlineError: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    height: 52,
  },
});
export default HomeworkReviewModal;
