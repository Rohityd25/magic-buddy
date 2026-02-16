import React, { useState, useEffect } from 'react';
import { Mic, Volume2, Play, Image as ImageIcon, Sparkles } from 'lucide-react';
import { initializeOpenAI, analyzeImageAndStart, continueConversation, mockAnalyzeImageAndStart, mockContinueConversation, type ChatMessage } from './lib/openai';
import { useSpeech } from './hooks/useSpeech';
import { convertFileToBase64, fetchImageAsBase64 } from './utils/image';
import './App.css';

type AppState = 'IDLE' | 'ANALYZING' | 'SPEAKING' | 'LISTENING' | 'THINKING' | 'ERROR';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [imageSrc, setImageSrc] = useState('/dino.svg');
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [lastAIResponse, setLastAIResponse] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#f0f9ff'); // Default light blue
  const [isDemoMode, setIsDemoMode] = useState(false);

  const { isListening, speak, startListening, transcript, stopListening, isSupported } = useSpeech();

  // Load API key from local storage
  useEffect(() => {
    const storedKey = localStorage.getItem('openai_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setHasKey(true);
      initializeOpenAI(storedKey);
    }
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim().startsWith('sk-')) {
      localStorage.setItem('openai_api_key', apiKey);
      initializeOpenAI(apiKey);
      setHasKey(true);
    } else {
      alert('Please enter a valid OpenAI API Key starting with sk-');
    }
  };

  const handleResetKey = () => {
    localStorage.removeItem('openai_api_key');
    setApiKey('');
    setHasKey(false);
    setAppState('IDLE');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const base64 = await convertFileToBase64(e.target.files[0]);
      setImageSrc(base64);
      setAppState('IDLE');
      setHistory([]);
      setLastAIResponse('');
    }
  };

  const startConversation = async (forceDemo = false) => {
    if (!hasKey && !forceDemo) return;

    // Activating demo mode if forced or if we are already in demo mode
    const useDemo = forceDemo || isDemoMode;
    if (forceDemo) setIsDemoMode(true);

    setAppState('ANALYZING');
    try {
      // If image is relative path (like /dino.svg), fetch and convert first
      let base64 = imageSrc;
      if (!imageSrc.startsWith('data:') && !useDemo) {
        base64 = await fetchImageAsBase64(imageSrc);
      }

      let result;
      if (useDemo) {
        result = await mockAnalyzeImageAndStart();
      } else {
        result = await analyzeImageAndStart(base64);
      }

      const { text, toolCall, initialUserMessage } = result;
      setLastAIResponse(text);
      setHistory([initialUserMessage, { role: 'assistant', content: text }]);

      if (toolCall) setBackgroundColor(toolCall.color);

      setAppState('SPEAKING');
      speak(text, () => {
        handleAIBlueSpeechEnd();
      });
    } catch (error: any) {
      console.error("Analysis failed", error);
      setLastAIResponse(error.message || "Unknown error occurred");
      setAppState('ERROR');
    }
  };

  const handleAIBlueSpeechEnd = () => {
    setAppState('LISTENING');
    startListening();
  };

  // Effect to handle user speech end
  useEffect(() => {
    if (!isListening && appState === 'LISTENING') {
      // User stopped speaking. Check transcript.
      if (transcript.trim().length > 0) {
        handleUserResponse(transcript);
      } else {
        // Silence or no speech detected? Maybe prompt again or just stop?
        // For a robust demo, let's just go back to IDLE or wait for manual trigger.
        // But requirement is "sustain conversation".
        // Let's retry listening once or show "I didn't hear you".
        // For simplicity: stick to state. Maybe wait for user to click "Speak" if silent?
        // Let's auto-transition to thinking if we have something, else stay listing?
        // Actually, `useSpeech` sets isListening to false on end.
        // If transcript is empty, maybe the user cancelled.
      }
    }
  }, [isListening, appState, transcript]);

  const handleUserResponse = async (userText: string) => {
    setAppState('THINKING');
    const newHistory = [...history, { role: 'user', content: userText } as ChatMessage];
    setHistory(newHistory);

    try {
      let result;
      if (isDemoMode) {
        result = await mockContinueConversation(newHistory);
      } else {
        result = await continueConversation(newHistory);
      }

      const { text, toolCall } = result;
      setLastAIResponse(text);
      setHistory([...newHistory, { role: 'assistant', content: text }]);

      if (toolCall) setBackgroundColor(toolCall.color);

      setAppState('SPEAKING');
      speak(text, () => {
        handleAIBlueSpeechEnd();
      });
    } catch (error: any) {
      console.error("Conversation failed", error);
      setLastAIResponse(error.message || "Unknown error occurred");
      setAppState('ERROR');
    }
  };

  // Manual Intervention
  const handleMicClick = () => {
    if (appState === 'IDLE' || appState === 'SPEAKING') return;
    if (isListening) {
      stopListening();
    } else {
      setAppState('LISTENING');
      startListening();
    }
  };

  return (
    <div className="app-container" style={{ backgroundColor: backgroundColor, transition: 'background-color 1s ease' }}>
      <header className="header">
        <h1>✨ Magic Buddy ✨</h1>
        {!hasKey && (
          <div className="api-key-input">
            <input
              type="password"
              placeholder="Enter OpenAI API Key (sk-...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button onClick={handleSaveKey}>Save Key</button>
          </div>
        )}
        {hasKey && (
          <button onClick={handleResetKey} className="upload-btn" style={{ fontSize: '0.8rem', padding: '5px 10px' }}>
            Change API Key
          </button>
        )}
        {!isSupported && (
          <div style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>
            Your browser doesn't support Speech Recognition. Please use Chrome, Edge, or Safari.
          </div>
        )}
      </header>

      <main className="main-content">
        <div className="image-wrapper">
          <img src={imageSrc} alt="Conversation Topic" className="main-image" />

          {appState === 'IDLE' && (
            <div className="overlay">
              <button onClick={() => startConversation(false)} className="start-btn" disabled={!hasKey}>
                <Play size={32} /> Start Adventure!
              </button>
              {!hasKey && (
                <button onClick={() => startConversation(true)} className="upload-btn" style={{ marginTop: '10px', background: '#e0f7fa', color: '#006064', border: 'none' }}>
                  🚀 Try Demo Mode
                </button>
              )}
              <label className="upload-btn">
                <ImageIcon size={20} /> Change Image
                <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
              </label>
            </div>
          )}

          {appState === 'ANALYZING' && (
            <div className="overlay status-overlay">
              <Sparkles className="animate-spin" size={48} />
              <p>Looking closely...</p>
            </div>
          )}

          {appState === 'THINKING' && (
            <div className="overlay status-overlay">
              <div className="thinking-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}

          {appState === 'ERROR' && (
            <div className="overlay status-overlay error-mode">
              <div className="error-content">
                <span className="error-icon">🤕</span>
                <p className="error-title">Ouch! A Booboo Occurred.</p>
                <p className="error-detail">{lastAIResponse || "Something went wrong with the magic connection."}</p>
                <button onClick={() => setAppState('IDLE')} className="retry-btn">
                  Try Again
                </button>
                <div style={{ marginTop: '15px' }}>
                  <button onClick={() => { setAppState('IDLE'); startConversation(true); }} style={{ background: 'none', border: 'none', color: '#666', textDecoration: 'underline', cursor: 'pointer' }}>
                    Or try disconnected Demo Mode
                  </button>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <button onClick={handleResetKey} style={{ background: 'none', border: 'none', color: '#FF6B6B', fontSize: '0.9rem', cursor: 'pointer' }}>
                    (Change My API Key)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="interaction-area">
          <div className={`status-indicator ${appState.toLowerCase()}`}>
            {appState === 'SPEAKING' && <Volume2 size={48} className="pulse" />}
            {appState === 'LISTENING' && <Mic size={48} className="pulse-red" onClick={handleMicClick} style={{ cursor: 'pointer' }} />}
          </div>

          <div className="dialogue-box">
            <p className="ai-text">{lastAIResponse || "Ready to play?"}</p>
            {transcript && <p className="user-transcript">You: {transcript}</p>}

            {appState === 'LISTENING' && (
              <div style={{ marginTop: '15px', width: '100%', display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Or type here if mic isn't working..."
                  style={{ flex: 1, padding: '10px', borderRadius: '15px', border: '1px solid #ddd' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUserResponse((e.target as HTMLInputElement).value);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
