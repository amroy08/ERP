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
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../../../constants/colors';
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
              <Text style={styles.headerTitle}>Submit Homework</Text>
              <TouchableOpacity onPress={onClose} disabled={loading} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
              <Text style={styles.hwTitle}>{homework.title}</Text>
              <Text style={styles.subjectText}>{homework.subjectName}</Text>
              <Text style={styles.dueText}>
                Due: {new Date(homework.dueDate).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short',
                })}
              </Text>

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
                >
                  <Text style={styles.uploadIcon}>📎</Text>
                  <Text style={styles.uploadText}>Select File</Text>
                  <Text style={styles.uploadSubtext}>
                    PDF, DOC, DOCX, JPG, JPEG, PNG, TXT up to 10MB
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.fileCard}>
                  <View style={styles.fileIcon}>
                    <Text style={{ fontSize: 20 }}>📄</Text>
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
                  >
                    <Text style={styles.removeIcon}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </ScrollView>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.cancelBtn]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelBtnLabel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.submitBtn]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.submitBtnLabel}>Submit</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalWrapper: {
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    color: colors.mutedText,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
  },
  hwTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  subjectText: {
    fontSize: 13,
    color: colors.mutedText,
    marginTop: 2,
  },
  dueText: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: colors.surfaceSoft,
    marginBottom: 16,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
    marginBottom: 16,
  },
  uploadIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.student,
  },
  uploadSubtext: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 4,
    textAlign: 'center',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surfaceSoft,
    marginBottom: 16,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  fileSize: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 2,
  },
  removeBtn: {
    padding: 8,
  },
  removeIcon: {
    fontSize: 14,
    color: colors.danger,
    fontWeight: '700',
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.mutedText,
  },
  submitBtn: {
    backgroundColor: colors.student,
  },
  submitBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
});
