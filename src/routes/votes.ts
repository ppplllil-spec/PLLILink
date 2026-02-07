import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

const votes = new Hono<{ Bindings: Bindings }>()

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
    const { title, description, vote_url, deadline, platform, created_by } = body
    
    if (!title || !vote_url) {
      return c.json({ success: false, error: 'Title and vote_url are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO votes (title, description, vote_url, deadline, platform, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(title, description || null, vote_url, deadline || null, platform || null, created_by || null).run()
    
    return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201)
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create vote' }, 500)
  }
})

// 투표 수정
votes.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { title, description, vote_url, deadline, platform } = body
    
    const result = await c.env.DB.prepare(`
      UPDATE votes 
      SET title = ?, description = ?, vote_url = ?, deadline = ?, platform = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(title, description, vote_url, deadline, platform, id).run()
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'Vote not found' }, 404)
    }
    
    return c.json({ success: true, message: 'Vote updated' })
  } catch (error) {
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
  } catch (error) {
    return c.json({ success: false, error: 'Failed to delete vote' }, 500)
  }
})

export default votes
