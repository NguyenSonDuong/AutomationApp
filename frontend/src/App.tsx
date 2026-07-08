import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import './App.css';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

const SERVER_URL = 'http://localhost:3000';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isApiHealthy, setIsApiHealthy] = useState(false);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  // 1. Fetch initial tasks and perform API health check
  const fetchTasksAndCheckHealth = async () => {
    try {
      // Check API health
      const healthRes = await fetch(`${SERVER_URL}/health`);
      if (healthRes.ok) {
        setIsApiHealthy(true);
      } else {
        setIsApiHealthy(false);
      }

      // Fetch Tasks
      const res = await fetch(`${SERVER_URL}/api/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('API Server connection error:', error);
      setIsApiHealthy(false);
    }
  };

  useEffect(() => {
    fetchTasksAndCheckHealth();

    // 2. Set up Socket.io client connection
    const socket = io(SERVER_URL);
    setSocketInstance(socket);

    socket.on('connect', () => {
      console.log('Socket.io connected successfully:', socket.id);
      setIsSocketConnected(true);
      setIsApiHealthy(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
      setIsSocketConnected(false);
    });

    // 3. Listen to real-time events broadcasted by Express server
    socket.on('task:created', (newTask: Task) => {
      setTasks((prevTasks) => {
        // Prevent duplicate tasks if already fetched
        if (prevTasks.some((t) => t.id === newTask.id)) return prevTasks;
        return [newTask, ...prevTasks];
      });
    });

    socket.on('task:updated', (updatedTask: Task) => {
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
    });

    // Run health check periodically
    const healthInterval = setInterval(() => {
      fetch(`${SERVER_URL}/health`)
        .then((res) => setIsApiHealthy(res.ok))
        .catch(() => setIsApiHealthy(false));
    }, 5000);

    // Clean up connections on unmount
    return () => {
      socket.disconnect();
      clearInterval(healthInterval);
    };
  }, []);

  // 4. Create Task
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const res = await fetch(`${SERVER_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (res.ok) {
        setTitle('');
        // We do not need to manually add the task here because it will
        // be pushed back through Socket.io ('task:created') and added.
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error}`);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  // 5. Toggle Task completion
  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/tasks/${id}/toggle`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error('Error toggling task:', errData.error);
      }
      // Triggers 'task:updated' via Socket.io to sync state
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Dashboard Task Automation</h1>
        <div className="status-badges">
          <div className={`badge ${isApiHealthy ? 'badge-connected' : 'badge-disconnected'}`}>
            <span className="status-dot"></span>
            API REST: {isApiHealthy ? 'Online' : 'Offline'}
          </div>
          <div className={`badge ${isSocketConnected ? 'badge-connected' : 'badge-disconnected'}`}>
            <span className="status-dot"></span>
            Socket.io: {isSocketConnected ? 'Connected' : 'Disconnected'}
          </div>
          <div className="badge badge-info">
            SQLite: Connected
          </div>
        </div>
      </header>

      <form className="task-form" onSubmit={handleSubmit}>
        <div className="task-input-wrapper">
          <input
            type="text"
            className="task-input"
            placeholder="Nhập nhiệm vụ mới cần xử lý..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-submit">
          Thêm Nhiệm Vụ
        </button>
      </form>

      <main className="tasks-container">
        {tasks.length === 0 ? (
          <div className="no-tasks">
            Chưa có nhiệm vụ nào được ghi nhận. Hãy bắt đầu tạo một nhiệm vụ mới!
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${task.completed ? 'task-item-completed' : ''}`}
              onClick={() => handleToggle(task.id)}
            >
              <div className="task-left">
                <div className="checkbox-container">
                  <div className="checkbox-custom"></div>
                </div>
                <div>
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    ID: {task.id} • {formatDate(task.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

export default App;
