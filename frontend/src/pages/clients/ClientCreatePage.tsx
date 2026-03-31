import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { ClientForm } from '@/components/clients/ClientForm';
import { useCreateClient } from '@/hooks/useClients';
import type { ClientCreate } from '@/types/client';

export default function ClientCreatePage() {
  const navigate = useNavigate();
  const mutation = useCreateClient();

  const handleSubmit = (data: ClientCreate) => {
    mutation.mutate(data, {
      onSuccess: (client) => navigate(`/clients/${client.id}`),
    });
  };

  return (
    <PageWrapper>
      <motion.button
        whileHover={{ x: -3 }}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        onClick={() => navigate('/clients')}
      >
        <ArrowLeft size={16} /> Back to Clients
      </motion.button>

      <GlassCard>
        <h2 className="text-xl font-semibold mb-6">New Client</h2>
        <ClientForm onSubmit={handleSubmit} isLoading={mutation.isPending} />
      </GlassCard>
    </PageWrapper>
  );
}
