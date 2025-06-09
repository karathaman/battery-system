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

interface TaskGroup {
  id: string;
  title: string;
  tasks: Task[];
}

export const TaskList = () => {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([
    {
      id: "1",
      title: "المهام الإدارية",
      tasks: [
        { id: "1", title: "مراجعة فواتير الموردين", completed: false },
        { id: "2", title: "تحديث أسعار البطاريات", completed: true },
      ],
    },
    {
      id: "2",
      title: "المهام الفنية",
      tasks: [
        { id: "3", title: "جرد المخزن الشهري", completed: false },
        { id: "4", title: "متابعة مديونيات العملاء", completed: false },
      ],
    },
  ]);

  const [newTaskGroupTitle, setNewTaskGroupTitle] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");

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

    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
    };

    setTaskGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, tasks: [...group.tasks, task] }
          : group
      )
    );
    setNewTaskTitle("");
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
            ? { ...task, completed: !task.completed }
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

  const completedTasks = taskGroups.reduce(
    (total, group) => total + group.tasks.filter((task) => task.completed).length,
    0
  );
  const totalTasks = taskGroups.reduce(
    (total, group) => total + group.tasks.length,
    0
  );

  return (
    <div>
      {/* إضافة مجموعة جديدة */}
      <div className="flex gap-2 mb-6">
        <Input
          placeholder="أدخل عنوان مجموعة المهام"
          value={newTaskGroupTitle}
          onChange={(e) => setNewTaskGroupTitle(e.target.value)}
        />
        <Button onClick={addTaskGroup}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* عرض المجموعات والمهام في شبكة (Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {taskGroups.map((group) => (
          <Card key={group.id} className="mb-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {group.title}
                {group.tasks.length > 0 && (
                  <span className="text-sm text-gray-500">
                    ({group.tasks.filter((task) => task.completed).length}/
                    {group.tasks.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* إضافة مهمة جديدة */}
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="أدخل عنوان المهمة"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addTaskToGroup(group.id)}
                />
                <Button onClick={() => addTaskToGroup(group.id)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* عرض المهام داخل المجموعة */}
              <div>
                {group.tasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">لا توجد مهام</p>
                ) : (
                  group.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between mb-2 p-3 border rounded-lg ${
                        task.completed ? "bg-gray-50" : "bg-white"
                      }`}
                    >
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
                        >
                          {task.title}
                        </span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteTask(group.id, task.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
