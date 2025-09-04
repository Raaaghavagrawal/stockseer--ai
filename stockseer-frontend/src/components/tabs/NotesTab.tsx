import { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Search, Star, Bookmark } from 'lucide-react';
import type { Note } from '../../types/stock';
import { notesAPI } from '../../utils/api';

export default function NotesTab() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newNote, setNewNote] = useState({
    title: '', content: '', tags: '', relatedStocks: ''
  });

  // Fetch real notes data
  const fetchNotes = async () => {
    try {
      const data = await notesAPI.getNotes();
      setNotes(data.notes || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes([]);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const addNote = async () => {
    if (newNote.title && newNote.content) {
      try {
        await notesAPI.createNote(newNote);
        setNewNote({ title: '', content: '', tags: '', relatedStocks: '' });
        setShowAddForm(false);
        fetchNotes(); // Refresh the notes list
      } catch (error) {
        console.error('Error creating note:', error);
      }
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await notesAPI.deleteNote(id);
      fetchNotes(); // Refresh the notes list
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.related_stocks.some(stock => stock.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">📝 Stock Notes</h2>
            <p className="text-slate-400">Keep track of your research and insights</p>
          </div>
          <button onClick={() => setShowAddForm(true)} className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white flex items-center">
            <Plus className="w-4 h-4 mr-2" />Add Note
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Add New Note</h3>
          <div className="space-y-4">
            <input placeholder="Title" value={newNote.title} onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))} className="bg-input border border-border text-foreground rounded px-3 py-2 placeholder:text-muted-foreground" />
            <textarea placeholder="Content" value={newNote.content} onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))} className="w-full h-32 bg-input border border-border text-foreground rounded px-3 py-2 resize-none placeholder:text-muted-foreground" />
            <input placeholder="Tags (comma-separated)" value={newNote.tags} onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))} className="bg-input border border-border text-foreground rounded px-3 py-2 placeholder:text-muted-foreground" />
            <input placeholder="Related Stocks (comma-separated)" value={newNote.relatedStocks} onChange={(e) => setNewNote(prev => ({ ...prev, relatedStocks: e.target.value }))} className="bg-input border border-border text-foreground rounded px-3 py-2 placeholder:text-muted-foreground" />
            <div className="flex space-x-2">
              <button onClick={addNote} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white">Add Note</button>
              <button onClick={() => setShowAddForm(false)} className="border border-slate-600 text-slate-300 hover:bg-slate-600 px-4 py-2 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredNotes.map(note => (
            <div key={note.id} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-white mb-2">{note.title}</h4>
                  <p className="text-slate-300 text-sm mb-3">{note.content}</p>
                  <div className="flex items-center space-x-4 text-xs text-slate-400">
                    <span>Created: {note.created_at}</span>
                    <span>Updated: {note.updated_at}</span>
                  </div>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {note.related_stocks.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.related_stocks.map(stock => (
                        <span key={stock} className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                          {stock}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2 ml-4">
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteNote(note.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-600 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No notes found. Create your first note to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}
