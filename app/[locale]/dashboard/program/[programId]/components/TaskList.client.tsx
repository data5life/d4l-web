'use client';

import TaskListButton from './TaskListButton.client';
import { useTranslations } from 'next-intl';
import ListCard from '@/components/ListCard.client';
import { useProgramDashboard } from '@/components/ProgramDashboardProvider';

export default function TaskList() {
  const t = useTranslations('program');
  const common = useTranslations('common');
  const { state, allTasks } = useProgramDashboard();
  const data = state.data;

  const title = t('availableTasks');
  if (data.status === 'loading' || data.status === 'error') {
    return <ListCard title={title} isLoading />;
  }

  const tasks = allTasks?.filter(
    (task) => task.type !== 'unsupported' && task.taskAccess.status !== 'hidden',
  );
  const error = tasks === undefined ? common('genericError') : null;

  if (error) {
    return <ListCard title={title} error={error} />;
  }

  return (
    <ListCard title={title}>
      {tasks!.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-500">{t('noTasks')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks!.map((task) => (
            <TaskListButton key={task.id} task={task}></TaskListButton>
          ))}
        </div>
      )}
    </ListCard>
  );
}
