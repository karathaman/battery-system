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

interface StickyNote {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

const NotesAndBatteriesPage = () => {
  // Sticky Notes State
  const [notes, setNotes] = useState<StickyNote[]>([
    {
      id: "1",
      title: "ملاحظة مهمة",
      content: "تذكير بموعد تسليم الطلبية الكبيرة",
      color: "bg-yellow-200",
      createdAt: "2024-01-20",
      updatedAt: "2024-01-20"
    }
  ]);
  
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    color: "bg-yellow-200"
  });

  const [editingNote, setEditingNote] = useState<StickyNote | null>(null);

  const noteColors = [
    { name: "أصفر", value: "bg-yellow-200" },
    { name: "أزرق", value: "bg-blue-200" },
    { name: "أخضر", value: "bg-green-200" },
    { name: "وردي", value: "bg-pink-200" },
    { name: "بنفسجي", value: "bg-purple-200" }
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

    const note: StickyNote = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      color: newNote.color,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setNotes(prev => [note, ...prev]);
    setNewNote({ title: "", content: "", color: "bg-yellow-200" });
    
    toast({
      title: "تمت الإضافة",
      description: "تمت إضافة الملاحظة بنجاح"
    });
  };

  const updateNote = () => {
    if (!editingNote) return;

    setNotes(prev => prev.map(note => 
      note.id === editingNote.id 
        ? { ...editingNote, updatedAt: new Date().toISOString().split('T')[0] }
        : note
    ));
    setEditingNote(null);
    
    toast({
      title: "تم التحديث",
      description: "تم تحديث الملاحظة بنجاح"
    });
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    toast({
      title: "تم الحذف",
      description: "تم حذف الملاحظة بنجاح"
    });
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
                      className={`w-8 h-8 rounded-full border-2 ${color.value} ${
                        newNote.color === color.value ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      onClick={() => setNewNote({ ...newNote, color: color.value })}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <Button onClick={addNote} className="w-full" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة ملاحظة
              </Button>
            </CardContent>
          </Card>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <Card key={note.id} className={`${note.color} border-2`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {note.title}
                    </h3>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingNote(note)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNote(note.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm mb-3" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    {note.content}
                  </p>
                  <p className="text-xs text-gray-600">
                    آخر تحديث: {note.updatedAt}
                  </p>
                </CardContent>
              </Card>
            ))}
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
                    className={`w-8 h-8 rounded-full border-2 ${color.value} ${
                      editingNote.color === color.value ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    onClick={() => setEditingNote({ ...editingNote, color: color.value })}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={updateNote} className="flex-1">حفظ</Button>
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
