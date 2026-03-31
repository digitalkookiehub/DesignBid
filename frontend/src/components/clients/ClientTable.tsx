import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, Edit } from 'lucide-react';
import type { Client } from '@/types/client';

interface ClientTableProps {
  clients: Client[];
  onDelete: (id: number) => void;
}

export function ClientTable({ clients, onDelete }: ClientTableProps) {
  const navigate = useNavigate();

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No clients yet</p>
        <p className="text-sm mt-1">Add your first client to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Client ID</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Phone</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Property</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">City</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden xl:table-cell">Source</th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase w-24">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <motion.tr
              key={client.id}
              whileHover={{ backgroundColor: 'rgba(249, 250, 251, 1)' }}
              className="border-b border-gray-100 cursor-pointer"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <td className="py-3 px-4">
                <span className="text-xs font-mono font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                  {client.client_code || `CLT-${String(client.id).padStart(4, '0')}`}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">{client.name}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-gray-600 hidden md:table-cell">{client.phone || '-'}</td>
              <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">
                {client.company && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">{client.company}</span>}
                {client.zip_code && <span className="text-xs text-gray-500 ml-1">{client.zip_code}</span>}
                {!client.company && !client.zip_code && '-'}
              </td>
              <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">{client.city || '-'}</td>
              <td className="py-3 px-4 text-gray-500 text-sm hidden xl:table-cell">{client.source || '-'}</td>
              <td className="py-3 px-4 text-right">
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                    onClick={() => navigate(`/clients/${client.id}/edit`)}
                  >
                    <Edit size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    onClick={() => onDelete(client.id)}
                  >
                    <Trash2 size={16} />
                  </motion.button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
