import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from './types'
import votes from './routes/votes'
import adRequests from './routes/adRequests'
import radioRequests from './routes/radioRequests'

const app = new Hono<{ Bindings: Bindings }>()

// CORS 미들웨어 적용
app.use('/api/*', cors())

// API 라우트 등록
app.route('/api/votes', votes)
app.route('/api/ad-requests', adRequests)
app.route('/api/radio-requests', radioRequests)

// 메인 페이지
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>팬덤 정보 공유 플랫폼</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .tab-button.active {
            border-bottom: 3px solid #3b82f6;
            color: #3b82f6;
          }
          .status-open { color: #10b981; }
          .status-in_progress { color: #f59e0b; }
          .status-closed { color: #ef4444; }
        </style>
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen">
            <!-- Header -->
            <header class="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
                <div class="max-w-7xl mx-auto px-4 py-6">
                    <h1 class="text-3xl font-bold flex items-center gap-3">
                        <i class="fas fa-heart"></i>
                        팬덤 정보 공유 플랫폼
                    </h1>
                    <p class="text-purple-100 mt-2">투표, 광고 시안, 라디오 신청 정보를 실시간으로 공유하세요</p>
                </div>
            </header>

            <!-- Tab Navigation -->
            <div class="bg-white shadow-md sticky top-0 z-10">
                <div class="max-w-7xl mx-auto px-4">
                    <div class="flex gap-2 border-b">
                        <button class="tab-button active px-6 py-4 font-semibold transition-colors" data-tab="votes">
                            <i class="fas fa-vote-yea mr-2"></i>투표 정보
                        </button>
                        <button class="tab-button px-6 py-4 font-semibold transition-colors" data-tab="ads">
                            <i class="fas fa-ad mr-2"></i>광고 시안 요청
                        </button>
                        <button class="tab-button px-6 py-4 font-semibold transition-colors" data-tab="radio">
                            <i class="fas fa-broadcast-tower mr-2"></i>라디오 신청
                        </button>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <main class="max-w-7xl mx-auto px-4 py-8">
                <!-- Votes Tab -->
                <div id="votes-tab" class="tab-content">
                    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 class="text-2xl font-bold mb-4">새 투표 정보 등록</h2>
                        <form id="vote-form" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" name="title" placeholder="투표 제목*" required 
                                    class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                                <input type="text" name="platform" placeholder="플랫폼 (예: Twitter, Mnet)" 
                                    class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                            </div>
                            <input type="url" name="vote_url" placeholder="투표 링크*" required 
                                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                            <textarea name="description" placeholder="설명" rows="3" 
                                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"></textarea>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="datetime-local" name="deadline" 
                                    class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                                <input type="text" name="created_by" placeholder="작성자" 
                                    class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                            </div>
                            <button type="submit" class="w-full bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                                <i class="fas fa-plus mr-2"></i>등록하기
                            </button>
                        </form>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h2 class="text-2xl font-bold mb-4">투표 정보 목록</h2>
                        <div id="votes-list" class="space-y-4"></div>
                    </div>
                </div>

                <!-- Ads Tab -->
                <div id="ads-tab" class="tab-content hidden">
                    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 class="text-2xl font-bold mb-4">광고 시안 요청 등록</h2>
                        <form id="ad-form" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" name="title" placeholder="제목*" required 
                                    class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                <input type="text" name="location" placeholder="위치*" required 
                                    class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            </div>
                            <textarea name="description" placeholder="설명" rows="3" 
                                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" name="contact_info" placeholder="연락처" 
                                    class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                <input type="datetime-local" name="deadline" 
                                    class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <select name="status" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                    <option value="open">진행중</option>
                                    <option value="in_progress">작업중</option>
                                    <option value="closed">완료</option>
                                </select>
                                <input type="text" name="created_by" placeholder="작성자" 
                                    class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            </div>
                            <button type="submit" class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                                <i class="fas fa-plus mr-2"></i>등록하기
                            </button>
                        </form>
                    </div>
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h2 class="text-2xl font-bold mb-4">광고 시안 요청 목록</h2>
                        <div id="ads-list" class="space-y-4"></div>
                    </div>
                </div>

                <!-- Radio Tab -->
                <div id="radio-tab" class="tab-content hidden">
                    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 class="text-2xl font-bold mb-4">라디오 신청 정보 등록</h2>
                        <form id="radio-form" class="space-y-4">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" name="title" placeholder="제목*" required 
                                    class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none">
                                <input type="text" name="station_name" placeholder="방송국명*" required 
                                    class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none">
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" name="program_name" placeholder="프로그램명" 
                                    class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none">
                                <select name="country" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none">
                                    <option value="domestic">국내</option>
                                    <option value="international">해외</option>
                                </select>
                            </div>
                            <input type="url" name="request_url" placeholder="신청 링크" 
                                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none">
                            <input type="text" name="request_method" placeholder="신청 방법 (예: 앱, 문자, 전화)" 
                                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none">
                            <textarea name="description" placeholder="설명" rows="3" 
                                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"></textarea>
                            <input type="text" name="created_by" placeholder="작성자" 
                                class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none">
                            <button type="submit" class="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold">
                                <i class="fas fa-plus mr-2"></i>등록하기
                            </button>
                        </form>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-md p-6 mb-4">
                        <div class="flex gap-4 mb-4">
                            <button class="filter-btn px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" data-country="all">
                                전체
                            </button>
                            <button class="filter-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" data-country="domestic">
                                국내
                            </button>
                            <button class="filter-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors" data-country="international">
                                해외
                            </button>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h2 class="text-2xl font-bold mb-4">라디오 신청 정보 목록</h2>
                        <div id="radio-list" class="space-y-4"></div>
                    </div>
                </div>
            </main>

            <!-- Footer -->
            <footer class="bg-gray-800 text-white py-6 mt-12">
                <div class="max-w-7xl mx-auto px-4 text-center">
                    <p>&copy; 2024 팬덤 정보 공유 플랫폼. 팬들을 위한, 팬들에 의한 정보 공유 서비스</p>
                </div>
            </footer>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            const API_BASE = '/api';
            
            // Tab switching
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabName = btn.dataset.tab;
                    
                    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
                    document.getElementById(tabName + '-tab').classList.remove('hidden');
                    
                    if (tabName === 'votes') loadVotes();
                    else if (tabName === 'ads') loadAds();
                    else if (tabName === 'radio') loadRadio();
                });
            });
            
            // Format date
            function formatDate(dateStr) {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                return date.toLocaleString('ko-KR');
            }
            
            // Load Votes
            async function loadVotes() {
                try {
                    const { data } = await axios.get(\`\${API_BASE}/votes\`);
                    const list = document.getElementById('votes-list');
                    
                    if (data.data.length === 0) {
                        list.innerHTML = '<p class="text-gray-500 text-center py-8">등록된 투표 정보가 없습니다.</p>';
                        return;
                    }
                    
                    list.innerHTML = data.data.map(vote => \`
                        <div class="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="text-xl font-bold text-gray-800">\${vote.title}</h3>
                                <button onclick="deleteVote(\${vote.id})" class="text-red-500 hover:text-red-700">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            \${vote.platform ? \`<span class="inline-block bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm mb-2">\${vote.platform}</span>\` : ''}
                            \${vote.description ? \`<p class="text-gray-600 mb-2">\${vote.description}</p>\` : ''}
                            <a href="\${vote.vote_url}" target="_blank" class="text-blue-600 hover:underline flex items-center gap-1 mb-2">
                                <i class="fas fa-external-link-alt"></i> 투표 페이지 바로가기
                            </a>
                            <div class="flex flex-wrap gap-3 text-sm text-gray-500 mt-3">
                                \${vote.deadline ? \`<span><i class="far fa-clock mr-1"></i>마감: \${formatDate(vote.deadline)}</span>\` : ''}
                                \${vote.created_by ? \`<span><i class="fas fa-user mr-1"></i>\${vote.created_by}</span>\` : ''}
                                <span><i class="fas fa-calendar mr-1"></i>등록: \${formatDate(vote.created_at)}</span>
                            </div>
                        </div>
                    \`).join('');
                } catch (error) {
                    console.error('Failed to load votes:', error);
                }
            }
            
            // Load Ads
            async function loadAds() {
                try {
                    const { data } = await axios.get(\`\${API_BASE}/ad-requests\`);
                    const list = document.getElementById('ads-list');
                    
                    if (data.data.length === 0) {
                        list.innerHTML = '<p class="text-gray-500 text-center py-8">등록된 광고 시안 요청이 없습니다.</p>';
                        return;
                    }
                    
                    const statusMap = {
                        'open': '진행중',
                        'in_progress': '작업중',
                        'closed': '완료'
                    };
                    
                    list.innerHTML = data.data.map(ad => \`
                        <div class="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="text-xl font-bold text-gray-800">\${ad.title}</h3>
                                <button onclick="deleteAd(\${ad.id})" class="text-red-500 hover:text-red-700">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div class="flex items-center gap-2 mb-2">
                                <span class="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                                    <i class="fas fa-map-marker-alt mr-1"></i>\${ad.location}
                                </span>
                                <span class="inline-block status-\${ad.status} font-semibold text-sm">
                                    \${statusMap[ad.status] || ad.status}
                                </span>
                            </div>
                            \${ad.description ? \`<p class="text-gray-600 mb-2">\${ad.description}</p>\` : ''}
                            <div class="flex flex-wrap gap-3 text-sm text-gray-500 mt-3">
                                \${ad.contact_info ? \`<span><i class="fas fa-envelope mr-1"></i>\${ad.contact_info}</span>\` : ''}
                                \${ad.deadline ? \`<span><i class="far fa-clock mr-1"></i>마감: \${formatDate(ad.deadline)}</span>\` : ''}
                                \${ad.created_by ? \`<span><i class="fas fa-user mr-1"></i>\${ad.created_by}</span>\` : ''}
                            </div>
                        </div>
                    \`).join('');
                } catch (error) {
                    console.error('Failed to load ads:', error);
                }
            }
            
            // Load Radio
            let currentFilter = 'all';
            async function loadRadio(country = 'all') {
                try {
                    currentFilter = country;
                    const url = country === 'all' ? \`\${API_BASE}/radio-requests\` : \`\${API_BASE}/radio-requests?country=\${country}\`;
                    const { data } = await axios.get(url);
                    const list = document.getElementById('radio-list');
                    
                    document.querySelectorAll('.filter-btn').forEach(btn => {
                        if (btn.dataset.country === country) {
                            btn.classList.remove('bg-gray-100', 'text-gray-700');
                            btn.classList.add('bg-green-100', 'text-green-700');
                        } else {
                            btn.classList.remove('bg-green-100', 'text-green-700');
                            btn.classList.add('bg-gray-100', 'text-gray-700');
                        }
                    });
                    
                    if (data.data.length === 0) {
                        list.innerHTML = '<p class="text-gray-500 text-center py-8">등록된 라디오 신청 정보가 없습니다.</p>';
                        return;
                    }
                    
                    const countryMap = {
                        'domestic': '국내',
                        'international': '해외'
                    };
                    
                    list.innerHTML = data.data.map(radio => \`
                        <div class="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="text-xl font-bold text-gray-800">\${radio.title}</h3>
                                <button onclick="deleteRadio(\${radio.id})" class="text-red-500 hover:text-red-700">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            <div class="flex items-center gap-2 mb-2">
                                <span class="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                                    <i class="fas fa-broadcast-tower mr-1"></i>\${radio.station_name}
                                </span>
                                \${radio.program_name ? \`<span class="text-gray-600">\${radio.program_name}</span>\` : ''}
                                <span class="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                                    \${countryMap[radio.country] || radio.country}
                                </span>
                            </div>
                            \${radio.description ? \`<p class="text-gray-600 mb-2">\${radio.description}</p>\` : ''}
                            \${radio.request_method ? \`<p class="text-gray-700 mb-1"><strong>신청 방법:</strong> \${radio.request_method}</p>\` : ''}
                            \${radio.request_url ? \`
                                <a href="\${radio.request_url}" target="_blank" class="text-blue-600 hover:underline flex items-center gap-1 mb-2">
                                    <i class="fas fa-external-link-alt"></i> 신청 페이지 바로가기
                                </a>
                            \` : ''}
                            <div class="flex flex-wrap gap-3 text-sm text-gray-500 mt-3">
                                \${radio.created_by ? \`<span><i class="fas fa-user mr-1"></i>\${radio.created_by}</span>\` : ''}
                                <span><i class="fas fa-calendar mr-1"></i>등록: \${formatDate(radio.created_at)}</span>
                            </div>
                        </div>
                    \`).join('');
                } catch (error) {
                    console.error('Failed to load radio:', error);
                }
            }
            
            // Delete functions
            async function deleteVote(id) {
                if (!confirm('정말 삭제하시겠습니까?')) return;
                try {
                    await axios.delete(\`\${API_BASE}/votes/\${id}\`);
                    loadVotes();
                } catch (error) {
                    alert('삭제 실패');
                }
            }
            
            async function deleteAd(id) {
                if (!confirm('정말 삭제하시겠습니까?')) return;
                try {
                    await axios.delete(\`\${API_BASE}/ad-requests/\${id}\`);
                    loadAds();
                } catch (error) {
                    alert('삭제 실패');
                }
            }
            
            async function deleteRadio(id) {
                if (!confirm('정말 삭제하시겠습니까?')) return;
                try {
                    await axios.delete(\`\${API_BASE}/radio-requests/\${id}\`);
                    loadRadio(currentFilter);
                } catch (error) {
                    alert('삭제 실패');
                }
            }
            
            // Form submissions
            document.getElementById('vote-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    await axios.post(\`\${API_BASE}/votes\`, data);
                    e.target.reset();
                    loadVotes();
                    alert('등록 완료!');
                } catch (error) {
                    alert('등록 실패');
                }
            });
            
            document.getElementById('ad-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    await axios.post(\`\${API_BASE}/ad-requests\`, data);
                    e.target.reset();
                    loadAds();
                    alert('등록 완료!');
                } catch (error) {
                    alert('등록 실패');
                }
            });
            
            document.getElementById('radio-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    await axios.post(\`\${API_BASE}/radio-requests\`, data);
                    e.target.reset();
                    loadRadio(currentFilter);
                    alert('등록 완료!');
                } catch (error) {
                    alert('등록 실패');
                }
            });
            
            // Filter buttons
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    loadRadio(btn.dataset.country);
                });
            });
            
            // Initial load
            loadVotes();
        </script>
    </body>
    </html>
  `)
})

export default app
