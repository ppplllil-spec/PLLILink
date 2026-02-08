/**
 * PLAVE PLLI Community - 최종 통합 관리 스크립트 (기능 100% 통합)
 */

// 1. 전역 상태 및 설정
let allRadioData = [];
let allVotes = [];
let isAdminMode = false;
let currentTab = 'schedule';

const MEMBERS_ORDER = ['예준💙', '노아💜', '밤비💗', '은호❤️', '하민🖤'];
const PLAVE_ANNIVERSARIES = [
    { name: '노아💜', date: '02-10' },
    { name: '은호❤️', date: '05-24' },
    { name: '밤비💗', date: '07-15' },
    { name: '예준💙', date: '09-12' },
    { name: '하민🖤', date: '11-01' }
];

// 2. 통합 초기화 및 실행
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    console.log('🚀 통합 시스템 가동...');
    checkMemberAnniversaries(); // 생일 배너
    await loadSchedule();       // 오늘 일정 (최우선)
    await loadVotes();          // 투표 가이드
    await loadAds();            // 광고 시안
    
    // URL 파라미터 체크 (예: ?tab=radio 이면 해당 탭으로 바로 이동)
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) switchTab(tab);
}

// 3. 투표 섹션 (체크박스 및 SNS 공유 통합)
async function loadVotes() {
    try {
        const res = await axios.get('/api/votes?type=votes');
        allVotes = res.data.data;
        renderVotes();
    } catch (err) { console.error('투표 로드 실패:', err); }
}

function renderVotes() {
    const container = document.getElementById('votes-list');
    if (!container) return;
    const completedVotes = JSON.parse(localStorage.getItem('completed_votes') || '[]');

    container.innerHTML = allVotes.map(vote => {
        const isCompleted = completedVotes.includes(vote.id);
        return `
            <div class="card p-5 rounded-2xl border ${isCompleted ? 'border-gray-700 opacity-60' : 'border-cyan-500/20'} transition-all">
                <div class="flex justify-between mb-3">
                    <div class="flex items-center gap-2">
                        <input type="checkbox" onchange="toggleVote(${vote.id})" ${isCompleted ? 'checked' : ''} class="w-4 h-4 rounded border-cyan-500 bg-gray-800 checked:bg-cyan-500 cursor-pointer">
                        <span class="badge text-cyan-400 border-cyan-500/30 text-[10px]">${vote.category}</span>
                    </div>
                    <span class="text-[10px] text-gray-500">~ ${vote.deadline}</span>
                </div>
                <h4 class="text-lg font-black text-white mb-4 ${isCompleted ? 'line-through' : ''}">${vote.title}</h4>
                <div class="flex gap-2">
                    <a href="${vote.link}" target="_blank" class="flex-1 text-center py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all">투표하기</a>
                    <button onclick="shareToX('${vote.title}', '${vote.link}')" class="px-3 py-2 bg-gray-800 rounded-lg text-blue-400"><i class="fab fa-twitter"></i></button>
                </div>
            </div>`;
    }).join('') || '<p class="col-span-full text-center text-gray-500 py-10">등록된 투표가 없습니다.</p>';
}

