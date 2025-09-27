import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock, BarChart3, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimeSession {
  id: string;
  subject: string;
  category: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  description?: string;
}

interface TimerStats {
  totalTime: number;
  sessionsCount: number;
  averageSession: number;
  byCategory: Record<string, number>;
  byDay: Record<string, number>;
}

export default function TimerView() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [currentSession, setCurrentSession] = useState<Partial<TimeSession>>({
    subject: '',
    category: 'work',
    description: '',
  });
  const [showNewSession, setShowNewSession] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<Date>();

  // Load sessions from localStorage
  useEffect(() => {
    const savedSessions = localStorage.getItem('focusNote-timer');
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        startTime: new Date(session.startTime),
        endTime: session.endTime ? new Date(session.endTime) : undefined,
      }));
      setSessions(parsedSessions);
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Save sessions to localStorage
  const saveSessions = (updatedSessions: TimeSession[]) => {
    localStorage.setItem('focusNote-timer', JSON.stringify(updatedSessions));
    setSessions(updatedSessions);
  };

  const startTimer = () => {
    if (!currentSession.subject?.trim()) {
      setShowNewSession(true);
      return;
    }

    setIsRunning(true);
    startTimeRef.current = new Date();
    setCurrentTime(0);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const stopTimer = () => {
    if (!startTimeRef.current || !currentSession.subject) return;

    const endTime = new Date();
    const session: TimeSession = {
      id: crypto.randomUUID(),
      subject: currentSession.subject,
      category: currentSession.category || 'work',
      startTime: startTimeRef.current,
      endTime,
      duration: currentTime,
      description: currentSession.description,
    };

    saveSessions([session, ...sessions]);
    setIsRunning(false);
    setCurrentTime(0);
    setCurrentSession({ subject: '', category: 'work', description: '' });
    startTimeRef.current = undefined;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Calculate stats
  const getStats = (): TimerStats => {
    const now = new Date();
    let filteredSessions = sessions;

    switch (selectedPeriod) {
      case 'today':
        filteredSessions = sessions.filter(s => {
          const sessionDate = s.startTime.toDateString();
          return sessionDate === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredSessions = sessions.filter(s => s.startTime >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredSessions = sessions.filter(s => s.startTime >= monthAgo);
        break;
    }

    const totalTime = filteredSessions.reduce((sum, s) => sum + s.duration, 0);
    const byCategory = filteredSessions.reduce((acc, s) => {
      acc[s.category] = (acc[s.category] || 0) + s.duration;
      return acc;
    }, {} as Record<string, number>);

    const byDay = filteredSessions.reduce((acc, s) => {
      const day = s.startTime.toDateString();
      acc[day] = (acc[day] || 0) + s.duration;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTime,
      sessionsCount: filteredSessions.length,
      averageSession: filteredSessions.length > 0 ? totalTime / filteredSessions.length : 0,
      byCategory,
      byDay,
    };
  };

  const stats = getStats();
  const recentSessions = sessions.slice(0, 10);

  const categories = [
    { value: 'work', label: 'Work', color: 'bg-primary-glass text-primary' },
    { value: 'study', label: 'Study', color: 'bg-accent-glass text-accent' },
    { value: 'exercise', label: 'Exercise', color: 'bg-success-glass text-success' },
    { value: 'personal', label: 'Personal', color: 'bg-warning-glass text-warning' },
    { value: 'other', label: 'Other', color: 'bg-glass-secondary text-foreground-muted' },
  ];

  const getCategoryColor = (category: string) => {
    return categories.find(c => c.value === category)?.color || 'bg-glass-secondary text-foreground-muted';
  };

  return (
    <div className="space-y-6">
      {/* Timer Section */}
      <Card className="glass-card p-8 text-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="text-6xl font-mono font-bold text-gradient">
              {formatTime(currentTime)}
            </div>
            {currentSession.subject && (
              <p className="text-lg text-foreground-secondary">
                {currentSession.subject}
              </p>
            )}
            {isRunning && startTimeRef.current && (
              <p className="text-sm text-foreground-muted">
                Started at {startTimeRef.current.toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            {!isRunning ? (
              <Button
                onClick={startTimer}
                size="lg"
                className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-glass"
              >
                <Play className="w-5 h-5 mr-2" />
                Start
              </Button>
            ) : (
              <>
                <Button
                  onClick={pauseTimer}
                  size="lg"
                  variant="outline"
                  className="border-glass-border"
                >
                  <Pause className="w-5 h-5 mr-2" />
                  Pause
                </Button>
                <Button
                  onClick={stopTimer}
                  size="lg"
                  className="bg-error hover:bg-error text-white"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </Button>
              </>
            )}
          </div>

          {!currentSession.subject && (
            <Button
              onClick={() => setShowNewSession(true)}
              variant="ghost"
              className="text-foreground-muted"
            >
              <Plus className="w-4 h-4 mr-2" />
              Set up session details
            </Button>
          )}
        </div>
      </Card>

      {/* Session Setup */}
      {showNewSession && (
        <Card className="glass-card p-6 animate-slide-up">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Session Details</h3>
          <div className="space-y-4">
            <Input
              placeholder="What are you working on?"
              value={currentSession.subject || ''}
              onChange={(e) => setCurrentSession({ ...currentSession, subject: e.target.value })}
              className="bg-transparent border-glass-border"
            />

            <Select
              value={currentSession.category || 'work'}
              onValueChange={(value) => setCurrentSession({ ...currentSession, category: value })}
            >
              <SelectTrigger className="bg-transparent border-glass-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <textarea
              placeholder="Additional notes (optional)..."
              value={currentSession.description || ''}
              onChange={(e) => setCurrentSession({ ...currentSession, description: e.target.value })}
              className="w-full h-20 px-3 py-2 bg-transparent border border-glass-border rounded-md resize-none outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-foreground-muted"
            />

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowNewSession(false);
                  if (currentSession.subject?.trim()) {
                    startTimer();
                  }
                }}
                disabled={!currentSession.subject?.trim()}
                className="bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                Start Timer
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowNewSession(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-foreground-muted">Total Time</p>
              <p className="text-lg font-semibold text-foreground">
                {formatDuration(stats.totalTime)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-accent" />
            <div>
              <p className="text-sm text-foreground-muted">Sessions</p>
              <p className="text-lg font-semibold text-foreground">
                {stats.sessionsCount}
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-success" />
            <div>
              <p className="text-sm text-foreground-muted">Average</p>
              <p className="text-lg font-semibold text-foreground">
                {formatDuration(stats.averageSession)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="bg-transparent border-glass-border mb-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <div className="space-y-1">
            {Object.entries(stats.byCategory).map(([category, time]) => (
              <div key={category} className="flex justify-between text-sm">
                <span className="capitalize text-foreground-muted">{category}</span>
                <span className="text-foreground">{formatDuration(time)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Sessions */}
      <Card className="glass-card p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Recent Sessions</h3>
        {recentSessions.length > 0 ? (
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-lg bg-surface-hover"
              >
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 rounded-md text-xs ${getCategoryColor(session.category)}`}>
                    {session.category}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{session.subject}</p>
                    <p className="text-xs text-foreground-muted">
                      {session.startTime.toLocaleDateString()} at {session.startTime.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{formatDuration(session.duration)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
            <p className="text-foreground-muted">No sessions recorded yet</p>
          </div>
        )}
      </Card>
    </div>
  );
}