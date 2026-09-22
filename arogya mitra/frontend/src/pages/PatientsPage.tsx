import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Search, Plus, UserCheck, AlertCircle, Phone, Heart } from 'lucide-react';

export const PatientsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [patients, setPatients] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Form state for registration
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('MALE');
  const [dob, setDob] = useState('1995-01-01');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [regError, setRegError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPatients = async (query = '') => {
    try {
      setIsLoading(true);
      const res = await api.get(`/patients?q=${encodeURIComponent(query)}&size=50`);
      setPatients(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(initialQuery);
  }, [initialQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: searchQuery });
    fetchPatients(searchQuery);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setIsSubmitting(true);
    try {
      await api.post('/patients', {
        first_name: firstName,
        last_name: lastName,
        gender,
        date_of_birth: dob,
        phone,
        blood_group: bloodGroup,
      });
      setIsRegisterOpen(false);
      // Reset form
      setFirstName('');
      setLastName('');
      setPhone('');
      fetchPatients(searchQuery);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {t('patients.title')}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {t('patients.subtitle')} • Total: {total} registered
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => setIsRegisterOpen(true)}
        >
          {t('patients.register_btn')}
        </Button>
      </div>

      {/* Search Bar */}
      <Card style={{ padding: '0.875rem 1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ flex: 1 }}>
            <Input
              placeholder={t('patients.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftElement={<Search size={16} color="var(--text-muted)" />}
            />
          </div>
          <Button type="submit" variant="secondary" size="md">
            Search
          </Button>
        </form>
      </Card>

      {/* Patients Table */}
      <Card>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            {t('common.loading')}
          </div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No patients match your search.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem' }}>{t('patients.mrn')}</th>
                  <th style={{ padding: '0.75rem' }}>{t('patients.name')}</th>
                  <th style={{ padding: '0.75rem' }}>{t('patients.gender')}</th>
                  <th style={{ padding: '0.75rem' }}>{t('patients.age_dob')}</th>
                  <th style={{ padding: '0.75rem' }}>{t('patients.phone')}</th>
                  <th style={{ padding: '0.75rem' }}>{t('patients.blood_group')}</th>
                  <th style={{ padding: '0.75rem' }}>{t('patients.status')}</th>
                  <th style={{ padding: '0.75rem' }}>{t('patients.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr
                    key={p.id}
                    style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-secondary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '0.85rem 0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-navy)' }}>
                      {p.mrn}
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {p.first_name} {p.last_name || ''}
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)' }}>
                      {p.gender}
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-muted)' }}>
                      {p.date_of_birth || 'N/A'}
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)' }}>
                      {p.phone || '-'}
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <Badge variant="neutral">{p.blood_group || 'N/A'}</Badge>
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <Badge variant="success">Active</Badge>
                    </td>
                    <td style={{ padding: '0.85rem 0.75rem' }}>
                      <Button size="sm" variant="outline" onClick={() => alert(`Patient profile for ${p.first_name} (MRN: ${p.mrn})`)}>
                        {t('patients.view_record')}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Registration Modal */}
      {isRegisterOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(3px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-2xl)',
              width: '100%',
              maxWidth: '520px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--primary-navy)',
                color: '#fff',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#fff' }}>
                {t('patients.register_btn')}
              </h3>
              <button
                onClick={() => setIsRegisterOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {regError && (
                <div style={{ backgroundColor: 'var(--color-danger-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '0.8125rem' }}>
                  {regError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-secondary)' }}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <Input label="Date of Birth" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" />
                <div>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-secondary)' }}
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button type="button" variant="outline" onClick={() => setIsRegisterOpen(false)} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting} style={{ flex: 1 }}>
                  Register Patient
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