// 4. 라디오 섹션 (탭 필터링 및 공백 제거 통합)
async function renderRadioSection() {
    const tabContainer = document.getElementById('radio-station-tabs');
    const exampleList = document.getElementById('example-text-list');
    if (!tabContainer || !exampleList) return;

    try {
        const res = await axios.get('/api/radio-requests?type=radioRequests');
        allRadioData = res.data.data.map(item => ({ ...item, category: item.category ? item.category.trim() : "" }));

        const radioStations = allRadioData.filter(item => item.category !== '예시문' && item.category !== "");
        const uniqueStations = [...new Set(radioStations.map(s => s.category))];
        
        tabContainer.innerHTML = uniqueStations.map(station => `
            <button onclick="filterRadioByStation('${station}')" class="station-tab-btn px-4 py-2 rounded-xl font-bold transition-all text-gray-400 border border-cyan-800/30" data-station="${station}">${station}</button>`).join('');

        const exampleTexts = allRadioData.filter(item => item.category === '예시문');
        exampleList.innerHTML = exampleTexts.map(text => `
            <div class="card p-4 rounded-xl border border-purple-500/30 bg-purple-900/5">
                <h4 class="text-purple-400 font-bold mb-1">${text.title}</h4>
                <p class="text-sm text-gray-300 mb-4">${text.description}</p>
                <button onclick="copyToClipboard('${text.description.replace(/\n/g, '\\n')}')" class="w-full py-2 bg-purple-600/30 text-purple-200 rounded-lg text-xs font-bold transition-all">사연 복사하기</button>
            </div>`).join('');

        if (uniqueStations.length > 0) filterRadioByStation(uniqueStations[0]);
    } catch (err) { console.error('라디오 로드 실패', err); }
}

function filterRadioByStation(stationName) {
    const radioList = document.getElementById('radio-list');
    document.querySelectorAll('.station-tab-btn').forEach(btn => btn.classList.toggle('tab-active', btn.getAttribute('data-station') === stationName));
    const filtered = allRadioData.filter(item => item.category === stationName);
    radioList.innerHTML = filtered.map(item => `
        <div class="card p-5 rounded-2xl border border-cyan-500/20 hover:border-cyan-500/50 transition-all">
            <div class="flex justify-between items-start mb-4">
                <span class="badge text-cyan-400 border-cyan-500/30 bg-cyan-500/10 text-[10px]">${item.category}</span>
                ${item.title.includes('다중') ? '<span class="badge text-blue-400 border-blue-500/30 bg-blue-500/10 text-[10px]">다중신청</span>' : ''}
            </div>
            <h4 class="text-lg font-black text-white mb-2">${item.title}</h4>
            <p class="text-xs text-gray-400 mb-6 line-clamp-2">${item.description || '플레이브 노래를 신청해 주세요!'}</p>
            <a href="${item.link}" target="_blank" class="block w-full text-center py-2 bg-cyan-600 text-white rounded-lg text-xs font-bold transition-all">신청하러 가기</a>
        </div>`).join('');
}

// 5. 일정 및 광고 (영문 헤더 매칭)
async function loadSchedule() {
    const deadlineBox = document.getElementById('today-deadline-votes');
    if (!deadlineBox) return;
    try {
        const res = await axios.get('/api/schedule?type=schedule');
        const today = new Date().toISOString().split('T')[0];
        const todayItems = res.data.data.filter(item => item.date === today);
        deadlineBox.innerHTML = todayItems.length ? todayItems.map(item => `
            <div class="flex items-center gap-3 p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/10 mb-2">
                <span class="text-cyan-400 font-bold text-xs">${item.time}</span>
                <span class="text-white text-xs font-medium line-clamp-1">${item.title}</span>
            </div>`).join('') : '<p class="text-gray-500 text-xs text-center py-10">오늘 일정이 없습니다.</p>';
    } catch (e) { console.error('일정 로드 실패', e); }
}

async function loadAds() {
    const container = document.getElementById('ads-list');
    if (!container) return;
    try {
        const res = await axios.get('/api/ad-requests?type=ads');
        container.innerHTML = res.data.data.map(ad => `
            <div class="card rounded-2xl overflow-hidden border border-purple-500/20 group hover:border-purple-500/50 transition-all">
                <div class="aspect-video relative overflow-hidden bg-gray-900">
                    <img src="${ad.image}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onerror="this.src='/static/no-image.png'">
                    <span class="absolute top-2 left-2 badge bg-black/60 text-purple-400 border-purple-500/30 text-[10px]">${ad.category}</span>
                </div>
                <div class="p-4">
                    <h4 class="text-white font-bold text-sm mb-3 line-clamp-1">${ad.title}</h4>
                    <a href="${ad.link}" target="_blank" class="block w-full py-2 bg-gray-800 text-cyan-400 text-center rounded-lg text-[10px] font-bold">상세보기</a>
                </div>
            </div>`).join('') || '<p class="col-span-full text-center text-gray-500 py-10">광고 시안이 없습니다.</p>';
    } catch (e) { console.error('광고 로드 실패', e); }
}

