<body class="bg-[#0a0e27] text-white">
    <section id="content-schedule" class="content-section p-4">
        <h2 class="text-2xl font-black neon-text mb-4">TODAY ASTERUM</h2>
        <div id="today-deadline-votes" class="grid gap-3"></div>
    </section>

    <section id="content-radio" class="content-section hidden p-4">
        <div class="rounded-3xl bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-2 border-dashed border-cyan-500/30 p-6">
            <h3 class="text-xl font-bold mb-4">📻 라디오 신청 & 예시문</h3>
            <div id="radio-list" class="grid gap-4"></div>
        </div>
    </section>

    <div id="add-modal" class="hidden fixed inset-0 bg-black/90 backdrop-blur-xl z-50 p-6">
        <div class="card p-8 max-w-xl mx-auto border-2 border-cyan-500">
            <h2 class="text-2xl font-bold mb-6">정보 등록/수정</h2>
            <input type="text" onchange="fetchMetaData(this.value)" placeholder="URL을 입력하면 제목이 자동 입력됩니다" class="w-full p-3 bg-gray-900 mb-4 rounded-xl">
            <div id="form-content"></div>
        </div>
    </div>
</body>
