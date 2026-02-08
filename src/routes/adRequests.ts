import { Hono } from 'hono'

const ads = new Hono()

// 구글 시트 통합 URL (type 파라미터를 ads로 설정)
const API_URL = 'https://script.google.com/macros/s/AKfycbzl-B7_aSqGBpgnUPA62kRQHFdMPCwdpJsO-44Rpi8azR0DnulTau63xgs5cqfgoGELVg/exec?type=ads'

// 1. 광고 목록 조회
ads.get('/', async (c) => {
  try {
    const res = await fetch(API_URL)
    const result = await res.json()
    return c.json({ success: true, data: result })
  } catch (error) {
    return c.json({ success: false, error: '광고 데이터를 불러오지 못했습니다.' }, 500)
  }
})

// 2. 새 광고 정보 추가
ads.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ads',
        category: body.category,
        title: body.title,
        link: body.link || body.ad_url,
        description: body.description
      })
    })
    return c.json(await res.json())
  } catch (error) {
    return c.json({ success: false, error: '광고 정보 저장에 실패했습니다.' }, 500)
  }
})

export default ads
