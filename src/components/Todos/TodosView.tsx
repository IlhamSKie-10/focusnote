import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Calendar, CheckCircle2, Circle, Clock, Flag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Todo {
  id: string;
  title: string;
  description?: string;
  status: 'not-started' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  subtasks?: SubTask[];
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export default function TodosView() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    dueDate: '',
  });

  // Load todos from localStorage
  useEffect(() => {
    const savedTodos = localStorage.getItem('focusNote-todos');
    if (savedTodos) {
      const parsedTodos = JSON.parse(savedTodos).map((todo: any) => ({
        ...todo,
        createdAt: new Date(todo.createdAt),
        updatedAt: new Date(todo.updatedAt),
        dueDate: todo.dueDate ? new Date(todo.dueDate) : undefined,
      }));
      setTodos(parsedTodos);
    }
  }, []);

  // Save todos to localStorage
  const saveTodos = (updatedTodos: Todo[]) => {
    localStorage.setItem('focusNote-todos', JSON.stringify(updatedTodos));
    setTodos(updatedTodos);
  };

  // Filter and search todos
  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      todo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || todo.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Sort todos by priority and due date
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const statusOrder = { 'not-started': 3, 'in-progress': 2, completed: 1 };
    
    if (a.status !== b.status) {
      return statusOrder[b.status] - statusOrder[a.status];
    }
    
    if (a.priority !== b.priority) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    
    if (a.dueDate && b.dueDate) {
      return a.dueDate.getTime() - b.dueDate.getTime();
    }
    
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const createTodo = () => {
    if (!newTodo.title.trim()) return;

    const todo: Todo = {
      id: crypto.randomUUID(),
      title: newTodo.title.trim(),
      description: newTodo.description.trim(),
      status: 'not-started',
      priority: newTodo.priority,
      dueDate: newTodo.dueDate ? new Date(newTodo.dueDate) : undefined,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      subtasks: [],
    };

    saveTodos([todo, ...todos]);
    setNewTodo({ title: '', description: '', priority: 'medium', dueDate: '' });
    setIsCreating(false);
  };

  const updateTodoStatus = (todoId: string, status: Todo['status']) => {
    const updatedTodos = todos.map(todo =>
      todo.id === todoId 
        ? { ...todo, status, updatedAt: new Date() }
        : todo
    );
    saveTodos(updatedTodos);
  };

  const deleteTodo = (todoId: string) => {
    const updatedTodos = todos.filter(todo => todo.id !== todoId);
    saveTodos(updatedTodos);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-error-glass text-error border-error/20';
      case 'medium': return 'bg-warning-glass text-warning border-warning/20';
      case 'low': return 'bg-success-glass text-success border-success/20';
      default: return 'bg-glass-secondary text-foreground-muted';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'in-progress': return Clock;
      default: return Circle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success';
      case 'in-progress': return 'text-warning';
      default: return 'text-foreground-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">To-Do Lists</h2>
          <p className="text-foreground-muted">
            {todos.length} tasks • {todos.filter(t => t.status === 'completed').length} completed
          </p>
        </div>
        
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-glass"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-transparent border-glass-border"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40 bg-transparent border-glass-border">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-40 bg-transparent border-glass-border">
              <SelectValue placeholder="All Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Create New Task Form */}
      {isCreating && (
        <Card className="glass-card p-6 animate-slide-up">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Create New Task</h3>
          <div className="space-y-4">
            <Input
              placeholder="Task title..."
              value={newTodo.title}
              onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
              className="bg-transparent border-glass-border"
            />
            
            <textarea
              placeholder="Description (optional)..."
              value={newTodo.description}
              onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
              className="w-full h-20 px-3 py-2 bg-transparent border border-glass-border rounded-md resize-none outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-foreground-muted"
            />
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={newTodo.priority} onValueChange={(value: any) => setNewTodo({ ...newTodo, priority: value })}>
                <SelectTrigger className="bg-transparent border-glass-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                type="date"
                value={newTodo.dueDate}
                onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                className="bg-transparent border-glass-border"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={createTodo}
                disabled={!newTodo.title.trim()}
                className="bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                Create Task
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Tasks List */}
      <div className="space-y-3">
        {sortedTodos.map((todo) => {
          const StatusIcon = getStatusIcon(todo.status);
          return (
            <Card
              key={todo.id}
              className="glass-card p-4 hover:bg-surface-hover transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-1 h-auto ${getStatusColor(todo.status)}`}
                  onClick={() => {
                    const nextStatus = todo.status === 'not-started' 
                      ? 'in-progress' 
                      : todo.status === 'in-progress' 
                        ? 'completed' 
                        : 'not-started';
                    updateTodoStatus(todo.id, nextStatus);
                  }}
                >
                  <StatusIcon className="w-5 h-5" />
                </Button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium text-foreground ${todo.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p className="text-sm text-foreground-muted mt-1">
                          {todo.description}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTodo(todo.id)}
                      className="text-error hover:text-error p-1 h-auto ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className={getPriorityColor(todo.priority)}>
                      <Flag className="w-3 h-3 mr-1" />
                      {todo.priority}
                    </Badge>
                    
                    {todo.dueDate && (
                      <Badge variant="outline" className="text-foreground-muted border-glass-border">
                        <Calendar className="w-3 h-3 mr-1" />
                        {todo.dueDate.toLocaleDateString()}
                      </Badge>
                    )}
                    
                    <Badge variant="outline" className="text-foreground-muted border-glass-border">
                      {todo.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        
        {sortedTodos.length === 0 && (
          <Card className="glass-card p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' 
                ? 'No tasks found' 
                : 'No tasks yet'
              }
            </h3>
            <p className="text-foreground-muted">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first task to get started'
              }
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}