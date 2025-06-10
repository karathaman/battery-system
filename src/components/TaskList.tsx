
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, CheckCircle, Calendar, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Task, TaskGroup } from "@/types";

export const TaskList = () => {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([
    {
      id: "1",
      title: "المهام الإدارية",
      createdDate: "2024-01-15",
      tasks: [
        { 
          id: "1", 
          title: "مراجعة فواتير الموردين", 
          completed: false, 
          color: "bg-blue-100",
          createdDate: "2024-01-15"
        },
        { 
          id: "2", 
          title: "تحديث أسعار البطاريات", 
          completed: true, 
          color: "bg-green-100",
          createdDate: "2024-01-15",
          completedDate: "2024-01-16"
        },
      ],
    },
    {
      id: "2",
      title: "المهام الفنية",
      createdDate: "2024-01-15",
      tasks: [
        { 
          id: "3", 
          title: "جرد المخزن الشهري", 
          completed: false, 
          color: "bg-yellow-100",
          createdDate: "2024-01-15"
        },
        { 
          id: "4", 
          title: "متابعة مديونيات العملاء", 
          completed: false, 
          color: "bg-orange-100",
          createdDate: "2024-01-15"
        },
      ],
    },
  ]);

  const [newTaskGroupTitle, setNewTaskGroupTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskColor, setNewTaskColor] = useState("bg-white");

  const colorOptions = [
    { value: "bg-white", label: "افتراضي", color: "bg-white" },
    { value: "bg-red-100", label: "أحمر", color: "bg-red-100" },
    { value: "bg-blue-100", label: "أزرق", color: "bg-blue-100" },
    { value: "bg-green-100", label: "أخضر", color: "bg-green-100" },
    { value: "bg-yellow-100", label: "أصفر", color: "bg-yellow-100" },
    { value: "bg-purple-100", label: "بنفسجي", color: "bg-purple-100" },
    { value: "bg-pink-100", label: "وردي", color: "bg-pink-100" },
    { value: "bg-gray-100", label: "رمادي", color: "bg-gray-100" },
  ];

  const addTaskGroup = () => {
    if (!newTaskGroupTitle.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان المجموعة",
        variant: "destructive",
      });
      return;
    }

    const newGroup: TaskGroup = {
      id: Date.now().toString(),
      title: newTaskGroupTitle.trim(),
      createdDate: new Date().toISOString().split('T')[0],
      tasks: [],
    };

    setTaskGroups((prev) => [...prev, newGroup]);
    setNewTaskGroupTitle("");
    toast({
      title: "تمت الإضافة",
      description: "تمت إضافة مجموعة المهام بنجاح",
    });
  };

  const addTaskToGroup = (groupId: string) => {
    if (!newTaskTitle.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان المهمة",
        variant: "destructive",
      });
      return;
    }

    const group = taskGroups.find((group) => group.id === groupId);
    if (group?.tasks.some((task) => task.title === newTaskTitle.trim())) {
      toast({
        title: "خطأ",
        description: "المهمة موجودة بالفعل في هذه المجموعة",
        variant: "destructive",
      });
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      color: newTaskColor,
      createdDate: new Date().toISOString().split('T')[0]
    };

    setTaskGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, tasks: [...group.tasks, task] }
          : group
      )
    );
    setNewTaskTitle("");
    setNewTaskColor("bg-white");
    toast({
      title: "تمت الإضافة",
      description: "تمت إضافة المهمة بنجاح",
    });
  };

  const toggleTaskCompletion = (groupId: string, taskId: string) => {
    setTaskGroups((prev) =>
      prev.map((group) => ({
        ...group,
        tasks: group.tasks.map((task) =>
          task.id === taskId
            ? { 
                ...task, 
                completed: !task.completed,
                completedDate: !task.completed ? new Date().toISOString().split('T')[0] : undefined
              }
            : task
        ),
      }))
    );
  };

  const deleteTask = (groupId: string, taskId: string) => {
    setTaskGroups((prev) =>
      prev.map((group) => ({
        ...group,
        tasks: group.tasks.filter((task) => task.id !== taskId),
      }))
    );
    toast({
      title: "تم الحذف",
      description: "تم حذف المهمة بنجاح",
    });
  };

  const deleteTaskGroup = (groupId: string) => {
    setTaskGroups((prev) => prev.filter((group) => group.id !== groupId));
    toast({
      title: "تم الحذف",
      description: "تم حذف مجموعة المهام بنجاح",
    });
  };

  const completedTasks = taskGroups.reduce(
    (total, group) => total + group.tasks.filter((task) => task.completed).length,
    0
  );
  const totalTasks = taskGroups.reduce(
    (total, group) => total + group.tasks.length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="flex justify-between items-center bg-white rounded-lg shadow-lg p-6 flex-row-reverse">
        <div className="text-right">
          <p className="text-sm text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            إحصائيات المهام
          </p>
          <p className="text-2xl font-bold text-blue-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            {completedTasks} من {totalTasks} مكتملة
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="text-center">
            <div className="bg-green-100 rounded-lg p-3">
              <CheckCircle className="w-6 h-6 mx-auto text-green-600" />
              <p className="text-sm font-bold text-green-600">{completedTasks}</p>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>مكتملة</p>
            </div>
          </div>
          <div className="text-center">
            <div className="bg-orange-100 rounded-lg p-3">
              <Target className="w-6 h-6 mx-auto text-orange-600" />
              <p className="text-sm font-bold text-orange-600">{totalTasks - completedTasks}</p>
              <p className="text-xs text-gray-600" style={{ fontFamily: 'Tajawal, sans-serif' }}>متبقية</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Task Group */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <CardTitle className="flex items-center gap-2 flex-row-reverse" style={{ fontFamily: 'Tajawal, sans-serif' }}>
            <Plus className="w-5 h-5" />
            إضافة مجموعة مهام جديدة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="أدخل عنوان مجموعة المهام"
              value={newTaskGroupTitle}
              onChange={(e) => setNewTaskGroupTitle(e.target.value)}
              style={{ fontFamily: 'Tajawal, sans-serif' }}
              className="flex-1"
            />
            <Button onClick={addTaskGroup} style={{ fontFamily: 'Tajawal, sans-serif' }}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task Groups Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {taskGroups.map((group) => (
          <Card key={group.id} className="shadow-lg">
            <CardHeader className="bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 flex-row-reverse" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <CheckCircle className="w-5 h-5" />
                    {group.title}
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">
                      {group.tasks.filter((task) => task.completed).length}/
                      {group.tasks.length}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {group.createdDate}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteTaskGroup(group.id)}
                  title="حذف المجموعة"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-4">
              {/* Add New Task */}
              <div className="space-y-3 mb-4">
                <Input
                  placeholder="أدخل عنوان المهمة"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTaskToGroup(group.id)}
                  style={{ fontFamily: 'Tajawal, sans-serif' }}
                />
                
                <div className="flex gap-2">
                  <Select value={newTaskColor} onValueChange={setNewTaskColor}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="اختر اللون" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${option.color} border`}></div>
                            <span style={{ fontFamily: 'Tajawal, sans-serif' }}>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button onClick={() => addTaskToGroup(group.id)} style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-2">
                {group.tasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-8" style={{ fontFamily: 'Tajawal, sans-serif' }}>
                    لا توجد مهام
                  </p>
                ) : (
                  group.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 border rounded-lg ${task.color} transition-all hover:shadow-md`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() =>
                              toggleTaskCompletion(group.id, task.id)
                            }
                          />
                          <span
                            className={`${
                              task.completed ? "line-through text-gray-500" : "text-gray-900"
                            }`}
                            style={{ fontFamily: 'Tajawal, sans-serif' }}
                          >
                            {task.title}
                          </span>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteTask(group.id, task.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>أُنشئت: {task.createdDate}</span>
                        {task.completedDate && (
                          <span className="text-green-600">اكتملت: {task.completedDate}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
