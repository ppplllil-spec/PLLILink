import { Hono } from 'hono'

const votes = new Hono()

// 구글 시트 웹 앱 URL (배포하신 URL을 여기에 넣으세요)
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbzl-B7_aSqGBpgnUPA62kRQHFdMPCwdpJsO-44Rpi8azR0DnulTau63xgs5cqfgoGELVg/exec";

votes.get('/', async (c) => {
  try {
    const response = await fetch(`${SHEET_API_URL}?type=votes`);
    const data = await response.json();
    
    // 시트의 원본 데이터를 app.js가 쓰기 좋게 전달
    return c.json({ success: true, data: data.data });
  } catch (error) {
    return c.json({ success: false, error: '시트 데이터를 가져오지 못했습니다.' }, 500);
  }
})

export default votes
