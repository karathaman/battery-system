
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StickyNote, Battery, Plus, Edit, Trash2, Search, CheckSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { BatteryTypeManagement } from "@/components/BatteryTypeManagement";
import { TaskListWidget } from "@/components/TaskListWidget";
import { useNotes } from "@/hooks/useNotes";

const NotesAndBatteriesPage = () => {
  const today = new Date().toISOString().split('T')[0];
  const { notes, createNote, updateNote, deleteNote, isCreating } = useNotes(today);
  
  // Filter for regular notes only (not checklists)
  const stickyNotes = notes.filter(note => note.type === 'note');
  
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    color: "yellow"
  });

  const [editingNote, setEditingNote] = useState<any | null>(null);

  const noteColors = [
    { name: "أصفر", value: "yellow" },
    { name: "أزرق", value: "blue" },
    { name: "أخضر", value: "green" },
    { name: "وردي", value: "pink" },
    { name: "بنفسجي", value: "purple" }
  ];

  // Sticky Notes Functions
  const addNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى ملء العنوان والمحتوى",
        variant: "destructive"
      });
      return;
    }

    const noteData = {
      title: newNote.title,
      content: newNote.content,
      color: newNote.color,
      type: "note" as const,
      date: today
    };

    createNote(noteData);
    setNewNote({ title: "", content: "", color: "yellow" });
  };

  const updateNoteFunction = () => {
    if (!editingNote) return;

    const noteData = {
      title: editingNote.title,
      content: editingNote.content,
      color: editingNote.color,
      type: "note" as const
    };

    updateNote({ id: editingNote.id, data: noteData });
    setEditingNote(null);
  };

  const deleteNoteFunction = (noteId: string) => {
    deleteNote(noteId);
  };

  const startEditing = (note: any) => {
    setEditingNote({ ...note });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
          <CardTitle className="flex items-center gap-2 flex-row-reverse text-lg sm:text-xl" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <StickyNote className="w-4 h-4 sm:w-5 sm:h-5" />
            الملاحظات والمهام وأنواع البطاريات
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notes" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <StickyNote className="w-4 h-4 ml-2" />
            الملاحظات الملصقة
          </TabsTrigger>
          <TabsTrigger value="tasks" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <CheckSquare className="w-4 h-4 ml-2" />
            قائمة المهام
          </TabsTrigger>
          <TabsTrigger value="batteries" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <Battery className="w-4 h-4 ml-2" />
            أنواع البطاريات
          </TabsTrigger>
        </TabsList>

        {/* Sticky Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle style={{ fontFamily: 'Tajawal, sans-serif' }}>
                إضافة ملاحظة جديدة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="noteTitle" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  العنوان
                </Label>
                <Input
                  id="noteTitle"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="أدخل عنوان الملاحظة"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                />
              </div>

              <div>
                <Label htmlFor="noteContent" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  المحتوى
                </Label>
                <Textarea
                  id="noteContent"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="أدخل محتوى الملاحظة"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                  rows={3}
                />
              </div>

              <div>
                <Label style={{ fontFamily: 'Tajawal, sans-serif' }}>اللون</Label>
                <div className="flex gap-2 mt-2">
                  {noteColors.map((color) => (
                    <button
                      key={color.value}
                      className={`w-8 h-8 rounded-full border-2 bg-${color.value}-200 ${
                        newNote.color === color.value ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      onClick={() => setNewNote({ ...newNote, color: color.value })}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <Button 
                onClick={addNote} 
                className="w-full" 
                style={{ fontFamily: 'Tajawal, sans-serif' }}
                disabled={isCreating}
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة ملاحظة
              </Button>
            </CardContent>
          </Card>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stickyNotes.map((note) => (
              <Card key={note.id} className={`bg-${note.color}-200 border-2`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {note.title}
                    </h3>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(note)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNoteFunction(note.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {note.content}
                  </p>
                  <p className="text-xs text-gray-600">
                    آخر تحديث: {new Date(note.updated_at).toLocaleDateString('ar-SA')}
                  </p>
                </CardContent>
              </Card>
            ))}
            
            {stickyNotes.length === 0 && (
              <div className="col-span-full text-center py-8">
                <StickyNote className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  لا توجد ملاحظات. ابدأ بإنشاء ملاحظة جديدة!
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <TaskListWidget />
        </TabsContent>

        {/* Battery Types Tab */}
        <TabsContent value="batteries" className="space-y-4">
          <BatteryTypeManagement />
        </TabsContent>
      </Tabs>

      {/* Edit Note Dialog */}
      {editingNote && (
        <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
              تعديل الملاحظة
            </h3>
            <div className="space-y-4">
              <Input
                value={editingNote.title}
                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                placeholder="العنوان"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
              <Textarea
                value={editingNote.content}
                onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                placeholder="المحتوى"
                style={{ fontFamily: 'Tajawal, sans-serif' }}
                rows={3}
              />
              <div className="flex gap-2">
                {noteColors.map((color) => (
                  <button
                    key={color.value}
                    className={`w-8 h-8 rounded-full border-2 bg-${color.value}-200 ${
                      editingNote.color === color.value ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    onClick={() => setEditingNote({ ...editingNote, color: color.value })}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={updateNoteFunction} className="flex-1">حفظ</Button>
                <Button variant="outline" onClick={() => setEditingNote(null)} className="flex-1">إلغاء</Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default NotesAndBatteriesPage;
