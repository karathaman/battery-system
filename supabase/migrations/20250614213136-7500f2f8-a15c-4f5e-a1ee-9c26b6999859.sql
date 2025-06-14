
-- Create notes table to store notes linked to dates
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  date DATE NOT NULL,
  color VARCHAR(50) DEFAULT 'yellow',
  type VARCHAR(20) DEFAULT 'note' CHECK (type IN ('note', 'checklist')),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create checklist_items table for checklist notes
CREATE TABLE public.checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_notes_date ON public.notes(date);
CREATE INDEX idx_notes_type ON public.notes(type);
CREATE INDEX idx_checklist_items_note_id ON public.checklist_items(note_id);

-- Add trigger to update updated_at column
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
