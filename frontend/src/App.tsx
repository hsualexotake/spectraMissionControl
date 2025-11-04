import { useState } from 'react'
import './App.css'

function App() {
  const [inputText, setInputText] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to summarize')
      return
    }

    setLoading(true)
    setError('')
    setSummary('')

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputText }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to summarize text')
      }

      setSummary(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <h1>Text Summarization Demo</h1>
      <p className="subtitle">Using LangChain + OpenAI</p>

      <div className="container">
        <div className="input-section">
          <label htmlFor="input-text">Enter text to summarize:</label>
          <textarea
            id="input-text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste or type text here..."
            rows={8}
          />
        </div>

        <button
          onClick={handleSummarize}
          disabled={loading || !inputText.trim()}
          className="summarize-btn"
        >
          {loading ? 'Summarizing...' : 'Summarize'}
        </button>

        {error && (
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {summary && (
          <div className="output-section">
            <label>Summary:</label>
            <div className="summary-box">
              {summary}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
