import { useState, useEffect } from 'react'
import './DockingCalendar.css'

interface Mission {
  mission_id: string
  start_time: string
  end_time: string
  team: string
}

interface ScheduleResponse {
  ports: {
    [key: string]: Mission[]
  }
}

interface DockingCalendarProps {
  refreshTrigger?: number
}

// Define time slots (hours from 00:00 to 23:00)
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => i)
const PORTS = ['A1', 'A2', 'B1']
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface OccupiedSlot {
  mission_id: string
  port: string
  day: number  // 0-6 for Mon-Sun
  startHour: number
  endHour: number
}

function DockingCalendar({ refreshTrigger }: DockingCalendarProps) {
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([])
  const [weekDates, setWeekDates] = useState<Date[]>([])  // Store actual dates for each day

  const fetchSchedule = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/docking-status')
      const data: ScheduleResponse = await response.json()

      if (!response.ok) {
        throw new Error('Failed to fetch schedule')
      }

      setSchedule(data)
      processScheduleForCalendar(data)
    } catch (err) {
      console.error('Failed to load schedule:', err)
    } finally {
      setLoading(false)
    }
  }

  const processScheduleForCalendar = (scheduleData: ScheduleResponse) => {
    const slots: OccupiedSlot[] = []

    // Flatten all missions from all ports
    const allMissions: Array<Mission & { port: string }> = []
    Object.entries(scheduleData.ports).forEach(([port, missions]) => {
      missions.forEach(mission => {
        allMissions.push({ ...mission, port })
      })
    })

    if (allMissions.length === 0) {
      setOccupiedSlots([])
      setWeekDates([])
      return
    }

    // Find the earliest assignment date to determine our week start
    const allDates = allMissions.map(m => new Date(m.start_time).getTime())
    const earliestDate = new Date(Math.min(...allDates))

    // Get the start of the week containing the earliest assignment (Monday)
    const currentDay = earliestDate.getDay()
    const diff = currentDay === 0 ? -6 : 1 - currentDay // Adjust when day is Sunday
    const weekStart = new Date(earliestDate)
    weekStart.setDate(earliestDate.getDate() + diff)
    weekStart.setHours(0, 0, 0, 0)

    // Calculate dates for each day of the week
    const dates: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      dates.push(date)
    }
    setWeekDates(dates)

    allMissions.forEach(mission => {
      const startDate = new Date(mission.start_time)
      const endDate = new Date(mission.end_time)

      // Calculate which day of the week this assignment falls on
      const daysDiff = Math.floor((startDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24))

      // Show all assignments regardless of which week they're in
      // For simplicity, we'll show them in a 7-day view starting from the week with assignments
      if (daysDiff >= 0 && daysDiff < 7) {
        const startHour = startDate.getHours() + startDate.getMinutes() / 60
        const endHour = endDate.getHours() + endDate.getMinutes() / 60

        slots.push({
          mission_id: mission.mission_id,
          port: mission.port,
          day: daysDiff,
          startHour,
          endHour
        })
      }
    })

    setOccupiedSlots(slots)
  }

  useEffect(() => {
    fetchSchedule()
  }, [refreshTrigger])

  const isSlotOccupied = (day: number, hour: number, port: string): OccupiedSlot | null => {
    const slot = occupiedSlots.find(s =>
      s.day === day &&
      s.port === port &&
      hour >= s.startHour &&
      hour < s.endHour
    )
    return slot || null
  }

  const hasPortBookings = (port: string, day: number): boolean => {
    return occupiedSlots.some(slot => slot.port === port && slot.day === day)
  }

  const formatTimeLabel = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  const formatDayHeader = (dayName: string, date: Date | undefined) => {
    if (!date) return dayName
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${dayName} ${month}/${day}`
  }

  return (
    <div className="docking-calendar">
      <div className="calendar-header">
        <h2>Docking Schedule - Week View</h2>
      </div>

      {loading ? (
        <div className="calendar-loading">Loading schedule...</div>
      ) : (
        <div className="calendar-grid-container">
          <div className="calendar-grid">
            {/* Header row with days and ports */}
            <div className="calendar-header-row">
              <div className="time-label-cell"></div>
              {DAYS.map((day, index) => (
                <div
                  key={day}
                  className={`day-header ${index < 6 ? 'day-separator' : ''}`}
                  style={{ gridColumn: `span ${PORTS.length}` }}
                >
                  {formatDayHeader(day, weekDates[index])}
                </div>
              ))}
            </div>

            {/* Port sub-headers */}
            <div className="calendar-port-row">
              <div className="time-label-cell"></div>
              {DAYS.map((day, dayIndex) => (
                PORTS.map(port => {
                  const hasBookings = hasPortBookings(port, dayIndex)
                  return (
                    <div
                      key={`${day}-${port}`}
                      className={`port-header ${hasBookings ? `port-${port.toLowerCase()}` : 'port-empty'} ${port === 'B1' && dayIndex < 6 ? 'day-separator' : ''}`}
                    >
                      {port}
                    </div>
                  )
                })
              ))}
            </div>

            {/* Time slots grid */}
            {TIME_SLOTS.map(hour => (
              <div key={hour} className="calendar-row">
                <div className="time-label">{formatTimeLabel(hour)}</div>
                {DAYS.map((_, dayIndex) => (
                  PORTS.map(port => {
                    const occupied = isSlotOccupied(dayIndex, hour, port)
                    return (
                      <div
                        key={`${dayIndex}-${hour}-${port}`}
                        className={`calendar-cell ${occupied ? 'occupied' : 'available'} ${port === 'B1' && dayIndex < 6 ? 'day-separator' : ''}`}
                        title={occupied ? `Mission ${occupied.mission_id}` : ''}
                      >
                        {occupied && <div className="occupied-block"></div>}
                      </div>
                    )
                  })
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && occupiedSlots.length === 0 && (
        <div className="calendar-empty">
          <p>No docking assignments for this week</p>
        </div>
      )}
    </div>
  )
}

export default DockingCalendar
