import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Pill,
  AlertTriangle,
  Clock,
  Search,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  ArrowDownToLine,
  X,
} from 'lucide-react';

export const PharmacyPage: React.FC = () => {
  const { t } = useTranslation();

  const [stocks, setStocks] = useState<any[]>([]);
  const [drugs, setDrugs] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'LOW_STOCK' | 'EXPIRING' | 'JAN_AUSHADHI'>('ALL');

  // Modals
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isDispenseOpen, setIsDispenseOpen] = useState(false);
  const [selectedStockForDispense, setSelectedStockForDispense] = useState<any | null>(null);

  // Receive Form State
  const [receiveDrugId, setReceiveDrugId] = useState('');
  const [receiveBatchNo, setReceiveBatchNo] = useState('');
  const [receiveExpiry, setReceiveExpiry] = useState('');
  const [receiveQty, setReceiveQty] = useState(100);
  const [receiveNotes, setReceiveNotes] = useState('');
  const [isReceiving, setIsReceiving] = useState(false);

  // Dispense Form State
  const [dispensePatientId, setDispensePatientId] = useState('');
  const [dispenseStockId, setDispenseStockId] = useState('');
  const [dispenseQty, setDispenseQty] = useState(1);
  const [dispenseNotes, setDispenseNotes] = useState('');
  const [isDispensing, setIsDispensing] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [stocksRes, drugsRes, patientsRes] = await Promise.all([
        api.get('/inventory/stocks'),
        api.get('/inventory/drugs'),
        api.get('/patients?size=50'),
      ]);
      setStocks(stocksRes || []);
      setDrugs(drugsRes || []);
      setPatients(patientsRes?.items || []);
      if (drugsRes && drugsRes.length > 0 && !receiveDrugId) {
        setReceiveDrugId(drugsRes[0].id);
      }
    } catch (err) {
      console.error('Failed to load pharmacy data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and search logic
  const filteredStocks = stocks.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.drug_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.generic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batch_number?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterMode === 'LOW_STOCK') return item.is_low_stock;
    if (filterMode === 'EXPIRING') return item.is_expiring_soon;
    if (filterMode === 'JAN_AUSHADHI') return item.is_essential_jan_aushadhi;

    return true;
  });

  const lowStockCount = stocks.filter((s) => s.is_low_stock).length;
  const expiringCount = stocks.filter((s) => s.is_expiring_soon).length;

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionErrorMsg(null);
    setIsReceiving(true);
    try {
      await api.post('/inventory/receive', {
        drug_id: receiveDrugId,
        batch_number: receiveBatchNo,
        expiry_date: receiveExpiry,
        quantity: Number(receiveQty),
        notes: receiveNotes,
      });
      setIsReceiveOpen(false);
      setActionSuccessMsg('Stock delivery successfully recorded in central inventory.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
      setReceiveBatchNo('');
      setReceiveExpiry('');
      fetchData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to receive stock');
    } finally {
      setIsReceiving(false);
    }
  };

  const handleDispenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionErrorMsg(null);
    setIsDispensing(true);
    try {
      const targetStockId = dispenseStockId || selectedStockForDispense?.id || (stocks[0]?.id);
      await api.post('/inventory/dispense', {
        patient_id: dispensePatientId || undefined,
        items: [{ stock_id: targetStockId, quantity: Number(dispenseQty) }],
        notes: dispenseNotes,
      });
      setIsDispenseOpen(false);
      setSelectedStockForDispense(null);
      setActionSuccessMsg('Prescription medication dispensed and batch inventory decremented.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
      setDispenseNotes('');
      setDispenseQty(1);
      fetchData();
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Dispensing failed');
    } finally {
      setIsDispensing(false);
    }
  };

  const openDispenseForStock = (stock: any) => {
    setSelectedStockForDispense(stock);
    setDispenseStockId(stock.id);
    setIsDispenseOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('pharmacy.title')}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {t('pharmacy.subtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="outline"
            leftIcon={<ArrowDownToLine size={16} />}
            onClick={() => setIsReceiveOpen(true)}
          >
            {t('pharmacy.receive_stock_btn')}
          </Button>
          <Button
            variant="primary"
            leftIcon={<Pill size={16} />}
            onClick={() => {
              setSelectedStockForDispense(null);
              setIsDispenseOpen(true);
            }}
          >
            {t('pharmacy.dispense_desk_btn')}
          </Button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMsg && (
        <div
          style={{
            backgroundColor: 'var(--accent-emerald-subtle)',
            color: 'var(--accent-emerald)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: '1px solid var(--accent-emerald)',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <Card variant="default">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--accent-blue-subtle)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('pharmacy.total_skus')}
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {drugs.length}
              </div>
            </div>
          </div>
        </Card>

        <Card variant="default">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--accent-teal-subtle)',
                color: 'var(--accent-teal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('pharmacy.in_stock')}
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {stocks.length}
              </div>
            </div>
          </div>
        </Card>

        <Card variant="default">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--accent-red)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('pharmacy.low_stock_alert')}
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--accent-red)' }}>
                {lowStockCount}
              </div>
            </div>
          </div>
        </Card>

        <Card variant="default">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                color: 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('pharmacy.expiring_soon_alert')}
              </div>
              <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                {expiringCount}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card variant="bordered">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1', minWidth: '280px' }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={t('pharmacy.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Filter Chips */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: t('pharmacy.filter_all') },
              { id: 'LOW_STOCK', label: `${t('pharmacy.filter_low_stock')} (${lowStockCount})` },
              { id: 'EXPIRING', label: `${t('pharmacy.filter_expiring')} (${expiringCount})` },
              { id: 'JAN_AUSHADHI', label: t('pharmacy.filter_jan_aushadhi') },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setFilterMode(chip.id as any)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-full)',
                  border: filterMode === chip.id ? '1px solid var(--accent-blue)' : '1px solid var(--border-light)',
                  backgroundColor: filterMode === chip.id ? 'var(--accent-blue-subtle)' : '#ffffff',
                  color: filterMode === chip.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Inventory Stock Table */}
      <Card variant="bordered" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface-secondary)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {t('pharmacy.table_drug')}
                </th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {t('pharmacy.table_batch')}
                </th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {t('pharmacy.table_expiry')}
                </th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {t('pharmacy.table_quantity')}
                </th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {t('pharmacy.table_status')}
                </th>
                <th style={{ padding: '0.85rem 1.25rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {t('pharmacy.table_actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {t('common.loading')}
                  </td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No matching medication batches found in inventory.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid var(--border-light)',
                      backgroundColor: item.is_low_stock ? 'rgba(239, 68, 68, 0.02)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.drug_name || 'Generic Formulation'} {item.strength ? `(${item.strength})` : ''}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Salt: {item.generic_name || 'Generic Salt'} • {item.dosage_form || 'Tablet'}
                      </div>
                      {item.is_essential_jan_aushadhi && (
                        <div style={{ marginTop: '0.35rem' }}>
                          <span
                            style={{
                              backgroundColor: 'rgba(13, 148, 136, 0.12)',
                              color: '#0f766e',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: 'var(--radius-full)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <Sparkles size={11} />
                            {t('pharmacy.badge_jan_aushadhi')}
                          </span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', fontFamily: 'monospace', fontWeight: 600 }}>
                      {item.batch_number}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600 }}>{item.expiry_date}</div>
                      {item.is_expiring_soon && (
                        <Badge variant="warning">
                          {t('pharmacy.badge_expiring')}
                        </Badge>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '1rem',
                          color: item.is_low_stock ? 'var(--accent-red)' : 'var(--text-primary)',
                        }}
                      >
                        {item.quantity_available} units
                      </span>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        Reorder at {item.reorder_level}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {item.is_low_stock ? (
                        <Badge variant="danger">
                          {t('pharmacy.badge_low_stock')}
                        </Badge>
                      ) : (
                        <Badge variant="success">
                          IN STOCK
                        </Badge>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<Pill size={14} />}
                        onClick={() => openDispenseForStock(item)}
                      >
                        Dispense
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL: Receive Stock Delivery */}
      {isReceiveOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <Card
            variant="default"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowDownToLine size={20} color="var(--accent-blue)" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t('pharmacy.receive_modal_title')}
                </h3>
              </div>
              <button
                onClick={() => setIsReceiveOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            {actionErrorMsg && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--accent-red)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  fontSize: '0.8125rem',
                }}
              >
                {actionErrorMsg}
              </div>
            )}

            <form onSubmit={handleReceiveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  {t('pharmacy.receive_select_drug')}
                </label>
                <select
                  value={receiveDrugId}
                  onChange={(e) => setReceiveDrugId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                  }}
                  required
                >
                  {drugs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.generic_name}) - {d.dosage_form}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input
                  label={t('pharmacy.receive_batch_no')}
                  placeholder="e.g. B-JAN-2026C"
                  value={receiveBatchNo}
                  onChange={(e) => setReceiveBatchNo(e.target.value)}
                  required
                />
                <Input
                  label={t('pharmacy.receive_expiry_date')}
                  type="date"
                  value={receiveExpiry}
                  onChange={(e) => setReceiveExpiry(e.target.value)}
                  required
                />
              </div>

              <Input
                label={t('pharmacy.receive_quantity')}
                type="number"
                min="1"
                value={receiveQty}
                onChange={(e) => setReceiveQty(Number(e.target.value))}
                required
              />

              <Input
                label={t('pharmacy.receive_notes')}
                placeholder="Consignment No, Central Warehouse PO-8821"
                value={receiveNotes}
                onChange={(e) => setReceiveNotes(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button variant="outline" type="button" onClick={() => setIsReceiveOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button variant="primary" type="submit" isLoading={isReceiving}>
                  {t('pharmacy.receive_submit')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL: 1-Tap Dispensing Desk */}
      {isDispenseOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <Card
            variant="default"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pill size={20} color="var(--accent-teal)" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {t('pharmacy.dispense_modal_title')}
                </h3>
              </div>
              <button
                onClick={() => setIsDispenseOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            {actionErrorMsg && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--accent-red)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  fontSize: '0.8125rem',
                }}
              >
                {actionErrorMsg}
              </div>
            )}

            <form onSubmit={handleDispenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  {t('pharmacy.dispense_select_patient')}
                </label>
                <select
                  value={dispensePatientId}
                  onChange={(e) => setDispensePatientId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="">Walk-in OPD / Counter Patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.first_name} {p.last_name} ({p.mrn}) - {p.gender}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                  {t('pharmacy.dispense_select_batch')}
                </label>
                <select
                  value={dispenseStockId || selectedStockForDispense?.id}
                  onChange={(e) => setDispenseStockId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.875rem',
                    backgroundColor: '#ffffff',
                  }}
                  required
                >
                  {stocks.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.drug_name} [Batch: {s.batch_number}] — Avail: {s.quantity_available} units (Exp: {s.expiry_date})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label={t('pharmacy.dispense_quantity')}
                type="number"
                min="1"
                max={selectedStockForDispense?.quantity_available || 100}
                value={dispenseQty}
                onChange={(e) => setDispenseQty(Number(e.target.value))}
                required
              />

              <Input
                label={t('pharmacy.dispense_notes')}
                placeholder="Dosage instruction: 1 tab twice daily after food"
                value={dispenseNotes}
                onChange={(e) => setDispenseNotes(e.target.value)}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button variant="outline" type="button" onClick={() => setIsDispenseOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button variant="primary" type="submit" isLoading={isDispensing}>
                  {t('pharmacy.dispense_submit')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
