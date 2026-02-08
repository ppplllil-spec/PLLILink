/** [1. 투표 정보 관리 핵심 로직] **/
let allVotes = [];

// 페이지 로드 시 서버에 데이터 요청
async function loadVotes() {
    const container = document.getElementById('votes-list');
    if (!container) return;

    try {
        // [중요] 서버의 /api/votes 통로로 접속합니다.
        const res = await axios.get('/api/votes');
        allVotes = res.data.data;
        renderVotes();
    } catch (err) {
        console.error("서버에서 데이터를 가져오지 못했습니다.");
    }
}

function renderVotes() {
    const container = document.getElementById('votes-list');
    const completed = JSON.parse(localStorage.getItem('completed_votes') || '[]');

    container.innerHTML = allVotes.map(v => {
        const isDone = completed.includes(v.id);
        return `
            <div class="card p-5 border ${isDone ? 'border-gray-800' : 'border-cyan-500/20'} rounded-2xl bg-gray-900/50">
                <div class="flex justify-between items-start mb-2">
                    <input type="checkbox" onclick="toggleVote('${v.id}')" ${isDone ? 'checked' : ''} class="w-5 h-5 accent-cyan-500">
                    <span class="text-[10px] px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg">${v.platform}</span>
                </div>
                
                <h4 class="text-white font-black text-lg ${isDone ? 'line-through opacity-50' : ''}">${v.title}</h4>
                
                <div id="timer-${v.id}" class="text-pink-500 font-mono text-xs my-3">남은 시간 계산 중...</div>
                
                <div class="flex gap-2">
                    <a href="${v.link}" target="_blank" class="flex-1 text-center py-2 bg-cyan-600 text-white rounded-xl text-xs font-bold">투표하기</a>
                    <button onclick="shareToX('${v.title}', '${v.link}')" class="px-3 py-2 bg-gray-800 rounded-lg text-blue-400 border border-gray-700 hover:border-blue-400">
                        <i class="fab fa-twitter"></i>
                    </button>
                </div>
            </div>`;
    }).join('');
}

// [실시간 기능] 초 단위 카운트다운 업데이트 엔진
setInterval(() => {
    allVotes.forEach(v => {
        const timerEl = document.getElementById(`timer-${v.id}`);
        if (!timerEl || !v.deadline) return;

        const diff = new Date(v.deadline) - new Date();
        if (diff <= 0) {
            timerEl.innerText = "🚨 마감되었습니다!";
            timerEl.classList.replace('text-pink-500', 'text-gray-500');
            return;
        }

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        timerEl.innerText = `⏳ ${h}시간 ${m}분 ${s}초 남음`;
        
        // 마감 1시간 전 긴급 알림 처리 (알림 기능과 연동 가능)
    });
}, 1000);

function updateTimers(votes) {
    votes.forEach(v => {
        const el = document.getElementById(`timer-${v.id}`);
        if (!el) return;
        const diff = new Date(v.deadline) - new Date();
        if (diff <= 0) { el.innerText = "마감됨"; return; }
        
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        el.innerText = `${h}h ${m}m ${s}s 남음`;
    });
}

/** [2. 모달 입력창 생성] **/
function openAddModal() {
    const content = document.getElementById('form-content');
    // 5줄 textarea 등 수희님 요청 UI 반영
    content.innerHTML = `
        <input type="text" name="title" placeholder="제목" class="w-full p-3 bg-gray-900 mb-3 rounded-xl text-white">
        <textarea name="description" placeholder="예시문을 입력하세요 (5줄 가이드)" class="w-full p-3 bg-gray-900 h-32 rounded-xl text-white"></textarea>
    `;
    document.getElementById('add-modal').classList.remove('hidden');
}

// [보완] 투표 완료 체크 로직 (로컬 저장소 활용)
function toggleVote(id) {
    let completed = JSON.parse(localStorage.getItem('completed_votes') || '[]');
    if (completed.includes(id)) {
        completed = completed.filter(v => v !== id);
    } else {
        completed.push(id);
        showToast('💙 투표 완료! PLLI의 힘을 보여주세요!');
    }
    localStorage.setItem('completed_votes', JSON.stringify(completed));
    renderVotes(); // 화면 즉시 업데이트
}

/** [3. 라디오 신청 정보 관리] **/
async function loadRadio() {
    try {
        const res = await axios.get('/api/radio');
        const data = res.data.data;
        const container = document.getElementById('radio-list');
        
        container.innerHTML = data.map(r => `
            <div class="card p-6 rounded-3xl bg-gradient-to-br from-purple-900/10 to-cyan-900/10 border-2 border-dashed border-cyan-500/20">
                <div class="flex justify-between mb-3">
                    <span class="badge text-purple-400">${r.region === '해외' ? 'Global 🌐' : 'Domestic 🇰🇷'}</span>
                    <h4 class="text-white font-bold">${r.station_name}</h4>
                </div>
                <h3 class="text-xl font-black text-white mb-2">${r.title}</h3>
                
                <div class="bg-black/40 p-4 rounded-xl border border-purple-500/30 mb-4">
                    <p class="text-xs text-gray-400 mb-2">📝 신청 예시문</p>
                    <p id="desc-${r.id}" class="text-sm text-gray-200 leading-relaxed">${r.description}</p>
                </div>
                
                <div class="flex gap-2">
                    <button onclick="copyToClipboard('${r.description.replace(/\n/g, '\\n')}')" class="flex-1 py-3 bg-purple-600/30 text-purple-200 rounded-xl font-bold hover:bg-purple-600/50">예시문 복사</button>
                    <a href="${r.link}" target="_blank" class="flex-1 py-3 bg-cyan-600 text-white rounded-xl font-bold text-center">신청하러 가기</a>
                </div>
            </div>
        `).join('');
    } catch (e) { console.error("라디오 로드 실패"); }
}
