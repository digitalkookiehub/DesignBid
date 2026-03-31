import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { GradientButton } from '@/components/ui/GradientButton';
import type { ClientDocument } from '@/types/client';

interface DocumentUploadProps {
  documents: ClientDocument[];
  onUpload: (file: File) => void;
  isUploading?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentUpload({ documents, onUpload, isUploading }: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
        <GradientButton size="sm" isLoading={isUploading} onClick={() => inputRef.current?.click()}>
          <Upload size={16} /> Upload Document
        </GradientButton>
      </div>

      {documents.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">No documents yet</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <FileText size={20} className="text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{doc.file_name}</p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(doc.file_size)} &middot; {format(new Date(doc.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
