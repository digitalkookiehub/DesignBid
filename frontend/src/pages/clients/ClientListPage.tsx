import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GradientButton } from '@/components/ui/GradientButton';
import { ClientTable } from '@/components/clients/ClientTable';
import { useClients, useDeleteClient } from '@/hooks/useClients';

export default function ClientListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { data, isLoading } = useClients(page, search);
  const deleteMutation = useDeleteClient();

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <GradientButton onClick={() => navigate('/clients/new')}>
          <Plus size={18} /> Add Client
        </GradientButton>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <ClientTable clients={data?.items || []} onDelete={handleDelete} />
            {data && data.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  Page {data.page} of {data.pages} ({data.total} clients)
                </span>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >Previous</button>
                  <button
                    className="px-3 py-1 text-sm rounded border border-gray-300 disabled:opacity-50"
                    disabled={page >= data.pages}
                    onClick={() => setPage(page + 1)}
                  >Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}
