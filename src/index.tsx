import { Hono } from 'hono'
import { cors } from 'hono/cors'
import votes from './routes/votes'
import schedule from './routes/schedule'
import radioRequests from './routes/radioRequests'
import adRequests from './routes/adRequests'

const app = new Hono()
app.use('/api/*', cors())

// 시트 데이터를 가져올 깔끔한 API 경로들
app.route('/api/votes', votes)
app.route('/api/schedule', schedule)
app.route('/api/radio-requests', radioRequests)
app.route('/api/ad-requests', adRequests)

export default app
