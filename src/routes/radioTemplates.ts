import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// 방송국별 예시문 조회
app.get('/station/:stationName', async (c) => {
  const { DB } = c.env
  const stationName = c.req.param('stationName')

  try {
    const result = await DB.prepare(`
      SELECT * FROM radio_templates 
      WHERE station_name = ?
      ORDER BY created_at DESC
    `).bind(stationName).all()

    return c.json({
      success: true,
      templates: result.results || []
    })
  } catch (error: any) {
    console.error('Error fetching radio templates:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 모든 템플릿 조회
app.get('/', async (c) => {
  const { DB } = c.env

  try {
    const result = await DB.prepare(`
      SELECT * FROM radio_templates 
      ORDER BY station_name, created_at DESC
    `).all()

    return c.json({
      success: true,
      templates: result.results || []
    })
  } catch (error: any) {
    console.error('Error fetching all radio templates:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 예시문으로 텍스트 생성 (치환)
app.post('/generate', async (c) => {
  const { DB } = c.env
  const { template_id, artist_name, song_name } = await c.req.json()

  try {
    const templateResult = await DB.prepare(`
      SELECT * FROM radio_templates WHERE id = ?
    `).bind(template_id).first()

    if (!templateResult) {
      return c.json({
        success: false,
        error: 'Template not found'
      }, 404)
    }

    let generatedText = templateResult.template_text as string

    // 치환 처리
    if (artist_name) {
      generatedText = generatedText.replace(/\{\{artist_name\}\}/g, artist_name)
    }
    if (song_name) {
      generatedText = generatedText.replace(/\{\{song_name\}\}/g, song_name)
    }

    return c.json({
      success: true,
      generated_text: generatedText,
      template: templateResult
    })
  } catch (error: any) {
    console.error('Error generating text:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 새 템플릿 추가 (커뮤니티 기여용)
app.post('/', async (c) => {
  const { DB } = c.env
  const { station_name, template_text, language, template_type, placeholder_fields, example_text } = await c.req.json()

  try {
    const result = await DB.prepare(`
      INSERT INTO radio_templates 
      (station_name, template_text, language, template_type, placeholder_fields, example_text)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      station_name,
      template_text,
      language || 'en',
      template_type || 'request',
      placeholder_fields || '[]',
      example_text || ''
    ).run()

    return c.json({
      success: true,
      id: result.meta.last_row_id
    })
  } catch (error: any) {
    console.error('Error creating radio template:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

export default app
