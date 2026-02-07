import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

const votes = new Hono<{ Bindings: Bindings }>()

// SHA-256 해시 함수
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// 권한 확인 함수
async function checkPermission(DB: D1Database, id: string, sessionToken?: string, password?: string): Promise<{ allowed: boolean, role?: string }> {
  // 관리자/모더레이터 권한 확인
  if (sessionToken) {
    const session = await DB.prepare(`
      SELECT u.role FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.expires_at > CURRENT_TIMESTAMP
    `).bind(sessionToken).first()
    
    if (session && (session.role === 'admin' || session.role === 'moderator')) {
      return { allowed: true, role: session.role as string }
    }
  }
  
  // 비밀번호 확인 (비회원)
  if (password) {
    const passwordHash = await hashPassword(password)
    const vote = await DB.prepare(`
      SELECT id FROM votes WHERE id = ? AND password_hash = ?
    `).bind(id, passwordHash).first()
    
    if (vote) {
      return { allowed: true, role: 'owner' }
    }
  }
  
  return { allowed: false }
}

// 투표 목록 조회
votes.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM votes 
      ORDER BY created_at DESC
    `).all()
    
    return c.json({ success: true, data: results })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch votes' }, 500)
  }
})

// 투표 상세 조회
votes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const vote = await c.env.DB.prepare(`
      SELECT * FROM votes WHERE id = ?
    `).bind(id).first()
    
    if (!vote) {
      return c.json({ success: false, error: 'Vote not found' }, 404)
    }
    
    return c.json({ success: true, data: vote })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch vote' }, 500)
  }
})

// 투표 생성
votes.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { title, description, vote_url, deadline, platform, created_by, password, is_recurring, recurrence_type, recurrence_time, recurrence_days } = body
    
    if (!title || !vote_url) {
      return c.json({ success: false, error: 'Title and vote_url are required' }, 400)
    }
    
    // 비밀번호 해시 (비회원용)
    let passwordHash = null
    if (password) {
      passwordHash = await hashPassword(password)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO votes (title, description, vote_url, deadline, platform, created_by, password_hash, is_recurring, recurrence_type, recurrence_time, recurrence_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title, 
      description || null, 
      vote_url, 
      deadline || null, 
      platform || null, 
      created_by || null, 
      passwordHash,
      is_recurring || 0,
      recurrence_type || null,
      recurrence_time || null,
      recurrence_days || null
    ).run()
    
    return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201)
  } catch (error: any) {
    console.error('Create vote error:', error)
    return c.json({ success: false, error: 'Failed to create vote' }, 500)
  }
})

// 투표 수정
votes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    
    // 기존 데이터 가져오기
    const existing = await c.env.DB.prepare('SELECT * FROM votes WHERE id = ?').bind(id).first()
    
    if (!existing) {
      return c.json({ success: false, error: 'Vote not found' }, 404)
    }
    
    // 제공된 필드만 업데이트 (부분 업데이트 지원)
    const title = body.title !== undefined ? body.title : existing.title
    const description = body.description !== undefined ? body.description : existing.description
    const vote_url = body.vote_url !== undefined ? body.vote_url : existing.vote_url
    const deadline = body.deadline !== undefined ? body.deadline : existing.deadline
    const platform = body.platform !== undefined ? body.platform : existing.platform
    
    const result = await c.env.DB.prepare(`
      UPDATE votes 
      SET title = ?, description = ?, vote_url = ?, deadline = ?, platform = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(title, description, vote_url, deadline, platform, id).run()
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'Vote not found' }, 404)
    }
    
    return c.json({ success: true, message: 'Vote updated' })
  } catch (error: any) {
    console.error('Update vote error:', error)
    return c.json({ success: false, error: 'Failed to update vote' }, 500)
  }
})

// 투표 삭제
votes.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const result = await c.env.DB.prepare(`
      DELETE FROM votes WHERE id = ?
    `).bind(id).run()
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'Vote not found' }, 404)
    }
    
    return c.json({ success: true, message: 'Vote deleted' })
  } catch (error: any) {
    console.error('Delete vote error:', error)
    return c.json({ success: false, error: 'Failed to delete vote' }, 500)
  }
})

export default votes
