import { useState } from 'react'
import './App.css'

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

interface DockingSchedule {
  ports: {
    [key: string]: Array<{
      mission_id: string
      start_time: string
      end_time: string
      team: string
    }>
  }
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null)
  const [processLoading, setProcessLoading] = useState(false)
  const [processError, setProcessError] = useState('')
  const [schedule, setSchedule] = useState<DockingSchedule | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)

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
      // Automatically fetch updated schedule after processing
      await fetchSchedule()
    } catch (err) {
      setProcessError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setProcessLoading(false)
    }
  }

  const fetchSchedule = async () => {
    setScheduleLoading(true)
    try {
      const response = await fetch('/api/docking-status')
      const data = await response.json()
      setSchedule(data)
    } catch (err) {
      console.error('Failed to fetch schedule:', err)
    } finally {
      setScheduleLoading(false)
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

        {/* Docking Schedule */}
        {schedule && (
          <div className="output-section">
            <h2>Current Docking Schedule</h2>
            <button onClick={fetchSchedule} disabled={scheduleLoading} className="refresh-btn">
              {scheduleLoading ? 'Refreshing...' : 'Refresh Schedule'}
            </button>

            <div className="schedule-grid">
              {Object.entries(schedule.ports).map(([port, missions]) => (
                <div key={port} className="port-schedule">
                  <h3>Port {port}</h3>
                  {missions.length === 0 ? (
                    <p className="empty-port">No missions scheduled</p>
                  ) : (
                    <div className="missions-list">
                      {missions.map((mission, idx) => (
                        <div key={idx} className="mission-card">
                          <div><strong>{mission.mission_id}</strong></div>
                          <div className="mission-time">
                            {new Date(mission.start_time).toLocaleString()}
                            {' → '}
                            {new Date(mission.end_time).toLocaleString()}
                          </div>
                          <div className="mission-team">Team: {mission.team}</div>
                        </div>
                      ))}
                    </div>
                  )}
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
