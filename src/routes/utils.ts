import { Hono } from 'hono'

const utils = new Hono()

// URL 메타데이터 추출 API
utils.post('/fetch-metadata', async (c) => {
  try {
    const { url } = await c.req.json()
    
    if (!url) {
      return c.json({ success: false, error: 'URL is required' }, 400)
    }

    // URL 유효성 검사
    let parsedUrl
    try {
      parsedUrl = new URL(url)
    } catch (e) {
      return c.json({ success: false, error: 'Invalid URL' }, 400)
    }

    // HTML 페치
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      return c.json({ success: false, error: 'Failed to fetch URL' }, 400)
    }

    const html = await response.text()

    // 메타데이터 추출
    const metadata = {
      title: '',
      description: '',
      image: '',
      site_name: ''
    }

    // Open Graph 태그 추출
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)
    const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
    const ogSiteMatch = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i)

    // 일반 메타 태그 추출
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)

    // 우선순위: Open Graph > 일반 메타 태그
    metadata.title = ogTitleMatch?.[1] || titleMatch?.[1] || ''
    metadata.description = ogDescMatch?.[1] || descMatch?.[1] || ''
    metadata.image = ogImageMatch?.[1] || ''
    metadata.site_name = ogSiteMatch?.[1] || parsedUrl.hostname

    // HTML 엔티티 디코딩
    metadata.title = decodeHtmlEntities(metadata.title)
    metadata.description = decodeHtmlEntities(metadata.description)

    return c.json({ 
      success: true, 
      data: {
        ...metadata,
        url: url
      }
    })
  } catch (error) {
    console.error('Metadata fetch error:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to extract metadata',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// HTML 엔티티 디코딩 헬퍼 함수
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&#x27;': "'",
    '&#x2F;': '/',
    '&nbsp;': ' '
  }
  
  return text.replace(/&[#\w]+;/g, (entity) => {
    return entities[entity] || entity
  })
}

export default utils
