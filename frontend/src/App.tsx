import { useState } from 'react'
import './App.css'
import DockingCalendar from './components/DockingCalendar'

interface MissionData {
  mission_id: string
  requested_port: string
  start_time: string
  end_time: string
  team: string
  refueling_required: boolean
}

interface DockingResult {
  status: 'accepted' | 'rejected'
  assigned_port?: string
  reason?: string
}

interface ProcessResult {
  filename: string
  parsed_data: MissionData
  docking_result: DockingResult
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null)
  const [processLoading, setProcessLoading] = useState(false)
  const [processError, setProcessError] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setProcessError('')
      setProcessResult(null)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setProcessResult(null)
  }

  const handleProcessMission = async () => {
    if (!selectedFile) {
      setProcessError('Please select a file to process')
      return
    }

    setProcessLoading(true)
    setProcessError('')
    setProcessResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/process-mission', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process mission')
      }

      setProcessResult(data)
      // Trigger calendar refresh after processing
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      setProcessError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setProcessLoading(false)
    }
  }

  return (
    <div className="app">
      <h1>Mission Control Docking Scheduler</h1>
      <p className="subtitle">Upload mission logs to parse and automatically process docking requests</p>

      <div className="container">
        <div className="input-section">
          <label htmlFor="file-input">Select mission log file (.txt, .pdf, .csv):</label>
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            accept=".txt,.pdf,.csv"
            className="file-input"
          />
        </div>

        {selectedFile && (
          <div className="file-list">
            <label>Selected file:</label>
            <div className="file-item">
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
              <button
                onClick={removeFile}
                className="remove-btn"
                type="button"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleProcessMission}
          disabled={processLoading || !selectedFile}
          className="summarize-btn"
        >
          {processLoading ? 'Processing...' : 'Process Mission'}
        </button>

        {processError && (
          <div className="error">
            <strong>Error:</strong> {processError}
          </div>
        )}

        {processResult && (
          <div className="output-section">
            <h2>Mission Result</h2>

            {/* Docking Result Banner */}
            <div className={`docking-result ${processResult.docking_result.status}`}>
              {processResult.docking_result.status === 'accepted' ? (
                <>
                  <div className="status-icon">✅</div>
                  <div className="status-text">
                    <strong>Mission Accepted</strong>
                    <p>Assigned to Port: <strong>{processResult.docking_result.assigned_port}</strong></p>
                  </div>
                </>
              ) : (
                <>
                  <div className="status-icon">❌</div>
                  <div className="status-text">
                    <strong>Mission Rejected</strong>
                    <p>Reason: {processResult.docking_result.reason}</p>
                  </div>
                </>
              )}
            </div>

            {/* Parsed Mission Data */}
            <div className="result-item">
              <h3 className="result-filename">Parsed Mission Data ({processResult.filename})</h3>
              <pre className="json-output">
                {JSON.stringify(processResult.parsed_data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Docking Schedule - Separate Section */}
      <div className="schedule-section">
        <DockingCalendar refreshTrigger={refreshTrigger} />
      </div>
    </div>
  )
}

export default App
