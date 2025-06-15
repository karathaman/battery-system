
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, CheckSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNotes } from "@/hooks/useNotes";

export const TaskListWidget = () => {
  const today = new Date().toISOString().split('T')[0];
  const { notes, createNote, updateNote, deleteNote, toggleChecklistItem } = useNotes(today);
  
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskItems, setNewTaskItems] = useState<{ [key: string]: string }>({});

  // Filter for checklist notes only
  const taskLists = notes.filter(note => note.type === 'checklist');

  const addNewTaskList = async () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان القائمة",
        variant: "destructive",
      });
      return;
    }

    const noteData = {
      title: newTaskTitle,
      content: "",
      color: "blue",
      type: "checklist" as const,
      date: today,
      checklist_items: []
    };

    createNote(noteData);
    setNewTaskTitle("");
  };

  const addTaskToList = async (taskListId: string) => {
    const newTaskText = newTaskItems[taskListId];
    if (!newTaskText?.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال نص المهمة",
        variant: "destructive",
      });
      return;
    }

    // Find the task list
    const taskList = taskLists.find(list => list.id === taskListId);
    if (!taskList) return;

    // Create new checklist items array with the new task
    const updatedItems = [
      ...(taskList.checklist_items || []),
      { text: newTaskText, completed: false }
    ];

    const noteData = {
      title: taskList.title,
      content: taskList.content,
      color: taskList.color,
      type: "checklist" as const,
      checklist_items: updatedItems
    };

    updateNote({ id: taskListId, data: noteData });
    
    // Clear the input for this task list
    setNewTaskItems(prev => ({ ...prev, [taskListId]: "" }));
  };

  const deleteTaskList = (id: string) => {
    deleteNote(id);
  };

  const removeTaskFromList = async (taskListId: string, taskIndex: number) => {
    const taskList = taskLists.find(list => list.id === taskListId);
    if (!taskList) return;

    const updatedItems = (taskList.checklist_items || []).filter((_, index) => index !== taskIndex);

    const noteData = {
      title: taskList.title,
      content: taskList.content,
      color: taskList.color,
      type: "checklist" as const,
      checklist_items: updatedItems
    };

    updateNote({ id: taskListId, data: noteData });
  };

  const toggleTaskCompletion = async (taskListId: string, taskIndex: number) => {
    const taskList = taskLists.find(list => list.id === taskListId);
    if (!taskList) return;

    const updatedItems = (taskList.checklist_items || []).map((item, index) => 
      index === taskIndex ? { ...item, completed: !item.completed } : item
    );

    const noteData = {
      title: taskList.title,
      content: taskList.content,
      color: taskList.color,
      type: "checklist" as const,
      checklist_items: updatedItems
    };

    updateNote({ id: taskListId, data: noteData });
  };

  return (
    <div className="space-y-6">
      {/* Add New Task List */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center gap-2 flex-row-reverse" style={{ fontFamily: "Tajawal, sans-serif" }}>
            <Plus className="w-5 h-5" />
            إضافة قائمة مهام جديدة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            <Input
              placeholder="أدخل عنوان قائمة المهام"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              style={{ fontFamily: "Tajawal, sans-serif" }}
            />
            <Button onClick={addNewTaskList} style={{ fontFamily: "Tajawal, sans-serif" }}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task Lists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {taskLists.map((taskList) => (
          <Card key={taskList.id} className="shadow-lg bg-blue-50 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-400 to-blue-500 text-white">
              <CardTitle className="flex items-center justify-between" style={{ fontFamily: "Tajawal, sans-serif" }}>
                <span>{taskList.title}</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteTaskList(taskList.id)}
                  title="حذف القائمة"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {/* Add New Task to This List */}
              <div className="flex gap-2">
                <Input
                  placeholder="أدخل مهمة جديدة..."
                  value={newTaskItems[taskList.id] || ""}
                  onChange={(e) => setNewTaskItems(prev => ({ ...prev, [taskList.id]: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addTaskToList(taskList.id);
                    }
                  }}
                  style={{ fontFamily: "Tajawal, sans-serif" }}
                  className="flex-1"
                />
                <Button
                  onClick={() => addTaskToList(taskList.id)}
                  size="sm"
                  title="إضافة مهمة"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Task List */}
              <div className="space-y-2">
                {taskList.checklist_items && taskList.checklist_items.map((task, index) => (
                  <div
                    key={index}
                    className={`rounded-lg p-3 shadow-sm ${task.completed ? "opacity-60" : ""}`}
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.47)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTaskCompletion(taskList.id, index)}
                        />
                        <span
                          className={`${
                            task.completed ? "line-through text-gray-500" : "text-gray-900"
                          }`}
                          style={{ fontFamily: "Tajawal, sans-serif" }}
                        >
                          {task.text}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTaskFromList(taskList.id, index)}
                        title="حذف المهمة"
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!taskList.checklist_items || taskList.checklist_items.length === 0) && (
                  <p className="text-gray-500 text-center py-4" style={{ fontFamily: "Tajawal, sans-serif" }}>
                    لا توجد مهام في هذه القائمة. استخدم الحقل أعلاه لإضافة مهام.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {taskLists.length === 0 && (
        <div className="text-center py-8">
          <CheckSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500" style={{ fontFamily: "Tajawal, sans-serif" }}>
            لا توجد قوائم مهام. ابدأ بإنشاء قائمة جديدة!
          </p>
        </div>
      )}
    </div>
  );
};
