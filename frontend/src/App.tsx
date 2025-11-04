import { useState, useEffect } from 'react'
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

interface ProcessedMission {
  filename: string
  mission_id: string
  requested_port: string
  assigned_port: string
  status: 'valid' | 'invalid'
  start_time: string
  end_time: string
  originalData: MissionData
  rejectionReason?: string
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedMissions, setProcessedMissions] = useState<ProcessedMission[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [processLoading, setProcessLoading] = useState(false)
  const [processError, setProcessError] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Load mission logs from localStorage on mount
  useEffect(() => {
    const storedLogs = localStorage.getItem('missionLogs')
    if (storedLogs) {
      try {
        const parsed = JSON.parse(storedLogs)
        setProcessedMissions(parsed)
      } catch (error) {
        console.error('Failed to parse stored mission logs:', error)
      }
    }
  }, [])

  // Save mission logs to localStorage whenever they change
  useEffect(() => {
    if (processedMissions.length > 0) {
      localStorage.setItem('missionLogs', JSON.stringify(processedMissions))
    }
  }, [processedMissions])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setProcessError('')
    }
  }

  const handleProcessMission = async () => {
    if (!selectedFile) {
      setProcessError('Please select a file to process')
      return
    }

    setProcessLoading(true)
    setProcessError('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/process-mission', {
        method: 'POST',
        body: formData,
      })

      const data: ProcessResult = await response.json()

      if (!response.ok) {
        throw new Error(data.docking_result.reason || 'Failed to process mission')
      }

      // Create mission entry for table
      const newMission: ProcessedMission = {
        filename: data.filename,
        mission_id: data.parsed_data.mission_id,
        requested_port: data.parsed_data.requested_port,
        assigned_port: data.docking_result.status === 'accepted'
          ? (data.docking_result.assigned_port || '--')
          : '--',
        status: data.docking_result.status === 'accepted' ? 'valid' : 'invalid',
        start_time: data.parsed_data.start_time,
        end_time: data.parsed_data.end_time,
        originalData: data.parsed_data,
        rejectionReason: data.docking_result.reason,
      }

      // Add to missions history
      setProcessedMissions(prev => [...prev, newMission])

      // Clear file selection and trigger calendar refresh
      setSelectedFile(null)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      setProcessError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setProcessLoading(false)
    }
  }

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const toggleRowExpansion = (index: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const handleClearAll = async () => {
    if (processedMissions.length === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to clear all ${processedMissions.length} mission log(s) and the docking schedule? This cannot be undone.`
    )

    if (!confirmed) return

    try {
      // Call backend to clear the docking schedule
      const response = await fetch('/api/clear-schedule', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear schedule')
      }

      // If backend cleared successfully, clear frontend
      setProcessedMissions([])
      setExpandedRows(new Set())
      localStorage.removeItem('missionLogs')

      // Trigger calendar refresh to show empty schedule
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      setProcessError(err instanceof Error ? err.message : 'Failed to clear data')
    }
  }

  return (
    <div className="app">
      <div className="container">
        {/* Header with title and buttons */}
        <div className="mission-logs-header">
          <h1>Mission Logs</h1>
          <div className="header-buttons">
            <label htmlFor="file-input" className="choose-files-btn">
              Choose Files
            </label>
            <input
              id="file-input"
              type="file"
              onChange={handleFileChange}
              accept=".txt,.pdf,.csv"
              className="file-input-hidden"
            />
            <span className="file-chosen-text">
              {selectedFile ? selectedFile.name : 'No file chosen'}
            </span>
            <button
              onClick={handleProcessMission}
              disabled={processLoading || !selectedFile}
              className="parse-files-btn"
            >
              {processLoading ? 'Parsing...' : 'Parse Files'}
            </button>
            <button
              onClick={handleRefresh}
              className="refresh-btn-new"
            >
              Refresh
            </button>
            <button
              onClick={handleClearAll}
              className="clear-all-btn"
              disabled={processedMissions.length === 0}
            >
              Clear All
            </button>
          </div>
        </div>

        {processError && (
          <div className="error">
            <strong>Error:</strong> {processError}
          </div>
        )}

        {/* Mission Data Table */}
        {processedMissions.length > 0 && (
          <div className="mission-table-container">
            <table className="mission-table">
              <thead>
                <tr>
                  <th className="arrow-column"></th>
                  <th>MISSION ID</th>
                  <th>PORT REQUESTED</th>
                  <th>PORT ASSIGNED</th>
                  <th>STATUS</th>
                  <th>START TIME</th>
                  <th>END TIME</th>
                </tr>
              </thead>
              <tbody>
                {processedMissions.map((mission, index) => (
                  <>
                    <tr key={index} className="mission-row">
                      <td className="arrow-column">
                        <button
                          className="expand-arrow"
                          onClick={() => toggleRowExpansion(index)}
                          aria-label="Toggle details"
                        >
                          <span className={expandedRows.has(index) ? 'arrow-down' : 'arrow-right'}>
                            {expandedRows.has(index) ? '▼' : '▶'}
                          </span>
                        </button>
                      </td>
                      <td>{mission.mission_id}</td>
                      <td>{mission.requested_port}</td>
                      <td>{mission.assigned_port}</td>
                      <td>
                        <span className={`status-badge status-${mission.status}`}>
                          {mission.status === 'valid' ? 'Valid' : 'Invalid'}
                        </span>
                      </td>
                      <td>{mission.start_time}</td>
                      <td>{mission.end_time}</td>
                    </tr>
                    {expandedRows.has(index) && (
                      <tr key={`expanded-${index}`} className="expanded-row">
                        <td colSpan={7} className="expanded-content">
                          <div className="expanded-inner">
                            <div className="expanded-header">
                              <strong>File:</strong> {mission.filename}
                            </div>
                            <div className="expanded-json-section">
                              <h4>Original Parsed Data:</h4>
                              <pre className="json-output">
                                {JSON.stringify(mission.originalData, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            <div className="table-footer">
              <span>Total: {processedMissions.length}</span>
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
