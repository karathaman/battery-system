import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Note {
  id: string;
  title: string;
  content: string | null;
  date: string;
  color: string;
  type: 'note' | 'checklist';
  completed: boolean;
  created_at: string;
  updated_at: string;
  checklist_items?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  note_id: string;
  text: string;
  completed: boolean;
  created_at: string;
}

export interface NoteFormData {
  title: string;
  content?: string;
  date: string;
  color: string;
  type: 'note' | 'checklist';
  checklist_items?: { text: string; completed: boolean }[];
}

const notesService = {
  getNotesByDate: async (date: string): Promise<Note[]> => {
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        checklist_items(*)
      `)
      .eq('date', date)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      throw new Error(error.message);
    }

    return (data || []).map(note => ({
      id: note.id,
      title: note.title,
      content: note.content,
      date: note.date,
      color: note.color,
      type: note.type as 'note' | 'checklist',
      completed: note.completed,
      created_at: note.created_at,
      updated_at: note.updated_at,
      checklist_items: note.checklist_items || []
    }));
  },

  createNote: async (data: NoteFormData): Promise<Note> => {
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .insert({
        title: data.title,
        content: data.content,
        date: data.date,
        color: data.color,
        type: data.type
      })
      .select()
      .single();

    if (noteError) {
      console.error('Error creating note:', noteError);
      throw new Error(noteError.message);
    }

    // If it's a checklist, create checklist items
    if (data.type === 'checklist' && data.checklist_items && data.checklist_items.length > 0) {
      const { error: itemsError } = await supabase
        .from('checklist_items')
        .insert(
          data.checklist_items.map(item => ({
            note_id: noteData.id,
            text: item.text,
            completed: item.completed
          }))
        );

      if (itemsError) {
        console.error('Error creating checklist items:', itemsError);
        throw new Error(itemsError.message);
      }
    }

    return {
      id: noteData.id,
      title: noteData.title,
      content: noteData.content,
      date: noteData.date,
      color: noteData.color,
      type: noteData.type as 'note' | 'checklist',
      completed: noteData.completed,
      created_at: noteData.created_at,
      updated_at: noteData.updated_at
    };
  },

  updateNote: async (id: string, data: Partial<NoteFormData>): Promise<Note> => {
    // Update the note
    const { data: noteData, error: noteError } = await supabase
      .from('notes')
      .update({
        title: data.title,
        content: data.content,
        color: data.color,
        completed: data.type === 'note' ? false : undefined
      })
      .eq('id', id)
      .select()
      .single();

    if (noteError) {
      console.error('Error updating note:', noteError);
      throw new Error(noteError.message);
    }

    // If it's a checklist and has checklist_items, update them
    if (data.type === 'checklist' && data.checklist_items !== undefined) {
      // First, delete existing checklist items
      const { error: deleteError } = await supabase
        .from('checklist_items')
        .delete()
        .eq('note_id', id);

      if (deleteError) {
        console.error('Error deleting old checklist items:', deleteError);
        throw new Error(deleteError.message);
      }

      // Then, insert new checklist items if any
      if (data.checklist_items.length > 0) {
        const { error: itemsError } = await supabase
          .from('checklist_items')
          .insert(
            data.checklist_items.map(item => ({
              note_id: id,
              text: item.text,
              completed: item.completed
            }))
          );

        if (itemsError) {
          console.error('Error creating new checklist items:', itemsError);
          throw new Error(itemsError.message);
        }
      }
    }

    return {
      id: noteData.id,
      title: noteData.title,
      content: noteData.content,
      date: noteData.date,
      color: noteData.color,
      type: noteData.type as 'note' | 'checklist',
      completed: noteData.completed,
      created_at: noteData.created_at,
      updated_at: noteData.updated_at
    };
  },

  deleteNote: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting note:', error);
      throw new Error(error.message);
    }
  },

  toggleChecklistItem: async (itemId: string, completed: boolean): Promise<void> => {
    const { error } = await supabase
      .from('checklist_items')
      .update({ completed })
      .eq('id', itemId);

    if (error) {
      console.error('Error updating checklist item:', error);
      throw new Error(error.message);
    }
  }
};

export const useNotes = (date: string) => {
  const queryClient = useQueryClient();

  const {
    data: notes = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notes', date],
    queryFn: () => notesService.getNotesByDate(date)
  });

  const createNoteMutation = useMutation({
    mutationFn: (data: NoteFormData) => notesService.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', date] });
      toast({
        title: "تم الحفظ",
        description: "تم إنشاء الملاحظة بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الملاحظة",
        variant: "destructive",
      });
    }
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NoteFormData> }) => 
      notesService.updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', date] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث الملاحظة بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الملاحظة",
        variant: "destructive",
      });
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => notesService.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', date] });
      toast({
        title: "تم الحذف",
        description: "تم حذف الملاحظة بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في حذف الملاحظة",
        variant: "destructive",
      });
    }
  });

  const toggleChecklistItemMutation = useMutation({
    mutationFn: ({ itemId, completed }: { itemId: string; completed: boolean }) => 
      notesService.toggleChecklistItem(itemId, completed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', date] });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: "فشل في تحديث العنصر",
        variant: "destructive",
      });
    }
  });

  return {
    notes,
    isLoading,
    error,
    refetch,
    createNote: createNoteMutation.mutate,
    updateNote: updateNoteMutation.mutate,
    deleteNote: deleteNoteMutation.mutate,
    toggleChecklistItem: toggleChecklistItemMutation.mutate,
    isCreating: createNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending
  };
};
