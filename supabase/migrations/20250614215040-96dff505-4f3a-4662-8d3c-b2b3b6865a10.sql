
-- Add color column to task_groups table
ALTER TABLE public.task_groups ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT 'yellow';

-- Also need to add task_group_id column to tasks table for proper relationship
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_group_id UUID REFERENCES public.task_groups(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_task_group_id ON public.tasks(task_group_id);
