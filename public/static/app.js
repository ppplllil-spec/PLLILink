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



// 7. 투표 정보 로드
async function loadVotes() {
    try {
        const response = await axios.get('/api/votes');
        const votes = response.data.data;
        
        const votesList = document.getElementById('votes-list');
        if (!votesList) return;
        
        if (!votes || votes.length === 0) {
            votesList.innerHTML = `
                <div class="col-span-full text-center text-gray-400 py-8">
                    <i class="fas fa-inbox text-4xl mb-4 opacity-50"></i>
                    <p>등록된 투표 정보가 없습니다.</p>
                </div>
            `;
            return;
        }
        
        votesList.innerHTML = votes.map(vote => {
            const deadline = vote.deadline ? new Date(vote.deadline) : null;
            const isExpired = deadline && deadline < new Date();
            const deadlineText = deadline ? deadline.toLocaleString('ko-KR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '상시';
            
            return `
                <div class="glass-panel p-6 rounded-xl border ${isExpired ? 'border-gray-600 opacity-60' : 'border-cyan-500/20 hover:border-cyan-500/50'} transition-all">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="text-xl font-bold text-cyan-300">${escapeHtml(vote.title)}</h3>
                        ${isAdminMode ? `
                        <div class="flex gap-2">
                            <button data-action="edit-vote" data-id="${vote.id}" class="text-cyan-400 text-xs hover:underline">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button data-action="delete-item" data-type="votes" data-id="${vote.id}" class="text-red-400 text-xs hover:underline">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        ` : ''}
                    </div>
                    ${vote.description ? `<p class="text-sm text-gray-400 mb-4">${escapeHtml(vote.description)}</p>` : ''}
                    <div class="flex items-center gap-2 text-sm text-gray-400 mb-4">
                        <i class="fas fa-clock"></i>
                        <span class="${isExpired ? 'text-red-400' : 'text-cyan-400'}">${deadlineText}${isExpired ? ' (마감)' : ''}</span>
                    </div>
                    ${vote.vote_url ? `
                    <a href="${escapeHtml(vote.vote_url)}" target="_blank" 
                       class="block w-full text-center bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-lg transition-all">
                        <i class="fas fa-vote-yea mr-2"></i>투표하러 가기
                    </a>
                    ` : ''}
                    ${isAdminMode ? `
                    <button data-action="open-proof" class="mt-3 w-full text-center bg-pink-600/20 hover:bg-pink-600/30 text-pink-400 border border-pink-500/50 font-bold py-2 px-4 rounded-lg transition-all">
                        <i class="fas fa-camera mr-2"></i>인증하기
                    </button>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        console.log('✅ Votes loaded:', votes.length);
    } catch (error) {
        console.error('❌ Failed to load votes:', error);
        const votesList = document.getElementById('votes-list');
        if (votesList) {
            votesList.innerHTML = `
                <div class="col-span-full text-center text-red-400 py-8">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <p>투표 정보를 불러오는데 실패했습니다.</p>
                </div>
            `;
        }
    }
}

// 7-1. 일정 정보 로드
async function loadSchedule() {
    try {
        const response = await axios.get('/api/schedule/today');
        const scheduleData = response.data.data;
        
        console.log('📅 Schedule data loaded:', scheduleData);
        // renderTodaySchedule()에서 실제 렌더링 수행
    } catch (error) {
        console.error('❌ Failed to load schedule:', error);
    }
}

// 8. 라디오 신청 정보 로드 및 필터링

async function loadRadio() {

    try {

        const url = radioFilter === 'all' ? '/api/radio-requests' : `/api/radio-requests?country=${radioFilter}`;

        const response = await axios.get(url);

        const radios = response.data.data;

        const today = new Date().getDay().toString(); // 오늘 요일 (0:일 ~ 6:토)



        const radioList = document.getElementById('radio-list');

        if (!radioList) return;



        radioList.innerHTML = radios.map(radio => {

            // 요일 반복 설정 확인

            const recurrenceDays = JSON.parse(radio.recurrence_days || '[]');

            const isToday = recurrenceDays.includes(today);

            const todayBadge = isToday ? '<span class="badge bg-pink-500/20 text-pink-400 border-pink-500/50">오늘 참여</span>' : '';



            return `

            <div class="card rounded-xl p-6 transition-all border border-cyan-500/20 hover:border-cyan-500/50">

                <div class="flex justify-between items-start mb-3">

                    <div class="flex flex-col gap-1">

                        <h3 class="text-xl font-bold text-cyan-300 truncate-text" style="max-width: 200px;">${escapeHtml(radio.title)}</h3>

                        <div class="flex gap-2">${todayBadge}</div>

                    </div>

                    <div class="flex gap-2">

                        ${isAdminMode ? `<button onclick="editRadio(${radio.id})" class="text-cyan-400 text-xs hover:underline"><i class="fas fa-edit"></i></button>` : ''}

                        ${isAdminMode ? `<button onclick="deleteItem('radio-requests', ${radio.id})" class="text-red-400 text-xs hover:underline"><i class="fas fa-trash"></i></button>` : ''}

                    </div>

                </div>

                <p class="text-lg font-semibold text-purple-300 mb-1">${escapeHtml(radio.station_name)}</p>

                <p class="text-xs text-gray-400 mb-4 line-clamp-2">${escapeHtml(radio.description || '라디오 신청 정보입니다.')}</p>

               

                <div class="flex gap-2">

                    <button onclick="copyAndGo(\`${escapeHtml(radio.example_text || '').replace(/`/g, '\\`')}\`, '${radio.request_url}')"

                            class="flex-1 neon-button text-white py-3 rounded-xl font-black text-sm transition-all shadow-lg">

                        <i class="fas fa-paper-plane mr-2"></i>복사 후 신청

                    </button>

                </div>

            </div>

            `;

        }).join('') || '<div class="col-span-full text-center text-gray-500 py-10">등록된 라디오 정보가 없습니다.</div>';

    } catch (error) {

        console.error('라디오 로드 실패:', error);

    }

}

// 4. 라디오 로직 (곡 선택 및 문구 자동화 통합)

const RADIO_TEMPLATE = "Hello! I'd like to request '{SONG_TITLE}' by PLAVE. Check it out on Spotify: {SPOTIFY_URL} #PLAVE #플레이브";



async function loadRadio() {

    try {

        // 1. 라디오 목록과 곡 목록을 동시에 가져옴

        const [radioRes, songRes] = await Promise.all([

            axios.get('/api/radio-requests'),

            axios.get('/api/songs') // 등록한 플레이브 곡 리스트

        ]);



        const radios = radioRes.data.data;

        const songs = songRes.data.data;

        const today = new Date().getDay().toString();

        const radioList = document.getElementById('radio-list');

        if (!radioList) return;



        radioList.innerHTML = radios.map(radio => {

            const isToday = JSON.parse(radio.recurrence_days || '[]').includes(today);

           

            // 곡 선택 드롭다운 생성 (멤버 순서 반영된 리스트 사용 권장)

            const songOptions = songs.map(song =>

                `<option value="${song.id}" data-en="${song.title_en}" data-url="${song.spotify_url}">${song.title_ko} (${song.title_en})</option>`

            ).join('');



            return `

            <div class="card rounded-xl p-6 border border-cyan-500/20 mb-4">

                <div class="flex justify-between items-start mb-2">

                    <h3 class="text-xl font-bold text-cyan-300 truncate-text">${escapeHtml(radio.station_name)}</h3>

                    ${isToday ? '<span class="badge bg-pink-500/20 text-pink-400 border-pink-500/50 animate-pulse">오늘 참여</span>' : ''}

                </div>

               

                <div class="mb-4">

                    <label class="block text-[10px] text-purple-300 font-bold mb-1 uppercase tracking-tighter">🎵 신청곡 선택</label>

                    <select onchange="updateRadioMessage(this, ${radio.id})"

                            class="w-full bg-gray-900/50 border border-purple-500/30 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan-400">

                        <option value="">곡을 선택하세요 (자동 문구 생성)</option>

                        ${songOptions}

                    </select>

                </div>



                <div class="bg-black/30 rounded-lg p-3 mb-4 border border-white/5">

                    <p id="msg-preview-${radio.id}" class="text-xs text-gray-400 italic">곡을 선택하면 영어 신청 문구가 이곳에 나타납니다.</p>

                    <input type="hidden" id="msg-input-${radio.id}" value="">

                </div>



                <button onclick="copyAndGoFromPreview(${radio.id}, '${radio.request_url}')"

                        class="w-full neon-button text-white py-3 rounded-xl font-black text-sm">

                    <i class="fas fa-paper-plane mr-2"></i>복사 후 신청하기

                </button>

            </div>`;

        }).join('');

    } catch (e) { console.error('라디오 로드 실패:', e); }

}



// 곡 선택 시 문구를 실시간으로 갈아끼우는 함수

function updateRadioMessage(selectElement, radioId) {

    const selectedOption = selectElement.options[selectElement.selectedIndex];

    const previewBox = document.getElementById(`msg-preview-${radioId}`);

    const hiddenInput = document.getElementById(`msg-input-${radioId}`);

   

    if (!selectedOption.value) {

        previewBox.innerText = "곡을 선택하면 영어 신청 문구가 이곳에 나타납니다.";

        hiddenInput.value = "";

        return;

    }



    const titleEn = selectedOption.getAttribute('data-en');

    const spotifyUrl = selectedOption.getAttribute('data-url');



    // 템플릿 변수 치환

    const customizedMsg = RADIO_TEMPLATE

        .replace('{SONG_TITLE}', titleEn)

        .replace('{SPOTIFY_URL}', spotifyUrl || '');



    previewBox.innerText = customizedMsg;

    previewBox.classList.remove('text-gray-400');

    previewBox.classList.add('text-cyan-200');

    hiddenInput.value = customizedMsg;

}



// 프리뷰 박스에 있는 내용을 복사해서 이동하는 함수

async function copyAndGoFromPreview(radioId, url) {

    const text = document.getElementById(`msg-input-${radioId}`).value;

    if (!text) {

        showToast('먼저 곡을 선택해 주세요!', 'error');

        return;

    }

    await copyAndGo(text, url);

}



// 9. Copy & Go 핵심 함수

async function copyAndGo(text, url) {

    if (!text) {

        showToast('복사할 예시문이 없습니다.', 'error');

        if (url) window.open(url, '_blank');

        return;

    }

    try {

        await navigator.clipboard.writeText(text);

        showToast('📝 문구가 복사되었습니다! 신청 페이지로 이동합니다.', 'success');

        if (url) setTimeout(() => window.open(url, '_blank'), 800);

    } catch (err) {

        showToast('클립보드 복사에 실패했습니다.', 'error');

    }

}



// 10. 광고 정보 로드 (시안 포함)

async function loadAds() {

    try {

        const response = await axios.get('/api/ad-requests');

        const ads = response.data.data;

        const adsList = document.getElementById('ads-list');

        if (!adsList) return;



        adsList.innerHTML = ads.map(ad => `

            <div class="card rounded-xl p-5 border border-purple-500/20">

                <div class="flex justify-between items-start mb-3">

                    <h3 class="text-lg font-bold text-purple-300 truncate-text" style="max-width: 180px;">${escapeHtml(ad.title)}</h3>

                    ${isAdminMode ? `<button onclick="deleteItem('ad-requests', ${ad.id})" class="text-red-400"><i class="fas fa-trash text-xs"></i></button>` : ''}

                </div>

                ${ad.image_url ? `<img src="${ad.image_url}" class="w-full h-32 object-cover rounded-lg mb-3 border border-white/10">` : ''}

                <p class="text-[11px] text-gray-400 mb-1"><i class="fas fa-map-marker-alt mr-1"></i>${escapeHtml(ad.location)}</p>

                <p class="text-[11px] text-pink-400 font-bold mb-3"><i class="far fa-clock mr-1"></i>~ ${new Date(ad.deadline).toLocaleDateString()}</p>

                <a href="${escapeHtml(ad.ad_url || '#')}" target="_blank" class="block w-full py-2 bg-purple-600/20 text-purple-300 text-center rounded-lg text-xs font-bold border border-purple-500/30">상세 정보 (X)</a>

            </div>

        `).join('') || '<div class="col-span-full text-center text-gray-400 py-10">광고 정보가 없습니다.</div>';

    } catch (error) { console.error('광고 로드 실패:', error); }

}



// 11. 팁 및 노하우 로드

async function loadTips() {

    try {

        const response = await axios.get('/api/tips');

        const tips = response.data.data;

        const tipsList = document.getElementById('tips-list');

        if (!tipsList) return;



        tipsList.innerHTML = tips.map(tip => `

            <div class="card rounded-xl p-5 border border-indigo-500/20">

                <div class="flex justify-between mb-2">

                    <span class="badge bg-indigo-900/40 text-indigo-300 border-indigo-500/50">${escapeHtml(tip.platform)}</span>

                    ${isAdminMode ? `<button onclick="deleteItem('tips', ${tip.id})" class="text-red-400"><i class="fas fa-trash text-xs"></i></button>` : ''}

                </div>

                <h4 class="font-bold text-cyan-100 mb-2 truncate-text">${escapeHtml(tip.tip_title)}</h4>

                <p class="text-xs text-gray-400 line-clamp-2 mb-3">${escapeHtml(tip.tip_content)}</p>

                <button onclick="viewTips(${tip.id})" class="text-[10px] text-purple-400 font-bold hover:underline">자세히 보기 <i class="fas fa-chevron-right ml-1"></i></button>

            </div>

        `).join('');

    } catch (error) { console.error('팁 로드 실패:', error); }

}



// 12. 공통 유틸리티: 탭 전환

function switchTab(tab) {

    currentTab = tab;

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active', 'tab-active', 'text-cyan-300'));

    const activeBtn = document.getElementById(`tab-${tab}`);

    if (activeBtn) activeBtn.classList.add('tab-active', 'text-cyan-300');



    document.querySelectorAll('.content-section').forEach(section => section.classList.add('hidden'));

    const targetSection = document.getElementById(`content-${tab}`);

    if (targetSection) targetSection.classList.remove('hidden');



    if (tab === 'votes') loadVotes();

    if (tab === 'radio') loadRadio();

    if (tab === 'ads') loadAds();

}



// 13. 플레이브 멤버 생일 알림 시스템

function checkMemberAnniversaries() {

    const today = new Date();

    const currentMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

   

    // 기념일 체크

    const celebrateMember = PLAVE_ANNIVERSARIES.find(m => m.date === currentMonthDay);

    const anniversaryBanner = document.getElementById('anniversary-banner'); // HTML에 해당 ID의 div가 필요합니다.



    if (celebrateMember && anniversaryBanner) {

        anniversaryBanner.innerHTML = `

            <div class="glass-panel mb-6 p-6 border-2 border-pink-400 bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-pulse text-center">

                <h2 class="text-2xl font-black text-white italic">✨ HAPPY ${celebrateMember.name} DAY ✨</h2>

                <p class="text-sm text-pink-200 mt-2 font-bold">오늘은 플레이브의 소중한 멤버, ${celebrateMember.name}의 생일입니다! 모두 함께 축하해주세요! 💙💜💗❤️🖤</p>

            </div>

        `;

        anniversaryBanner.classList.remove('hidden');

    }

}



// 14. 오늘의 일정 탭 데이터 렌더링 (멤버 순서 준수)

async function renderTodaySchedule() {

    // 기존의 loadSchedule 내부 로직을 보강

    const scheduleContainer = document.getElementById('today-schedule-content');

    if (!scheduleContainer) return;



    // 멤버 순서대로 정렬된 가이드나 일정을 여기에 배치

    // 예: 예준 -> 노아 -> 밤비 -> 은호 -> 하민 순으로 개인 활동 정보 렌더링

}

// 15. 데이터 관리 및 수정 연동 유틸리티

function getCompletedVotes() {

    const today = new Date().toISOString().split('T')[0];

    const stored = localStorage.getItem('completed_votes');

    if (!stored) return { date: today, votes: [] };

    try {

        const data = JSON.parse(stored);

        // 날짜가 지나면 투표 완료 기록 초기화

        if (data.date !== today) return { date: today, votes: [] };

        return data;

    } catch (e) {

        return { date: today, votes: [] };

    }

}



// 라디오 수정 모달 연동

async function editRadio(radioId) {

    try {

        const response = await axios.get(`/api/radio-requests/${radioId}`);

        const radio = response.data.data;

       

        // 관리 모드에서 상세 수정창을 열어주는 로직 (AddModal과 유사한 구조)

        // 기존 폼에 radio 정보를 채워넣습니다.

        openAddModal(); // 모달을 열고

        setTimeout(() => {

            const form = document.getElementById('add-form');

            if (form) {

                form.elements['title'].value = radio.title;

                form.elements['station_name'].value = radio.station_name;

                form.elements['example_text'].value = radio.example_text || '';

                // 수정 모드임을 알리기 위해 ID 저장

                form.dataset.editId = radioId;

            }

        }, 200);

    } catch (error) {

        showToast('라디오 정보를 불러오지 못했습니다.', 'error');

    }

}



// 투표 완료 상태 토글 (HTML의 checkbox와 연동)

function toggleVoteComplete(voteId) {

    const data = getCompletedVotes();

    const index = data.votes.indexOf(voteId);

    if (index > -1) {

        data.votes.splice(index, 1);

    } else {

        data.votes.push(voteId);

    }

    localStorage.setItem('completed_votes', JSON.stringify(data));

    renderFilteredVotes(); // 화면 갱신

}



// 16. 신곡 관리 전용 팝업 열기

async function openSongManager() {

    if (!isAdminMode) {

        showToast('관리자 모드에서만 가능합니다.', 'error');

        return;

    }



    const modal = document.createElement('div');

    modal.id = 'song-manager-modal';

    modal.className = 'fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4';

   

    // 곡 목록 불러오기

    const response = await axios.get('/api/songs');

    const songs = response.data.data;



    modal.innerHTML = `

        <div class="glass-panel w-full max-w-2xl p-6 overflow-y-auto max-h-[80vh]">

            <div class="flex justify-between items-center mb-6">

                <h2 class="text-2xl font-black text-cyan-300 italic">🎵 PLAVE 곡 DB 관리</h2>

                <button onclick="this.closest('#song-manager-modal').remove()" class="text-white text-2xl">&times;</button>

            </div>



            <form id="new-song-form" class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8 p-4 bg-white/5 rounded-xl border border-white/10">

                <input type="text" name="title_ko" placeholder="한글 제목" required class="bg-gray-900/50 p-2 rounded border border-purple-500/30 text-white text-sm outline-none">

                <input type="text" name="title_en" placeholder="영어 제목" required class="bg-gray-900/50 p-2 rounded border border-purple-500/30 text-white text-sm outline-none">

                <input type="url" name="spotify_url" placeholder="스포티파이 URL" class="bg-gray-900/50 p-2 rounded border border-purple-500/30 text-white text-sm outline-none">

                <button type="submit" class="md:col-span-3 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-500 transition-all">신곡 등록하기</button>

            </form>



            <div class="space-y-2">

                <p class="text-[10px] text-purple-300 font-bold mb-2">현재 등록된 곡 목록</p>

                ${songs.map(song => `

                    <div class="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">

                        <div class="text-xs">

                            <span class="text-white font-bold">${song.title_ko}</span>

                            <span class="text-gray-400 ml-2">(${song.title_en})</span>

                        </div>

                        <button onclick="deleteSong(${song.id})" class="text-red-400 text-xs hover:underline">삭제</button>

                    </div>

                `).join('')}

            </div>

        </div>

    `;

    document.body.appendChild(modal);



    // 신곡 등록 이벤트

    document.getElementById('new-song-form').addEventListener('submit', async (e) => {

        e.preventDefault();

        const formData = new FormData(e.target);

        try {

            await axios.post('/api/songs', Object.fromEntries(formData));

            showToast('신곡이 등록되었습니다!', 'success');

            modal.remove();

            loadRadio(); // 라디오 드롭다운 갱신

        } catch (error) { showToast('등록 실패', 'error'); }

    });

}



// 곡 삭제 함수

async function deleteSong(id) {

    if (!confirm('곡을 삭제하시겠습니까?')) return;

    try {

        await axios.delete(`/api/songs/${id}`);

        showToast('삭제 완료');

        document.getElementById('song-manager-modal').remove();

        openSongManager(); // 목록 갱신을 위해 재오픈

    } catch (e) { showToast('삭제 실패', 'error'); }

}



// 17. 유튜브 30일 자동 삭제 (북마크 보존 기능 포함)

async function autoCleanupYoutube() {

    try {

        const thirtyDaysAgo = new Date();

        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

       

        // 서버에 30일이 지났지만 북마크(is_bookmarked=0)가 아닌 영상만 삭제 요청

        await axios.delete('/api/youtube/cleanup', {

            data: { expiry_date: thirtyDaysAgo.toISOString() }

        });

        console.log('유튜브 데이터 정리 완료 (북마크 제외)');

    } catch (error) { console.error('정리 실패:', error); }

}



// 18. 화력 지원: 트위터(X) 공유 최적화

function shareToX(title, url) {

    const hashtags = "PLAVE,플레이브,PLLI,플리";

    const text = `🗳️ [VOTE FOR PLAVE]\n\n${title}\n지금 바로 투표에 참여하세요! ✨\n\n#PLAVE #플레이브 #PLLI #플리`;

    const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

    window.open(xUrl, '_blank');

}



// 19. 브라우저 알림 권한 요청 및 상태 확인

async function requestNotificationPermission() {

    if (!("Notification" in window)) {

        console.log("이 브라우저는 알림을 지원하지 않습니다.");

        return;

    }



    if (Notification.permission !== "granted") {

        const permission = await Notification.requestPermission();

        if (permission === "granted") {

            showToast('알림 권한이 승인되었습니다! 새 영상 소식을 알려드릴게요. 💙💜💗❤️🖤', 'success');

        }

    }

}



// 20. 신규 영상 체크 및 알림 발송 로직

let lastVideoId = localStorage.getItem('last_video_id'); // 마지막으로 확인한 영상 ID 저장



async function checkNewVideos() {

    try {

        const response = await axios.get('/api/youtube/latest'); // 가장 최근 영상 1개를 가져오는 API

        const latestVideo = response.data.data;



        if (!latestVideo) return;



        // 새로운 영상 ID가 감지되었을 때

        if (latestVideo.video_id !== lastVideoId) {

            // 알림 권한이 있을 경우 푸시 발송

            if (Notification.permission === "granted") {

                const notification = new Notification("🎵 PLAVE NEW VIDEO!", {

                    body: `새로운 영상이 업로드되었습니다:\n${latestVideo.title}`,

                    icon: '/assets/plave-logo.png', // 실제 로고 경로로 수정 필요

                    badge: '/assets/plave-badge.png'

                });



                notification.onclick = function() {

                    window.open(`https://www.youtube.com/watch?v=${latestVideo.video_id}`, '_blank');

                    notification.close();

                };

            }



            // 토스트로도 한 번 더 표시

            showToast(`🚀 신규 영상: ${latestVideo.title}`, 'info');



            // 마지막 영상 ID 업데이트

            lastVideoId = latestVideo.video_id;

            localStorage.setItem('last_video_id', lastVideoId);

           

            // 영상 목록 탭 갱신 (유튜브 탭이 활성화되어 있을 경우)

            if (currentTab === 'youtube') loadYoutube();

        }

    } catch (error) {

        console.error('영상 체크 실패:', error);

    }

}



// 21. 주기적 폴링 (5분마다 체크)

function startVideoPolling() {

    // 앱 실행 시 권한 요청

    requestNotificationPermission();

   

    // 즉시 실행 후 5분마다 반복

    checkNewVideos();

    setInterval(checkNewVideos, 5 * 60 * 1000);

}

// 22. 모달 제어 및 탭별 데이터 로드 보완

function openAddModal() {

    const modal = document.getElementById('add-modal');

    if (modal) modal.classList.remove('hidden');

}



function closeAddModal() {

    const modal = document.getElementById('add-modal');

    if (modal) {

        modal.classList.add('hidden');

        document.getElementById('add-form').reset();

        delete document.getElementById('add-form').dataset.editId; // 수정 모드 해제

    }

}



// 탭 전환 시 상단 배너 표시 여부 제어 유틸리티

function updateTabUI(tab) {

    const banner = document.getElementById('anniversary-banner');

    if (banner) {

        // '오늘의 일정' 탭에서만 생일 배너를 보여주고 싶다면 아래 조건 사용

        if (tab === 'schedule') banner.classList.remove('hidden');

        else banner.classList.add('hidden');

    }

}



// 기존 switchTab 함수에 UI 업데이트 연결

const originalSwitchTab = switchTab;

switchTab = function(tab) {

    originalSwitchTab(tab);

    updateTabUI(tab);

};

// 23. 유튜브 북마크 상태 업데이트 (30일 삭제 예외 처리)
async function toggleYoutubeBookmark(videoId, currentStatus) {
    try {
        const newStatus = currentStatus === 1 ? 0 : 1;
        await axios.put(`/api/youtube/${videoId}/bookmark`, {
            is_bookmarked: newStatus
        });
        
        showToast(newStatus === 1 ? '⭐ 북마크 저장! 30일 뒤에도 삭제되지 않습니다.' : '북마크 해제되었습니다.', 'success');
        
        // 유튜브 목록 재로드하여 UI 갱신
        if (typeof loadYoutube === 'function') loadYoutube();
    } catch (error) {
        showToast('북마크 업데이트 실패', 'error');
        console.error(error);
    }
}

// 탭 전환 시 각 탭에 맞는 로드 함수 호출 보강
function updateTabUI(tab) {
    const banner = document.getElementById('anniversary-banner');
    
    // 생일 배너는 '오늘의 일정' 탭에서만 노출
    if (banner) {
        if (tab === 'schedule') banner.classList.remove('hidden');
        else banner.classList.add('hidden');
    }

    // 탭별 데이터 실시간 새로고침
    switch(tab) {
        case 'youtube': if (typeof loadYoutube === 'function') loadYoutube(); break;
        case 'schedule': loadSchedule(); break;
        case 'votes': loadVotes(); break;
        case 'radio': loadRadio(); break;
        case 'ads': loadAds(); break;
    }
}



// 최종 초기화 로직

document.addEventListener('DOMContentLoaded', () => {

    // 기본 데이터 로드

    loadSchedule();

    loadVotes();

    loadAds();

    loadRadio();

    loadTips();

   

    // 유틸리티 실행

    startCountdownUpdates();

    setWatermark();

   

    // [추가] 기념일 체크 실행

    checkMemberAnniversaries();

   

    // 알림 권한 체크 (기존 로직)

    updateNotificationButtonStatus();

});

