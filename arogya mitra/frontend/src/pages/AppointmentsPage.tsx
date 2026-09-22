import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../lib/auth';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Calendar,
  Clock,
  QrCode,
  User,
  Building,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Stethoscope,
  Printer,
  Search,
  Filter,
  Users,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface OpdToken {
  id: string;
  token_number: string;
  patient_id: string;
  patient_name: string;
  patient_mrn: string;
  patient_abha: string;
  facility_name: string;
  department: string;
  room_number: string;
  doctor_name: string;
  position_in_queue: number;
  estimated_wait_mins: number;
  priority: 'ROUTINE' | 'SENIOR_CITIZEN' | 'MATERNAL_HIGH_RISK' | 'EMERGENCY_TRIAGE';
  status: 'WAITING' | 'SERVING' | 'COMPLETED' | 'CANCELLED';
  slot_time: string;
  created_at: string;
}

export const AppointmentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [patients, setPatients] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Active Selected Boarding Pass for Detail Modal
  const [activeBoardingPass, setActiveBoardingPass] = useState<OpdToken | null>(null);

  // Book OPD Token Modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('District Hospital, Central OPD');
  const [department, setDepartment] = useState('General Medicine');
  const [priority, setPriority] = useState<OpdToken['priority']>('ROUTINE');
  const [chiefComplaint, setChiefComplaint] = useState('');

  // Initial Seeded OPD Queue
  const [tokens, setTokens] = useState<OpdToken[]>([
    {
      id: 'tok-1',
      token_number: 'TK-OPD-108',
      patient_id: 'p-1',
      patient_name: 'Rajesh Patil',
      patient_mrn: 'MH-2026-0041',
      patient_abha: '91-4820-9182-3910',
      facility_name: 'District Hospital, Nashik',
      department: 'General Medicine',
      room_number: 'Room 104',
      doctor_name: 'Dr. Ramesh Patil (MD)',
      position_in_queue: 4,
      estimated_wait_mins: 15,
      priority: 'ROUTINE',
      status: 'WAITING',
      slot_time: 'Today, 10:30 AM',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tok-2',
      token_number: 'TK-ANC-042',
      patient_id: 'p-2',
      patient_name: 'Sunita Mehra (High-Risk ANC)',
      patient_mrn: 'MH-2026-0089',
      patient_abha: '91-8841-2910-4491',
      facility_name: 'District Hospital, Nashik',
      department: 'Obstetrics & Gynecology',
      room_number: 'Room 202',
      doctor_name: 'Dr. Kavita Deshmukh',
      position_in_queue: 1,
      estimated_wait_mins: 3,
      priority: 'MATERNAL_HIGH_RISK',
      status: 'SERVING',
      slot_time: 'Today, 10:15 AM',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'tok-3',
      token_number: 'TK-NCD-019',
      patient_id: 'p-3',
      patient_name: 'Eknath Shinde (Elderly HTN)',
      patient_mrn: 'MH-2026-0112',
      patient_abha: '91-3329-8812-7612',
      facility_name: 'Civil Hospital Malegaon',
      department: 'Cardiology (NCD Clinic)',
      room_number: 'Room 108',
      doctor_name: 'Dr. A. K. Sharma',
      position_in_queue: 2,
      estimated_wait_mins: 8,
      priority: 'SENIOR_CITIZEN',
      status: 'WAITING',
      slot_time: 'Today, 11:00 AM',
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'tok-4',
      token_number: 'TK-PED-005',
      patient_id: 'p-4',
      patient_name: 'Aarav Gavit (Child Anemia)',
      patient_mrn: 'MH-2026-0155',
      patient_abha: '91-9921-4412-1082',
      facility_name: 'Sub-District Hospital Niphad',
      department: 'Pediatrics & Immunization',
      room_number: 'Room 101',
      doctor_name: 'Dr. Neha Kulkarni',
      position_in_queue: 0,
      estimated_wait_mins: 0,
      priority: 'ROUTINE',
      status: 'COMPLETED',
      slot_time: 'Today, 09:45 AM',
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ]);

  useEffect(() => {
    async function loadMeta() {
      try {
        setIsLoading(true);
        const [pRes, bRes] = await Promise.all([
          api.get('/patients?size=50'),
          api.get('/branches'),
        ]);
        const items = pRes.items || [];
        setPatients(items);
        setBranches(bRes || []);
        if (items.length > 0) setSelectedPatientId(items[0].id);
        if (bRes.length > 0) setSelectedFacility(bRes[0].name);
      } catch (err) {
        console.error('Failed to load appointments meta:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadMeta();
  }, []);

  const handleBookToken = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === selectedPatientId) || patients[0];
    const roomMap: Record<string, string> = {
      'General Medicine': 'Room 104',
      'Obstetrics & Gynecology': 'Room 202',
      'Cardiology (NCD)': 'Room 108',
      'Pediatrics': 'Room 101',
      'Orthopedics': 'Room 105',
      'Ophthalmology': 'Room 301',
    };

    const nextNumber = Math.floor(100 + Math.random() * 900);
    const prefix = department.slice(0, 3).toUpperCase();
    const newToken: OpdToken = {
      id: `tok-${Date.now()}`,
      token_number: `TK-${prefix}-${nextNumber}`,
      patient_id: patient?.id || 'demo-p',
      patient_name: patient?.name || 'Citizen Patient',
      patient_mrn: patient?.mrn || `MH-2026-0${nextNumber}`,
      patient_abha: patient?.abha_id || `91-${nextNumber}-0000-1111`,
      facility_name: selectedFacility,
      department,
      room_number: roomMap[department] || 'Room 102',
      doctor_name: 'Dr. Specialist on Duty',
      position_in_queue: tokens.filter((t) => t.status === 'WAITING').length + 1,
      estimated_wait_mins: (tokens.filter((t) => t.status === 'WAITING').length + 1) * 5,
      priority,
      status: 'WAITING',
      slot_time: 'Today, Walk-in Fast Track',
      created_at: new Date().toISOString(),
    };

    setTokens([newToken, ...tokens]);
    setActiveBoardingPass(newToken);
    setIsBookModalOpen(false);
    setChiefComplaint('');
  };

  const filteredTokens = tokens.filter((t) => {
    const matchesSearch =
      t.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.token_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.patient_mrn.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept =
      selectedDeptFilter === 'ALL' ||
      t.department.toLowerCase().includes(selectedDeptFilter.toLowerCase());
    return matchesSearch && matchesDept;
  });

  // Highlight featured active pass (first waiting or serving)
  const featuredPass = tokens.find((t) => t.status === 'SERVING' || t.status === 'WAITING') || tokens[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary" />
            {t('appointments.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('appointments.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsBookModalOpen(true)}
            className="gap-2 shadow-sm font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            {t('appointments.book_new_opd')}
          </Button>
        </div>
      </div>

      {/* Hero Featured Live Boarding Pass */}
      {featuredPass && (
        <div className="relative bg-gradient-to-r from-[#003366] to-[#0D1B2A] text-white rounded-3xl p-6 md:p-8 shadow-xl overflow-hidden border border-blue-900/50 animate-fade-in">
          {/* Background watermark badge */}
          <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none text-9xl font-black text-white font-mono">
            OPD
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  {t('appointments.active_pass')}
                </span>
                <span className="text-xs text-blue-200">
                  Estimated Wait: <strong>~{featuredPass.estimated_wait_mins} Mins</strong>
                </span>
              </div>

              <div>
                <div className="text-4xl md:text-5xl font-black font-mono tracking-tight text-white flex items-center gap-3">
                  {featuredPass.token_number}
                  {featuredPass.priority === 'MATERNAL_HIGH_RISK' && (
                    <span className="text-xs bg-rose-600 text-white px-2.5 py-1 rounded-full font-sans font-bold">
                      High-Risk ANC Priority
                    </span>
                  )}
                </div>
                <p className="text-lg font-bold text-blue-100 mt-1">{featuredPass.patient_name}</p>
                <p className="text-xs text-blue-300 font-mono">
                  MRN: {featuredPass.patient_mrn} • ABHA: {featuredPass.patient_abha}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                  <span className="text-blue-200 block text-[10px]">{t('appointments.assigned_room')}</span>
                  <strong className="text-white text-sm">{featuredPass.room_number}</strong>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10">
                  <span className="text-blue-200 block text-[10px]">{t('appointments.assigned_doctor')}</span>
                  <strong className="text-white text-sm truncate block">{featuredPass.doctor_name}</strong>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10 col-span-2 sm:col-span-1">
                  <span className="text-blue-200 block text-[10px]">{t('appointments.position_in_queue')}</span>
                  <strong className="text-emerald-300 text-sm">
                    {featuredPass.position_in_queue === 0 ? 'Now Serving' : `#${featuredPass.position_in_queue} in line`}
                  </strong>
                </div>
              </div>
            </div>

            {/* QR Code Pass Box */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 bg-white text-slate-900 p-4 rounded-2xl shadow-2xl border-4 border-blue-300/30 flex-shrink-0 text-center">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
                <QrCode className="w-28 h-28 text-slate-900 mx-auto" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800">Scan at OPD Turnstile / Gate</p>
                <p className="text-[10px] text-slate-500 font-mono">ABDM Fast-Track Verified</p>
                <Button
                  variant="outline"
                  onClick={() => setActiveBoardingPass(featuredPass)}
                  className="mt-2 text-xs py-1 px-3 h-7 w-full border-blue-600 text-blue-700 hover:bg-blue-50 font-bold"
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  Print Pass
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OPD Live Department Status Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card orientation="vertical" className="p-4 bg-white border-border text-center shadow-xs">
          <div className="text-xs text-muted-foreground font-semibold">Total Patients Today</div>
          <div className="text-2xl font-black text-slate-800 mt-1 font-mono">148</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">↑ 12% vs yesterday</div>
        </Card>

        <Card orientation="vertical" className="p-4 bg-white border-border text-center shadow-xs">
          <div className="text-xs text-muted-foreground font-semibold">Currently Serving</div>
          <div className="text-2xl font-black text-blue-700 mt-1 font-mono">6 Rooms</div>
          <div className="text-[11px] text-blue-600 font-medium mt-0.5">All Doctors Active</div>
        </Card>

        <Card orientation="vertical" className="p-4 bg-white border-border text-center shadow-xs">
          <div className="text-xs text-muted-foreground font-semibold">Avg. Consultation Time</div>
          <div className="text-2xl font-black text-slate-800 mt-1 font-mono">7.4 Min</div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">Optimal Pace</div>
        </Card>

        <Card orientation="vertical" className="p-4 bg-white border-border text-center shadow-xs">
          <div className="text-xs text-muted-foreground font-semibold">Emergency Triage</div>
          <div className="text-2xl font-black text-rose-600 mt-1 font-mono">0 Pending</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Zero Delays</div>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-border shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search patient, token #, MRN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'General', 'Maternal', 'Cardiology', 'Pediatrics'].map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDeptFilter(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedDeptFilter === dept
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dept === 'ALL' ? 'All Departments' : dept}
            </button>
          ))}
        </div>
      </div>

      {/* OPD Tokens Queue Table */}
      <Card orientation="vertical" className="border-border shadow-sm overflow-hidden bg-white">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Live OPD Queue Tickets ({filteredTokens.length})
          </h3>
          <span className="text-xs text-muted-foreground">Auto-synced with turnstiles</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-4">Token #</th>
                <th className="py-3 px-4">Patient Name & MRN</th>
                <th className="py-3 px-4">Department & Doctor</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Queue Pos.</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Pass</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No OPD tokens matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((token) => (
                  <tr key={token.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {token.token_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{token.patient_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{token.patient_mrn}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{token.department}</div>
                      <div className="text-[11px] text-slate-500">{token.doctor_name}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{token.room_number}</td>
                    <td className="py-3 px-4">
                      {token.status === 'SERVING' ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Inside Room
                        </span>
                      ) : token.status === 'COMPLETED' ? (
                        <span className="text-slate-400">Checked Out</span>
                      ) : (
                        <span className="font-mono font-medium text-slate-700">
                          #{token.position_in_queue} (~{token.estimated_wait_mins}m)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          token.priority === 'MATERNAL_HIGH_RISK'
                            ? 'danger'
                            : token.priority === 'SENIOR_CITIZEN'
                            ? 'warning'
                            : 'neutral'
                        }
                        className="text-[10px]"
                      >
                        {token.priority.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          token.status === 'SERVING'
                            ? 'success'
                            : token.status === 'WAITING'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {token.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveBoardingPass(token)}
                        className="p-1.5 rounded-lg text-primary hover:bg-blue-50 transition"
                        title="View Digital QR Boarding Pass"
                      >
                        <QrCode className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Book New OPD Token Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Book New OPD Token Pass
              </h2>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookToken} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Patient *</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (MRN: {p.mrn} • {p.gender}, {p.age_years}y)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Health Facility *</label>
                <select
                  value={selectedFacility}
                  onChange={(e) => setSelectedFacility(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="District Hospital, Nashik (Central OPD)">
                    District Hospital, Nashik (Central OPD)
                  </option>
                  <option value="Sub-District Hospital Niphad">Sub-District Hospital Niphad</option>
                  <option value="Civil Hospital Malegaon">Civil Hospital Malegaon</option>
                  <option value="Dindori Primary Health Centre">Dindori Primary Health Centre</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department / Clinical Specialty *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="General Medicine">General Medicine (Room 104)</option>
                  <option value="Obstetrics & Gynecology">Obstetrics & Gynecology (Room 202)</option>
                  <option value="Cardiology (NCD)">Cardiology & NCD (Room 108)</option>
                  <option value="Pediatrics">Pediatrics & Neonatal (Room 101)</option>
                  <option value="Orthopedics">Orthopedics (Room 105)</option>
                  <option value="Ophthalmology">Ophthalmology & Eye (Room 301)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Triage Priority *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ROUTINE', label: 'Routine Walk-in' },
                    { id: 'MATERNAL_HIGH_RISK', label: 'High-Risk ANC Mother' },
                    { id: 'SENIOR_CITIZEN', label: 'Senior Citizen (>60y)' },
                    { id: 'EMERGENCY_TRIAGE', label: 'Urgent Triage Fast-Track' },
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPriority(p.id as any)}
                      className={`p-2.5 rounded-lg border text-left font-medium transition ${
                        priority === p.id
                          ? 'bg-blue-50 border-primary text-primary font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chief Reason / Symptoms</label>
                <Input
                  placeholder="e.g. Mild chest discomfort, routine pregnancy follow-up"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBookModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="text-xs font-semibold">
                  Generate Instant Token
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Boarding Pass Detail Print Modal */}
      {activeBoardingPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-4 border-[#003366] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#003366] text-white flex items-center justify-center font-bold text-xs">
                  AM
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#003366]">Arogya Mitra Pass</h3>
                  <p className="text-[10px] text-slate-500">ABDM Fast-Track OPD Ticket</p>
                </div>
              </div>
              <button
                onClick={() => setActiveBoardingPass(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Ticket Graphic */}
            <div className="bg-gradient-to-b from-blue-50/80 to-slate-50 rounded-2xl p-4 border border-blue-200 text-center space-y-3">
              <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                {activeBoardingPass.facility_name}
              </span>

              <div className="text-4xl font-black font-mono text-[#003366] tracking-tight py-1">
                {activeBoardingPass.token_number}
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs inline-block mx-auto">
                <QrCode className="w-36 h-36 text-slate-900 mx-auto" />
              </div>

              <div className="text-xs text-slate-800 font-semibold">{activeBoardingPass.patient_name}</div>
              <div className="text-[11px] text-slate-500 font-mono">
                MRN: {activeBoardingPass.patient_mrn} • ABHA: {activeBoardingPass.patient_abha}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-left text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Department & Room</span>
                  <span className="font-bold text-slate-800">
                    {activeBoardingPass.department} ({activeBoardingPass.room_number})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Doctor on Duty</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {activeBoardingPass.doctor_name}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="primary"
                onClick={() => window.print()}
                className="w-full text-xs font-bold gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF Ticket
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
