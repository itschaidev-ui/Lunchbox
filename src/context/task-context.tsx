
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Task } from '@/lib/types';

type TaskContextType = {
    tasks: Task[];
    addTask: (task: Omit<Task, 'id' | 'completed'>) => void;
    addMultipleTasks: (tasks: Omit<Task, 'id' | 'completed'>[]) => void;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    editTask: (id: string, updatedTask: Partial<Omit<Task, 'id' | 'completed'>>) => void;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
    const [tasks, setTasks] = useState<Task[]>([]);

    const addTask = (task: Omit<Task, 'id' | 'completed'>) => {
        const newTask: Task = {
            id: Date.now().toString(),
            ...task,
            completed: false,
        };
        setTasks(prev => [newTask, ...prev]);
    };
    
    const addMultipleTasks = (newTasks: Omit<Task, 'id' | 'completed'>[]) => {
        const tasksToAdd: Task[] = newTasks.map(task => ({
            id: `${Date.now()}-${Math.random()}`,
            ...task,
            completed: false,
        }));
        setTasks(prev => [...tasksToAdd, ...prev]);
    };

    const toggleTask = (id: string) => {
        setTasks(prev =>
            prev.map(task =>
                task.id === id ? { ...task, completed: !task.completed } : task
            )
        );
    };

    const deleteTask = (id: string) => {
        setTasks(prev => prev.filter(task => task.id !== id));
    };

    const editTask = (id: string, updatedTask: Partial<Omit<Task, 'id' | 'completed'>>) => {
        setTasks(prev => 
            prev.map(task => 
                task.id === id ? { ...task, ...updatedTask } : task
            )
        );
    };

    return (
        <TaskContext.Provider value={{ tasks, addTask, addMultipleTasks, toggleTask, deleteTask, editTask }}>
            {children}
        </TaskContext.Provider>
    );
}

export function useTasks() {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
}
