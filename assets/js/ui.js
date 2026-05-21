// ====== UI 顏色設定 (僅變更文字為: 違法、高風險、須注意) ======
const SEVERITY_CONFIG = {
    'illegal':   { label: '違法', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-400' },
    'high-risk': { label: '高風險', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-400' },
    'notice':    { label: '須注意', text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-400' }
};

function formatCurrency(amount) {
    return new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(amount);
}

// ====== Upload Page 邏輯 ======
if (window.location.pathname.includes('upload.html')) {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const fileListEl = document.getElementById('file-list');
    const analyzeBtn = document.getElementById('analyze-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const stepTexts = document.querySelectorAll('.step-text');
    let selectedFiles = [];

    uploadZone.addEventListener('click', () => fileInput.click());

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('bg-[#EFF6FF]', 'border-[#2563EB]');
    });
    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('bg-[#EFF6FF]', 'border-[#2563EB]');
    });
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('bg-[#EFF6FF]', 'border-[#2563EB]');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.size > 20 * 1024 * 1024) {
                showToast(`檔案超過大小限制`, 'error');
                return;
            }
            selectedFiles.push(file);
        });
        renderFileList();
    }

    function renderFileList() {
        fileListEl.innerHTML = '';
        selectedFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm';
            li.innerHTML = `
                <span class="truncate text-gray-700 font-medium">📄 ${file.name}</span>
                <button type="button" class="text-gray-400 hover:text-red-500 font-bold px-2" onclick="removeFile(${index})">✕</button>
            `;
            fileListEl.appendChild(li);
        });

        if (selectedFiles.length > 0) {
            analyzeBtn.disabled = false;
            analyzeBtn.classList.replace('bg-[#93C5FD]', 'bg-[#2563EB]');
        } else {
            analyzeBtn.disabled = true;
            analyzeBtn.classList.replace('bg-[#2563EB]', 'bg-[#93C5FD]');
        }
    }

    window.removeFile = (index) => {
        selectedFiles.splice(index, 1);
        renderFileList();
    };

    analyzeBtn.addEventListener('click', async () => {
        analyzeBtn.classList.add('hidden');
        progressContainer.classList.remove('hidden');

        const setProgress = (step) => {
            progressBar.style.width = `${step * 25}%`;
            stepTexts.forEach((el, idx) => {
                if (idx < step) el.classList.add('text-[#2563EB]');
            });
        };

        try {
            setProgress(1); 
            setTimeout(() => setProgress(2), 1000); 
            setTimeout(() => setProgress(3), 2000); 

            const result = await analyzeContract(selectedFiles);
            
            setProgress(4); 
            sessionStorage.setItem('analysis_result', JSON.stringify(result));
            
            setTimeout(() => {
                window.location.href = 'result.html';
            }, 500);

        } catch (err) {
            progressContainer.classList.add('hidden');
            analyzeBtn.classList.remove('hidden');
        }
    });
}

