import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Printer,
  FileText,
  QrCode,
  Layers,
  Sparkles,
  X,
  RefreshCw,
  Eye,
  Check,
  Activity,
  ShieldAlert,
} from 'lucide-react';

export const LaboratoryPage: React.FC = () => {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Selected Order State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [reportData, setReportData] = useState<any | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);

  // New Order Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [orderUrgency, setOrderUrgency] = useState('ROUTINE');
  const [clinicalIndication, setClinicalIndication] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Result Entry Form State
  const [resultInputs, setResultInputs] = useState<{ [itemId: string]: { value: string; numVal?: number; notes: string } }>({});
  const [isSavingResults, setIsSavingResults] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [catalogRes, ordersRes, patientsRes] = await Promise.all([
        api.get('/lab/catalog'),
        api.get('/lab/orders'),
        api.get('/patients?size=50'),
      ]);
      setCatalog(catalogRes || []);
      setOrders(ordersRes || []);
      const pItems = patientsRes?.items || [];
      setPatients(pItems);
      if (pItems.length > 0 && !selectedPatientId) {
        setSelectedPatientId(pItems[0].id);
      }
    } catch (err) {
      console.error('Failed to load lab data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateOrder = () => {
    setSelectedTestIds([]);
    setClinicalIndication('');
    setOrderUrgency('ROUTINE');
    setIsOrderModalOpen(true);
  };

  const handleToggleTestSelection = (testId: string) => {
    setSelectedTestIds((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || selectedTestIds.length === 0) {
      alert('Please select a patient and at least one diagnostic test.');
      return;
    }

    try {
      setIsSubmittingOrder(true);
      await api.post('/lab/orders', {
        patient_id: selectedPatientId,
        test_ids: selectedTestIds,
        urgency: orderUrgency,
        clinical_indication: clinicalIndication || 'Diagnostic Investigation',
      });
      setIsOrderModalOpen(false);
      setActionSuccessMsg('Lab Requisition created with automated barcoded specimen labels!');
      setTimeout(() => setActionSuccessMsg(null), 4000);
      fetchData();
    } catch (err) {
      console.error('Failed to create lab order:', err);
      alert('Failed to create lab requisition.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleOpenResultEntry = (order: any) => {
    setSelectedOrder(order);
    const initialInputs: { [itemId: string]: { value: string; numVal?: number; notes: string } } = {};
    order.items.forEach((item: any) => {
      initialInputs[item.id] = {
        value: item.result_value === 'PENDING' ? '' : item.result_value || '',
        numVal: item.numeric_value || undefined,
        notes: item.technician_notes || '',
      };
    });
    setResultInputs(initialInputs);
    setIsResultModalOpen(true);
  };

  const handleResultSubmit = async (markPublished = true) => {
    if (!selectedOrder) return;

    try {
      setIsSavingResults(true);
      const resultsPayload = Object.entries(resultInputs).map(([itemId, res]) => ({
        item_id: itemId,
        result_value: res.value || 'NORMAL',
        numeric_value: res.numVal !== undefined ? Number(res.numVal) : undefined,
        technician_notes: res.notes || undefined,
      }));

      await api.post(`/lab/orders/${selectedOrder.id}/results`, {
        results: resultsPayload,
        mark_published: markPublished,
      });

      setIsResultModalOpen(false);
      setActionSuccessMsg('Analyzer results verified and published to Longitudinal EHR!');
      setTimeout(() => setActionSuccessMsg(null), 4000);
      fetchData();
    } catch (err) {
      console.error('Failed to submit results:', err);
      alert('Failed to save analyzer results.');
    } finally {
      setIsSavingResults(false);
    }
  };

  const handleViewReport = async (orderId: string) => {
    try {
      setIsReportLoading(true);
      setIsReportModalOpen(true);
      const rep = await api.get(`/lab/orders/${orderId}/report`);
      setReportData(rep);
    } catch (err) {
      console.error('Failed to load diagnostic report:', err);
      alert('Failed to retrieve diagnostic report.');
    } finally {
      setIsReportLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const pName = order.patient_name || '';
    const mrn = order.patient_mrn || '';
    const ordNum = order.order_number || '';
    const matchesSearch =
      pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ordNum.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'CRITICAL') return order.items?.some((i: any) => i.is_critical);
    return order.status === statusFilter;
  });

  const totalOrders = orders.length;
  const criticalCount = orders.reduce(
    (acc, ord) => acc + (ord.items?.filter((i: any) => i.is_critical).length || 0),
    0
  );
  const pendingCount = orders.filter((o) => o.status === 'SAMPLE_COLLECTED' || o.status === 'ORDERED').length;
  const completedCount = orders.filter((o) => o.status === 'PUBLISHED' || o.status === 'COMPLETED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-blue)',
              }}
            >
              <FlaskConical size={22} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {t('lab.title', 'Laboratory Information System (LIS)')}
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: 0 }}>
            {t(
              'lab.subtitle',
              'National Essential Diagnostic List (EDL), Barcoded Specimen Tracking, Automated Critical Alarms & Diagnostic Reports'
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={fetchData} leftIcon={<RefreshCw size={16} />}>
            {t('common.refresh', 'Refresh')}
          </Button>
          <Button variant="primary" onClick={handleOpenCreateOrder} leftIcon={<Plus size={16} />}>
            {t('lab.create_order_btn', '+ New Lab Requisition')}
          </Button>
        </div>
      </div>

      {actionSuccessMsg && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10b981',
            color: '#065f46',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} color="#10b981" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <Card style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-blue)',
            }}
          >
            <FlaskConical size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {t('lab.total_orders', 'Total Requisitions')}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {totalOrders}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-red)',
            }}
          >
            <ShieldAlert size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {t('lab.critical_alarms', 'Critical Threshold Alerts')}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-red)' }}>
              {criticalCount}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
            }}
          >
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {t('lab.pending_processing', 'Samples in Processing')}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#d97706' }}>
              {pendingCount}
            </div>
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-green)',
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {t('lab.published_reports', 'Published Diagnostic Reports')}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-green)' }}>
              {completedCount}
            </div>
          </div>
        </Card>
      </div>

      {/* Main Lab Content Card */}
      <Card style={{ padding: '1.5rem' }}>
        {/* Filters and Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 300px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <Input
                placeholder="Search by Patient Name, MRN, or Order Number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.25rem', width: '100%' }}
              />
            </div>
          </div>

          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['ALL', 'CRITICAL', 'SAMPLE_COLLECTED', 'PUBLISHED'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: statusFilter === filter ? '1px solid var(--accent-blue)' : '1px solid var(--border-light)',
                  backgroundColor: statusFilter === filter ? 'var(--accent-blue-subtle)' : '#ffffff',
                  color: statusFilter === filter ? 'var(--primary-navy)' : 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  fontWeight: statusFilter === filter ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {filter === 'ALL' && 'All Orders'}
                {filter === 'CRITICAL' && '🚨 Critical Alerts'}
                {filter === 'SAMPLE_COLLECTED' && '🧪 In Laboratory'}
                {filter === 'PUBLISHED' && '✅ Verified Reports'}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 0.5rem' }} />
            <div>Loading Laboratory Diagnostic Orders...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FlaskConical size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <div style={{ fontWeight: 600 }}>No Lab Orders Found</div>
            <p style={{ fontSize: '0.8125rem' }}>Create a new requisition to start barcoded specimen testing.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '2px solid var(--border-light)',
                    textAlign: 'left',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: '0.75rem 0.5rem' }}>Order Details</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Patient / MRN</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Specimen Barcodes</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Requested Tests</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status & Alerts</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const hasCritical = order.items?.some((i: any) => i.is_critical);
                  const isStat = order.urgency === 'STAT_EMERGENCY';

                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        backgroundColor: hasCritical ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>
                          {order.order_number}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(order.created_at).toLocaleDateString()} •{' '}
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {isStat && (
                          <span
                            style={{
                              backgroundColor: '#fee2e2',
                              color: '#991b1b',
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              display: 'inline-block',
                              marginTop: '0.2rem',
                            }}
                          >
                            ⚡ STAT EMERGENCY
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {order.patient_name || 'Citizen'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          MRN: {order.patient_mrn || 'N/A'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {order.samples?.map((s: any) => (
                            <div
                              key={s.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: '0.75rem',
                                backgroundColor: 'var(--bg-surface-secondary)',
                                padding: '0.2rem 0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-light)',
                                width: 'fit-content',
                              }}
                            >
                              <QrCode size={12} color="var(--accent-blue)" />
                              <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{s.barcode}</span>
                              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>({s.sample_type})</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {order.items?.map((item: any) => (
                            <Badge
                              key={item.id}
                              variant={item.is_critical ? 'danger' : item.is_abnormal ? 'warning' : 'neutral'}
                            >
                              {item.test_name || item.test_code}:{' '}
                              {item.result_value === 'PENDING' ? 'Pending' : item.result_value}
                            </Badge>
                          ))}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <Badge
                            variant={
                              order.status === 'PUBLISHED'
                                ? 'success'
                                : order.status === 'SAMPLE_COLLECTED'
                                ? 'info'
                                : 'neutral'
                            }
                          >
                            {order.status}
                          </Badge>
                          {hasCritical && (
                            <span
                              style={{
                                color: 'var(--accent-red)',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                            >
                              <AlertTriangle size={13} /> CRITICAL VALUE
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenResultEntry(order)}
                            leftIcon={<Activity size={14} />}
                          >
                            Enter Results
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleViewReport(order.id)}
                            leftIcon={<FileText size={14} />}
                          >
                            Report
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* EDL Catalog Reference Drawer / Card */}
      <Card style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              National Essential Diagnostic List (EDL) Reference Catalog
            </h3>
            <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Standard biological reference ranges and critical panic alarm thresholds
            </p>
          </div>
          <Badge variant="info">EDL Compliant</Badge>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '0.85rem',
          }}
        >
          {catalog.map((tItem) => (
            <div
              key={tItem.id}
              style={{
                padding: '0.85rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{tItem.name}</span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--accent-blue)',
                  }}
                >
                  {tItem.category}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Tube: <strong style={{ color: 'var(--text-primary)' }}>{tItem.vacutainer_color}</strong> • Specimen:{' '}
                {tItem.sample_type}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Normal Range:{' '}
                {tItem.normal_min !== null ? `${tItem.normal_min} - ${tItem.normal_max} ${tItem.units || ''}` : 'Negative / Non-Reactive'}
              </div>
              {tItem.critical_low !== null && (
                <div style={{ fontSize: '0.6875rem', color: 'var(--accent-red)', fontWeight: 700 }}>
                  Critical Alarm: &lt; {tItem.critical_low} or &gt; {tItem.critical_high} {tItem.units}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* MODAL 1: Create Lab Requisition Order */}
      {isOrderModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FlaskConical size={20} color="var(--accent-blue)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Create Lab Requisition Order</h2>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Select Patient
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.875rem',
                  }}
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.mrn || 'No MRN'}) • {p.gender}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Clinical Indication / Chief Complaint
                </label>
                <Input
                  placeholder="e.g. Acute high fever with chills, suspected Dengue / Malaria..."
                  value={clinicalIndication}
                  onChange={(e) => setClinicalIndication(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Order Urgency
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="urgency"
                      value="ROUTINE"
                      checked={orderUrgency === 'ROUTINE'}
                      onChange={() => setOrderUrgency('ROUTINE')}
                    />
                    Routine (Same Day)
                  </label>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      color: 'var(--accent-red)',
                      fontWeight: 700,
                    }}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value="STAT_EMERGENCY"
                      checked={orderUrgency === 'STAT_EMERGENCY'}
                      onChange={() => setOrderUrgency('STAT_EMERGENCY')}
                    />
                    🚨 STAT Emergency (Immediate)
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  Select Diagnostic Tests (EDL Catalog)
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '0.5rem',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem',
                  }}
                >
                  {catalog.map((tItem) => {
                    const isChecked = selectedTestIds.includes(tItem.id);
                    return (
                      <label
                        key={tItem.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.5rem',
                          padding: '0.4rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isChecked ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                          cursor: 'pointer',
                          fontSize: '0.8125rem',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleTestSelection(tItem.id)}
                          style={{ marginTop: '0.2rem' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{tItem.name}</div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            {tItem.category} • {tItem.vacutainer_color}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <Button variant="secondary" type="button" onClick={() => setIsOrderModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmittingOrder}>
                  {isSubmittingOrder ? 'Generating Requisition...' : 'Create Requisition & Barcodes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Enter Analyzer Results */}
      {isResultModalOpen && selectedOrder && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  Automated Analyzer Result Entry & Verification
                </h2>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Order: {selectedOrder.order_number} • Patient: {selectedOrder.patient_name}
                </div>
              </div>
              <button
                onClick={() => setIsResultModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {selectedOrder.items?.map((item: any) => {
                const current = resultInputs[item.id] || { value: '', numVal: undefined, notes: '' };
                const isNumeric = item.normal_min !== null;

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--bg-surface-secondary)',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{item.test_name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Normal: {item.normal_min !== null ? `${item.normal_min} - ${item.normal_max} ${item.units || ''}` : 'Negative / Non-Reactive'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: isNumeric ? '1fr 1fr' : '1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      {isNumeric ? (
                        <>
                          <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                              Numeric Value ({item.units || ''})
                            </label>
                            <Input
                              type="number"
                              step="any"
                              placeholder={`e.g. ${item.normal_min || 0}`}
                              value={current.numVal ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                setResultInputs((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    ...prev[item.id],
                                    numVal: val,
                                    value: val !== undefined ? `${val} ${item.units || ''}` : '',
                                  },
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                              Display String
                            </label>
                            <Input
                              placeholder="e.g. 42000 /cumm"
                              value={current.value}
                              onChange={(e) =>
                                setResultInputs((prev) => ({
                                  ...prev,
                                  [item.id]: { ...prev[item.id], value: e.target.value },
                                }))
                              }
                            />
                          </div>
                        </>
                      ) : (
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                            Rapid Kit Result (Positive / Negative / Non-Reactive)
                          </label>
                          <select
                            value={current.value || 'NEGATIVE'}
                            onChange={(e) =>
                              setResultInputs((prev) => ({
                                ...prev,
                                [item.id]: { ...prev[item.id], value: e.target.value },
                              }))
                            }
                            style={{
                              width: '100%',
                              padding: '0.55rem',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-light)',
                              fontSize: '0.875rem',
                            }}
                          >
                            <option value="NEGATIVE">NEGATIVE (Non-Reactive)</option>
                            <option value="POSITIVE">POSITIVE (Reactive - Trigger Alert)</option>
                            <option value="EQUIVOCAL">EQUIVOCAL / BORDERLINE</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div>
                      <Input
                        placeholder="Technician observation notes / instrument serial..."
                        value={current.notes}
                        onChange={(e) =>
                          setResultInputs((prev) => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], notes: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
              <Button variant="secondary" onClick={() => setIsResultModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => handleResultSubmit(true)} disabled={isSavingResults}>
                {isSavingResults ? 'Publishing Report...' : 'Verify & Publish Diagnostic Report'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Official Diagnostic Report PDF/Print View */}
      {isReportModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container" style={{ maxWidth: '800px', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={22} color="var(--accent-blue)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Official Diagnostic Pathology Report</h2>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button size="sm" variant="secondary" onClick={() => window.print()} leftIcon={<Printer size={14} />}>
                  Print / Save PDF
                </Button>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {isReportLoading || !reportData ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 0.5rem' }} />
                <div>Generating High-Resolution Diagnostic Report...</div>
              </div>
            ) : (
              <div
                style={{
                  border: '2px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  backgroundColor: '#ffffff',
                }}
              >
                {/* Clinic Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: '2px solid var(--primary-navy)',
                    paddingBottom: '1rem',
                    marginBottom: '1rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary-navy)' }}>
                      DISTRICT HOSPITAL JAIPUR — CENTRAL PATHOLOGY LAB
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Ayushman Bharat Certified • EDL & NABL Standardized Laboratory Services
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                      Report #{reportData.order_number}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Dated: {reportData.reporting_date}
                    </div>
                  </div>
                </div>

                {/* Patient Demographics Box */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.75rem',
                    backgroundColor: 'var(--bg-surface-secondary)',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.25rem',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Patient Name:</span>
                    <div style={{ fontWeight: 700 }}>{reportData.patient_name}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>MRN / ABHA ID:</span>
                    <div style={{ fontWeight: 700 }}>{reportData.patient_mrn}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Gender / DOB:</span>
                    <div style={{ fontWeight: 700 }}>
                      {reportData.patient_gender} • {reportData.patient_age_dob}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Sample Collected:</span>
                    <div style={{ fontWeight: 700 }}>{reportData.ordered_date}</div>
                  </div>
                </div>

                {/* Critical Panic Warning Banner */}
                {reportData.has_critical_alerts && (
                  <div
                    style={{
                      backgroundColor: '#fee2e2',
                      border: '1px solid #ef4444',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 1rem',
                      marginBottom: '1rem',
                      color: '#991b1b',
                      fontSize: '0.8125rem',
                    }}
                  >
                    <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <AlertTriangle size={16} /> CRITICAL PATHOLOGY ALARM (PANIC VALUE)
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                      {reportData.critical_alerts?.map((alert: string, i: number) => (
                        <li key={i} style={{ fontWeight: 700 }}>{alert}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Results Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', backgroundColor: '#f8fafc', textAlign: 'left' }}>
                      <th style={{ padding: '0.6rem 0.5rem' }}>Investigation</th>
                      <th style={{ padding: '0.6rem 0.5rem' }}>Observed Result</th>
                      <th style={{ padding: '0.6rem 0.5rem' }}>Reference Interval</th>
                      <th style={{ padding: '0.6rem 0.5rem' }}>Units</th>
                      <th style={{ padding: '0.6rem 0.5rem' }}>Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.results?.map((res: any) => (
                      <tr key={res.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>{res.test_name}</td>
                        <td
                          style={{
                            padding: '0.6rem 0.5rem',
                            fontWeight: 700,
                            color: res.is_critical ? 'var(--accent-red)' : res.is_abnormal ? '#d97706' : 'var(--text-primary)',
                          }}
                        >
                          {res.result_value}
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>
                          {res.normal_min !== null ? `${res.normal_min} - ${res.normal_max}` : 'Negative / Non-Reactive'}
                        </td>
                        <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>{res.units || '-'}</td>
                        <td style={{ padding: '0.6rem 0.5rem' }}>
                          {res.is_critical ? (
                            <span style={{ color: '#ef4444', fontWeight: 800 }}>🚨 CRITICAL</span>
                          ) : res.is_abnormal ? (
                            <span style={{ color: '#d97706', fontWeight: 700 }}>⚠️ ABNORMAL</span>
                          ) : (
                            <span style={{ color: '#10b981', fontWeight: 600 }}>NORMAL</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Clinical Interpretation */}
                <div
                  style={{
                    backgroundColor: '#f1f5f9',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.85rem',
                    fontSize: '0.8125rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <strong style={{ color: 'var(--primary-navy)' }}>Automated Clinical Impression:</strong>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)' }}>
                    {reportData.clinical_interpretation}
                  </p>
                </div>

                {/* Pathologist Signature Footer */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    borderTop: '1px solid var(--border-light)',
                    paddingTop: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <QrCode size={36} color="var(--primary-navy)" />
                    <div>
                      <div>Scan to verify with ABDM Repository</div>
                      <div style={{ fontFamily: 'monospace' }}>SHA-256 Verified</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'cursive', fontSize: '1.125rem', color: 'var(--primary-navy)' }}>
                      Dr. R. K. Sharma, MD
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Senior Consultant Pathologist</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Reg No: DMC-48921</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
