import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { D1Database } from '@cloudflare/workers-types'

import votes from './routes/votes'
import adRequests from './routes/adRequests'
import radioRequests from './routes/radioRequests'
import tips from './routes/tips'
import utils from './routes/utils'
import schedule from './routes/schedule'
import radioTemplates from './routes/radioTemplates'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 제공
app.use('/static/*', serveStatic({ root: './public' }))

// manifest.json과 sw.js는 직접 제공
app.get('/manifest.json', (c) => {
  return c.json({
    "name": "PLAVE PLLI Community",
    "short_name": "PLLI",
    "description": "플레이브 팬덤 플리들의 투표·광고·라디오 정보 공유 커뮤니티",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0a0e27",
    "theme_color": "#00bfff",
    "orientation": "portrait-primary",
    "icons": [
      {
        "src": "/static/icon-192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any maskable"
      },
      {
        "src": "/static/icon-512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ],
    "categories": ["entertainment", "social", "utilities"],
    "shortcuts": [
      {
        "name": "오늘 일정",
        "short_name": "일정",
        "description": "오늘의 투표 및 라디오 일정 보기",
        "url": "/?tab=schedule",
        "icons": [{ "src": "/static/icon-192.png", "sizes": "192x192" }]
      },
      {
        "name": "투표 정보",
        "short_name": "투표",
        "description": "투표 정보 확인",
        "url": "/?tab=votes",
        "icons": [{ "src": "/static/icon-192.png", "sizes": "192x192" }]
      }
    ]
  })
})

app.get('/sw.js', (c) => {
  const swCode = `
const CACHE_NAME = 'plave-plli-v1';
const urlsToCache = [
  '/',
  '/static/app.js',
  '/static/style.css',
  '/static/icon-192.png',
  '/static/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
  `
  return c.text(swCode, 200, {
    'Content-Type': 'application/javascript'
  })
})

// API 라우트
app.route('/api/votes', votes)
app.route('/api/ad-requests', adRequests)
app.route('/api/radio-requests', radioRequests)
app.route('/api/tips', tips)
app.route('/api/utils', utils)
app.route('/api/schedule', schedule)
app.route('/api/radio-templates', radioTemplates)

// 메인 페이지
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="플레이브 팬덤 플리들의 투표·광고·라디오 정보 공유 커뮤니티">
        <meta name="theme-color" content="#00bfff">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="PLLI">
        
        <title>PLAVE PLLI - 투표·광고·라디오 정보 공유</title>
        
        <!-- PWA Manifest -->
        <link rel="manifest" href="/manifest.json">
        
        <!-- 앱 아이콘 -->
        <link rel="icon" type="image/svg+xml" href="/static/icon.svg">
        <link rel="apple-touch-icon" href="/static/icon.svg">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        <style>
          * {
            font-family: 'Pretendard', 'Inter', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
          }
          
          body {
            background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1426 100%);
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
          }
          
          /* 사이버틱 배경 효과 */
          body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 20% 50%, rgba(0, 191, 255, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(138, 43, 226, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 40% 20%, rgba(255, 0, 255, 0.1) 0%, transparent 40%);
            pointer-events: none;
            z-index: 0;
          }
          
          /* 네온 그리드 효과 */
          body::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
              linear-gradient(rgba(0, 191, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 191, 255, 0.03) 1px, transparent 1px);
            background-size: 50px 50px;
            pointer-events: none;
            z-index: 0;
          }
          
          .content-wrapper {
            position: relative;
            z-index: 1;
          }
          
          .card {
            backdrop-filter: blur(20px);
            background: linear-gradient(135deg, rgba(15, 20, 38, 0.9) 0%, rgba(26, 31, 58, 0.85) 100%);
            border: 1px solid rgba(0, 191, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 191, 255, 0.1), 0 0 20px rgba(138, 43, 226, 0.05);
          }
          
          .card:hover {
            border-color: rgba(0, 191, 255, 0.4);
            box-shadow: 0 12px 40px rgba(0, 191, 255, 0.2), 0 0 30px rgba(138, 43, 226, 0.1);
          }
          
          .badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
            border: 1px solid currentColor;
            text-shadow: 0 0 8px currentColor;
          }
          
          .tab-active {
            background: linear-gradient(135deg, rgba(0, 191, 255, 0.2), rgba(138, 43, 226, 0.2));
            border: 1px solid rgba(0, 191, 255, 0.5);
            box-shadow: 0 0 20px rgba(0, 191, 255, 0.3), inset 0 0 10px rgba(0, 191, 255, 0.1);
            color: #00bfff;
            font-weight: 700;
          }
          
          .neon-button {
            background: linear-gradient(135deg, #00bfff 0%, #8a2be2 100%);
            box-shadow: 0 0 20px rgba(0, 191, 255, 0.5), 0 0 40px rgba(138, 43, 226, 0.3);
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.3);
            animation: pulse-glow 2s ease-in-out infinite;
          }
          
          .neon-button:hover {
            box-shadow: 0 0 30px rgba(0, 191, 255, 0.8), 0 0 60px rgba(138, 43, 226, 0.5);
            transform: translateY(-2px);
          }
          
          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 0 20px rgba(0, 191, 255, 0.5), 0 0 40px rgba(138, 43, 226, 0.3);
            }
            50% {
              box-shadow: 0 0 30px rgba(0, 191, 255, 0.7), 0 0 60px rgba(138, 43, 226, 0.5);
            }
          }
          
          .neon-text {
            color: #00bfff;
            text-shadow: 0 0 10px rgba(0, 191, 255, 0.6), 0 0 20px rgba(0, 191, 255, 0.3);
            font-weight: 900;
            letter-spacing: 0.02em;
            font-family: 'Inter', 'Pretendard', sans-serif;
          }
          
          .cyber-link {
            background: linear-gradient(135deg, rgba(0, 191, 255, 0.8), rgba(138, 43, 226, 0.8));
            box-shadow: 0 4px 15px rgba(0, 191, 255, 0.3);
          }
          
          .cyber-link:hover {
            box-shadow: 0 6px 25px rgba(0, 191, 255, 0.5);
          }
        </style>
    </head>
    <body class="p-4 md:p-8">
        <div class="content-wrapper">
        <!-- 헤더 -->
        <div class="max-w-7xl mx-auto mb-8">
            <div class="card rounded-2xl shadow-2xl p-8 mb-6 border-2">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white shadow-lg" style="box-shadow: 0 0 30px rgba(0, 191, 255, 0.6);">
                            P
                        </div>
                        <div>
                            <h1 class="text-4xl md:text-5xl font-black neon-text mb-1">
                                PLAVE PLLI
                            </h1>
                            <p class="text-cyan-300 text-sm font-semibold tracking-wider">VIRTUAL IDOL COMMUNITY</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button id="notification-toggle" onclick="toggleNotifications()" class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg">
                            <i class="fas fa-bell mr-2"></i><span id="notification-status">알림 켜기</span>
                        </button>
                    </div>
                </div>
                <p class="text-gray-300 text-center md:text-left mt-4 border-t border-cyan-900/30 pt-4">
                    <i class="fas fa-star mr-2 text-cyan-400"></i>
                    플리들의 투표·광고·라디오 정보를 실시간으로 공유하세요
                    <i class="fas fa-star ml-2 text-purple-400"></i>
                </p>
            </div>
            
            <!-- 탭 메뉴 -->
            <div class="card rounded-2xl shadow-2xl p-3 mb-6">
                <div class="flex flex-wrap gap-3">
                    <button onclick="switchTab('schedule')" id="tab-schedule" class="flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold transition-all text-gray-300 border border-cyan-800/30 hover:border-cyan-500/50 hover:bg-cyan-900/20">
                        <i class="fas fa-calendar-alt mr-2"></i>오늘 일정
                    </button>
                    <button onclick="switchTab('votes')" id="tab-votes" class="flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold transition-all text-gray-300 border border-cyan-800/30 hover:border-cyan-500/50 hover:bg-cyan-900/20">
                        <i class="fas fa-vote-yea mr-2"></i>투표
                    </button>
                    <button onclick="switchTab('ads')" id="tab-ads" class="flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold transition-all text-gray-300 border border-cyan-800/30 hover:border-cyan-500/50 hover:bg-cyan-900/20">
                        <i class="fas fa-ad mr-2"></i>광고 시안
                    </button>
                    <button onclick="switchTab('radio')" id="tab-radio" class="flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold transition-all text-gray-300 border border-cyan-800/30 hover:border-cyan-500/50 hover:bg-cyan-900/20">
                        <i class="fas fa-radio mr-2"></i>라디오
                    </button>
                    <button onclick="switchTab('tips')" id="tab-tips" class="flex-1 min-w-[120px] py-3 px-4 rounded-xl font-bold transition-all text-gray-300 border border-cyan-800/30 hover:border-cyan-500/50 hover:bg-cyan-900/20">
                        <i class="fas fa-lightbulb mr-2"></i>투표 팁
                    </button>
                </div>
            </div>
            
            <!-- 추가 버튼 -->
            <div class="flex justify-end mb-4">
                <button onclick="openAddModal()" class="neon-button text-white px-8 py-3 rounded-xl font-black shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
                    <i class="fas fa-plus mr-2"></i>새 정보 추가
                </button>
            </div>
        </div>

        <!-- 콘텐츠 영역 -->
        <div class="max-w-7xl mx-auto">
            <!-- 오늘 일정 섹션 -->
            <div id="content-schedule" class="content-section">
                <div class="mb-6">
                    <h2 class="text-2xl font-black neon-text mb-4">
                        <i class="fas fa-calendar-day mr-2"></i>오늘의 일정
                        <span id="today-date" class="text-lg text-gray-400 ml-3"></span>
                    </h2>
                    
                    <!-- 오늘 마감 투표 -->
                    <div class="mb-6">
                        <h3 class="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
                            <i class="fas fa-hourglass-end"></i>
                            오늘 마감 투표
                        </h3>
                        <div id="today-deadline-votes" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <!-- 동적 생성 -->
                        </div>
                    </div>
                    
                    <!-- 매일 반복 투표 -->
                    <div class="mb-6">
                        <h3 class="text-xl font-bold text-purple-400 mb-3 flex items-center gap-2">
                            <i class="fas fa-sync-alt"></i>
                            매일 반복 투표
                        </h3>
                        <div id="today-recurring-votes" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <!-- 동적 생성 -->
                        </div>
                    </div>
                    
                    <!-- 오늘 라디오 요청 -->
                    <div class="mb-6">
                        <h3 class="text-xl font-bold text-green-400 mb-3 flex items-center gap-2">
                            <i class="fas fa-broadcast-tower"></i>
                            오늘 라디오 요청
                        </h3>
                        <div id="today-radio" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <!-- 동적 생성 -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- 투표 섹션 -->
            <div id="content-votes" class="content-section">
                <!-- 검색 & 필터 -->
                <div class="mb-6 space-y-4">
                    <!-- 검색바 -->
                    <div class="relative">
                        <input type="text" 
                               id="vote-search" 
                               placeholder="투표 제목, 플랫폼으로 검색..." 
                               class="w-full p-4 pl-12 bg-gray-900/50 border border-cyan-500/30 rounded-lg text-cyan-100 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                        <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-500"></i>
                    </div>
                    
                    <!-- 필터 버튼 -->
                    <div class="flex flex-wrap gap-2">
                        <button onclick="filterVotes('all')" 
                                id="filter-all" 
                                class="vote-filter-btn px-4 py-2 rounded-lg bg-cyan-600 text-white font-semibold transition-all">
                            전체
                        </button>
                        <button onclick="filterVotes('deadline')" 
                                id="filter-deadline" 
                                class="vote-filter-btn px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 font-semibold transition-all">
                            마감 임박
                        </button>
                        <button onclick="filterVotes('recurring')" 
                                id="filter-recurring" 
                                class="vote-filter-btn px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 font-semibold transition-all">
                            반복 투표
                        </button>
                        <button onclick="filterVotes('completed')" 
                                id="filter-completed" 
                                class="vote-filter-btn px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 font-semibold transition-all">
                            완료한 투표
                        </button>
                        <button onclick="filterVotes('incomplete')" 
                                id="filter-incomplete" 
                                class="vote-filter-btn px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 font-semibold transition-all">
                            미완료 투표
                        </button>
                    </div>
                </div>
                
                <!-- 완료율 표시 -->
                <div id="completion-stats" class="mb-6"></div>
                
                <div id="votes-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- 로딩 중... -->
                </div>
            </div>

            <!-- 광고 섹션 -->
            <div id="content-ads" class="content-section hidden">
                <div id="ads-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- 로딩 중... -->
                </div>
            </div>

            <!-- 라디오 섹션 -->
            <div id="content-radio" class="content-section hidden">
                <div class="mb-4 flex gap-2 justify-between items-center flex-wrap">
                    <div class="flex gap-2">
                        <button onclick="filterRadio('all')" class="radio-filter-btn px-4 py-2 rounded-lg bg-white shadow">전체</button>
                        <button onclick="filterRadio('domestic')" class="radio-filter-btn px-4 py-2 rounded-lg bg-white shadow">국내</button>
                        <button onclick="filterRadio('international')" class="radio-filter-btn px-4 py-2 rounded-lg bg-white shadow">해외</button>
                    </div>
                    <button onclick="openExampleTextManager()" class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg">
                        <i class="fas fa-file-alt mr-2"></i>예시문 관리
                    </button>
                </div>
                <div id="radio-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- 로딩 중... -->
                </div>
            </div>

            <!-- 팁 섹션 -->
            <div id="content-tips" class="content-section hidden">
                <div id="tips-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- 로딩 중... -->
                </div>
            </div>
        </div>

        <!-- 추가 모달 -->
        <div id="add-modal" class="hidden fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50" style="backdrop-filter: blur(10px);">
            <div class="card rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-3xl font-black neon-text">새 정보 추가</h2>
                    <button onclick="closeAddModal()" class="text-cyan-400 hover:text-cyan-300 transition-colors">
                        <i class="fas fa-times text-3xl"></i>
                    </button>
                </div>
                <form id="add-form" class="space-y-4">
                    <div id="form-content">
                        <!-- 동적으로 생성됨 -->
                    </div>
                    <div class="flex gap-3 pt-6 border-t border-cyan-900/30">
                        <button type="submit" class="flex-1 neon-button text-white px-6 py-3 rounded-xl font-black">
                            <i class="fas fa-save mr-2"></i>저장
                        </button>
                        <button type="button" onclick="closeAddModal()" class="px-8 py-3 rounded-xl font-bold border-2 border-gray-600 text-gray-300 hover:bg-gray-800/50 transition-all">
                            취소
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js?v=2.1"></script>
        
        <!-- PWA 설치 안내 및 Service Worker 등록 -->
        <script>
          // Service Worker 등록
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                  console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                  console.log('Service Worker registration failed:', error);
                });
            });
          }
          
          // PWA 설치 안내
          let deferredPrompt;
          window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // 설치 안내 배너 표시
            const installBanner = document.createElement('div');
            installBanner.id = 'install-banner';
            installBanner.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50';
            installBanner.innerHTML = \`
              <div class="card rounded-xl shadow-2xl p-4 border-2 border-cyan-500/50">
                <div class="flex items-start gap-3">
                  <div class="text-3xl">📱</div>
                  <div class="flex-1">
                    <h3 class="text-lg font-bold text-cyan-300 mb-1">앱으로 설치하기</h3>
                    <p class="text-sm text-gray-300 mb-3">홈 화면에 추가하고 더 빠르게 접속하세요!</p>
                    <div class="flex gap-2">
                      <button onclick="installPWA()" class="flex-1 neon-button text-white px-4 py-2 rounded-lg font-bold text-sm">
                        설치하기
                      </button>
                      <button onclick="closeInstallBanner()" class="px-4 py-2 rounded-lg font-bold text-gray-400 hover:text-gray-200 text-sm">
                        나중에
                      </button>
                    </div>
                  </div>
                  <button onclick="closeInstallBanner()" class="text-gray-400 hover:text-gray-200">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
            \`;
            document.body.appendChild(installBanner);
          });
          
          // PWA 설치 함수
          window.installPWA = async () => {
            if (!deferredPrompt) return;
            
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
              console.log('User accepted the install prompt');
            }
            
            deferredPrompt = null;
            closeInstallBanner();
          };
          
          // 설치 배너 닫기
          window.closeInstallBanner = () => {
            const banner = document.getElementById('install-banner');
            if (banner) banner.remove();
          };
          
          // iOS 설치 안내 (Safari)
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
          const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
          
          if (isIOS && !isStandalone) {
            setTimeout(() => {
              const iosBanner = document.createElement('div');
              iosBanner.id = 'ios-install-banner';
              iosBanner.className = 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50';
              iosBanner.innerHTML = \`
                <div class="card rounded-xl shadow-2xl p-4 border-2 border-cyan-500/50">
                  <div class="flex items-start gap-3">
                    <div class="text-3xl">🍎</div>
                    <div class="flex-1">
                      <h3 class="text-lg font-bold text-cyan-300 mb-1">iOS 앱 설치하기</h3>
                      <p class="text-sm text-gray-300 mb-2">
                        Safari에서 <i class="fas fa-share" style="color: #00bfff;"></i> 버튼을 누르고<br>
                        "홈 화면에 추가"를 선택하세요!
                      </p>
                      <button onclick="this.parentElement.parentElement.parentElement.remove()" class="w-full px-4 py-2 rounded-lg font-bold text-gray-400 hover:text-gray-200 text-sm border border-gray-600">
                        닫기
                      </button>
                    </div>
                  </div>
                </div>
              \`;
              document.body.appendChild(iosBanner);
            }, 3000);
          }
        </script>
        </div>
    </body>
    </html>
  `)
})

export default app
