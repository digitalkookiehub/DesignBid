import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { NotesList } from '@/components/clients/NotesList';
import { useClient, useDeleteClient, useClientNotes, useAddClientNote } from '@/hooks/useClients';

type Tab = 'overview' | 'notes';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const clientId = Number(id);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { data: client, isLoading } = useClient(clientId);
  const { data: notes } = useClientNotes(clientId);
  const deleteMutation = useDeleteClient();
  const addNoteMutation = useAddClientNote();

  if (isLoading) {
    return <PageWrapper><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div></PageWrapper>;
  }

  if (!client) {
    return <PageWrapper><p className="text-gray-500">Client not found</p></PageWrapper>;
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteMutation.mutate(clientId, { onSuccess: () => navigate('/clients') });
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'notes', label: 'Notes' },
  ];

  return (
    <PageWrapper>
      <motion.button whileHover={{ x: -3 }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4" onClick={() => navigate('/clients')}>
        <ArrowLeft size={16} /> Back to Clients
      </motion.button>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-600">{client.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-500">{client.company || 'No company'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <GradientButton variant="secondary" size="sm" onClick={() => navigate(`/clients/${clientId}/edit`)}>
            <Edit size={16} /> Edit
          </GradientButton>
          <GradientButton variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 size={16} /> Delete
          </GradientButton>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >{tab.label}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          <GlassCard>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {client.phone && <div className="flex items-center gap-2 text-gray-700"><Phone size={16} className="text-gray-400" /> {client.phone}</div>}
              {client.email && <div className="flex items-center gap-2 text-gray-700"><Mail size={16} className="text-gray-400" /> {client.email}</div>}
              {client.state && <div className="flex items-center gap-2 text-gray-700"><Phone size={16} className="text-gray-400" /> {client.state} <span className="text-xs text-gray-400">(Alt)</span></div>}
              {client.source && <div className="text-sm text-gray-500">Source: <span className="text-gray-700 font-medium">{client.source}</span></div>}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Property</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {client.company && <div className="text-sm"><span className="text-gray-500">Type:</span> <span className="font-medium text-gray-700">{client.company}</span></div>}
              {client.zip_code && <div className="text-sm"><span className="text-gray-500">Size:</span> <span className="font-medium text-gray-700">{client.zip_code}</span></div>}
              {client.website && <div className="text-sm"><span className="text-gray-500">Budget:</span> <span className="font-medium text-gray-700">{client.website}</span></div>}
              {client.city && <div className="text-sm"><span className="text-gray-500">City:</span> <span className="font-medium text-gray-700">{client.city}</span></div>}
            </div>
            {client.address && (
              <div className="mt-3 text-sm text-gray-500"><span className="text-gray-500">Address:</span> {client.address}</div>
            )}
          </GlassCard>

          {client.special_discount > 0 && (
            <GlassCard>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Special Discount</h3>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-green-600">{client.special_discount}%</span>
                <span className="text-sm text-gray-500">discount auto-applied on all quotations for this client</span>
              </div>
            </GlassCard>
          )}

          {client.tags && client.tags.length > 0 && (
            <GlassCard>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {client.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">{tag}</span>
                ))}
              </div>
            </GlassCard>
          )}

          {client.notes && (
            <GlassCard>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{client.notes}</p>
            </GlassCard>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <GlassCard>
          <NotesList
            notes={notes || []}
            onAddNote={(content) => addNoteMutation.mutate({ clientId, content })}
            isAdding={addNoteMutation.isPending}
          />
        </GlassCard>
      )}
    </PageWrapper>
  );
}
