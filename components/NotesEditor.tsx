'use client';

import { useState } from 'react';
import type { TickerNote } from '@/lib/types';
import { addNoteForTicker, updateNoteForTicker, deleteNoteForTicker } from '@/lib/storage';

interface NotesEditorProps {
  ticker: string;
  notes: TickerNote[];
  onNotesChange: () => void;
}

export default function NotesEditor({ ticker, notes, onNotesChange }: NotesEditorProps) {
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNoteForTicker(ticker, newNote);
      setNewNote('');
      onNotesChange();
    }
  };

  const handleStartEdit = (note: TickerNote) => {
    setEditingNoteId(note.noteId);
    setEditingText(note.text);
  };

  const handleSaveEdit = () => {
    if (editingNoteId && editingText.trim()) {
      updateNoteForTicker(ticker, editingNoteId, editingText);
      setEditingNoteId(null);
      setEditingText('');
      onNotesChange();
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingText('');
  };

  const handleDelete = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNoteForTicker(ticker, noteId);
      onNotesChange();
    }
  };

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Add Note
        </label>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Enter your note here..."
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <button
          onClick={handleAddNote}
          className="mt-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save Note
        </button>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Past Notes</h4>
        {sortedNotes.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No notes yet</p>
        ) : (
          <div className="space-y-2">
            {sortedNotes.map((note) => (
              <div
                key={note.noteId}
                className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
              >
                {editingNoteId === note.noteId ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={3}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="rounded bg-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">{note.text}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(note.updatedAt).toLocaleString()}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartEdit(note)}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(note.noteId)}
                          className="text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

