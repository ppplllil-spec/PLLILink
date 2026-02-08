/** [1. 투표 관리 & 카운트다운] **/
async function loadVotes() {
    const res = await axios.get('/api/votes'); // 서버 통로 호출
    const data = res.data.data;
    const container = document.getElementById('votes-list');
    
    container.innerHTML = data.map(v => `
        <div class="card p-5 border border-cyan-500/20 rounded-2xl">
            <h4 class="text-white font-bold">${v.title}</h4>
            <div id="timer-${v.id}" class="text-pink-500 text-xs font-mono my-2">계산 중...</div>
            <a href="${v.link}" target="_blank" class="block text-center py-2 bg-cyan-600 rounded-lg text-xs">투표하기</a>
        </div>
    `).join('');
    
    // 카운트다운 시작
    setInterval(() => updateTimers(data), 1000);
}

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
