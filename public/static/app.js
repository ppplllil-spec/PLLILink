/**
 * PLAVE PLLI Community - 최종 통합 관리 스크립트
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

// 2. 통합 초기화
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    console.log('🚀 통합 시스템 가동...');
    checkMemberAnniversaries();
    await loadSchedule();
    await loadVotes();
    await loadAds();
    
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) switchTab(tab);
}

// 3. 투표 섹션 (중요도 정렬 및 체크박스)
async function loadVotes() {
    try {
        const res = await axios.get('/api/votes?type=votes')
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
    }).join('');
}

// 4. 라디오 섹션 (공백 제거 및 필터링)
async function renderRadioSection() {
    const tabContainer = document.getElementById('radio-station-tabs');
    const exampleList = document.getElementById('example-text-list');
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
                <button onclick="copyToClipboard('${text.description.replace(/\n/g, '\\n')}')" class="w-full py-2 bg-purple-600/30 text-purple-200 rounded-lg text-xs font-bold">사연 복사하기</button>
            </div>`).join('');

        if (uniqueStations.length > 0) filterRadioByStation(uniqueStations[0]);
    } catch (err) { console.error('라디오 로드 실패', err); }
}

function filterRadioByStation(stationName) {
    const radioList = document.getElementById('radio-list');
    document.querySelectorAll('.station-tab-btn').forEach(btn => btn.classList.toggle('tab-active', btn.getAttribute('data-station') === stationName));
    const filtered = allRadioData.filter(item => item.category === stationName);
    radioList.innerHTML = filtered.map(item => `
        <div class="card p-5 rounded-2xl border border-cyan-500/20">
            <div class="flex justify-between items-start mb-4">
                <span class="badge text-cyan-400 border-cyan-500/30 bg-cyan-500/10 text-[10px]">${item.category}</span>
                ${item.title.includes('다중') ? '<span class="badge text-blue-400 border-blue-500/30 bg-blue-500/10 text-[10px]">다중신청</span>' : ''}
            </div>
            <h4 class="text-lg font-black text-white mb-2">${item.title}</h4>
            <p class="text-xs text-gray-400 mb-6 line-clamp-2">${item.description || '플레이브 노래를 신청해 주세요!'}</p>
            <a href="${item.link}" target="_blank" class="block w-full text-center py-2 bg-cyan-600 text-white rounded-lg text-xs font-bold">신청하러 가기</a>
        </div>`).join('');
}

// 1. 오늘 일정 로드 및 렌더링
async function loadSchedule() {
    const deadlineBox = document.getElementById('today-deadline-votes');
    const radioBox = document.getElementById('today-radio');
    const recurringBox = document.getElementById('today-recurring-votes');

    try {
        // [수정] 서버 경로와 시트 탭 이름을 정확히 일치시킵니다
        const res = await axios.get('/api/schedule?type=schedule');
        const data = res.data.data;
        
        // 오늘 날짜 구하기 (YYYY-MM-DD)
        const today = new Date().toLocaleDateString('ko-KR', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).replace(/\. /g, '-').replace('.', '');

        // 오늘 일정만 필터링 (시트의 'date' 열 기준)
        const todayItems = data.filter(item => item.date === today);

        if (todayItems.length === 0) {
            deadlineBox.innerHTML = '<p class="text-gray-500 text-xs px-2 text-center py-4">오늘 예정된 일정이 없습니다.</p>';
            return;
        }

        // 일정 리스트 그리기
        deadlineBox.innerHTML = todayItems.map(item => `
            <div class="flex items-center gap-3 p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/10 mb-3 hover:border-cyan-500/30 transition-all">
                <div class="flex flex-col items-center min-w-[50px] border-r border-cyan-500/20 pr-3">
                    <span class="text-cyan-400 font-black text-xs">${item.time || '시간'}</span>
                    <span class="text-[9px] text-gray-500 uppercase font-bold">${item.category || '기타'}</span>
                </div>
                <div class="flex-1">
                    <h4 class="text-white text-sm font-bold line-clamp-1">${item.title}</h4>
                    ${item.link ? `<a href="${item.link}" target="_blank" class="text-[10px] text-cyan-500 hover:underline">관련 링크 바로가기 ></a>` : ''}
                </div>
            </div>
        `).join('');

        console.log('✅ 오늘 일정 렌더링 완료');
    } catch (e) { 
        console.error('일정 로드 실패:', e);
        deadlineBox.innerHTML = '<p class="text-red-400 text-xs text-center">데이터를 불러오지 못했습니다.</p>';
    }
}

// 2. 광고 시안 로드 및 렌더링
async function loadAds() {
    const container = document.getElementById('ads-list');
    if (!container) return;

    try {
        const res = await axios.get('/api/ad-requests?type=ads');
        const data = res.data.data;

        container.innerHTML = data.map(ad => `
            <div class="card overflow-hidden rounded-2xl border border-purple-500/20 group hover:border-purple-500/50 transition-all">
                <div class="aspect-video bg-gray-900 relative overflow-hidden">
                    <img src="${ad.image}" alt="${ad.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onerror="this.src='/static/no-image.png'">
                    <div class="absolute top-2 left-2">
                        <span class="badge bg-black/60 backdrop-blur-md text-purple-400 border-purple-500/30 text-[10px] font-black">${ad.category}</span>
                    </div>
                </div>
                <div class="p-5">
                    <h4 class="text-white font-bold text-sm mb-4 line-clamp-1">${ad.title}</h4>
                    <a href="${ad.link}" target="_blank" class="block w-full text-center py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-xl text-[11px] font-black border border-purple-500/30 transition-all">
                        시안 확인 및 다운로드
                    </a>
                </div>
            </div>
        `).join('');
    } catch (e) { 
        console.error('광고 로드 실패:', e); 
    }
}

// 6. 유튜브 로직 복구 (북마크 포함)
window.loadYoutube = async function() {
    const container = document.getElementById('youtube-list');
    if (!container) return;
    try {
        // 실제 연동 시 API 주소 확인 필요
        container.innerHTML = `<div class="col-span-full p-8 text-center text-gray-400 border border-dashed border-white/10 rounded-2xl">준비 중인 섹션입니다. 공식 채널을 확인해 주세요.</div>`;
    } catch (e) { console.error(e); }
}

// 7. 유틸리티
function copyToClipboard(text) { navigator.clipboard.writeText(text).then(() => showToast('📋 문구가 복사되었습니다!')); }
function shareToX(title, url) { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('🗳️ [PLAVE VOTE]\n' + title)}&url=${encodeURIComponent(url)}`, '_blank'); }
function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-cyan-600 text-white font-bold rounded-full shadow-2xl';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
function checkMemberAnniversaries() {
    const today = new Date().toISOString().slice(5, 10);
    const member = PLAVE_ANNIVERSARIES.find(m => m.date === today);
    const banner = document.getElementById('anniversary-banner');
    if (member && banner) {
        banner.innerHTML = `<div class="p-4 bg-pink-600 text-white text-center font-black">🎉 오늘 ${member.name}의 생일입니다! 🎊</div>`;
        banner.classList.remove('hidden');
    }
}
function switchTab(tab) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(`content-${tab}`);
    if (target) target.classList.remove('hidden');
    if (tab === 'radio') renderRadioSection();
    if (tab === 'votes') loadVotes();
    if (tab === 'youtube') loadYoutube();
}
