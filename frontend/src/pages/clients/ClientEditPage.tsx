import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { ClientForm } from '@/components/clients/ClientForm';
import { useClient, useUpdateClient } from '@/hooks/useClients';
import type { ClientCreate } from '@/types/client';

export default function ClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const clientId = Number(id);
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(clientId);
  const mutation = useUpdateClient();

  if (isLoading) {
    return <PageWrapper><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div></PageWrapper>;
  }

  if (!client) {
    return <PageWrapper><p className="text-gray-500">Client not found</p></PageWrapper>;
  }

  const handleSubmit = (data: ClientCreate) => {
    mutation.mutate({ id: clientId, data }, {
      onSuccess: () => navigate(`/clients/${clientId}`),
    });
  };

  return (
    <PageWrapper>
      <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4" onClick={() => navigate(`/clients/${clientId}`)}>
        <ArrowLeft size={16} /> Back to Client
      </button>
      <GlassCard>
        <h2 className="text-xl font-semibold mb-6">Edit Client</h2>
        <ClientForm initialData={{
          name: client.name,
          email: client.email,
          phone: client.phone ?? undefined,
          company: client.company ?? undefined,
          address: client.address ?? undefined,
          city: client.city ?? undefined,
          state: client.state ?? undefined,
          country: client.country ?? undefined,
          zip_code: client.zip_code ?? undefined,
          website: client.website ?? undefined,
          notes: client.notes ?? undefined,
          tags: client.tags,
          source: client.source ?? undefined,
        }} onSubmit={handleSubmit} isLoading={mutation.isPending} />
      </GlassCard>
    </PageWrapper>
  );
}
