import { useState } from 'react';
import { Sparkles, Briefcase, CheckCircle2, AlertCircle, Terminal } from 'lucide-react';
import './index.css';

function App() {
  const [jobTitle, setJobTitle] = useState('Customer Success Manager');
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Configuration: Reads from .env.local or the constant below
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_API_KEY_HERE';


  const generateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobTitle.trim()) {
      setError('A valid job designation is required.');
      return;
    }
    
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
      setError('Service connection error. Please verify the application configuration.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setQuestions([]);

    try {
      const prompt = `Generate exactly 3 professional and thoughtful interview questions for a candidate applying for the role of "${jobTitle}". 
      Focus on assessing behavioral competency and role-specific expertise.
      Return the output strictly as a JSON array of strings. No extra text or markdown.
      Example: ["Question 1", "Question 2", "Question 3"]`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY.trim()}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.6 }
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message || `API Error: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const cleanJson = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (Array.isArray(parsed)) {
        setQuestions(parsed.slice(0, 3));
      } else {
        throw new Error('Unexpected response format.');
      }

    } catch (err: any) {
      setError(err.message || 'The system encountered an error. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="header-title">Reems</h1>
        <p className="header-subtitle">
          Advanced AI analysis for generating high-impact interview assessments.
        </p>
      </header>

      <main className="main-card">
        <form onSubmit={generateQuestions}>
          <div className="form-group">
            <label className="label-text">
              <Terminal size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Candidate Designation
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g., Lead Product Designer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? <div className="loader"></div> : <><Sparkles size={18} /> Run Analysis</>}
          </button>
        </form>

        {error && (
          <div className="alert-box">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {!isLoading && questions.length > 0 && (
          <div className="results-section">
            <h3 className="results-title">
              <CheckCircle2 size={20} color="var(--success-color)" />
              Assessment Protocol
            </h3>
            <div className="questions-stack">
              {questions.map((q, i) => (
                <div key={i} className="question-item">
                  <div className="question-marker">{i + 1}</div>
                  <div className="question-text">{q}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
