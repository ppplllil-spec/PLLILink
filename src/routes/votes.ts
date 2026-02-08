import { Hono } from 'hono'

const votes = new Hono()

// 배포한 구글 시트 웹 앱 URL
const SHEET_API_URL ="https://script.google.com/macros/s/AKfycbzl-B7_aSqGBpgnUPA62kRQHFdMPCwdpJsO-44Rpi8azR0DnulTau63xgs5cqfgoGELVg/exec";

votes.get('/', async (c) => {
  try {
    // 1. 서버가 구글 시트에게 데이터를 요청합니다.
    const response = await fetch(`${SHEET_API_URL}?type=votes`);
    const result = await response.json();
    
    // 2. 브라우저(app.js)에게 "데이터 여기 있어!"라고 전달합니다.
    return c.json({ success: true, data: result.data });
  } catch (error) {
    return c.json({ success: false, message: '서버-시트 연결 실패' }, 500);
  }
})

export default votes
