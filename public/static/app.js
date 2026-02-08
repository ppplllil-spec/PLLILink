/**
 * PLAVE PLLI Community - 모든 기능 통합 스크립트
 */

// 1. 전역 상태 관리
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

// 2. 초기화 로직
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    console.log('🚀 통합 앱 초기화 시작...');
    checkMemberAnniversaries(); // 기념일 체크
    await loadSchedule();       // 오늘 일정 로드
    await loadVotes();          // 투표 정보 로드
    
    // URL 파라미터에 따라 탭 자동 전환
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) switchTab(tab);
}

// 3. 투표 섹션 기능 (체크박스 및 완료 기록 유지)
async function loadVotes() {
    try {
        const res = await axios.get('/api/votes?type=votes');
        allVotes = res.data.data;
        renderVotes();
    } catch (err) {
        console.error('투표 로드 실패:', err);
    }
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
                        <input type="checkbox" onchange="toggleVote(${vote.id})" ${isCompleted ? 'checked' : ''} 
                               class="w-4 h-4 rounded border-cyan-500 bg-gray-800 checked:bg-cyan-500 cursor-pointer">
                        <span class="badge text-cyan-400 border-cyan-500/30 text-[10px]">${vote.category}</span>
                    </div>
                    <span class="text-[10px] text-gray-500">~ ${vote.deadline}</span>
                </div>
                <h4 class="text-lg font-black text-white mb-4 ${isCompleted ? 'line-through' : ''}">${vote.title}</h4>
                <div class="flex gap-2">
                    <a href="${vote.link}" target="_blank" class="flex-1 text-center py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all">
                        투표하기
                    </a>
                    <button onclick="shareToX('${vote.title}', '${vote.link}')" class="px-3 py-2 bg-gray-800 rounded-xl text-blue-400">
                        <i class="fab fa-twitter"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 4. 라디오 섹션 기능 (공백 제거 및 사연 복사 통합)
async function renderRadioSection() {
    const tabContainer = document.getElementById('radio-station-tabs');
    const exampleList = document.getElementById('example-text-list');

    try {
        const res = await axios.get('/api/radio-requests?type=radioRequests');
        allRadioData = res.data.data.map(item => ({
            ...item,
            category: item.category ? item.category.trim() : ""
        }));

        const radioStations = allRadioData.filter(item => item.category !== '예시문' && item.category !== "");
        const uniqueStations = [...new Set(radioStations.map(s => s.category))];
        
        tabContainer.innerHTML = uniqueStations.map(station => `
            <button onclick="filterRadioByStation('${station}')" 
                    class="station-tab-btn px-4 py-2 rounded-xl font-bold transition-all text-gray-400 border border-cyan-800/30"
                    data-station="${station}">
                ${station}
            </button>
        `).join('');

        const exampleTexts = allRadioData.filter(item => item.category === '예시문');
        exampleList.innerHTML = exampleTexts.map(text => `
            <div class="card p-4 rounded-xl border border-purple-500/30 bg-purple-900/5">
                <h4 class="text-purple-400 font-bold mb-1">${text.title}</h4>
                <p class="text-sm text-gray-300 mb-4">${text.description}</p>
                <button onclick="copyToClipboard('${text.description.replace(/\n/g, '\\n')}')" 
                        class="w-full py-2 bg-purple-600/30 text-purple-200 rounded-lg text-xs font-bold">
                    사연 복사하기
                </button>
            </div>
        `).join('');

        if (uniqueStations.length > 0) filterRadioByStation(uniqueStations[0]);
    } catch (err) { console.error(err); }
}

// 5. 공통 유틸리티 (복사, 공유, 탭 전환, 관리자 모드)
function toggleVote(voteId) {
    let completed = JSON.parse(localStorage.getItem('completed_votes') || '[]');
    if (completed.includes(voteId)) {
        completed = completed.filter(id => id !== voteId);
    } else {
        completed.push(voteId);
        showToast('오늘의 투표 완료! 고생하셨습니다 💙💜💗❤️🖤');
    }
    localStorage.setItem('completed_votes', JSON.stringify(completed));
    renderVotes();
}

function shareToX(title, url) {
    const text = `🗳️ [PLAVE VOTE]\n${title}\n지금 바로 참여하세요! ✨\n\n#PLAVE #플레이브 #PLLI #플리`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`content-${tab}`).classList.remove('hidden');
    
    if (tab === 'radio') renderRadioSection();
    if (tab === 'votes') loadVotes();
}

function toggleAdminMode() {
    isAdminMode = !isAdminMode;
    const btn = document.getElementById('admin-switch');
    if (btn) btn.innerText = isAdminMode ? 'ADMIN: ON' : 'ADMIN: OFF';
    showToast(isAdminMode ? '관리자 모드 활성화' : '관리자 모드 비활성화');
    renderVotes(); // 버튼 노출 업데이트를 위해 재렌더링
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-cyan-600 text-white font-bold rounded-full shadow-2xl animate-bounce';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// 생일 배너 기능 복구
function checkMemberAnniversaries() {
    const today = new Date().toISOString().slice(5, 10); // MM-DD
    const member = PLAVE_ANNIVERSARIES.find(m => m.date === today);
    const banner = document.getElementById('anniversary-banner');
    if (member && banner) {
        banner.innerHTML = `<div class="p-4 bg-pink-600 text-white text-center font-black">🎉 오늘 플리들의 보물, ${member.name}의 생일입니다! 🎊</div>`;
        banner.classList.remove('hidden');
    }
}
