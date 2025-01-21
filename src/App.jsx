import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import logo from './adhdpadlogo.webp';
import { db } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import './App.css';

function HomeScreen() {
  const [openAIStatus, setOpenAIStatus] = React.useState(null);

  const testOpenAI = async () => {
    try {
      const result = await import('./ai-service').then(module => module.testOpenAIConnection());
      setOpenAIStatus(result);

      if (result.success) {
        alert(
          `Connection Successful!\n\n` +
          `Model: ${result.model}\n` +
          `Tokens Used: ${result.tokens.total}\n` +
          `(Prompt: ${result.tokens.prompt}, Completion: ${result.tokens.completion})\n\n` +
          `Proverb: ${result.proverb}`
        );
      } else {
        const errorMessage = `Connection Failed!\nError: ${result.error}`;
        alert(errorMessage);
        try {
          await navigator.clipboard.writeText(errorMessage);
        } catch (clipboardError) {
          console.error('Clipboard access denied:', clipboardError);
          alert('Note: Could not copy to clipboard. Please ensure clipboard permissions are enabled.');
        }
      }
    } catch (error) {
      const errorMessage = `Test Failed!\nError: ${error.message}`;
      alert(errorMessage);
      try {
        await navigator.clipboard.writeText(errorMessage);
      } catch (clipboardError) {
        console.error('Clipboard access denied:', clipboardError);
        alert('Note: Could not copy to clipboard. Please ensure clipboard permissions are enabled.');
      }
    }
  };

  return (
    <div className="container">
      <img src={logo} alt="ADHD Pad" className="logo" />
      <div className="domain-name">ADHDPad.com</div>
      <h1 className="title">Turn Your Ideas into Action</h1>
      <p className="subtitle">Capture, organize, and complete tasks with ADHD Pad</p>
      <button onClick={async () => {
        try {
          const aiService = await import('./ai-service');
          const [openaiResult, deepseekResult] = await Promise.all([
            aiService.testOpenAIConnection(),
            aiService.testDeepSeekConnection()
          ]);

          const results = `AI Model Test Results\n` +
            `------------------\n\n` +
            `OpenAI:\n` +
            `Status: ${openaiResult.success ? 'PASSED' : 'FAILED'}\n` +
            `Model: ${openaiResult.model}\n` +
            `Tokens Used: ${openaiResult.tokens.total} ` +
            `(Prompt: ${openaiResult.tokens.prompt}, Completion: ${openaiResult.tokens.completion})\n` +
            `Proverb: ${openaiResult.proverb}\n\n` +
            `DeepSeek:\n` +
            `Status: ${deepseekResult.success ? 'PASSED' : 'FAILED'}\n` +
            `Model: ${deepseekResult.model}\n` +
            `Tokens Used: ${deepseekResult.tokens.total} ` +
            `(Prompt: ${deepseekResult.tokens.prompt}, Completion: ${deepseekResult.tokens.completion})\n` +
            `Proverb: ${deepseekResult.proverb}`;

          alert(results);

          try {
            await navigator.clipboard.writeText(results);
            alert('Results copied to clipboard!');
          } catch (clipError) {
            console.error('Clipboard access denied:', clipError);
          }
        } catch (error) {
          alert(`Test Failed: ${error.message}`);
        }
      }} className="test-ai-button">
        Test AI Model Connections
      </button>
      <div className="buttonContainer">
        <Link to="/voice-recorder" className="button">
          <span className="buttonText">Voice Recorder</span>
        </Link>
        <Link to="/task-list" className="button">
          <span className="buttonText">Task List</span>
        </Link>
      </div>
    </div>
  );
}

