import { Badge } from "../../components/common/Badge";
import React, { useState, useEffect, useMemo } from 'react';
import { User, Phone, Mail, MapPin, BookOpen, GraduationCap, CheckCircle, XCircle, Clock, ArrowRight, Edit3, Save, X, Calculator, IndianRupee, Users, Briefcase, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { StatusBadge } from '../../components/common/Badge';
import axiosInstance from '../../api/axiosInstance';
import { ClassDoc, SectionDoc, ApiResponse, FeeStructureDoc } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface AdmissionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  admission: any | null;  // Use any since the API schema has evolved
  onUpdate: () => void;
}
export const AdmissionDetailsModal: React.FC<AdmissionDetailsModalProps> = ({ isOpen, onClose, admission, onUpdate }) => {
  const { isRole } = usePermissions();
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [sections, setSections] = useState<SectionDoc[]>([]);
  const [availableFeeStructureDocs, setAvailableFeeStructureDocs] = useState<FeeStructureDoc[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [isEditingFees, setIsEditingFees] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState<any>(null);
  const [tempAssignments, setTempAssignments] = useState<{ feeStructureId: string; amount: number }[]>([]);
  const [activeTab, setActiveTab] = useState<'student' | 'parents' | 'addresses' | 'documents' | 'fees'>('student');
  
  const canProcessAdmissions = isRole(['super_admin', 'admin', 'clerk']);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  useEffect(() => {
    if (isOpen) {
      axiosInstance.get<ApiResponse<ClassDoc[]>>('/classes').then(res => setClasses(res.data.data)).catch(() => {});
      setIsEditingFees(false);
      setIsConverting(false);
      setEnrollmentSuccess(null);
      setSelectedClass('');
      setSelectedSection('');
      setRollNumber('');
      setActiveTab('student');
    }
  }, [isOpen]);

  useEffect(() => {
    if (admission && isOpen) {
      // Fetch fee structures for the admission's class
      const classId = admission.classId || admission.class?.id;
      if (classId) {
        axiosInstance.get<ApiResponse<FeeStructureDoc[]>>(`/fees/structures?classId=${classId}`)
          .then(res => setAvailableFeeStructureDocs(res.data.data))
          .catch(() => setAvailableFeeStructureDocs([]));
      }
      
      // Initialize temp assignments from existing assigned fees
      setTempAssignments(
        (admission.assignedFees || []).map((af: any) => ({
          feeStructureId: af.feeStructureId,
          amount: af.customAmount ?? (af.feeStructure as any)?.totalAmount ?? 0
        }))
      );
    }
  }, [admission, isOpen]);

  const totalAmount = useMemo(() => {
    if (isEditingFees) {
      return tempAssignments.reduce((sum, fa) => sum + fa.amount, 0);
    }
    return (admission?.assignedFees || []).reduce(
      (sum: number, af: any) => sum + (af.customAmount ?? (af.feeStructure as any)?.totalAmount ?? 0), 0
    );
  }, [isEditingFees, tempAssignments, admission]);

  useEffect(() => {
    if (selectedClass) {
      axiosInstance.get<ApiResponse<SectionDoc[]>>(`/sections?classId=${selectedClass}`)
        .then(res => setSections(res.data.data))
        .catch(() => setSections([]));
    } else {
      setSections([]);
    }
  }, [selectedClass]);

  if (!admission) return null;

  // Safe field accessors
  const fullName = `${admission.firstName || ''} ${admission.lastName || ''}`.trim() || 'Unknown';
  const initials = (admission.firstName || 'U').charAt(0).toUpperCase();
  const className = admission.class?.name || admission.classAppliedFor || '—';
  const appNo = admission.applicationNo || `APP-${String(admission.id).slice(-6).toUpperCase()}`;
  const dateApplied = admission.createdAt || admission.enquiryDate;

  const handleUpdateStatus = async (status: string) => {
    setIsLoading(true);
    try {
      await axiosInstance.put(`/admissions/${admission.id}`, { status });
      toast.success(`Status updated to ${status.replace('_', ' ')}`);
      onUpdate();
      onClose();
    } catch {
      toast.error('Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeeUpdate = async () => {
    setIsLoading(true);
    try {
      await axiosInstance.put(`/admissions/${admission.id}`, { feeAssignments: tempAssignments });
      toast.success('Fee assignments updated!');
      setIsEditingFees(false);
      onUpdate();
    } catch {
      toast.error('Failed to update fees');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFee = (fee: FeeStructureDoc) => {
    setTempAssignments(prev => {
      const exists = prev.find(fa => fa.feeStructureId === fee.id);
      if (exists) return prev.filter(fa => fa.feeStructureId !== fee.id);
      return [...prev, { feeStructureId: fee.id, amount: fee.totalAmount }];
    });
  };

  const updateTempAmount = (id: string, amount: string) => {
    setTempAssignments(prev =>
      prev.map(fa => fa.feeStructureId === id ? { ...fa, amount: Number(amount) || 0 } : fa)
    );
  };

  const handleConvert = async () => {
    if (!selectedClass) return toast.error('Please select a class');
    setIsLoading(true);
    try {
      const res = await axiosInstance.post(`/admissions/convert/${admission.id}`, {
        classId: selectedClass,
        sectionId: selectedSection || undefined,
        rollNumber: rollNumber || undefined
      });
      toast.success('Student enrolled successfully!');
      setEnrollmentSuccess(res.data.credentials);
      onUpdate();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Enrollment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={enrollmentSuccess ? 'Enrollment Complete' : (isConverting ? 'Enroll Student' : 'Admission Details')}
      size={isConverting || enrollmentSuccess ? 'md' : 'lg'}
    >
      {enrollmentSuccess ? (
        <div className="space-y-6 text-center py-4">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-800">Welcome to School!</h3>
            <p className="text-sm text-slate-500 mt-1">Enrollment for {fullName} is successful.</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Portal Login Details</span>
               <Badge variant="blue">Student Account</Badge>
            </div>
            
            <div className="space-y-3">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Login ID (Email)</label>
                  <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl mt-1">
                     <span className="text-sm font-bold text-slate-700">{enrollmentSuccess.student.email}</span>
                     <Button variant="secondary" size="sm" className="h-7 text-[10px]" onClick={() => handleCopy(enrollmentSuccess.student.email)}>Copy</Button>
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">Password</label>
                  <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl mt-1">
                     <span className="text-sm font-mono font-black text-blue-600 tracking-wider">
                        {enrollmentSuccess.student.password}
                     </span>
                     <Button variant="secondary" size="sm" className="h-7 text-[10px]" onClick={() => handleCopy(enrollmentSuccess.student.password)}>Copy</Button>
                  </div>
               </div>
            </div>

            <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-3 rounded-lg border border-amber-100 leading-relaxed italic">
               ⚠️ Please share these credentials securely with the student. They should change their password after first login.
            </p>
          </div>

          <Button className="w-full h-12 text-base font-black uppercase tracking-widest bg-slate-900 shadow-xl" onClick={onClose}>
             Finish & Close
          </Button>
        </div>
      ) : !isConverting ? (
        <div className="space-y-7">
          {/* Header */}
          <div className="flex items-start justify-between bg-gradient-to-br from-slate-50 to-blue-50/30 p-5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20">
                {initials}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{fullName}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={admission.status || 'new'} />
                  <span className="text-slate-300">•</span>
                  <p className="text-xs text-slate-500 font-bold">{appNo}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Applied On</p>
              <p className="text-sm font-bold text-slate-700">
                {dateApplied ? format(new Date(dateApplied), 'dd MMM yyyy') : '—'}
              </p>
            </div>
          </div>

          {admission.status === 'accepted' && !isConverting && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-black text-emerald-950 uppercase">Application Approved</p>
                  <p className="text-[11px] text-emerald-700 font-bold uppercase tracking-tight mt-0.5">Ready to be converted into a student directory profile.</p>
                </div>
              </div>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] h-9 shrink-0 shadow-lg shadow-emerald-200" icon={<ArrowRight className="w-3.5 h-3.5" />} onClick={() => setIsConverting(true)}>
                Enroll Candidate
              </Button>
            </div>
          )}

          {/* Tab Stepper */}
          <div className="flex border-b border-slate-200 overflow-x-auto gap-2 pb-1 text-sm font-bold">
            {[
              { id: 'student', label: 'Student Details' },
              { id: 'parents', label: 'Parent Details' },
              { id: 'addresses', label: 'Address & Emergency' },
              { id: 'documents', label: 'Documents Checklist' },
              { id: 'fees', label: 'Fees & Remarks' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-4 border-b-2 font-bold whitespace-nowrap transition-all outline-none ${
                  activeTab === tab.id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <div className="space-y-6">
            {/* Student Details Tab */}
            {activeTab === 'student' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Profile */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.18em] flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5" /> Candidate Profile
                    </h4>
                    {[
                      { label: 'First Name', value: admission.firstName },
                      { label: 'Middle Name', value: admission.middleName || 'Not Provided' },
                      { label: 'Last Name', value: admission.lastName },
                      { label: 'Date of Birth', value: admission.dateOfBirth ? format(new Date(admission.dateOfBirth), 'dd MMM yyyy') : 'Not Provided' },
                      { label: 'Gender', value: admission.gender ? String(admission.gender).charAt(0).toUpperCase() + String(admission.gender).slice(1) : 'Not Provided' },
                      { label: 'Aadhaar Number', value: admission.aadhaarNumber || 'Not Provided' },
                      { label: 'Blood Group', value: admission.bloodGroup || 'Not Provided' },
                      { label: 'Religion', value: admission.religion || 'Not Provided' },
                      { label: 'Caste/Category', value: admission.category || 'Not Provided' },
                      { label: 'Nationality', value: admission.nationality || 'Not Provided' },
                      { label: 'Mother Tongue', value: admission.motherTongue || 'Not Provided' }
                    ].map((item: any) => (
                      <div key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
                        <span className="text-sm font-black text-slate-800">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Academic Profile */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.18em] flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5" /> Academic History
                    </h4>
                    {[
                      { label: 'Class Applying For', value: className },
                      { label: 'Previous School', value: admission.previousSchool || 'Not Provided' },
                      { label: 'Previous Board', value: admission.previousBoard || 'Not Provided' },
                      { label: 'Last Class Attended', value: admission.lastClassAttended || 'Not Provided' },
                      { label: 'Previous Marks/Percentage', value: admission.previousMarks ? `${admission.previousMarks}%` : 'Not Provided' },
                      { label: 'TC Number', value: admission.transferCertificateNo || 'Not Provided' },
                      { label: 'Admission Source', value: admission.admissionSource || 'Not Provided' }
                    ].map((item: any) => (
                      <div key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
                        <span className="text-sm font-black text-slate-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Parent Details Tab */}
            {activeTab === 'parents' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Primary & Father details */}
                  <div className="space-y-5">
                    {/* Primary Contact */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.18em] flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> Primary Contact
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Primary Guardian</p>
                            <p className="text-sm font-black text-slate-800">{admission.parentName || 'Not Provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                            <Phone className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Primary Phone</p>
                            <p className="text-sm font-black text-slate-800">{admission.parentPhone || 'Not Provided'}</p>
                          </div>
                        </div>
                        {admission.parentEmail && (
                          <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                              <Mail className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase">Primary Email</p>
                              <p className="text-sm font-black text-slate-800 truncate">{admission.parentEmail}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Father details */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.18em] flex items-center gap-2">
                        <User className="w-3.5 h-3.5" /> Father's Information
                      </h4>
                      <div className="space-y-2">
                        {[
                          { label: 'Name', value: admission.fatherName || 'Not Provided' },
                          { label: 'Phone', value: admission.fatherPhone || 'Not Provided' },
                          { label: 'Email', value: admission.fatherEmail || 'Not Provided' },
                          { label: 'Aadhaar', value: admission.fatherAadhaar || 'Not Provided' },
                          { label: 'Occupation', value: admission.fatherOccupation || 'Not Provided' },
                          { label: 'Qualification', value: admission.fatherQualification || 'Not Provided' },
                          { label: 'Annual Income', value: admission.fatherAnnualIncome ? `₹${admission.fatherAnnualIncome.toLocaleString()}` : 'Not Provided' },
                          { label: 'Office Address', value: admission.fatherOfficeAddress || 'Not Provided' }
                        ].map((item: any) => (
                          <div key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
                            <span className="text-sm font-black text-slate-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Mother details */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-pink-500 uppercase tracking-[0.18em] flex items-center gap-2">
                      <User className="w-3.5 h-3.5" /> Mother's Information
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Name', value: admission.motherName || 'Not Provided' },
                        { label: 'Phone', value: admission.motherPhone || 'Not Provided' },
                        { label: 'Email', value: admission.motherEmail || 'Not Provided' },
                        { label: 'Aadhaar', value: admission.motherAadhaar || 'Not Provided' },
                        { label: 'Occupation', value: admission.motherOccupation || 'Not Provided' },
                        { label: 'Qualification', value: admission.motherQualification || 'Not Provided' },
                        { label: 'Annual Income', value: admission.motherAnnualIncome ? `₹${admission.motherAnnualIncome.toLocaleString()}` : 'Not Provided' },
                        { label: 'Office Address', value: admission.motherOfficeAddress || 'Not Provided' }
                      ].map((item: any) => (
                        <div key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
                          <span className="text-sm font-black text-slate-800">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Address & Emergency Tab */}
            {activeTab === 'addresses' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Addresses */}
                  <div className="space-y-5">
                    {/* Correspondence Address */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.18em] flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" /> Correspondence Address
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                        {admission.addressStreet ? (
                          <div className="space-y-1.5 text-xs text-slate-700">
                            <div><span className="font-bold text-slate-400 uppercase">Street:</span> <span className="font-black text-slate-800">{admission.addressStreet}</span></div>
                            <div><span className="font-bold text-slate-400 uppercase">City:</span> <span className="font-black text-slate-800">{admission.addressCity}</span></div>
                            <div><span className="font-bold text-slate-400 uppercase">State & Pincode:</span> <span className="font-black text-slate-800">{admission.addressState} - {admission.addressPincode}</span></div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-700 font-bold leading-relaxed">{admission.address || 'Not Provided'}</p>
                        )}
                      </div>
                    </div>

                    {/* Permanent Address */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.18em] flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" /> Permanent Address
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                        {admission.permanentAddressStreet ? (
                          <div className="space-y-1.5 text-xs text-slate-700">
                            <div><span className="font-bold text-slate-400 uppercase">Street:</span> <span className="font-black text-slate-800">{admission.permanentAddressStreet}</span></div>
                            <div><span className="font-bold text-slate-400 uppercase">City:</span> <span className="font-black text-slate-800">{admission.permanentAddressCity}</span></div>
                            <div><span className="font-bold text-slate-400 uppercase">State & Pincode:</span> <span className="font-black text-slate-800">{admission.permanentAddressState} - {admission.permanentAddressPincode}</span></div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 font-bold italic">Same as correspondence address, or not provided.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Emergency / Logistics */}
                  <div className="space-y-5">
                    {/* Emergency Contacts */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.18em] flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" /> Guardian / Emergency Contact
                      </h4>
                      <div className="space-y-2">
                        {[
                          { label: 'Emergency Contact', value: admission.emergencyContactName || 'Not Provided' },
                          { label: 'Emergency Phone', value: admission.emergencyContactPhone || 'Not Provided' },
                          { label: 'Relationship', value: admission.guardianRelationship || 'Not Provided' },
                          { label: 'Guardian Occupation', value: admission.guardianOccupation || 'Not Provided' },
                          { label: 'Guardian Address', value: admission.guardianAddress || 'Not Provided' }
                        ].map((item: any) => (
                          <div key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
                            <span className="text-sm font-black text-slate-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Medical details */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.18em] flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5" /> Medical & Logistics
                      </h4>
                      <div className="space-y-2">
                        {[
                          { label: 'Medical Condition', value: admission.medicalCondition || 'None' },
                          { label: 'Allergies', value: admission.allergies || 'None' },
                          { label: 'Special Needs', value: admission.specialNeeds || 'None' },
                          { label: 'Transport Service', value: admission.transportRequired ? 'Required' : 'Not Needed' },
                          { label: 'Hostel Facility', value: admission.hostelRequired ? 'Required' : 'Not Needed' }
                        ].map((item: any) => (
                          <div key={item.label} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
                            <span className="text-sm font-black text-slate-800">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Checklist Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Checklist Verification Status</p>
                    <p className="mt-0.5 opacity-90">Digital document upload links will be operational in the next phase rollout (Phase 2.7D). Please verify paper-based documents physically.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Student Docs */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Candidate Documentation
                    </h4>
                    {[
                      'Student Aadhaar Card',
                      'Birth Certificate',
                      'Leaving Certificate / TC / LC',
                      'Previous Marksheet',
                      'Passport Size Photo'
                    ].map((docName) => (
                      <div key={docName} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                        <span className="text-xs font-bold text-slate-700">{docName}</span>
                        <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200">
                          Pending Upload
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Parent Docs */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Parent Documentation
                    </h4>
                    {[
                      'Father Aadhaar Card',
                      'Mother Aadhaar Card',
                      'Guardian ID Proof'
                    ].map((docName) => (
                      <div key={docName} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                        <span className="text-xs font-bold text-slate-700">{docName}</span>
                        <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200">
                          Pending Upload
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Fees Tab */}
            {activeTab === 'fees' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Fee Assignments */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.18em] flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5" /> Assigned Fees
                      </h4>
                      {totalAmount > 0 && (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100">
                          <Calculator className="w-3 h-3 text-blue-600" />
                          <span className="text-[10px] font-black text-blue-700">Total ₹{totalAmount.toLocaleString()}</span>
                        </span>
                      )}
                    </div>
                    {canProcessAdmissions && (
                      <button
                        type="button"
                        onClick={() => setIsEditingFees(!isEditingFees)}
                        className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all border ${
                          isEditingFees
                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isEditingFees ? <><X className="w-3 h-3" /> Cancel</> : <><Edit3 className="w-3 h-3" /> Edit Fees</>}
                      </button>
                    )}
                  </div>

                  {isEditingFees ? (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                      {availableFeeStructureDocs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {availableFeeStructureDocs.map((fee) => {
                            const assignment = tempAssignments.find(fa => fa.feeStructureId === fee.id);
                            const isSelected = !!assignment;
                            return (
                              <div
                                key={fee.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                  isSelected ? 'bg-white border-blue-400 ring-1 ring-blue-500/10 shadow-sm' : 'bg-white/50 border-slate-100 opacity-60'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleFee(fee)}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                                  }`}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-black truncate ${isSelected ? 'text-blue-900' : 'text-slate-400'}`}>{fee.name}</p>
                                  <div className={`mt-0.5 flex items-center gap-1 px-2 py-0.5 rounded border w-fit ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-transparent border-transparent'}`}>
                                    <IndianRupee className={`w-2.5 h-2.5 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                                    <input
                                      type="number"
                                      disabled={!isSelected}
                                      value={isSelected ? assignment.amount : fee.totalAmount}
                                      onChange={(e) => updateTempAmount(fee.id, e.target.value)}
                                      className={`text-xs font-black bg-transparent outline-none w-20 ${isSelected ? 'text-blue-700' : 'text-slate-300'}`}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic text-center py-4">No fee structures available for this class.</p>
                      )}
                      <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                        <p className="text-xs font-bold text-slate-500">
                          Total: <span className="text-blue-700">₹{tempAssignments.reduce((s, fa) => s + fa.amount, 0).toLocaleString()}</span>
                        </p>
                        <Button size="sm" icon={<Save className="w-3.5 h-3.5" />} isLoading={isLoading} onClick={handleFeeUpdate}>
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(admission.assignedFees || []).length > 0 ? (
                        (admission.assignedFees || []).map((af: any) => (
                          <div key={af.feeStructureId || af.id} className="relative flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white overflow-hidden hover:border-orange-200 hover:shadow-sm transition-all">
                            <div className="absolute left-0 top-2 bottom-2 w-1 bg-orange-400 rounded-r" />
                            <div className="pl-3">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{(af.feeStructure as any)?.components?.[0]?.category || 'Fee'}</p>
                              <p className="text-xs font-black text-slate-800">{af.feeStructure?.name || af.name || '—'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-blue-700">₹{(af.customAmount ?? (af.feeStructure as any)?.totalAmount ?? 0).toLocaleString()}</p>
                              {af.customAmount != null && af.customAmount !== (af.feeStructure as any)?.totalAmount && (
                                <span className="text-[8px] font-black text-blue-400 bg-blue-50 px-1 rounded uppercase">Custom</span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-xs text-slate-400 italic bg-slate-50 p-5 rounded-xl border border-dashed border-slate-200 text-center">
                          No fee components assigned yet.{canProcessAdmissions && ' Use "Edit Fees" to assign.'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Administrative Remarks */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.18em] flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" /> Administrative Remarks
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{admission.remarks || 'No remarks added.'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-5 border-t border-slate-100">
            {canProcessAdmissions && !isEditingFees && (
              <>
                {admission.status === 'new' && (
                  <Button variant="secondary" icon={<Clock className="w-4 h-4" />} isLoading={isLoading} onClick={() => handleUpdateStatus('under_review')}>
                    Mark Under Review
                  </Button>
                )}
                {(admission.status === 'new' || admission.status === 'under_review') && (
                  <>
                    <Button icon={<CheckCircle className="w-4 h-4" />} isLoading={isLoading} onClick={() => handleUpdateStatus('accepted')}>
                      Accept
                    </Button>
                    <Button variant="danger" icon={<XCircle className="w-4 h-4" />} isLoading={isLoading} onClick={() => handleUpdateStatus('rejected')}>
                      Reject
                    </Button>
                  </>
                )}
                {admission.status === 'accepted' && (
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" icon={<ArrowRight className="w-4 h-4" />} onClick={() => setIsConverting(true)}>
                    Enroll as Student
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── Enrollment Flow ── */
        <div className="space-y-6">
          <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-4 items-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-emerald-900">Enrolling {fullName}</p>
              <p className="text-xs text-emerald-700">Assign the final class, section, and roll number.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Assign Class *"
              type="select"
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              options={classes.map(c => ({ label: c.name, value: c.id }))}
            />
            <Input
              label="Assign Section"
              type="select"
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              options={sections.map(s => ({ label: `Section ${s.name}`, value: s.id }))}
              disabled={!selectedClass}
            />
            <Input
              label="Roll Number (Optional)"
              placeholder="e.g. 05"
              value={rollNumber}
              onChange={e => setRollNumber(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1 h-11" onClick={() => setIsConverting(false)}>← Back</Button>
            <Button className="flex-1 h-11 shadow-xl shadow-blue-500/20" isLoading={isLoading} onClick={handleConvert}>Confirm Enrollment</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
