import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

const schedule = new Hono<{ Bindings: Bindings }>()

// 오늘의 일정 조회
schedule.get('/today', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    // 오늘 마감인 투표
    const { results: deadlineVotes } = await c.env.DB.prepare(`
      SELECT *, 'deadline' as schedule_type FROM votes 
      WHERE date(deadline) = ? 
      ORDER BY deadline ASC
    `).bind(today).all()
    
    // 매일 반복되는 투표 (시간 범위 체크)
    const { results: recurringVotes } = await c.env.DB.prepare(`
      SELECT *, 'recurring' as schedule_type FROM votes 
      WHERE is_recurring = 1 
      AND recurrence_type = 'daily'
      AND (
        recurrence_start_time IS NULL 
        OR recurrence_end_time IS NULL
        OR (recurrence_start_time <= ? AND recurrence_end_time >= ?)
        OR recurrence_start_time IS NULL
      )
      ORDER BY recurrence_time ASC
    `).bind(currentTime, currentTime).all()
    
    // 요일별 반복 투표 (시간 범위 체크)
    const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()]
    const { results: weeklyVotes } = await c.env.DB.prepare(`
      SELECT *, 'recurring' as schedule_type FROM votes 
      WHERE is_recurring = 1 
      AND recurrence_type = 'weekly'
      AND recurrence_days LIKE ?
      AND (
        recurrence_start_time IS NULL 
        OR recurrence_end_time IS NULL
        OR (recurrence_start_time <= ? AND recurrence_end_time >= ?)
        OR recurrence_start_time IS NULL
      )
      ORDER BY recurrence_time ASC
    `).bind(`%"${dayOfWeek}"%`, currentTime, currentTime).all()
    
    // 오늘 요청해야 하는 라디오
    const { results: todayRadio } = await c.env.DB.prepare(`
      SELECT *, 'specific' as schedule_type FROM radio_requests 
      WHERE request_date = ?
      ORDER BY request_time ASC
    `).bind(today).all()
    
    // 매일 반복 라디오 (시간 범위 체크)
    const { results: recurringRadio } = await c.env.DB.prepare(`
      SELECT *, 'recurring' as schedule_type FROM radio_requests 
      WHERE is_recurring = 1 
      AND recurrence_type = 'daily'
      AND (
        recurrence_start_time IS NULL 
        OR recurrence_end_time IS NULL
        OR (recurrence_start_time <= ? AND recurrence_end_time >= ?)
        OR recurrence_start_time IS NULL
      )
      ORDER BY request_time ASC
    `).bind(currentTime, currentTime).all()
    
    // 요일별 반복 라디오 (시간 범위 체크)
    const { results: weeklyRadio } = await c.env.DB.prepare(`
      SELECT *, 'recurring' as schedule_type FROM radio_requests 
      WHERE is_recurring = 1 
      AND recurrence_type = 'weekly'
      AND recurrence_days LIKE ?
      AND (
        recurrence_start_time IS NULL 
        OR recurrence_end_time IS NULL
        OR (recurrence_start_time <= ? AND recurrence_end_time >= ?)
        OR recurrence_start_time IS NULL
      )
      ORDER BY request_time ASC
    `).bind(`%"${dayOfWeek}"%`, currentTime, currentTime).all()
    
    // 시간 상태 추가 (지났는지, 진행중인지, 예정인지)
    const addTimeStatus = (item: any) => {
      if (!item.recurrence_start_time || !item.recurrence_end_time) {
        return { ...item, timeStatus: 'all-day' }
      }
      if (currentTime < item.recurrence_start_time) {
        return { ...item, timeStatus: 'upcoming' }
      }
      if (currentTime > item.recurrence_end_time) {
        return { ...item, timeStatus: 'past' }
      }
      return { ...item, timeStatus: 'active' }
    }
    
    return c.json({ 
      success: true, 
      data: {
        date: today,
        currentTime: currentTime,
        votes: {
          deadline: deadlineVotes.map(addTimeStatus),
          recurring: [...recurringVotes, ...weeklyVotes].map(addTimeStatus)
        },
        radio: {
          specific: todayRadio.map(addTimeStatus),
          recurring: [...recurringRadio, ...weeklyRadio].map(addTimeStatus)
        }
      }
    })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch today schedule' }, 500)
  }
})

// 다가오는 일정 조회 (7일)
schedule.get('/upcoming', async (c) => {
  try {
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    
    const todayStr = today.toISOString().split('T')[0]
    const nextWeekStr = nextWeek.toISOString().split('T')[0]
    
    // 7일 이내 마감 투표
    const { results: upcomingVotes } = await c.env.DB.prepare(`
      SELECT * FROM votes 
      WHERE date(deadline) BETWEEN ? AND ?
      ORDER BY deadline ASC
    `).bind(todayStr, nextWeekStr).all()
    
    // 7일 이내 라디오 요청
    const { results: upcomingRadio } = await c.env.DB.prepare(`
      SELECT * FROM radio_requests 
      WHERE request_date BETWEEN ? AND ?
      ORDER BY request_date ASC, request_time ASC
    `).bind(todayStr, nextWeekStr).all()
    
    return c.json({ 
      success: true, 
      data: {
        votes: upcomingVotes,
        radio: upcomingRadio
      }
    })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch upcoming schedule' }, 500)
  }
})

// 반복 일정 조회
schedule.get('/recurring', async (c) => {
  try {
    const { results: recurringVotes } = await c.env.DB.prepare(`
      SELECT * FROM votes 
      WHERE is_recurring = 1
      ORDER BY recurrence_time ASC
    `).all()
    
    const { results: recurringRadio } = await c.env.DB.prepare(`
      SELECT * FROM radio_requests 
      WHERE is_recurring = 1
      ORDER BY request_time ASC
    `).all()
    
    return c.json({ 
      success: true, 
      data: {
        votes: recurringVotes,
        radio: recurringRadio
      }
    })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch recurring schedule' }, 500)
  }
})

export default schedule
