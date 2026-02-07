import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

const adRequests = new Hono<{ Bindings: Bindings }>()

// 광고 시안 요청 목록 조회
adRequests.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM ad_requests 
      ORDER BY created_at DESC
    `).all()
    
    return c.json({ success: true, data: results })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch ad requests' }, 500)
  }
})

// 광고 시안 요청 상세 조회
adRequests.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const adRequest = await c.env.DB.prepare(`
      SELECT * FROM ad_requests WHERE id = ?
    `).bind(id).first()
    
    if (!adRequest) {
      return c.json({ success: false, error: 'Ad request not found' }, 404)
    }
    
    return c.json({ success: true, data: adRequest })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch ad request' }, 500)
  }
})

// 광고 시안 요청 생성
adRequests.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { title, description, location, contact_info, deadline, status, created_by } = body
    
    if (!title || !location) {
      return c.json({ success: false, error: 'Title and location are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO ad_requests (title, description, location, contact_info, deadline, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(title, description || null, location, contact_info || null, deadline || null, status || 'open', created_by || null).run()
    
    return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201)
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create ad request' }, 500)
  }
})

// 광고 시안 요청 수정
adRequests.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { title, description, location, contact_info, deadline, status } = body
    
    const result = await c.env.DB.prepare(`
      UPDATE ad_requests 
      SET title = ?, description = ?, location = ?, contact_info = ?, deadline = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(title, description, location, contact_info, deadline, status, id).run()
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'Ad request not found' }, 404)
    }
    
    return c.json({ success: true, message: 'Ad request updated' })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to update ad request' }, 500)
  }
})

// 광고 시안 요청 삭제
adRequests.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const result = await c.env.DB.prepare(`
      DELETE FROM ad_requests WHERE id = ?
    `).bind(id).run()
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'Ad request not found' }, 404)
    }
    
    return c.json({ success: true, message: 'Ad request deleted' })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to delete ad request' }, 500)
  }
})

export default adRequests
