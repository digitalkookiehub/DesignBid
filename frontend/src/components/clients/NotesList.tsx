import { useState, type FormEvent } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { GradientButton } from '@/components/ui/GradientButton';
import type { ClientNote } from '@/types/client';

interface NotesListProps {
  notes: ClientNote[];
  onAddNote: (content: string) => void;
  isAdding?: boolean;
}

export function NotesList({ notes, onAddNote, isAdding }: NotesListProps) {
  const [content, setContent] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAddNote(content);
    setContent('');
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm resize-none"
          rows={2}
          placeholder="Add a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <GradientButton type="submit" size="sm" isLoading={isAdding} disabled={!content.trim()}>
          Add
        </GradientButton>
      </form>

      {notes.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">No notes yet</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-gray-50 rounded-lg"
            >
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
              <p className="text-xs text-gray-400 mt-2">
                {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
