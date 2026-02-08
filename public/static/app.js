// 1. 전역 상태 관리
let currentTab = 'schedule';
let radioFilter = 'all';
let isAutoFilling = false;
let allVotes = []; 
let currentVoteFilter = 'all';
let currentSearchQuery = '';
let isAdminMode = false; // [수정] 관리 모드 상태
let modalEventListeners = [];

// [수정] 플레이브 멤버 순서 및 기념일 정보
const MEMBERS_ORDER = ['예준💙', '노아💜', '밤비💗', '은호❤️', '하민🖤'];
const PLAVE_ANNIVERSARIES = [
    { name: '노아💜', date: '02-10' },
    { name: '은호❤️', date: '05-24' },
    { name: '밤비💗', date: '07-15' },
    { name: '예준💙', date: '09-12' },
    { name: '하민🖤', date: '11-01' }
];

// [수정] 투표 중요도 우선순위
const VOTE_PRIORITY = { '시상식': 1, '생일': 2, '일반': 3 };

// 2. 중요도 기반 투표 정렬 함수
function sortVotesByImportance(votes) {
    return votes.sort((a, b) => {
        const pA = VOTE_PRIORITY[a.category] || 99;
        const pB = VOTE_PRIORITY[b.category] || 99;
        
        if (pA === pB) {
            return new Date(a.deadline || '9999-12-31') - new Date(b.deadline || '9999-12-31');
        }
        return pA - pB;
    });
}

// 3. 토스트 알림 시스템
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
    const bgColor = type === 'success' ? 'from-green-500 to-green-600' : 
                    type === 'error' ? 'from-red-500 to-red-600' : 'from-blue-500 to-blue-600';
    
    toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl bg-gradient-to-r ${bgColor} text-white font-bold transform transition-all duration-300 translate-x-full flex items-center gap-3 max-w-md`;
    toast.innerHTML = `<span class="text-2xl">${icon}</span><span class="flex-1">${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.style.transform = 'translateX(0)', 10);
    setTimeout(() => {
        toast.style.transform = 'translateX(150%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 4. 통합 투표 렌더링 (중복 제거 및 텍스트 넘침 방지)
function renderFilteredVotes() {
    const votesList = document.getElementById('votes-list');
    if (!votesList) return;

    const completedVotes = getCompletedVotes().votes;
    
    let filtered = allVotes.filter(vote => {
        if (currentSearchQuery && !vote.title.toLowerCase().includes(currentSearchQuery)) return false;
        if (currentVoteFilter === 'deadline') return vote.deadline && new Date(vote.deadline) > new Date();
        if (currentVoteFilter === 'completed') return completedVotes.includes(vote.id);
        if (currentVoteFilter === 'incomplete') return !completedVotes.includes(vote.id);
        return true;
    });

    const sortedVotes = sortVotesByImportance(filtered);

    votesList.innerHTML = sortedVotes.map(vote => {
        const isCompleted = completedVotes.includes(vote.id);
        const priorityColor = vote.category === '시상식' ? 'border-yellow-400 border-2' : 'border-cyan-500/30 border';
        
        return `
        <div class="card rounded-2xl p-5 transition-all ${priorityColor} ${isCompleted ? 'opacity-60 grayscale' : 'hover:scale-[1.01]'}">
            <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-2">
                    <input type="checkbox" data-vote-checkbox="${vote.id}" ${isCompleted ? 'checked' : ''} 
                           class="w-5 h-5 rounded border-2 border-cyan-500 bg-gray-800 checked:bg-cyan-500 transition-all cursor-pointer">
                    <span class="text-[10px] font-black ${vote.category === '시상식' ? 'text-yellow-400' : 'text-purple-400'} uppercase">
                        [${vote.category || '일반'}]
                    </span>
                </div>
                ${isAdminMode ? `
                    <div class="flex gap-2">
                        <button onclick="editItem('votes', ${vote.id})" class="text-cyan-400 text-xs hover:underline"><i class="fas fa-edit"></i></button>
                        <button onclick="deleteItem('votes', ${vote.id})" class="text-red-400 text-xs hover:underline"><i class="fas fa-trash"></i></button>
                    </div>
                ` : ''}
            </div>
            
            <h3 class="text-lg font-bold text-cyan-100 mb-1 truncate-text ${isCompleted ? 'line-through opacity-50' : ''}" title="${escapeHtml(vote.title)}">
                ${escapeHtml(vote.title)}
            </h3>
            <p class="text-xs text-gray-400 mb-4 line-clamp-2 min-h-[2.5rem]">
                ${escapeHtml(vote.description || '상세 내용이 없습니다.')}
            </p>
            
            <div class="flex flex-col gap-2">
                ${vote.deadline ? `<div class="text-[10px] font-mono text-cyan-400">${getCountdownHTML(vote.deadline)}</div>` : ''}
                <div class="flex gap-2">
                    <a href="${escapeHtml(vote.vote_url)}" target="_blank" class="flex-1 text-center py-2 bg-cyan-600/20 border border-cyan-500/50 rounded-lg text-cyan-300 text-xs font-bold hover:bg-cyan-500 transition-all">
                        투표하러 가기
                    </a>
                    <button onclick="shareToSNS('twitter', '${escapeHtml(vote.vote_url)}', '${escapeHtml(vote.title)}')" class="px-3 py-2 bg-gray-800 rounded-lg text-blue-400">
                        <i class="fab fa-twitter"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('') || '<div class="col-span-full text-center text-gray-500 py-10">내용이 없습니다.</div>';
    
    updateCompletionStats();
}

// 5. 관리 모드 및 실수 방지 로직
function toggleAdminMode() {
    isAdminMode = !isAdminMode;
    const btn = document.getElementById('admin-switch');
    if (btn) {
        btn.innerText = isAdminMode ? 'ADMIN: ON' : 'ADMIN: OFF';
        btn.classList.toggle('bg-purple-600', isAdminMode);
    }
    showToast(isAdminMode ? '편집 모드가 활성화되었습니다.' : '편집 모드가 꺼졌습니다.', 'info');
    renderFilteredVotes(); // 버튼 표시 업데이트를 위해 재렌더링
}

// 6. 인증샷 편집기 (워터마크 및 하트 가리기)
function setWatermark() {
    const input = document.getElementById('watermark-input');
    if (input) input.placeholder = "예 : PLLI"; // [수정] 요청 문구 반영
}

// 하트 스티커로 정보 가리기 기능 (캔버스 연동 시 호출)
function attachHeartGlow(ctx, x, y) {
    ctx.font = '50px serif';
    ctx.textAlign = 'center';
    ctx.fillText('💜', x, y + 20); // [수정] 보라색 하트로 가리기
}

// 7. 카운트다운 및 기타 유틸리티 (기존 로직 유지)
function startCountdownUpdates() {
    setInterval(() => {
        document.querySelectorAll('[data-deadline]').forEach(element => {
            const deadline = element.getAttribute('data-deadline');
            element.innerHTML = getCountdownHTML(deadline);
        });
    }, 1000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 페이지 초기 로드
document.addEventListener('DOMContentLoaded', () => {
    loadSchedule();
    loadVotes();
    loadAds();
    loadRadio();
    loadTips();
    startCountdownUpdates();
    setWatermark(); // 초기 워터마크 설정
});

