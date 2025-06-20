import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { StickyNote, Plus, Trash2, Edit3, Palette, CheckSquare, Square } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useNotes } from "@/hooks/useNotes";

interface StickyNotesProps {
  compact?: boolean;
  language?: string;
}

const noteColors = [
  { name: "أصفر", value: "yellow", bg: "bg-yellow-50", border: "border-yellow-200", header: "from-yellow-400 to-yellow-500" },
  { name: "أزرق", value: "blue", bg: "bg-blue-50", border: "border-blue-200", header: "from-blue-400 to-blue-500" },
  { name: "أخضر", value: "green", bg: "bg-green-50", border: "border-green-200", header: "from-green-400 to-green-500" },
  { name: "أحمر", value: "red", bg: "bg-red-50", border: "border-red-200", header: "from-red-400 to-red-500" },
  { name: "بنفسجي", value: "purple", bg: "bg-purple-50", border: "border-purple-200", header: "from-purple-400 to-purple-500" },
  { name: "وردي", value: "pink", bg: "bg-pink-50", border: "border-pink-200", header: "from-pink-400 to-pink-500" }
];

export const StickyNotes = ({ compact = false, language = "ar" }: StickyNotesProps) => {
  const today = new Date().toISOString().split('T')[0];
  const { notes, createNote, updateNote, deleteNote, toggleChecklistItem, isCreating } = useNotes(today);
  
  const [newNote, setNewNote] = useState({ title: "", content: "", color: "yellow", type: "note" as 'note' | 'checklist' });
  const [newChecklistItems, setNewChecklistItems] = useState<string[]>([""]);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const isRTL = language === "ar";

  const getColorClasses = (color: string) => {
    return noteColors.find(c => c.value === color) || noteColors[0];
  };

  const addNote = async () => {
    if (!newNote.title.trim()) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "يرجى إدخال عنوان للملاحظة" : "Please enter a note title",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    const noteData = {
      title: newNote.title,
      content: newNote.content,
      color: newNote.color,
      type: newNote.type,
      date: today,
      checklist_items: newNote.type === 'checklist' 
        ? newChecklistItems.filter(item => item.trim()).map(text => ({ text, completed: false }))
        : undefined
    };

    createNote(noteData);

    // Reset form
    setNewNote({ title: "", content: "", color: "yellow", type: "note" });
    setNewChecklistItems([""]);
  };

  const handleEdit = (note: any) => {
    setNewNote({
      title: note.title,
      content: note.content || "",
      color: note.color,
      type: note.type as 'note' | 'checklist'
    });
    if (note.type === 'checklist' && note.checklist_items) {
      setNewChecklistItems(note.checklist_items.map((item: any) => item.text));
    }
    setEditingNote(note.id);
  };

  const handleUpdate = () => {
    if (!editingNote || !newNote.title.trim()) return;

    const noteData = {
      title: newNote.title,
      content: newNote.content,
      color: newNote.color,
      type: newNote.type,
      checklist_items: newNote.type === 'checklist' 
        ? newChecklistItems.filter(item => item.trim()).map(text => ({ text, completed: false }))
        : undefined
    };

    updateNote({ id: editingNote, data: noteData });
    
    // Reset form
    setNewNote({ title: "", content: "", color: "yellow", type: "note" });
    setNewChecklistItems([""]);
    setEditingNote(null);
  };

  const addNewChecklistItemField = () => {
    setNewChecklistItems(prev => [...prev, ""]);
  };

  const updateNewChecklistItem = (index: number, value: string) => {
    setNewChecklistItems(prev => prev.map((item, i) => i === index ? value : item));
  };

  const removeNewChecklistItem = (index: number) => {
    if (newChecklistItems.length > 1) {
      setNewChecklistItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const activeNotes = notes.filter(note => !note.completed);
  const completedNotes = notes.filter(note => note.completed);
  const displayNotes = showCompleted ? completedNotes : activeNotes;

  // For compact view, hide the entire section if no active notes
  if (compact && activeNotes.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {/* Add New Note Card */}
        <Card className="shadow-lg border-dashed border-2 border-yellow-300 hover:border-yellow-400 transition-colors">
          <CardHeader className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white pb-3">
            <CardTitle className={`flex items-center gap-2 text-sm ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Plus className="w-4 h-4" />
              {language === "ar" ? "ملاحظة جديدة" : "New Note"}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-3">
            <div className="space-y-2">
              {/* Note Type Selection */}
              <div className="flex gap-1">
                <Button
                  onClick={() => setNewNote(prev => ({ ...prev, type: 'note' }))}
                  variant={newNote.type === 'note' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 text-xs"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <StickyNote className="w-3 h-3 mr-1" />
                  ملاحظة
                </Button>
                <Button
                  onClick={() => setNewNote(prev => ({ ...prev, type: 'checklist' }))}
                  variant={newNote.type === 'checklist' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 text-xs"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <CheckSquare className="w-3 h-3 mr-1" />
                  قائمة
                </Button>
              </div>

              <Input
                placeholder={language === "ar" ? "عنوان..." : "Title..."}
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                className={`text-xs ${isRTL ? 'text-right' : 'text-left'}`}
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
              
              {newNote.type === 'note' ? (
                <Textarea
                  placeholder={language === "ar" ? "المحتوى..." : "Content..."}
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  rows={2}
                  className={`text-xs ${isRTL ? 'text-right' : 'text-left'}`}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                />
              ) : (
                <div className="space-y-1">
                  {newChecklistItems.map((item, index) => (
                    <div key={index} className="flex gap-1">
                      <Input
                        placeholder={`${language === "ar" ? "مهمة" : "Task"} ${index + 1}...`}
                        value={item}
                        onChange={(e) => updateNewChecklistItem(index, e.target.value)}
                        className={`text-xs flex-1 ${isRTL ? 'text-right' : 'text-left'}`}
                        style={{ fontFamily: 'Tajawal, sans-serif' }}
                      />
                      {newChecklistItems.length > 1 && (
                        <Button
                          onClick={() => removeNewChecklistItem(index)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={addNewChecklistItemField}
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    style={{ fontFamily: 'Tajawal, sans-serif' }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    إضافة مهمة
                  </Button>
                </div>
              )}
              
              {/* Color Picker */}
              <div className="flex flex-wrap gap-1">
                {noteColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewNote(prev => ({ ...prev, color: color.value }))}
                    className={`w-4 h-4 rounded-full ${color.bg} border-2 ${
                      newNote.color === color.value ? 'border-gray-800' : 'border-gray-300'
                    } hover:scale-110 transition-transform`}
                    title={color.name}
                  />
                ))}
              </div>
              
              <Button
                onClick={editingNote ? handleUpdate : addNote}
                size="sm"
                className={`w-full text-xs ${isRTL ? 'flex-row-reverse' : ''}`}
                style={{ fontFamily: 'Tajawal, sans-serif' }}
                disabled={isCreating}
              >
                <Plus className="w-3 h-3 mr-1" />
                {editingNote ? "تحديث" : (language === "ar" ? "إضافة" : "Add")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Display Notes from Database */}
        {activeNotes.slice(0, 5).map(note => {
          const colorClasses = getColorClasses(note.color);
          return (
            <Card key={note.id} className={`shadow-lg ${colorClasses.bg} ${colorClasses.border}`}>
              <CardHeader className={`bg-gradient-to-r ${colorClasses.header} text-white pb-2`}>
                <CardTitle className={`flex items-center justify-between text-xs ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {note.type === 'checklist' ? <CheckSquare className="w-3 h-3" /> : <StickyNote className="w-3 h-3" />}
                    <span className="truncate">{note.title}</span>
                  </div>
                  <div className={`flex gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Button
                      onClick={() => handleEdit(note)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-white hover:bg-black/20"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => deleteNote(note.id)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-white hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-3">
                <div className="space-y-2">
                  {note.type === 'note' && note.content && (
                    <p className={`text-xs text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {note.content.length > 60 ? note.content.substring(0, 60) + "..." : note.content}
                    </p>
                  )}
                  
                  {note.type === 'checklist' && note.checklist_items && (
                    <div className="space-y-1">
                      {note.checklist_items.slice(0, 3).map(item => (
                        <div key={item.id} className={`flex items-center gap-1 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleChecklistItem({ itemId: item.id, completed: !item.completed })}
                            className="h-3 w-3"
                          />
                          <span className={`${item.completed ? 'line-through text-gray-500' : ''} truncate`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                      {note.checklist_items.length > 3 && (
                        <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          +{note.checklist_items.length - 3} أكثر
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Show more indicator if there are more notes */}
        {activeNotes.length > 5 && (
          <Card className="shadow-lg border-dashed border-2 border-gray-300">
            <CardContent className="p-6 text-center flex items-center justify-center">
              <div>
                <StickyNote className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-xs text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  {language === "ar" ? `+${activeNotes.length - 5} ملاحظات` : `+${activeNotes.length - 5} more`}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Full notes page - keep existing functionality
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <StickyNote className="w-5 h-5" />
            {language === "ar" ? "الملاحظات اللاصقة" : "Sticky Notes"}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4 md:p-6">
          {/* Add New Note */}
          <div className="space-y-4 mb-6 p-4 bg-yellow-50 rounded-lg border">
            {/* Note Type Selection */}
            <div className="flex gap-2">
              <Button
                onClick={() => setNewNote(prev => ({ ...prev, type: 'note' }))}
                variant={newNote.type === 'note' ? 'default' : 'outline'}
                size="sm"
                className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <StickyNote className="w-4 h-4" />
                ملاحظة عادية
              </Button>
              <Button
                onClick={() => setNewNote(prev => ({ ...prev, type: 'checklist' }))}
                variant={newNote.type === 'checklist' ? 'default' : 'outline'}
                size="sm"
                className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              >
                <CheckSquare className="w-4 h-4" />
                قائمة مهام
              </Button>
            </div>

            <Input
              placeholder={language === "ar" ? "عنوان الملاحظة..." : "Note title..."}
              value={newNote.title}
              onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
              className={isRTL ? 'text-right' : 'text-left'}
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            />
            
            {newNote.type === 'note' ? (
              <Textarea
                placeholder={language === "ar" ? "محتوى الملاحظة..." : "Note content..."}
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                rows={3}
                className={isRTL ? 'text-right' : 'text-left'}
                style={{ fontFamily: 'Tajawal, sans-serif' }}
              />
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                  المهام:
                </label>
                {newChecklistItems.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`${language === "ar" ? "مهمة" : "Task"} ${index + 1}...`}
                      value={item}
                      onChange={(e) => updateNewChecklistItem(index, e.target.value)}
                      className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}
                      style={{ fontFamily: 'Tajawal, sans-serif' }}
                    />
                    {newChecklistItems.length > 1 && (
                      <Button
                        onClick={() => removeNewChecklistItem(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  onClick={addNewChecklistItemField}
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center gap-2"
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                >
                  <Plus className="w-4 h-4" />
                  إضافة مهمة جديدة
                </Button>
              </div>
            )}
            
            {/* Color Picker */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 flex items-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                <Palette className="w-4 h-4 mr-2" />
                {language === "ar" ? "اللون:" : "Color:"}
              </span>
              {noteColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setNewNote(prev => ({ ...prev, color: color.value }))}
                  className={`w-6 h-6 rounded-full ${color.bg} border-2 ${
                    newNote.color === color.value ? 'border-gray-800' : 'border-gray-300'
                  } hover:scale-110 transition-transform`}
                  title={color.name}
                />
              ))}
            </div>
            
            <Button
              onClick={editingNote ? handleUpdate : addNote}
              className={`w-full flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              disabled={isCreating}
            >
              <Plus className="w-4 h-4" />
              {editingNote ? "تحديث الملاحظة" : (language === "ar" ? "إضافة ملاحظة" : "Add Note")}
            </Button>
          </div>

          {/* Toggle completed notes */}
          <div className={`flex items-center gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Button
              onClick={() => setShowCompleted(!showCompleted)}
              variant="outline"
              size="sm"
              style={{ fontFamily: 'Tajawal, sans-serif' }}
            >
              {showCompleted 
                ? `${language === "ar" ? `المكتملة (${completedNotes.length})` : `Completed (${completedNotes.length})`}` 
                : `${language === "ar" ? `النشطة (${activeNotes.length})` : `Active (${activeNotes.length})`}`
              }
            </Button>
          </div>

          {/* Notes Grid - Display notes from database */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {displayNotes.map(note => {
              const colorClasses = getColorClasses(note.color);
              return (
                <div key={note.id} className={`p-4 rounded-lg border-l-4 ${
                  note.completed 
                    ? 'bg-gray-100 border-gray-400 opacity-70' 
                    : `${colorClasses.bg} border-${note.color}-400`
                } ${isRTL ? 'border-r-4 border-l-0' : ''}`}>
                  {editingNote === note.id ? (
                    <EditNoteForm
                      note={note}
                      newNote={newNote}
                      setNewNote={setNewNote}
                      newChecklistItems={newChecklistItems}
                      setNewChecklistItems={setNewChecklistItems}
                      onSave={handleUpdate}
                      onCancel={() => {
                        setEditingNote(null);
                        setNewNote({ title: "", content: "", color: "yellow", type: "note" });
                        setNewChecklistItems([""]);
                      }}
                      language={language}
                    />
                  ) : (
                    <div>
                      <div className={`flex items-start justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          {note.type === 'checklist' ? <CheckSquare className="w-4 h-4" /> : <StickyNote className="w-4 h-4" />}
                          <h4 className={`font-semibold text-sm ${note.completed ? 'line-through text-gray-500' : ''} ${isRTL ? 'text-right' : 'text-left'}`} 
                              style={{ fontFamily: 'Tajawal, sans-serif' }}>
                            {note.title}
                          </h4>
                        </div>
                        <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Button
                            onClick={() => handleEdit(note)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => deleteNote(note.id)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {note.type === 'note' && note.content && (
                        <p className={`text-gray-600 mb-3 text-xs ${note.completed ? 'line-through' : ''} ${isRTL ? 'text-right' : 'text-left'}`} 
                           style={{ fontFamily: 'Tajawal, sans-serif' }}>
                          {note.content}
                        </p>
                      )}

                      {note.type === 'checklist' && note.checklist_items && (
                        <div className="mb-3 space-y-1">
                          {note.checklist_items.map(item => (
                            <div key={item.id} className={`flex items-center gap-2 text-xs ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <Checkbox
                                checked={item.completed}
                                onCheckedChange={() => toggleChecklistItem({ itemId: item.id, completed: !item.completed })}
                                className="h-3 w-3"
                              />
                              <span className={`${item.completed ? 'line-through text-gray-500' : ''} flex-1`} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                                {item.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-xs text-gray-400">
                          {new Date(note.created_at).toLocaleDateString(language === "ar" ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {displayNotes.length === 0 && (
            <div className="text-center py-8">
              <StickyNote className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                {showCompleted 
                  ? (language === "ar" ? "لا توجد ملاحظات مكتملة" : "No completed notes") 
                  : (language === "ar" ? "لا توجد ملاحظات نشطة" : "No active notes")
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface EditNoteFormProps {
  note: any;
  newNote: any;
  setNewNote: any;
  newChecklistItems: string[];
  setNewChecklistItems: any;
  onSave: () => void;
  onCancel: () => void;
  language?: string;
  compact?: boolean;
}

const EditNoteForm = ({ note, newNote, setNewNote, newChecklistItems, setNewChecklistItems, onSave, onCancel, language = "ar", compact = false }: EditNoteFormProps) => {
  const isRTL = language === "ar";

  const handleSave = () => {
    if (!newNote.title.trim()) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "يرجى إدخال عنوان للملاحظة" : "Please enter a note title",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }
    onSave();
  };

  return (
    <div className="space-y-2">
      <Input
        value={newNote.title}
        onChange={(e) => setNewNote((prev: any) => ({ ...prev, title: e.target.value }))}
        className={`${compact ? 'text-xs' : ''} ${isRTL ? 'text-right' : 'text-left'}`}
        style={{ fontFamily: 'Tajawal, sans-serif' }}
      />
      {newNote.type === 'note' && (
        <Textarea
          value={newNote.content}
          onChange={(e) => setNewNote((prev: any) => ({ ...prev, content: e.target.value }))}
          rows={compact ? 2 : 3}
          className={`${compact ? 'text-xs' : ''} ${isRTL ? 'text-right' : 'text-left'}`}
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        />
      )}
      
      {/* Color Picker for Edit */}
      <div className="flex flex-wrap gap-1">
        {noteColors.map((colorOption) => (
          <button
            key={colorOption.value}
            onClick={() => setNewNote((prev: any) => ({ ...prev, color: colorOption.value }))}
            className={`w-4 h-4 rounded-full ${colorOption.bg} border-2 ${
              newNote.color === colorOption.value ? 'border-gray-800' : 'border-gray-300'
            } hover:scale-110 transition-transform`}
            title={colorOption.name}
          />
        ))}
      </div>
      
      <div className={`flex gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button 
          onClick={handleSave} 
          size={compact ? "sm" : "sm"} 
          className={compact ? 'text-xs' : ''}
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
          {language === "ar" ? "حفظ" : "Save"}
        </Button>
        <Button 
          onClick={onCancel} 
          variant="outline" 
          size={compact ? "sm" : "sm"}
          className={compact ? 'text-xs' : ''}
          style={{ fontFamily: 'Tajawal, sans-serif' }}
        >
          {language === "ar" ? "إلغاء" : "Cancel"}
        </Button>
      </div>
    </div>
  );
};
