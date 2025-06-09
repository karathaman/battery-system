import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "مراجعة فواتير الموردين", completed: false },
    { id: "2", title: "تحديث أسعار البطاريات", completed: true },
    { id: "3", title: "جرد المخزن الشهري", completed: false },
    { id: "4", title: "متابعة مديونيات العملاء", completed: false },
    { id: "5", title: "تنظيف وترتيب المتجر", completed: true },
    { id: "6", title: "تحديث قائمة العملاء", completed: false },
    { id: "7", title: "مراجعة الحسابات الشهرية", completed: false },
    { id: "8", title: "طلب بطاريات جديدة من الموردين", completed: true }
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState("");

  const addTask = () => {
    if (!newTaskTitle.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان المهمة",
        variant: "destructive"
      });
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false
    };

    setTasks(prev => [...prev, task]);
    setNewTaskTitle("");
    toast({
      title: "تمت الإضافة",
      description: "تمت إضافة المهمة بنجاح"
    });
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    toast({
      title: "تم الحذف",
      description: "تم حذف المهمة"
    });
  };

  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" style={{ fontFamily: 'Tajawal, sans-serif' }}>
          <CheckCircle className="w-5 h-5" />
          قائمة المهام
          {totalTasks > 0 && (
            <span className="text-sm text-gray-500">
              ({completedTasks}/{totalTasks})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* إضافة مهمة جديدة */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="أدخل عنوان المهمة"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
            />
            <Button onClick={addTask} style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* قائمة المهام في جدول */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>المهمة</th>
                <th className="p-3 text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>مكتملة</th>
                <th className="p-3 text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center text-gray-500 py-4" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    لا توجد مهام حالياً
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-center" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                      {task.title}
                    </td>
                    <td className="p-3 text-center">
                      <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} />
                    </td>
                    <td className="p-3 text-center">
                      <Button variant="destructive" size="sm" onClick={() => deleteTask(task.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
