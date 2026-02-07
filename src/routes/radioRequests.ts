import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

const radioRequests = new Hono<{ Bindings: Bindings }>()

// 라디오 신청 정보 목록 조회
radioRequests.get('/', async (c) => {
  try {
    const country = c.req.query('country')
    
    let query = 'SELECT * FROM radio_requests'
    const params = []
    
    if (country) {
      query += ' WHERE country = ?'
      params.push(country)
    }
    
    query += ' ORDER BY created_at DESC'
    
    const stmt = c.env.DB.prepare(query)
    const { results } = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all()
    
    return c.json({ success: true, data: results })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch radio requests' }, 500)
  }
})

// 라디오 신청 정보 상세 조회
radioRequests.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const radioRequest = await c.env.DB.prepare(`
      SELECT * FROM radio_requests WHERE id = ?
    `).bind(id).first()
    
    if (!radioRequest) {
      return c.json({ success: false, error: 'Radio request not found' }, 404)
    }
    
    return c.json({ success: true, data: radioRequest })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch radio request' }, 500)
  }
})

// 라디오 신청 정보 생성
radioRequests.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { title, station_name, program_name, request_url, request_method, country, description, example_text, created_by } = body
    
    if (!title || !station_name) {
      return c.json({ success: false, error: 'Title and station_name are required' }, 400)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO radio_requests (title, station_name, program_name, request_url, request_method, country, description, example_text, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(title, station_name, program_name || null, request_url || null, request_method || null, country || 'domestic', description || null, example_text || null, created_by || null).run()
    
    return c.json({ success: true, data: { id: result.meta.last_row_id } }, 201)
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create radio request' }, 500)
  }
})

// 라디오 신청 정보 수정
radioRequests.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    
    // 기존 데이터 가져오기
    const existing = await c.env.DB.prepare('SELECT * FROM radio_requests WHERE id = ?').bind(id).first()
    
    if (!existing) {
      return c.json({ success: false, error: 'Radio request not found' }, 404)
    }
    
    // 제공된 필드만 업데이트 (부분 업데이트 지원)
    const title = body.title !== undefined ? body.title : existing.title
    const station_name = body.station_name !== undefined ? body.station_name : existing.station_name
    const program_name = body.program_name !== undefined ? body.program_name : existing.program_name
    const request_url = body.request_url !== undefined ? body.request_url : existing.request_url
    const request_method = body.request_method !== undefined ? body.request_method : existing.request_method
    const country = body.country !== undefined ? body.country : existing.country
    const description = body.description !== undefined ? body.description : existing.description
    const example_text = body.example_text !== undefined ? body.example_text : existing.example_text
    
    const result = await c.env.DB.prepare(`
      UPDATE radio_requests 
      SET title = ?, station_name = ?, program_name = ?, request_url = ?, request_method = ?, country = ?, description = ?, example_text = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(title, station_name, program_name, request_url, request_method, country, description, example_text, id).run()
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'Radio request not found' }, 404)
    }
    
    return c.json({ success: true, message: 'Radio request updated' })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to update radio request' }, 500)
  }
})

// 라디오 신청 정보 삭제
radioRequests.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const result = await c.env.DB.prepare(`
      DELETE FROM radio_requests WHERE id = ?
    `).bind(id).run()
    
    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'Radio request not found' }, 404)
    }
    
    return c.json({ success: true, message: 'Radio request deleted' })
  } catch (error) {
    return c.json({ success: false, error: 'Failed to delete radio request' }, 500)
  }
})

export default radioRequests
