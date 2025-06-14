
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, StickyNote, CheckSquare } from "lucide-react";
import { useNotes, Note, NoteFormData } from "@/hooks/useNotes";

interface DailyNotesAndTasksProps {
  date: string;
}

const noteColors = [
  { name: "أصفر", value: "yellow", bg: "bg-yellow-200", border: "border-yellow-300" },
  { name: "أزرق", value: "blue", bg: "bg-blue-200", border: "border-blue-300" },
  { name: "أخضر", value: "green", bg: "bg-green-200", border: "border-green-300" },
  { name: "وردي", value: "pink", bg: "bg-pink-200", border: "border-pink-300" },
  { name: "بنفسجي", value: "purple", bg: "bg-purple-200", border: "border-purple-300" }
];

export const DailyNotesAndTasks = ({ date }: DailyNotesAndTasksProps) => {
  const { notes, createNote, updateNote, deleteNote, toggleChecklistItem, isCreating } = useNotes(date);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState<NoteFormData>({
    title: "",
    content: "",
    date: date,
    color: "yellow",
    type: "note",
    checklist_items: []
  });

  const resetForm = () => {
    setNewNote({
      title: "",
      content: "",
      date: date,
      color: "yellow",
      type: "note",
      checklist_items: []
    });
  };

  const handleSaveNote = () => {
    if (!newNote.title.trim()) return;

    createNote(newNote);
    resetForm();
    setShowAddDialog(false);
  };

  const handleUpdateNote = () => {
    if (!editingNote || !newNote.title.trim()) return;

    updateNote({ id: editingNote.id, data: newNote });
    resetForm();
    setEditingNote(null);
  };

  const handleEditNote = (note: Note) => {
    setNewNote({
      title: note.title,
      content: note.content || "",
      date: note.date,
      color: note.color,
      type: note.type,
      checklist_items: note.checklist_items?.map(item => ({
        text: item.text,
        completed: item.completed
      })) || []
    });
    setEditingNote(note);
  };

  const addChecklistItem = () => {
    setNewNote(prev => ({
      ...prev,
      checklist_items: [...(prev.checklist_items || []), { text: "", completed: false }]
    }));
  };

  const updateChecklistItem = (index: number, text: string) => {
    setNewNote(prev => ({
      ...prev,
      checklist_items: prev.checklist_items?.map((item, i) => 
        i === index ? { ...item, text } : item
      ) || []
    }));
  };

  const removeChecklistItem = (index: number) => {
    setNewNote(prev => ({
      ...prev,
      checklist_items: prev.checklist_items?.filter((_, i) => i !== index) || []
    }));
  };

  const getColorClasses = (color: string) => {
    const colorConfig = noteColors.find(c => c.value === color) || noteColors[0];
    return { bg: colorConfig.bg, border: colorConfig.border };
  };

  if (notes.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader className="bg-gray-50">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <StickyNote className="w-4 h-4" />
              ملاحظات ومهام اليوم
            </CardTitle>
            <Button 
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="flex items-center gap-1"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <Plus className="w-3 h-3" />
              إضافة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <p className="text-gray-500 text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            لا توجد ملاحظات أو مهام لهذا اليوم
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-4">
        <CardHeader className="bg-gray-50">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <StickyNote className="w-4 h-4" />
              ملاحظات ومهام اليوم ({notes.length})
            </CardTitle>
            <Button 
              onClick={() => setShowAddDialog(true)}
              size="sm"
              className="flex items-center gap-1"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              <Plus className="w-3 h-3" />
              إضافة
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notes.map((note) => {
              const colorClasses = getColorClasses(note.color);
              return (
                <Card key={note.id} className={`${colorClasses.bg} ${colorClasses.border} border-2`}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {note.type === 'checklist' ? (
                          <CheckSquare className="w-4 h-4 text-gray-600" />
                        ) : (
                          <StickyNote className="w-4 h-4 text-gray-600" />
                        )}
                        <h4 className="font-semibold text-sm" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {note.title}
                        </h4>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNote(note)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNote(note.id)}
                          className="h-6 w-6 p-0 text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {note.type === 'note' && note.content && (
                      <p className="text-xs text-gray-700 mb-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                        {note.content}
                      </p>
                    )}

                    {note.type === 'checklist' && note.checklist_items && (
                      <div className="space-y-1">
                        {note.checklist_items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={(checked) => 
                                toggleChecklistItem({ itemId: item.id, completed: !!checked })
                              }
                            />
                            <span 
                              className={`text-xs ${item.completed ? 'line-through text-gray-500' : ''}`}
                              style={{ fontFamily: 'Tajawal, sans-serif' }}
                            >
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Badge variant="outline" className="text-xs mt-2">
                      {note.type === 'checklist' ? 'قائمة مهام' : 'ملاحظة'}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Note Dialog */}
      <Dialog open={showAddDialog || !!editingNote} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setEditingNote(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
              {editingNote ? 'تعديل' : 'إضافة'} {newNote.type === 'checklist' ? 'قائمة مهام' : 'ملاحظة'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Input
                placeholder="العنوان"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={newNote.type === 'note' ? 'default' : 'outline'}
                onClick={() => setNewNote({ ...newNote, type: 'note' })}
                className="flex-1"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                ملاحظة
              </Button>
              <Button
                variant={newNote.type === 'checklist' ? 'default' : 'outline'}
                onClick={() => setNewNote({ ...newNote, type: 'checklist' })}
                className="flex-1"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                قائمة مهام
              </Button>
            </div>

            {newNote.type === 'note' && (
              <Textarea
                placeholder="المحتوى"
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                style={{ fontFamily: 'Tajawal, sans-serif' }}
                rows={3}
              />
            )}

            {newNote.type === 'checklist' && (
              <div className="space-y-2">
                {newNote.checklist_items?.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="نص المهمة"
                      value={item.text}
                      onChange={(e) => updateChecklistItem(index, e.target.value)}
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeChecklistItem(index)}
                    >
                      حذف
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={addChecklistItem}
                  className="w-full"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مهمة
                </Button>
              </div>
            )}

            <div>
              <div className="flex gap-2">
                {noteColors.map((color) => (
                  <button
                    key={color.value}
                    className={`w-6 h-6 rounded-full ${color.bg} border-2 ${
                      newNote.color === color.value ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    onClick={() => setNewNote({ ...newNote, color: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddDialog(false);
                  setEditingNote(null);
                  resetForm();
                }}
              >
                إلغاء
              </Button>
              <Button 
                onClick={editingNote ? handleUpdateNote : handleSaveNote}
                disabled={isCreating}
              >
                {editingNote ? 'تحديث' : 'حفظ'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
