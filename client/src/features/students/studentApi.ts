import axiosInstance from '../../api/axiosInstance';

export const uploadStudentDocument = async (studentId: string, documentType: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post(`/students/${studentId}/documents/${documentType}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const downloadStudentDocument = async (studentId: string, documentType: string) => {
  const response = await axiosInstance.get(`/students/${studentId}/documents/${documentType}`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: response.headers['content-type'] });
  const url = window.URL.createObjectURL(blob);
  
  // Try opening in new tab first
  const newWindow = window.open(url, '_blank');
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    // If pop-ups are blocked, fallback to triggering download safely
    const link = document.createElement('a');
    link.href = url;
    const contentDisposition = response.headers['content-disposition'];
    let filename = `${documentType}-${studentId}`;
    if (contentDisposition) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(contentDisposition);
      if (matches != null && matches[1]) { 
        filename = matches[1].replace(/['"]/g, '');
      }
    } else {
      const mimeType = response.headers['content-type'];
      const ext = mimeType === 'application/pdf' ? '.pdf' : mimeType === 'image/png' ? '.png' : '.jpg';
      filename += ext;
    }
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 100);
};

export const deleteStudentDocument = async (studentId: string, documentType: string) => {
  const response = await axiosInstance.delete(`/students/${studentId}/documents/${documentType}`);
  return response.data;
};