function VoiceRecorderScreen() {
  const [isRecording, setIsRecording] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [audioURL, setAudioURL] = React.useState('');
  const [transcribedText, setTranscribedText] = React.useState('');
  const [savedTranscriptions, setSavedTranscriptions] = React.useState([]);
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [modalData, setModalData] = React.useState({ isOpen: false, title: '', summary: '', transcription: '' });

  const fetchTranscriptions = async () => {
    try {
      setIsLoading(true);
      const transcriptionsRef = collection(db, 'transcriptions');
      const q = query(transcriptionsRef, orderBy('timestamp', 'desc')); // Add timestamp field and sort by it
      const querySnapshot = await getDocs(q);
      const transcriptionsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedTranscriptions(transcriptionsList);
    } catch (error) {
      setError('Error fetching transcriptions: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTranscriptions();
  }, []);

  const clearAll = async () => {
    if (window.confirm('Are you sure you want to delete all transcriptions and tasks? This cannot be undone.')) {
      try {
        const transcriptionsSnapshot = await getDocs(collection(db, 'transcriptions'));
        const tasksSnapshot = await getDocs(collection(db, 'tasks'));

        // Delete all transcriptions
        const transcriptionDeletes = transcriptionsSnapshot.docs.map(doc => 
          deleteDoc(doc.ref)
        );

        // Delete all tasks
        const taskDeletes = tasksSnapshot.docs.map(doc => 
          deleteDoc(doc.ref)
        );

        await Promise.all([...transcriptionDeletes, ...taskDeletes]);
        setSavedTranscriptions([]);
        alert('All transcriptions and tasks have been cleared!');
      } catch (error) {
        console.error("Error clearing data:", error);
        alert('Error clearing data. Please try again.');
      }
    }
  };

  const mediaRecorder = React.useRef(null);
  const audioChunks = React.useRef([]);
  const recognition = React.useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        audioChunks.current = [];
      };

      mediaRecorder.current.start();
      setIsRecording(true);

      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
          recognition.current = new SpeechRecognition();
          recognition.current.continuous = true;
          recognition.current.interimResults = true;
          recognition.current.lang = 'en-US';

          recognition.current.onstart = () => {
            console.log('Speech recognition started');
          };

          recognition.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setTranscribedText(prev => prev + `\nError: ${event.error}. Please try again.`);
            if (event.error === 'network') {
              setTranscribedText(prev => prev + '\nPlease check your internet connection.');
            } else if (event.error === 'audio-capture') {
              setTranscribedText(prev => prev + '\nNo microphone was found or permission was denied.');
            }
            stopRecording();
          };

          recognition.current.onend = () => {
            console.log('Speech recognition ended');
          };

          recognition.current.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            setTranscribedText(prev => prev + ' ' + transcript);
          };

          recognition.current.start();
        }
      } catch (speechError) {
        console.error('Speech recognition error:', speechError);
      }
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Error accessing microphone. Please ensure you've granted permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      if (recognition.current) {
        recognition.current.stop();
      }
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const saveTranscription = async () => {
    if (!transcribedText.trim()) {
      setError("Please record some text before saving.");
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      const aiResult = await generateTitleAndSummary(transcribedText);
      const title = aiResult?.title || transcribedText.split('.')[0];
      const description = aiResult?.summary || transcribedText.substring(0, 100);
      
      if (!db) {
        throw new Error("Firebase database is not initialized");
      }

      const transcriptionsRef = collection(db, 'transcriptions');
      await addDoc(transcriptionsRef, {
        title,
        description,
        text: transcribedText,
        timestamp: new Date().toISOString() // Add timestamp
      });

      // Clear the form
      setTranscribedText('');
      setAudioURL('');
      
      // Refresh the list
      await fetchTranscriptions();
      
    } catch (error) {
      console.error("Error saving transcription:", error);
      setError("Failed to save transcription: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container">
      <Link to="/" className="back-button">← Back</Link>
      <div className="header-container">
        <h1 className="title">Voice Recorder</h1>
        <button onClick={clearAll} className="clear-all-button">Clear All Data</button>
      </div>
      <div className="recorder-controls">
        {!isRecording ? (
          <button className="button" onClick={startRecording}>
            Start Recording
          </button>
        ) : (
          <button className="button recording" onClick={stopRecording}>
            Stop Recording
          </button>
        )}
        {audioURL && (
          <div className="audio-player">
            <audio controls src={audioURL} />
          </div>
        )}
        <div className="transcription">
          <h3>Transcription:</h3>
          <p>{transcribedText || "Transcription will appear here when you record and speak..."}</p>
          {error && <div className="error-message">{error}</div>}
          <button 
            className="button" 
            onClick={saveTranscription} 
            disabled={!transcribedText.trim() || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Transcription'}
          </button>
          <button 
            className="button"
            onClick={async () => {
              if (!transcribedText.trim()) {
                setError("Please record some text first");
                return;
              }
              try {
                setIsLoading(true);
                const result = await generateTitleAndSummary(transcribedText);
                alert(`Generated Title: ${result.title}\n\nSummary: ${result.summary}`);
              } catch (error) {
                setError("Failed to generate title and summary");
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={!transcribedText.trim() || isLoading}
          >
            Test AI Title Generation
          </button>
        </div>
        <div className="saved-transcriptions">
          <h3>Saved Transcriptions</h3>
          {isLoading && <div className="loading-indicator">Loading transcriptions...</div>}
          {savedTranscriptions.map(item => (
            <div key={item.id} className="transcription-item">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
              <small>{item.timestamp}</small>
              <button 
                className="convert-task-button"
                onClick={async () => {
                  try {
                    const aiResult = await generateTitleAndSummary(item.text);
                    const title = aiResult?.title || (item.text.split('.')[0].length > 50 ? 
                      item.text.split('.')[0].substring(0, 50) + '...' : 
                      item.text.split('.')[0]);
                    const description = aiResult?.summary || item.text.substring(0, 100);

                    const newTask = {
                      title,
                      description,
                      text: item.text,
                      completed: false,
                      createdAt: new Date().toLocaleString()
                    };

                    // Delete from transcriptions first
                    const transcriptionsRef = collection(db, 'transcriptions');
                    await deleteDoc(doc(transcriptionsRef, item.id));

                    // Update local state immediately
                    setSavedTranscriptions(prevTranscriptions => 
                      prevTranscriptions.filter(t => t.id !== item.id)
                    );

                    // Then add to tasks
                    await addDoc(collection(db, 'tasks'), newTask);
                    alert('Task created and moved to Task List!');
                  } catch (error) {
                    console.error("Error converting task:", error);
                    alert('Error creating task. Please try again.');
                  }
                }}
              >
                Convert to Task
              </button>
            </div>
          ))}
        </div>
      </div>
      <AIResultModal 
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ ...modalData, isOpen: false })}
        title={modalData.title}
        summary={modalData.summary}
        transcription={modalData.transcription}
        model={modalData.model}
        success={modalData.success}
        tokens={modalData.tokens}
      />
    </div>
  );
}

function TaskListScreen() {
  const [tasks, setTasks] = React.useState([]);
  const [newTask, setNewTask] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState({ show: false, taskId: null });

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, orderBy('createdAt', 'desc')); // Sort by creation time, newest first
      const querySnapshot = await getDocs(q);
      const tasksList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksList);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTasks();
  }, []);

  const generateJulianId = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const day = Math.floor(diff / oneDay);
    const time = now.getHours().toString().padStart(2, '0') + 
                 now.getMinutes().toString().padStart(2, '0') +
                 now.getSeconds().toString().padStart(2, '0');
    return `${now.getFullYear()}${day.toString().padStart(3, '0')}${time}`;
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (newTask.trim()) {
      try {
        setIsSaving(true);
        const aiResults = await generateTitleAndSummary(newTask);
        const title = aiResults.title || newTask.substring(0, 50);
        const description = aiResults.summary || newTask;
        const timestamp = new Date().toISOString();

        const taskRef = await addDoc(collection(db, 'tasks'), {
          julianId: generateJulianId(),
          title,
          description,
          text: newTask,
          completed: false,
          urgent: false,
          createdAt: timestamp
        });

        // Clear the input
        setNewTask('');
        
        // Refresh the task list to show the new task
        await fetchTasks();
        
      } catch (error) {
        console.error("Error adding task:", error);
        alert("Failed to add task. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const toggleTask = async (taskId) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      const task = tasks.find(t => t.id === taskId);
      await updateDoc(taskRef, {
        completed: !task.completed
      });
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ));
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const confirmDelete = async () => {
    await deleteTask(deleteConfirmation.taskId);
    setDeleteConfirmation({ show: false, taskId: null });
  };

  const filteredTasks = tasks.filter(task => 
    task.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container">
      <Link to="/" className="back-button">← Back</Link>
      <h1 className="title">Task List</h1>
      <div className="task-container">
        <div className="task-controls">
          <select 
            onChange={(e) => {
              const tasks = [...filteredTasks];
              if (e.target.value === 'urgent') {
                tasks.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
              } else if (e.target.value === 'newest') {
                tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              }
              setTasks(tasks);
            }}
            className="sort-select"
          >
            <option value="newest">Sort by Newest</option>
            <option value="urgent">Sort by Urgent</option>
          </select>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks..."
          className="task-input"
          style={{ marginBottom: '10px' }}
        />
        <form onSubmit={addTask} className="task-form">
          <textarea
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Enter a new task..."
            className="task-input"
            rows="3"
            disabled={isSaving}
          />
          <button 
            type="submit" 
            className="button"
            disabled={!newTask.trim() || isSaving}
          >
            {isSaving ? 'Adding Task...' : 'Add Task'}
          </button>
        </form>
        {isLoading && (
          <div className="loading-indicator">
            Loading tasks...
          </div>
        )}
        {isSaving && (
          <div className="saving-indicator">
            Processing and saving task...
          </div>
        )}
        <div className="task-list">
          {filteredTasks.map(task => (
            <div 
              key={task.id} 
              className={`task-item ${task.completed ? 'completed' : ''} ${task.urgent ? 'urgent' : ''}`}
              onMouseLeave={(e) => {
                const descriptionElement = e.currentTarget.querySelector('.task-description');
                if (descriptionElement) {
                  descriptionElement.scrollTop = 0;
                }
              }}
            >
              <div className="task-header-actions">
                <button 
                  onClick={() => {
                    const taskDetails = `Task ID: ${task.julianId}\nTitle: ${task.title}\nDescription: ${task.description}`;
                    navigator.clipboard.writeText(taskDetails);
                  }}
                >
                  📋
                </button>
                <button 
                  onClick={() => {
                    const taskDetails = `Task ID: ${task.julianId}\nTitle: ${task.title}\nDescription: ${task.description}`;
                    const mailtoLink = `mailto:?subject=Task Details - ${task.title}&body=${encodeURIComponent(taskDetails)}`;
                    window.location.href = mailtoLink;
                  }}
                >
                  📧
                </button>
              </div>
              <div className="task-content">
                <div className="task-subtitle-container">
                  <textarea
                    className="task-subtitle"
                    value={task.title || ''}
                    placeholder="Enter subtitle..."
                    onChange={async (e) => {
                      const newSubtitle = e.target.value;
                      const taskRef = doc(db, 'tasks', task.id);
                      await updateDoc(taskRef, { subtitle: newSubtitle });
                      setTasks(tasks.map(t => 
                        t.id === task.id ? { ...t, subtitle: newSubtitle } : t
                      ));
                    }}
                  />
                </div>
                <div className="task-description">{task.description}</div>
              </div>
              <div className="task-content">
                <div className="task-id">ID: {task.julianId}</div>
                
                {task.expanded && (
                  <>
                    <textarea
                      className="task-full-text-input"
                      value={task.text}
                      onChange={async (e) => {
                        const newText = e.target.value;
                        const taskRef = doc(db, 'tasks', task.id);
                        await updateDoc(taskRef, { text: newText });
                        setTasks(tasks.map(t => 
                          t.id === task.id ? { ...t, text: newText } : t
                        ));
                      }}
                    />
                    <small>{task.createdAt}</small>
                  </>
                )}
                <div className="button-group">
                  <button 
                    className="expand-button"
                    onClick={() => {
                      const updatedTasks = tasks.map(t => 
                        t.id === task.id ? { ...t, expanded: !t.expanded } : t
                      );
                      setTasks(updatedTasks);
                    }}
                  >
                    {task.expanded ? 'Collapse' : 'Expand'}
                  </button>
                  {task.expanded && (
                    <button 
                      className="ai-assist-button"
                      onClick={() => {
                        alert('AI Assist: This feature will help break down your idea into actionable tasks. Coming soon!');
                      }}
                    >
                      🤖 AI Assist
                    </button>
                  )}
                </div>
              </div>
              <div 
                className="task-menu-dots"
                onClick={(e) => {
                  e.stopPropagation();
                  setTasks(tasks.map(t => 
                    t.id === task.id ? { ...t, menuOpen: !t.menuOpen } : { ...t, menuOpen: false }
                  ));
                }}
              >
                ⋮
              </div>
              {task.menuOpen && (
                <div className="task-menu">
                  <button onClick={() => toggleTask(task.id)}>
                    {task.completed ? '↩️ Mark Incomplete' : '✓ Mark Complete'}
                  </button>
                  <button onClick={async () => {
                    const taskRef = doc(db, 'tasks', task.id);
                    await updateDoc(taskRef, { urgent: !task.urgent });
                    setTasks(tasks.map(t => 
                      t.id === task.id ? { ...t, urgent: !task.urgent, menuOpen: false } : t
                    ));
                  }}>
                    {task.urgent ? '📅 Remove Urgent' : '🚨 Mark Urgent'}
                  </button>
                  <button onClick={() => {
                    setDeleteConfirmation({ show: true, taskId: task.id });
                  }}>
                    🗑️ Delete
                  </button>
                </div>
              )}
              <div className="task-actions-wrapper">
                <div className="task-actions">
                  <button 
                    onClick={async () => {
                      const taskRef = doc(db, 'tasks', task.id);
                      await updateDoc(taskRef, { urgent: !task.urgent });
                      setTasks(tasks.map(t => 
                        t.id === task.id ? { ...t, urgent: !t.urgent } : t
                      ));
                    }} 
                    className={`urgent-button ${task.urgent ? 'active' : ''}`}
                  >
                    Urgent
                  </button>
                  <button onClick={() => setDeleteConfirmation({ show: true, taskId: task.id })} className="delete-button">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {deleteConfirmation.show && (
        <div className="confirmation-dialog">
          <div className="confirmation-content">
            <p>Are you sure you want to delete this task?</p>
            <div className="confirmation-actions">
              <button onClick={confirmDelete} className="confirm-btn">Delete</button>
              <button 
                onClick={() => setDeleteConfirmation({ show: false, taskId: null })} 
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/voice-recorder" element={<VoiceRecorderScreen />} />
        <Route path="/task-list" element={<TaskListScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

function AIResultModal({ isOpen, onClose, title = '', summary = '', transcription = '', model = 'GPT-3.5', success = false, tokens = {total: 0} }) {
  if (!isOpen) return null;

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${type} copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const copyAllResults = async () => {
    const allContent = `
AI Generated Results
------------------
Model Used: ${model}
AI Processing: ${success ? 'Successful' : 'Failed'}
Tokens Used: ${tokens.total}

Title:
${title}

Summary:
${summary}

Full Transcription:
${transcription}
    `.trim();

    try {
      await navigator.clipboard.writeText(allContent);
      alert('All results copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">AI Generated Results</h2>
        <div className="modal-info">
          <div className="ai-status">
            <p className="model-info">Model Used: {model}</p>
            <p className="model-info">AI Processing: {success ? 'Successful' : 'Failed'}</p>
            <p className="token-info">Tokens Used: {tokens.total}</p>
          </div>
          <button className="copy-all-button" onClick={copyAllResults}>
            Copy All Results
          </button>
          <p className="encouraging-message">
            You've got a great idea here!  This is a fantastic start. Keep up the amazing work!
          </p>
        </div>
        <div className="modal-section">
          <div className="section-header">
            <h3>Generated Title</h3>
            <button 
              className="copy-button"
              onClick={() => copyToClipboard(title, 'Title')}
            >
              Copy
            </button>
          </div>
          <p className="result-text">{title}</p>
        </div>
        <div className="modal-section">
          <div className="section-header">
            <h3>AI Summary</h3>
            <button 
              className="copy-button"
              onClick={() => copyToClipboard(summary, 'Summary')}
            >
              Copy
            </button>
          </div>
          <p className="result-text">{summary}</p>
        </div>
        <div className="modal-section">
          <div className="section-header">
            <h3>Full Transcription</h3>
            <button 
              className="copy-button"
              onClick={() => copyToClipboard(transcription, 'Transcription')}
            >
              Copy
            </button>
          </div>
          <p className="result-text">{transcription}</p>
        </div>
        <button className="close-button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

async function generateTitleAndSummary(text) {
  try {
    // Enhanced cleanup for speech recognition text
    const cleanedText = text
      .split(/\s+/)
      // Remove consecutive duplicate words and phrases
      .reduce((acc, word, index, array) => {
        const prevThreeWords = acc.slice(-3).join(' ');
        const nextThreeWords = array.slice(index, index + 3).join(' ');

        // Skip if word is part of a repeated phrase
        if (prevThreeWords.includes(nextThreeWords) && nextThreeWords.length > 5) {
          return acc;
        }

        // Skip consecutive duplicate words
        if (acc[acc.length - 1] === word) {
          return acc;
        }

        return [...acc, word];
      }, [])
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    const result = await import('./ai-service').then(module => 
      module.generateTitleAndSummary(cleanedText)
    );
    return result;
  } catch (error) {
    console.error('Error generating title and summary:', error);
    // Fallback to basic title/summary if AI fails
    return {
      title: text.split('.')[0],
      summary: text.substring(0, 100)
    };
  }
}