// 6. 모달 제어 (섹션별 필드 자동 생성)
function openAddModal() {
    const modal = document.getElementById('add-modal');
    const formContent = document.getElementById('form-content');
    if (!modal || !formContent) return;

    let fields = '';
    if (currentTab === 'votes') {
        fields = `
            <input type="text" name="category" placeholder="플랫폼 (예: 뮤빗)" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white mb-3" required>
            <input type="text" name="title" placeholder="투표 제목" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white mb-3" required>
            <input type="url" name="link" placeholder="투표 링크" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white mb-3" required>
            <input type="text" name="deadline" placeholder="마감 (YYYY-MM-DD)" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white">`;
    } else if (currentTab === 'radio') {
        fields = `
            <input type="text" name="category" placeholder="방송사 (예: MBC)" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white mb-3" required>
            <input type="text" name="title" placeholder="제목/프로그램" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white mb-3" required>
            <input type="url" name="link" placeholder="게시판 링크" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white mb-3" required>
            <textarea name="description" placeholder="사연 예시" class="w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl text-white h-32"></textarea>`;
    } else {
        fields = `<p class="text-gray-400 text-center py-4">이 탭의 내용은 관리 도구에서만 추가 가능합니다.</p>`;
    }
    formContent.innerHTML = fields;
    modal.classList.remove('hidden');
}

function closeAddModal() {
    const modal = document.getElementById('add-modal');
    if (modal) modal.classList.add('hidden');
}

// 7. 유틸리티 (복사, 공유, 토스트, 탭 전환)
function copyToClipboard(text) { navigator.clipboard.writeText(text).then(() => showToast('📋 문구가 복사되었습니다!')); }

function shareToX(title, url) { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('🗳️ [PLAVE VOTE]\n' + title + '\n지금 바로 참여하세요! ✨\n\n#PLAVE #플레이브 #PLLI #플리')}&url=${encodeURIComponent(url)}`, '_blank'); }

function toggleVote(voteId) {
    let completed = JSON.parse(localStorage.getItem('completed_votes') || '[]');
    completed.includes(voteId) ? completed = completed.filter(id => id !== voteId) : completed.push(voteId);
    localStorage.setItem('completed_votes', JSON.stringify(completed));
    if (completed.includes(voteId)) showToast('오늘의 투표 완료! 💙💜💗❤️🖤');
    renderVotes();
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`content-${tab}`);
    if (target) target.classList.remove('hidden');
    
    // 버튼 스타일 업데이트
    document.querySelectorAll('[id^="tab-"]').forEach(btn => btn.classList.remove('tab-active', 'text-cyan-300'));
    const activeBtn = document.getElementById(`tab-${tab}`);
    if (activeBtn) activeBtn.classList.add('tab-active', 'text-cyan-300');

    if (tab === 'radio') renderRadioSection();
    if (tab === 'votes') loadVotes();
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-cyan-600 text-white font-bold rounded-full shadow-2xl animate-bounce';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function checkMemberAnniversaries() {
    const today = new Date().toISOString().slice(5, 10);
    const member = PLAVE_ANNIVERSARIES.find(m => m.date === today);
    const banner = document.getElementById('anniversary-banner');
    if (member && banner) {
        banner.innerHTML = `<div class="p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center font-black animate-pulse">🎂 오늘 PLAVE의 보물, ${member.name}의 생일입니다! 모두 축하해 주세요! 💙💜💗❤️🖤</div>`;
        banner.classList.remove('hidden');
    }
}
