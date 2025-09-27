import { useState, useEffect } from 'react';
import { Search, Plus, Star, Archive, Edit3, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function NotesView() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('focusNote-notes');
    if (savedNotes) {
      const parsedNotes = JSON.parse(savedNotes).map((note: any) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      }));
      setNotes(parsedNotes);
    }
  }, []);

  // Save notes to localStorage
  const saveNotes = (updatedNotes: Note[]) => {
    localStorage.setItem('focusNote-notes', JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  // Filter notes based on search term
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort notes (pinned first, then by updated date)
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const createNewNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled Note',
      content: '',
      tags: [],
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const updatedNotes = [newNote, ...notes];
    saveNotes(updatedNotes);
    setSelectedNote(newNote);
    setIsEditing(true);
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
  };

  const togglePin = (noteId: string) => {
    const updatedNotes = notes.map(note =>
      note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
    );
    saveNotes(updatedNotes);
    if (selectedNote?.id === noteId) {
      setSelectedNote({ ...selectedNote, isPinned: !selectedNote.isPinned });
    }
  };

  const deleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    saveNotes(updatedNotes);
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setIsEditing(false);
    }
  };

  const saveNote = () => {
    if (!selectedNote) return;

    const updatedNote = {
      ...selectedNote,
      title: editTitle.trim() || 'Untitled Note',
      content: editContent,
      updatedAt: new Date(),
    };

    const updatedNotes = notes.map(note =>
      note.id === selectedNote.id ? updatedNote : note
    );
    
    saveNotes(updatedNotes);
    setSelectedNote(updatedNote);
    setIsEditing(false);
  };

  const startEditing = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(true);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
      {/* Notes List */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-card border-glass-border"
            />
          </div>
          <Button
            onClick={createNewNote}
            className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-glass"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {sortedNotes.map((note) => (
            <Card
              key={note.id}
              className={`
                glass-card cursor-pointer transition-all duration-200 p-4
                ${selectedNote?.id === note.id 
                  ? 'ring-2 ring-primary bg-primary-glass' 
                  : 'hover:bg-surface-hover'
                }
              `}
              onClick={() => setSelectedNote(note)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {note.isPinned && (
                      <Star className="w-3 h-3 text-warning fill-current" />
                    )}
                    <h3 className="font-medium text-sm truncate text-foreground">
                      {note.title}
                    </h3>
                  </div>
                  <p className="text-xs text-foreground-muted line-clamp-2">
                    {note.content || 'No content'}
                  </p>
                  <p className="text-xs text-foreground-muted mt-2">
                    {note.updatedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
          
          {sortedNotes.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
              <p className="text-foreground-muted">
                {searchTerm ? 'No notes found' : 'No notes yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Note Editor */}
      <div className="lg:col-span-2">
        {selectedNote ? (
          <Card className="glass-card h-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePin(selectedNote.id)}
                  className={selectedNote.isPinned ? 'text-warning' : 'text-foreground-muted'}
                >
                  <Star className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startEditing(selectedNote)}
                  className="text-foreground-muted hover:text-foreground"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteNote(selectedNote.id)}
                  className="text-error hover:text-error"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              {isEditing && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveNote}
                    className="bg-primary hover:bg-primary-hover text-primary-foreground"
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-4 h-[calc(100%-80px)]">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-lg font-medium bg-transparent border-none p-0 focus:ring-0"
                  placeholder="Note title..."
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full resize-none bg-transparent border-none outline-none text-foreground placeholder-foreground-muted"
                  placeholder="Start writing your note..."
                />
              </div>
            ) : (
              <div className="h-[calc(100%-80px)]">
                <h1 className="text-xl font-bold mb-4 text-foreground">
                  {selectedNote.title}
                </h1>
                <div className="prose prose-sm max-w-none text-foreground-secondary whitespace-pre-wrap overflow-y-auto h-full">
                  {selectedNote.content || (
                    <p className="text-foreground-muted italic">
                      This note is empty. Click edit to add content.
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
        ) : (
          <Card className="glass-card h-full flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Select a note to view
              </h3>
              <p className="text-foreground-muted">
                Choose a note from the sidebar or create a new one
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}