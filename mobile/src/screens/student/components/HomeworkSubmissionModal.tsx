import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../../constants/colors';
import { spacing, radii } from '../../../constants/layout';
import { typography } from '../../../constants/typography';
import { shadows } from '../../../constants/shadows';
import { submitStudentHomework } from '../../../api/mobileApi';
import { HomeworkItem } from '../../../types/mobile.types';

interface HomeworkSubmissionModalProps {
  visible: boolean;
  homework: HomeworkItem | null;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export const HomeworkSubmissionModal: React.FC<HomeworkSubmissionModalProps> = ({
  visible,
  homework,
  onClose,
  onSubmitSuccess,
}) => {
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    type: string;
    size?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setSubmissionText('');
      setSelectedFile(null);
      setError('');
    }
  }, [visible]);

  const handlePickDocument = async () => {
    try {
      setError('');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'txt'];

      if (!ext || !allowedExtensions.includes(ext)) {
        setError('Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, PNG, and TXT are allowed.');
        return;
      }

      if (file.size && file.size > 10 * 1024 * 1024) {
        setError('File size exceeds the 10MB limit.');
        return;
      }

      setSelectedFile({
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
        size: file.size,
      });
    } catch (err) {
      console.error('[DocumentPicker] Error picking document:', err);
      setError('Failed to select file. Please try again.');
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async () => {
    if (!submissionText.trim() && !selectedFile) {
      setError('Please enter an answer or attach a file before submitting.');
      return;
    }

    if (!homework) return;

    setLoading(true);
    setError('');

    try {
      await submitStudentHomework(homework.id, {
        submissionText: submissionText.trim() || undefined,
        file: selectedFile || undefined,
      });
      onSubmitSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to submit homework.');
    } finally {
      setLoading(false);
    }
  };

  if (!homework) return null;

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalWrapper}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.titleWithIcon}>
                <Ionicons name="cloud-upload-outline" size={20} color={colors.student} />
                <Text style={styles.headerTitle}>Submit Homework</Text>
              </View>
              <TouchableOpacity onPress={onClose} disabled={loading} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.hwTitle}>{homework.title}</Text>
              <Text style={styles.subjectText}>{homework.subjectName}</Text>
              <View style={styles.dueDateBadge}>
                <Ionicons name="time-outline" size={12} color={colors.warning} />
                <Text style={styles.dueText}>
                  Due: {new Date(homework.dueDate).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                  })}
                </Text>
              </View>

              <Text style={styles.label}>Your Text Answer (Optional)</Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={6}
                placeholder="Type your submission details or notes here..."
                value={submissionText}
                onChangeText={setSubmissionText}
                editable={!loading}
                placeholderTextColor={colors.mutedText}
              />

              <Text style={styles.label}>Attach Document/Image (Optional)</Text>
              {!selectedFile ? (
                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={handlePickDocument}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Ionicons name="attach" size={26} color={colors.student} style={styles.uploadIcon} />
                  <Text style={styles.uploadText}>Select File</Text>
                  <Text style={styles.uploadSubtext}>
                    PDF, DOC, DOCX, JPG, JPEG, PNG, TXT up to 10MB
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.fileCard}>
                  <View style={styles.fileIcon}>
                    <Ionicons name="document-text-outline" size={22} color={colors.student} />
                  </View>
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    {selectedFile.size && (
                      <Text style={styles.fileSize}>{formatSize(selectedFile.size)}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={handleRemoveFile}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              )}

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={onClose}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnLabel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.submitBtn]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={16} color={colors.white} />
                    <Text style={styles.submitBtnLabel}>Submit</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    ...typography.label,
    fontWeight: '800',
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.xxs,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  hwTitle: {
    ...typography.label,
    fontWeight: '700',
    color: colors.text,
  },
  subjectText: {
    ...typography.caption,
    color: colors.mutedText,
    marginTop: spacing.xxs,
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.warning + '12',
    borderWidth: 1,
    borderColor: colors.warning + '25',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  dueText: {
    ...typography.captionSmall,
    color: colors.warning,
    fontWeight: '700',
  },
  label: {
    ...typography.captionSmall,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.text,
    ...typography.bodyMedium,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: colors.surfaceSoft,
    marginBottom: spacing.md,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: colors.student + '45',
    borderStyle: 'dashed',
    borderRadius: radii.md,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.student + '06',
    marginBottom: spacing.md,
  },
  uploadIcon: {
    marginBottom: spacing.xs,
  },
  uploadText: {
    ...typography.labelSmall,
    fontWeight: '700',
    color: colors.student,
  },
  uploadSubtext: {
    ...typography.captionSmall,
    color: colors.mutedText,
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceSoft,
    marginBottom: spacing.md,
  },
  fileIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.sm,
    backgroundColor: colors.student + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileDetails: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  fileName: {
    ...typography.labelSmall,
    fontWeight: '700',
    color: colors.text,
  },
  fileSize: {
    ...typography.captionSmall,
    color: colors.mutedText,
    marginTop: 2,
  },
  removeBtn: {
    padding: spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerSoft,
    borderRadius: radii.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.danger + '20',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.danger,
    ...typography.captionSmall,
    fontWeight: '700',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  cancelBtn: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnLabel: {
    ...typography.buttonMedium,
    color: colors.mutedText,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: colors.student,
  },
  submitBtnLabel: {
    ...typography.buttonMedium,
    color: colors.white,
    fontWeight: '700',
  },
});

export default HomeworkSubmissionModal;
