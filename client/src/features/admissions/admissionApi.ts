import axiosInstance from '../../api/axiosInstance';

export const uploadAdmissionDocument = async (admissionId: string, documentType: string, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post(`/admissions/${admissionId}/documents/${documentType}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const downloadAdmissionDocument = async (admissionId: string, documentType: string) => {
  const response = await axiosInstance.get(`/admissions/${admissionId}/documents/${documentType}`, {
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
    let filename = `${documentType}-${admissionId}`;
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
};

export const deleteAdmissionDocument = async (admissionId: string, documentType: string) => {
  const response = await axiosInstance.delete(`/admissions/${admissionId}/documents/${documentType}`);
  return response.data;
};
export const getAdmissionById = async (admissionId: string) => {
  const response = await axiosInstance.get(`/admissions/${admissionId}`);
  return response.data;
};
