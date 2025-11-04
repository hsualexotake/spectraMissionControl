import { useState } from 'react'
import './App.css'

interface ParseResult {
  filename: string
  data: {
    mission_id: string
    requested_port: string
    start_time: string
    end_time: string
    team: string
    refueling_required: boolean
  }
}

function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [parseResults, setParseResults] = useState<ParseResult[]>([])
  const [parseLoading, setParseLoading] = useState(false)
  const [parseError, setParseError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setSelectedFiles(Array.from(files))
      setParseError('')
      setParseResults([])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleParse = async () => {
    if (selectedFiles.length === 0) {
      setParseError('Please select at least one file to parse')
      return
    }

    setParseLoading(true)
    setParseError('')
    setParseResults([])

    try {
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/parse-logs', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse files')
      }

      setParseResults(data.results)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setParseLoading(false)
    }
  }

  return (
    <div className="app">
      <h1>Mission Log Parser</h1>
      <p className="subtitle">Upload log files to extract structured mission data</p>

      <div className="container">
        <div className="input-section">
          <label htmlFor="file-input">Select log files (.txt, .pdf, .csv):</label>
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            accept=".txt,.pdf,.csv"
            multiple
            className="file-input"
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="file-list">
            <label>Selected files:</label>
            {selectedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <span className="file-name">{file.name}</span>
                <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                <button
                  onClick={() => removeFile(index)}
                  className="remove-btn"
                  type="button"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleParse}
          disabled={parseLoading || selectedFiles.length === 0}
          className="summarize-btn"
        >
          {parseLoading ? 'Parsing...' : 'Parse Files'}
        </button>

        {parseError && (
          <div className="error">
            <strong>Error:</strong> {parseError}
          </div>
        )}

        {parseResults.length > 0 && (
          <div className="output-section">
            <label>Parsed Results:</label>
            <div className="results-grid">
              {parseResults.map((result, index) => (
                <div key={index} className="result-item">
                  <h3 className="result-filename">{result.filename}</h3>
                  <pre className="json-output">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
