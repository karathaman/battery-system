import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, CheckSquare, Palette } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  completed: boolean; 
  createdDate: string;
}

interface TaskGroup {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

const groupColors = [
  { name: "أصفر", value: "yellow", bg: "bg-yellow-50", border: "border-yellow-200", header: "from-yellow-400 to-yellow-500" },
  { name: "أزرق", value: "blue", bg: "bg-blue-50", border: "border-blue-200", header: "from-blue-400 to-blue-500" },
  { name: "أخضر", value: "green", bg: "bg-green-50", border: "border-green-200", header: "from-green-400 to-green-500" },
  { name: "أحمر", value: "red", bg: "bg-red-50", border: "border-red-200", header: "from-red-400 to-red-500" },
  { name: "بنفسجي", value: "purple", bg: "bg-purple-50", border: "border-purple-200", header: "from-purple-400 to-purple-500" },
];

export const TaskList = () => {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([
    {
      id: "1",
      title: "المهام الإدارية",
      color: "yellow",
      tasks: [
        { id: "1", title: "مراجعة فواتير الموردين", completed: false,   createdDate: "2024-01-15" },
        { id: "2", title: "تحديث أسعار البطاريات", completed: true,   createdDate: "2024-01-15" },
      ],
    },
    {
      id: "2",
      title: "المهام الفنية",
      color: "blue",
      tasks: [
        { id: "3", title: "جرد المخزن الشهري", completed: false,  createdDate: "2024-01-15" },
        { id: "4", title: "متابعة مديونيات العملاء", completed: false,   createdDate: "2024-01-15" },
      ],
    },
  ]);

  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("yellow");

  const addTaskGroup = () => {
    if (!newGroupTitle.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان المجموعة",
        variant: "destructive",
      });
      return;
    }

    const newGroup: TaskGroup = {
      id: Date.now().toString(),
      title: newGroupTitle.trim(),
      color: newGroupColor,
      tasks: [],
    };

    setTaskGroups((prev) => [...prev, newGroup]);
    setNewGroupTitle("");
    setNewGroupColor("yellow");
    toast({
      title: "تمت الإضافة",
      description: "تمت إضافة مجموعة المهام بنجاح",
    });
  };

  const addTaskToGroup = (groupId: string, taskTitle: string) => {
    if (!taskTitle.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان المهمة",
        variant: "destructive",
      });
      return;
    }

    setTaskGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              tasks: [
                ...group.tasks,
                {
                  id: Date.now().toString(),
                  title: taskTitle.trim(),
                  completed: false,
                  color: "bg-white",
                  createdDate: new Date().toISOString().split("T")[0],
                },
              ],
            }
          : group
      )
    );
  };

  const toggleTaskCompletion = (groupId: string, taskId: string) => {
    setTaskGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              tasks: group.tasks.map((task) =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
              ),
            }
          : group
      )
    );
  };

  const deleteTask = (groupId: string, taskId: string) => {
    setTaskGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, tasks: group.tasks.filter((task) => task.id !== taskId) }
          : group
      )
    );
  };

  const deleteTaskGroup = (groupId: string) => {
    setTaskGroups((prev) => prev.filter((group) => group.id !== groupId));
  };

  return (
    <div className="space-y-6">
      {/* Add New Task Group */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <CardTitle className="flex items-center gap-2 flex-row-reverse" style={{ fontFamily: "Tajawal, sans-serif" }}>
            <Plus className="w-5 h-5" />
            إضافة مجموعة مهام جديدة
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            <Input
              placeholder="أدخل عنوان مجموعة المهام"
              value={newGroupTitle}
              onChange={(e) => setNewGroupTitle(e.target.value)}
              style={{ fontFamily: "Tajawal, sans-serif" }}
            />
            <div className="flex gap-2">
              {groupColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setNewGroupColor(color.value)}
                  className={`w-6 h-6 rounded-full ${color.bg} border-2 ${
                    newGroupColor === color.value ? "border-gray-800" : "border-gray-300"
                  }`}
                  title={color.name}
                />
              ))}
            </div>
            <Button onClick={addTaskGroup} style={{ fontFamily: "Tajawal, sans-serif" }}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task Groups */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {taskGroups.map((group) => {
          const colorClasses = groupColors.find((color) => color.value === group.color) || groupColors[0];
          return (
            <Card key={group.id} className={`shadow-lg ${colorClasses.bg} ${colorClasses.border}`}>
              <CardHeader className={`bg-gradient-to-r ${colorClasses.header} text-white`}>
                <CardTitle className="flex items-center h-2 justify-between" style={{ fontFamily: "Tajawal, sans-serif" }}>
                  {group.title}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTaskGroup(group.id)}
                    title="حذف المجموعة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Add Task */}
                <div className="flex gap-2">
                  <Input
                    placeholder="أدخل عنوان المهمة"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addTaskToGroup(group.id, e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                    style={{ fontFamily: "Tajawal, sans-serif" }}
                  />
                  <Button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input && input.value.trim()) {
                        addTaskToGroup(group.id, input.value);
                        input.value = "";
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Task List */}
                <div>
                  {group.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`rounded-lg p-3 shadow-sm cursor-pointer ${task.completed ? "opacity-60" : ""}`}
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.47)" }}
                    onClick={() => toggleTaskCompletion(group.id, task.id)}
                  >
                    <div className="flex items-center h-3 justify-between">
                    <div className="flex text-sm items-center gap-2">
                      <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleTaskCompletion(group.id, task.id)}
                      onClick={e => e.stopPropagation()}
                      />
                      <span
                      className={`${
                        task.completed ? "line-through text-gray-500" : "text-gray-900"
                      }`}
                      style={{ fontFamily: "Tajawal, sans-serif" }}
                      >
                      {task.title}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 p-0 text-white bg-red-500"
                      onClick={e => {
                      e.stopPropagation();
                      deleteTask(group.id, task.id);
                      }}
                      title="حذف المهمة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    </div>
                  </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};