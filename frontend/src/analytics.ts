// Anonymous local analytics for retention and motion layer metrics
// Stored strictly locally in localStorage, no external network calls

interface LocalMetrics {
  storiesOpenedPerVisit: number
  listenStarts: number
  caughtUpCompletions: number
  savesCount: number
  storiesViewedTotal: number
  reduceMotionUsed: boolean
  firstVisitDate: string
  day2Returned: boolean
  day7Returned: boolean
  lastInpMs: number | null
  eventLog: Array<{ event: string; timestamp: string; data?: any }>
}

const STORAGE_KEY = 'ai_app_local_metrics'

function getMetrics(): LocalMetrics {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {
    storiesOpenedPerVisit: 0,
    listenStarts: 0,
    caughtUpCompletions: 0,
    savesCount: 0,
    storiesViewedTotal: 0,
    reduceMotionUsed: false,
    firstVisitDate: new Date().toISOString(),
    day2Returned: false,
    day7Returned: false,
    lastInpMs: null,
    eventLog: []
  }
}

function saveMetrics(m: LocalMetrics) {
  try {
    // Keep event log under 100 items to avoid storage explosion
    if (m.eventLog.length > 100) {
      m.eventLog = m.eventLog.slice(-100)
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m))
  } catch {}
}

export const logAnalyticsEvent = (event: string, data?: any) => {
  const m = getMetrics()
  const now = new Date()
  m.eventLog.push({ event, timestamp: now.toISOString(), data })

  if (event === 'story_opened') {
    m.storiesOpenedPerVisit += 1
  } else if (event === 'listen_start') {
    m.listenStarts += 1
  } else if (event === 'caught_up_completed') {
    m.caughtUpCompletions += 1
  } else if (event === 'story_saved') {
    m.savesCount += 1
  } else if (event === 'story_viewed') {
    m.storiesViewedTotal += 1
  } else if (event === 'reduce_motion_toggled') {
    m.reduceMotionUsed = Boolean(data?.enabled)
  } else if (event === 'inp_measured') {
    if (typeof data?.inp === 'number') {
      m.lastInpMs = data.inp
    }
  }

  // Check day 2 / day 7 return
  try {
    const firstDate = new Date(m.firstVisitDate)
    const diffDays = Math.floor((now.getTime() - firstDate.getTime()) / (1000 * 3600 * 24))
    if (diffDays >= 2 && !m.day2Returned) m.day2Returned = true
    if (diffDays >= 7 && !m.day7Returned) m.day7Returned = true
  } catch {}

  saveMetrics(m)
}

export const getRetentionReport = () => {
  const m = getMetrics()
  const saveRate = m.storiesViewedTotal > 0 ? (m.savesCount / m.storiesViewedTotal) : 0
  return {
    ...m,
    saveRate: Number(saveRate.toFixed(3)),
  }
}
