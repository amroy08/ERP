import React, { useState, useEffect } from 'react';
import { Settings, Calendar, Globe, Mail, Phone, MapPin, Building, Save, Plus, Globe2 } from 'lucide-react';
import { Breadcrumb } from '../../components/common/Breadcrumb';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Tabs } from '../../components/common/Tabs';
import { Badge } from '../../components/common/Badge';
import axiosInstance from '../../api/axiosInstance';
import { School, AcademicYear, ApiResponse } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [school, setSchool] = useState<School | null>(null);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schoolRes, yearsRes] = await Promise.all([
          axiosInstance.get<ApiResponse<School>>('/school'),
          axiosInstance.get<ApiResponse<AcademicYear[]>>('/academic-years')
        ]);
        setSchool(schoolRes.data.data);
        setAcademicYears(yearsRes.data.data);
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setIsSaving(true);
    try {
      await axiosInstance.put('/school', school);
      toast.success('School settings saved successfully!');
    } catch (err) {
      console.error('Update failed:', err);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-100 rounded-xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-50 rounded-xl" />
          <div className="md:col-span-2 h-64 bg-slate-50 rounded-xl" />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General Info', icon: <Building className="w-4 h-4" /> },
    { id: 'academic', label: 'Academic Years', icon: <Calendar className="w-4 h-4" /> },
    { id: 'branding', label: 'Branding', icon: <Globe2 className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'System' }, { label: 'Settings' }]} />
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">School Settings</h1>
          <p className="text-slate-500 text-sm">Manage institutional details, branding, and academic configuration.</p>
        </div>
        <Button 
          onClick={handleUpdateSchool} 
          isLoading={isSaving}
          icon={<Save className="w-4 h-4" />}
        >
          Save All Changes
        </Button>
      </div>

      <Card className="p-0 overflow-hidden border-slate-200">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="bg-slate-50/50 px-4 pt-1" />
        
        <div className="p-6">
          {activeTab === 'general' && school && (
            <form className="space-y-8" onSubmit={handleUpdateSchool}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    Basic Information
                  </h3>
                  <Input 
                    label="School Name" 
                    value={school.name} 
                    onChange={e => setSchool({...school, name: e.target.value})}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Established Year" 
                      type="number" 
                      value={school.establishedYear} 
                      onChange={e => setSchool({...school, establishedYear: parseInt(e.target.value)})}
                    />
                    <Input 
                      label="Affiliation Board" 
                      value={school.board} 
                      onChange={e => setSchool({...school, board: e.target.value})}
                    />
                  </div>
                  <Input 
                    label="Principal Name" 
                    value={school.principalName} 
                    onChange={e => setSchool({...school, principalName: e.target.value})}
                  />
                </div>

                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Contact & Location
                  </h3>
                  <Input 
                    label="Email ID" 
                    type="email" 
                    icon={<Mail className="w-4 h-4" />}
                    value={school.email} 
                    onChange={e => setSchool({...school, email: e.target.value})}
                    required
                  />
                  <Input 
                    label="Phone Number" 
                    icon={<Phone className="w-4 h-4" />}
                    value={school.phone} 
                    onChange={e => setSchool({...school, phone: e.target.value})}
                    required
                  />
                  <Input 
                    label="Website" 
                    icon={<Globe className="w-4 h-4" />}
                    value={school.website} 
                    onChange={e => setSchool({...school, website: e.target.value})}
                  />
                  <Input 
                    label="Full Address" 
                    multiline 
                    value={school.address} 
                    onChange={e => setSchool({...school, address: e.target.value})}
                    required
                  />
                </div>
              </div>
            </form>
          )}

          {activeTab === 'academic' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Academic Year History</h3>
                <Button size="sm" variant="secondary" icon={<Plus className="w-4 h-4" />}>Add New Year</Button>
              </div>
              
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Session Name</th>
                      <th className="px-6 py-4">Start Date</th>
                      <th className="px-6 py-4">End Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {academicYears.map((year) => (
                      <tr key={year.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">{year.name}</td>
                        <td className="px-6 py-4 text-slate-500">{format(new Date(year.startDate), 'dd MMM yyyy')}</td>
                        <td className="px-6 py-4 text-slate-500">{format(new Date(year.endDate), 'dd MMM yyyy')}</td>
                        <td className="px-6 py-4">
                          {year.isCurrent ? (
                            <Badge variant="green" dot>Current Session</Badge>
                          ) : (
                            <Badge variant="gray">Past Session</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-blue-600 font-semibold hover:underline">Edit</button>
                        </td>
                      </tr>
                    ))}
                    {academicYears.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          No academic years configured.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'branding' && school && (
            <div className="max-w-2xl space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">School Logo</h3>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                    {school.logo ? (
                      <img src={school.logo} alt="School Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Building className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button size="sm" variant="secondary">Change Logo</Button>
                    <p className="text-xs text-slate-400">Recommended: 512x512 PNG, Max 2MB</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Localization</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Currency (ISO)" 
                    value={school.currency} 
                    onChange={e => setSchool({...school, currency: e.target.value})}
                  />
                  <Input 
                    label="Currency Symbol" 
                    value={school.currencySymbol} 
                    onChange={e => setSchool({...school, currencySymbol: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
