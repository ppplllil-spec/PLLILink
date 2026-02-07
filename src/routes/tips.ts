import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

const tips = new Hono<{ Bindings: Bindings }>()

// 팁 목록 조회 (특정 투표 또는 플랫폼별)
tips.get('/', async (c) => {
  try {
    const vote_id = c.req.query('vote_id')
    const platform = c.req.query('platform')
    
    let query = 'SELECT * FROM vote_tips WHERE 1=1'
    const params: any[] = []
    
    if (vote_id) {
      query += ' AND vote_id = ?'
      params.push(vote_id)
    }
    
    if (platform) {
      query += ' AND platform = ?'
      params.push(platform)
    }
    
    query += ' ORDER BY helpful_count DESC, created_at DESC'
    
    const stmt = c.env.DB.prepare(query)
    const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all()
    
    return c.json({ success: true, data: results })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch tips' }, 500)
  }
})

// 팁 상세 조회
tips.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const tip = await c.env.DB.prepare(`
      SELECT * FROM vote_tips WHERE id = ?
    `).bind(id).first()
    
    if (!tip) {
      return c.json({ success: false, error: 'Tip not found' }, 404)
    }
    
    return c.json({ success: true, data: tip })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch tip' }, 500)
  }
})

// 팁 생성
tips.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { vote_id, platform, tip_title, tip_content, created_by } = body
    
    if (!platform || !tip_title || !tip_content) {
      return c.json({ success: false, error: 'Platform, tip_title, and tip_content are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO vote_tips (vote_id, platform, tip_title, tip_content, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).bind(vote_id || null, platform, tip_title, tip_content, created_by || null).run()
    
    return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201)
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create tip' }, 500)
  }
})

// 팁 수정
tips.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { platform, tip_title, tip_content, is_verified } = body
    
    const result = await c.env.DB.prepare(`
      UPDATE vote_tips 
      SET platform = ?, tip_title = ?, tip_content = ?, is_verified = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(platform, tip_title, tip_content, is_verified, id).run()
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'Tip not found' }, 404)
    }
    
    return c.json({ success: true, message: 'Tip updated' })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to update tip' }, 500)
  }
})

// 팁 삭제
tips.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const result = await c.env.DB.prepare(`
      DELETE FROM vote_tips WHERE id = ?
    `).bind(id).run()
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'Tip not found' }, 404)
    }
    
    return c.json({ success: true, message: 'Tip deleted' })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to delete tip' }, 500)
  }
})

// 팁에 '도움됨' 반응 추가
tips.post('/:id/helpful', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { user_identifier } = body
    
    if (!user_identifier) {
      return c.json({ success: false, error: 'user_identifier is required' }, 400)
    }
    
    // 이미 반응했는지 확인
    const existing = await c.env.DB.prepare(`
      SELECT id FROM tip_reactions WHERE tip_id = ? AND user_identifier = ?
    `).bind(id, user_identifier).first()
    
    if (existing) {
      return c.json({ success: false, error: 'Already reacted' }, 400)
    }
    
    // 반응 추가
    await c.env.DB.prepare(`
      INSERT INTO tip_reactions (tip_id, user_identifier, reaction_type)
      VALUES (?, ?, 'helpful')
    `).bind(id, user_identifier).run()
    
    // helpful_count 증가
    await c.env.DB.prepare(`
      UPDATE vote_tips SET helpful_count = helpful_count + 1 WHERE id = ?
    `).bind(id).run()
    
    return c.json({ success: true, message: 'Reaction added' })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to add reaction' }, 500)
  }
})

export default tips