// ====== Result Page 邏輯 ======
function renderResultPage() {
    const container = document.getElementById('result-container');
    if (!container) return;

    const dataStr = sessionStorage.getItem('analysis_result');
    if (!dataStr) {
        window.location.href = 'upload.html';
        return;
    }

    const data = JSON.parse(dataStr);
    const summary = data.summary;
    const clauses = data.risk_clauses;

    // 確保依照 違法、高風險、須注意 排序
    const severityOrder = { 'illegal': 1, 'high-risk': 2, 'notice': 3 };
    clauses.sort((a, b) => (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99));
    
    // 寫回 sessionStorage 確保後續使用 index 存取時一致
    sessionStorage.setItem('analysis_result', JSON.stringify(data));

    const counts = { 'illegal': 0, 'high-risk': 0, 'notice': 0 };
    clauses.forEach(c => counts[c.severity]++);

    // 合約摘要 (計算租金合法金額展示)
    const depositBadgeHtml = summary.deposit.status === 'illegal'
        ? `<span class="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold ml-2">違法</span>`
        : ``;

    let depositDetailsHtml = `
        <div class="flex items-center">
            <span class="font-bold text-gray-900">${formatCurrency(summary.deposit.amount)}</span>
            ${depositBadgeHtml}
        </div>
    `;

    // 若押金違法，下方補充計算公式
    if (summary.deposit.status === 'illegal') {
        depositDetailsHtml = `
            <div class="flex flex-col items-end gap-1">
                <div class="flex items-center">
                    <span class="font-bold text-gray-900">${formatCurrency(summary.deposit.amount)}</span>
                    ${depositBadgeHtml}
                </div>
                <span class="text-[11px] text-red-500 font-medium bg-red-50 px-1.5 py-0.5 rounded border border-red-100">法定上限：${formatCurrency(summary.monthly_rent.amount)} × 2 = ${formatCurrency(summary.deposit.legal_limit)}</span>
            </div>
        `;
    }

    let html = `
        <div class="border border-gray-100 rounded-2xl p-5 mb-5 shadow-sm">
            <h2 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> 
                合約摘要
            </h2>
            <div class="space-y-3">
                <div class="bg-gray-50 rounded-xl p-3.5 flex justify-between items-center">
                    <span class="text-gray-500 flex items-center gap-2 text-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        月租金
                    </span>
                    <span class="font-bold text-gray-900">${formatCurrency(summary.monthly_rent.amount)}</span>
                </div>
                <div class="bg-gray-50 rounded-xl p-3.5 flex justify-between items-center">
                    <span class="text-gray-500 flex items-center gap-2 text-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        押金
                    </span>
                    ${depositDetailsHtml}
                </div>
                <div class="bg-gray-50 rounded-xl p-3.5 flex justify-between items-center">
                    <span class="text-gray-500 flex items-center gap-2 text-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        租期
                    </span>
                    <span class="font-bold text-gray-900">${summary.lease_term.start}~${summary.lease_term.end}</span>
                </div>
            </div>
        </div>
    `;

    // 風險 Banner
    if (clauses.length > 0) {
        let badgesHtml = '';
        if (counts['illegal'] > 0) badgesHtml += `<span class="bg-red-500 text-white text-[11px] px-2.5 py-0.5 rounded-full ml-1 font-medium">違法 ${counts['illegal']}</span>`;
        if (counts['high-risk'] > 0) badgesHtml += `<span class="bg-orange-500 text-white text-[11px] px-2.5 py-0.5 rounded-full ml-1 font-medium">高風險 ${counts['high-risk']}</span>`;
        if (counts['notice'] > 0) badgesHtml += `<span class="bg-yellow-500 text-white text-[11px] px-2.5 py-0.5 rounded-full ml-1 font-medium">須注意 ${counts['notice']}</span>`;

        html += `
            <div class="bg-[#FEF2F2] rounded-xl p-3 flex justify-between items-center mb-6 border border-red-100">
                <span class="text-red-600 font-bold text-sm flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    發現 ${clauses.length} 項需要注意的條款
                </span>
                <div class="flex">${badgesHtml}</div>
            </div>
            
            <h3 class="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                風險條款明細
            </h3>
            <div class="space-y-4 mb-4">
        `;

        // 風險手風琴 
        clauses.forEach((clause, index) => {
            const conf = SEVERITY_CONFIG[clause.severity];
            const subTitleLabel = conf.label; // 套用: 違法、高風險、須注意

            html += `
                <div class="border border-2 ${conf.border} rounded-2xl bg-white overflow-hidden shadow-sm">
                    <button class="w-full text-left p-4 pb-3 flex justify-between items-start focus:outline-none accordion-btn" onclick="toggleAccordion(${index})">
                        <div class="flex gap-3">
                            <div class="mt-0.5">
                                <svg class="w-5 h-5 ${conf.text}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div>
                                <h4 class="font-bold text-gray-900 mb-0.5 text-[15px]">${clause.title}</h4>
                                <div class="text-[12px] ${conf.text} font-medium">${subTitleLabel} &nbsp;<span class="text-gray-400 font-normal">${clause.clause_number}</span></div>
                            </div>
                        </div>
                        <span class="text-gray-400 transform transition-transform duration-200 mt-1" id="icon-${index}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </span>
                    </button>
                    
                    <div id="content-${index}" class="accordion-content">
                        <div class="px-5 pb-5 pt-2 space-y-4">
                            
                            <div>
                                <h5 class="text-[13px] font-bold text-[#2563EB] mb-1.5 flex items-center gap-1.5">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                                    AI 白話提示
                                </h5>
                                <p class="text-[14px] text-gray-700 leading-relaxed">${clause.plain_explanation}</p>
                            </div>
                            
                            <div>
                                <h5 class="text-[12px] font-bold text-gray-500 mb-1 flex items-center gap-1.5">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                    法規依據
                                </h5>
                                <p class="text-[13px] text-gray-500 leading-relaxed">${clause.legal_basis}</p>
                            </div>
                            
                            <div class="pt-2">
                                <h5 class="text-[13px] font-bold text-[#2563EB] mb-2 flex items-center gap-1.5">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                    產生建議話術
                                </h5>
                                
                                <div id="script-container-${index}" class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col items-center justify-center transition-all min-h-[60px]">
                                    <button id="script-btn-${index}" onclick="handleGenerateScript(${index})" class="text-[#2563EB] font-medium text-[13px] py-1.5 px-3 rounded-lg hover:bg-blue-100 transition flex items-center gap-1.5">
                                        產生談判建議
                                    </button>
                                    
                                    <p id="script-text-${index}" class="text-[14px] text-gray-700 leading-relaxed hidden w-full whitespace-pre-wrap"></p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    container.innerHTML = html;
    
    // 預設展開第一個項目
    if (clauses.length > 0) {
        toggleAccordion(0);
    }
}

window.toggleAccordion = (index) => {
    const content = document.getElementById(`content-${index}`);
    const icon = document.getElementById(`icon-${index}`);
    
    if (content.classList.contains('open')) {
        content.classList.remove('open');
        icon.style.transform = 'rotate(0deg)';
    } else {
        content.classList.add('open');
        icon.style.transform = 'rotate(180deg)';
    }
};

window.handleGenerateScript = async (index) => {
    const btn = document.getElementById(`script-btn-${index}`);
    const textEl = document.getElementById(`script-text-${index}`);
    const container = document.getElementById(`script-container-${index}`);

    const dataStr = sessionStorage.getItem('analysis_result');
    const clauseData = JSON.parse(dataStr).risk_clauses[index];

    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin h-4 w-4 text-[#2563EB]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> 產生中...`;

    try {
        const response = await generateNegotiationScript(clauseData);
        
        btn.classList.add('hidden');
        container.classList.remove('items-center', 'justify-center');
        textEl.textContent = response.script;
        textEl.classList.remove('hidden');
        
        const content = document.getElementById(`content-${index}`);
        content.style.maxHeight = content.scrollHeight + "px";
        
    } catch (err) {
        btn.disabled = false;
        btn.innerHTML = `產生失敗，點擊重試`;
    }
};