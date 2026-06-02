/**
 * AI System Design Guide - Client Application Core
 * Version: 2026.06
 * Zero-backend client-side interactive system with i18n and Commute Audio support.
 * Adapted for Multi-Page Document Architecture.
 */

// Global Application State
const state = {
    chapters: {},          // Structured chapters { sectionKey: { title, files: [ { title, path } ] } }
    questions: [],         // Parsed interview questions list
    glossary: [],          // Parsed glossary cards list
    activeQuestion: null,  // Currently selected question object
    activeChapterPath: '', // Currently opened chapter markdown path
    currentCardIndex: 0,   // Active flashcard index
    chatTurnsRemaining: 3, // Turns left in AI follow-up chat
    chatHistory: [],       // Follow-up chat messages [{role, text}]
    language: 'zh',        // 'zh' (Traditional Chinese) or 'en' (English)
    
    // Commute Audio State
    audioState: {
        isPlaying: false,
        source: 'flashcards', // 'flashcards' or 'interview'
        currentTrackIndex: 0,
        recallTimerId: null,
        recallTotalSeconds: 3,
        recallSecondsLeft: 0,
        wakeLock: null,
        currentUtterance: null,
        style: 'standard',     // 'standard', 'podcast', 'roleplay'
        scriptTurns: [],       // Array of { speaker, lang, text }
        currentTurnIndex: 0,
        enableBilingualSplit: false,
        ttsProvider: 'webspeech', // 'webspeech', 'gemini', 'openai', 'elevenlabs'
        voiceA: '',             // Selected Voice A name/ID
        voiceB: '',             // Selected Voice B name/ID
        customVoiceA: '',       // Custom ElevenLabs Voice A ID
        customVoiceB: ''        // Custom ElevenLabs Voice B ID
    },
    
    // Progress Tracking (saved to localStorage)
    progress: {
        readChapters: [],      // Array of completed chapter paths
        completedQuestions: {}, // Key-value: QuestionID -> Score (0-100)
        masteredCards: [],     // Array of mastered glossary term names
        learningCards: []      // Array of cards marked as "still learning"
    },
    
    // Credentials & API Config (saved to localStorage)
    apiConfig: {
        provider: 'gemini',
        key: '',
        geminiKey: '',
        openaiKey: '',
        elevenlabsKey: ''
    }
};

// ==========================================================================
// i18n Translation Dictionaries
// ==========================================================================
const sectionTranslations = {
    'zh': {
        '00-interview-prep': '00. 面試準備與趨勢',
        '01-foundations': '01. AI 基礎知識',
        '02-model-landscape': '02. 2026 模型全景',
        '03-training-and-adaptation': '03. 模型微調與適配',
        '04-inference-optimization': '04. 推論服務與優化',
        '05-prompting-and-context': '05. 提示工程與上下文',
        '06-retrieval-systems': '06. 檢索與 RAG 架構',
        '07-agentic-systems': '07. Agentic 代理系統',
        '08-memory-and-state': '08. 記憶與狀態層',
        '09-frameworks-and-tools': '09. 開發框架與工具鏈',
        '10-document-processing': '10. 文件解析與 OCR',
        '11-infrastructure-and-mlops': '11. GPU 基礎設施與 MLOps',
        '12-security-and-access': '12. 安全性與多租戶隔離',
        '13-reliability-and-safety': '13. 可靠性與安全防護',
        '14-evaluation-and-observability': '14. 系統評估與線上觀測',
        '15-ai-design-patterns': '15. AI 系統設計模式',
        '16-case-studies': '16. 經典系統架構案例',
        '17-tool-use-and-computer-agents': '17. 工具調用與電腦操作',
        'Root': '引言與目錄'
    },
    'en': {
        '00-interview-prep': '00. Interview Prep & Trends',
        '01-foundations': '01. AI Foundations',
        '02-model-landscape': '02. 2026 Model Landscape',
        '03-training-and-adaptation': '03. Model Fine-Tuning',
        '04-inference-optimization': '04. Inference & Optimization',
        '05-prompting-and-context': '05. Prompt Engineering',
        '06-retrieval-systems': '06. Retrieval & RAG Systems',
        '07-agentic-systems': '07. Agentic Systems',
        '08-memory-and-state': '08. Memory & State',
        '09-frameworks-and-tools': '09. Frameworks & Tools',
        '10-document-processing': '10. Document AI & OCR',
        '11-infrastructure-and-mlops': '11. GPU MLOps & Infra',
        '12-security-and-access': '12. Security & Isolation',
        '13-reliability-and-safety': '13. Safety & Guardrails',
        '14-evaluation-and-observability': '14. Evaluation & Tracing',
        '15-ai-design-patterns': '15. AI Design Patterns',
        '16-case-studies': '16. Production Case Studies',
        '17-tool-use-and-computer-agents': '17. Tool Use & Computer Agents',
        'Root': 'Introduction & Index'
    }
};

const translations = {
    'zh': {
        'menu_reader': '教材閱讀',
        'menu_interview': '模擬面試',
        'menu_flashcards': '閃卡複習',
        'menu_audio': '通勤聽書',
        'menu_settings': '設定',
        'progress_title': '學習進度',
        'quick_api_btn': 'API 金鑰設定',
        'search_placeholder': '搜尋教材、問題或單字...',
        'toc_title': '章節目錄',
        'mark_read_btn': '標記為已讀',
        'mark_unread_btn': '取消標記已讀',
        'already_read_btn': '已標記為已讀',
        'github_btn': '在 GitHub 查看',
        'question_bank_title': '面試問題庫',
        'cat_all': '所有類別',
        'cat_rag': 'RAG 架構',
        'cat_agent': 'Agentic 系統',
        'cat_model': '模型選擇',
        'cat_optimization': '推論優化',
        'cat_evaluation': '評估系統',
        'cat_mlops': '生產與 MLOps',
        'cat_scenario': '系統設計情境',
        'cat_advanced': '前沿與進階',
        'interview_empty_title': '準備好接受挑戰了嗎？',
        'interview_empty_desc': '從左側列表中選擇一個系統設計問題，或者點擊下方按鈕隨機挑選一題開始模擬面試。',
        'random_btn': '隨機挑選一題',
        'difficulty_label': '困難度：Senior / Staff',
        'tab_practice': '回答練習',
        'tab_feedback': '評分報告',
        'tab_suggested': '標準答案參考',
        'interviewer_hint_title': '面試官提示：',
        'textarea_label': '在此寫下您的回答（建議使用 Markdown 結構化表達，可混合中英文）：',
        'textarea_placeholder': '第一步，我會建立資料攝入管線... 然後我會使用 Hybrid Search...',
        'mode_self': '自我檢測評分',
        'mode_ai': 'AI 模擬官診斷',
        'submit_answer_btn': '提交回答',
        'self_eval_alert_title': '請進行自我檢測評分',
        'self_eval_alert_desc': '以下是資深/面試官期望回答中包含的關鍵點，請誠實勾選您剛才答案中提及的部分，系統將為您評分：',
        'calc_score_btn': '計算分數並完成此題',
        'ai_rating_label': 'AI 評級：',
        'ai_eval_timestamp': '評估基準時間：2026年6月，基於最新生產環境標準',
        'strengths_title': '答題亮點 (Strengths)',
        'improvements_title': '待改善與優化之處 (Improvements)',
        'followup_title': '面試官追問 (Follow-up Interaction)',
        'chat_input_placeholder': '對面試官的追問進行回覆...',
        'send_reply_btn': '送出回覆',
        'chat_turns_hint': '剩餘對話輪數：',
        'sample_answer_title': '標準參考答案 (Sample Answer)',
        'copy_btn': '複製',
        'copied_btn': '已複製',
        'flashcard_stats': '已掌握：',
        'reset_cards_btn': '重設卡片進度',
        'card_tag': '名詞定義',
        'flip_hint': '點擊卡片以翻面查看定義',
        'rate_fail_btn': '還不熟',
        'rate_pass_btn': '已掌握',
        'api_config_title': 'API 金鑰配置 (本機端安全儲存)',
        'api_config_desc': '金鑰將儲存於您的瀏覽器本地快取 (localStorage) 中，直接與 API 端點發送請求，絕不上傳至任何第三方伺服器。',
        'api_provider_label': '模型服務商',
        'api_key_label': 'API 金鑰 (API Key)',
        'api_key_placeholder': '輸入您的 API 金鑰...',
        'save_settings_btn': '儲存設定',
        'progress_management_title': '資料與學習紀錄管理',
        'progress_management_desc': '您可以清除本機端儲存的所有學習紀錄，包含已讀狀態、卡片熟練度以及面試模擬分數。',
        'clear_progress_btn': '刪除本機學習紀錄',
        'modal_title': '快速配置 API 金鑰',
        'modal_desc': '若要啟用 AI 模擬面試官診斷與追問 功能，請提供您的 API 金鑰。金鑰將安全儲存在您本地瀏覽器中，不經由任何第三方轉載。',
        'save_key_btn': '儲存金鑰',
        'cancel_btn': '取消',
        'unattempted_status': '未作答',
        'completed_status': '已得分: ',
        'welcome_title': '歡迎來到 AI 系統設計指南！',
        'welcome_desc': '請從左側目錄中選擇一個章節開始閱讀。本教材涵蓋 RAG 架構、Agentic 系統、模型選擇、推論優化及實際面試案例。',
        
        // Commute Audio i18n
        'audio_idle_title': '準備播音',
        'audio_idle_status': '請選擇右側播音來源，點擊播放鈕開始。',
        'audio_settings_title': '播音設定',
        'audio_source_label': '播音來源',
        'audio_source_flashcards': '閃卡名詞定義 (英中語音合成)',
        'audio_source_interview': '面試模擬 Q&A (英中語音合成)',
        'audio_pause_label': '回憶間隔 (Recall Delay)',
        'audio_speed_label': '語速調整',
        'audio_wakelock_label': '保持螢幕喚醒 (防止自動鎖屏)',
        'recall_timer_label': '主動回憶中...',
        'track_flashcard_prefix': '單字：',
        'track_interview_prefix': '問題：',
        'playing_status': '正在播放...',
        'paused_status': '已暫停',
        'audio_split_label': '英中雙語分段朗讀 (實驗性 - 易有斷點)'
    },
    'en': {
        'menu_reader': 'Read Guide',
        'menu_interview': 'Mock Interview',
        'menu_flashcards': 'Flashcards',
        'menu_audio': 'Commute Audio',
        'menu_settings': 'Settings',
        'progress_title': 'Learning Progress',
        'quick_api_btn': 'API Key Settings',
        'search_placeholder': 'Search chapters, questions or glossary...',
        'toc_title': 'Table of Contents',
        'mark_read_btn': 'Mark as Read',
        'mark_unread_btn': 'Mark as Unread',
        'already_read_btn': 'Read Completed',
        'github_btn': 'View on GitHub',
        'question_bank_title': 'Interview Bank',
        'cat_all': 'All Categories',
        'cat_rag': 'RAG Architecture',
        'cat_agent': 'Agentic Systems',
        'cat_model': 'Model Selection',
        'cat_optimization': 'Inference Optimization',
        'cat_evaluation': 'Evaluation Systems',
        'cat_mlops': 'Production & MLOps',
        'cat_scenario': 'System Design Scenarios',
        'cat_advanced': 'Advanced & Ensemble',
        'interview_empty_title': 'Ready for the challenge?',
        'interview_empty_desc': 'Choose a system design question from the sidebar, or click the button below to pick a random one to start your mock interview.',
        'random_btn': 'Pick Random Question',
        'difficulty_label': 'Senior / Staff',
        'tab_practice': 'Practice Answer',
        'tab_feedback': 'Score Report',
        'tab_suggested': 'Sample Answer',
        'interviewer_hint_title': 'Interviewer Expectations:',
        'textarea_label': 'Write your answer here (Markdown supported, English/Chinese mixed):',
        'textarea_placeholder': 'First, I will build an ingestion pipeline... Then I will use hybrid search...',
        'mode_self': 'Self Evaluation',
        'mode_ai': 'AI Evaluation',
        'submit_answer_btn': 'Submit Answer',
        'self_eval_alert_title': 'Self Evaluation Grading',
        'self_eval_alert_desc': 'Below are the key rubric points strong candidates cover. Honestly check which items you mentioned to calculate your score:',
        'calc_score_btn': 'Calculate Score & Finish',
        'ai_rating_label': 'AI Rating: ',
        'ai_eval_timestamp': 'Evaluation reference date: June 2026, based on latest production standards',
        'strengths_title': 'Strengths',
        'improvements_title': 'Areas of Improvement',
        'followup_title': 'Interviewer Follow-up',
        'chat_input_placeholder': 'Reply to interviewer\'s follow-up...',
        'send_reply_btn': 'Send Reply',
        'chat_turns_hint': 'Chat turns remaining: ',
        'sample_answer_title': 'Sample Answer Reference',
        'copy_btn': 'Copy',
        'copied_btn': 'Copied',
        'flashcard_stats': 'Mastered: ',
        'reset_cards_btn': 'Reset Progress',
        'card_tag': 'Glossary Definition',
        'flip_hint': 'Click card to flip and view definition',
        'rate_fail_btn': 'Still Learning',
        'rate_pass_btn': 'Mastered',
        'api_config_title': 'API Key Configuration (Secure Local Storage)',
        'api_config_desc': 'Keys are stored locally in your browser cache (localStorage) and requests are sent directly to API endpoints. They are never sent to any third-party server.',
        'api_provider_label': 'API Provider',
        'api_key_label': 'API Key',
        'api_key_placeholder': 'Enter your API key...',
        'save_settings_btn': 'Save Settings',
        'progress_management_title': 'Data & Progress Management',
        'progress_management_desc': 'You can wipe all learning progress stored locally, including chapter read states, card mastery, and interview scorecards.',
        'clear_progress_btn': 'Clear Learning Progress',
        'modal_title': 'Quick API Key Setup',
        'modal_desc': 'Provide your API key to unlock the interactive AI Interviewer discussion. The key is securely saved only in your local browser.',
        'save_key_btn': 'Save Key',
        'cancel_btn': 'Cancel',
        'unattempted_status': 'Unattempted',
        'completed_status': 'Completed: ',
        'welcome_title': 'Welcome to the AI System Design Guide!',
        'welcome_desc': 'Please select a chapter from the sidebar on the left to start reading. This guide covers RAG architectures, Agentic systems, model selection, inference optimization, and production case studies.',
        
        // Commute Audio i18n
        'audio_idle_title': 'Ready to Play',
        'audio_idle_status': 'Select a playback source on the right and tap play to begin.',
        'audio_settings_title': 'Playback Settings',
        'audio_source_label': 'Playback Source',
        'audio_source_flashcards': 'Glossary Flashcards (Bilingual TTS)',
        'audio_source_interview': 'Interview Q&A (Bilingual TTS)',
        'audio_pause_label': 'Recall Delay',
        'audio_speed_label': 'Speech Speed',
        'audio_wakelock_label': 'Keep Screen Awake (Prevent Lock)',
        'recall_timer_label': 'Recalling...',
        'track_flashcard_prefix': 'Term: ',
        'track_interview_prefix': 'Question: ',
        'playing_status': 'Playing...',
        'paused_status': 'Paused',
        'audio_split_label': 'Enable Bilingual Segment Splitting (Experimental - choppy)'
    }
};

// ==========================================================================
// Initialization & Lifecycle
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    loadSettings();
    initTheme();
    setupEventListeners();
    
    if (window.speechSynthesis) {
        // Trigger loading voices early
        speechSynthesis.getVoices();
        speechSynthesis.onvoiceschanged = () => {
            console.log("SpeechSynthesis voices refreshed:", speechSynthesis.getVoices().length);
            if (state.audioState.ttsProvider === 'webspeech') {
                updateVoiceSelectors();
            }
        };
    }
    
    try {
        await initApplicationData();
        applyLanguage(state.language);
        
        // Initialize default chapter loading if elements are present on this page
        if (document.getElementById('reader-content')) {
            loadChapter('README.md');
        }
    } catch (err) {
        console.error("Initialization error:", err);
        if (document.getElementById('reader-content')) {
            showErrorInReader("無法加載初始化數據。請確認您是在本機伺服器下開啟此網頁。");
        }
    }
});

// Load progress & API keys from localStorage
function loadSettings() {
    const savedProgress = localStorage.getItem('ai_sys_design_progress');
    if (savedProgress) {
        try {
            state.progress = JSON.parse(savedProgress);
            if (!state.progress.readChapters) state.progress.readChapters = [];
            if (!state.progress.completedQuestions) state.progress.completedQuestions = {};
            if (!state.progress.masteredCards) state.progress.masteredCards = [];
            if (!state.progress.learningCards) state.progress.learningCards = [];
        } catch (e) {
            console.error("Error parsing progress", e);
        }
    }
    
    const savedProvider = localStorage.getItem('ai_sys_design_api_provider');
    const savedKey = localStorage.getItem('ai_sys_design_api_key');
    if (savedProvider) state.apiConfig.provider = savedProvider;
    
    state.apiConfig.geminiKey = localStorage.getItem('ai_sys_design_gemini_key') || '';
    state.apiConfig.openaiKey = localStorage.getItem('ai_sys_design_openai_key') || '';
    state.apiConfig.elevenlabsKey = localStorage.getItem('ai_sys_design_elevenlabs_key') || '';
    
    // For backwards compatibility
    if (savedKey && !state.apiConfig.geminiKey && !state.apiConfig.openaiKey) {
        if (state.apiConfig.provider === 'gemini') {
            state.apiConfig.geminiKey = savedKey;
        } else {
            state.apiConfig.openaiKey = savedKey;
        }
    }
    state.apiConfig.key = state.apiConfig.provider === 'gemini' ? state.apiConfig.geminiKey : state.apiConfig.openaiKey;
    
    state.language = localStorage.getItem('ai_sys_design_lang') || 'zh';

    state.audioState.enableBilingualSplit = localStorage.getItem('ai_sys_design_audio_split') === 'true';
    const splitCheckbox = document.getElementById('audio-split-checkbox');
    if (splitCheckbox) splitCheckbox.checked = state.audioState.enableBilingualSplit;

    state.audioState.style = localStorage.getItem('ai_sys_design_audio_style') || 'standard';
    const styleSelect = document.getElementById('audio-style-select');
    if (styleSelect) styleSelect.value = state.audioState.style;
    updateAudioStyleUI();

    // Load TTS Provider and voice configs
    state.audioState.ttsProvider = localStorage.getItem('ai_sys_design_tts_provider') || 'webspeech';
    state.audioState.voiceA = localStorage.getItem('ai_sys_design_voice_a') || '';
    state.audioState.voiceB = localStorage.getItem('ai_sys_design_voice_b') || '';
    state.audioState.customVoiceA = localStorage.getItem('ai_sys_design_custom_voice_a') || '';
    state.audioState.customVoiceB = localStorage.getItem('ai_sys_design_custom_voice_b') || '';

    const ttsProviderSelect = document.getElementById('audio-tts-provider-select');
    if (ttsProviderSelect) ttsProviderSelect.value = state.audioState.ttsProvider;
    
    const customVoiceAInput = document.getElementById('audio-custom-voice-a-input');
    if (customVoiceAInput) customVoiceAInput.value = state.audioState.customVoiceA;
    const customVoiceBInput = document.getElementById('audio-custom-voice-b-input');
    if (customVoiceBInput) customVoiceBInput.value = state.audioState.customVoiceB;

    // Trigger voice populating
    updateVoiceSelectors();

    const providerSelect = document.getElementById('api-provider-select');
    if (providerSelect) providerSelect.value = state.apiConfig.provider;

    const geminiKeyInput = document.getElementById('gemini-key-input');
    if (geminiKeyInput) geminiKeyInput.value = state.apiConfig.geminiKey;
    const openaiKeyInput = document.getElementById('openai-key-input');
    if (openaiKeyInput) openaiKeyInput.value = state.apiConfig.openaiKey;
    const elevenlabsKeyInput = document.getElementById('elevenlabs-key-input');
    if (elevenlabsKeyInput) elevenlabsKeyInput.value = state.apiConfig.elevenlabsKey;
}

function saveProgress() {
    localStorage.setItem('ai_sys_design_progress', JSON.stringify(state.progress));
    updateProgressBar();
}

function initTheme() {
    const currentTheme = localStorage.getItem('ai_sys_design_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
}

function updateAudioStyleUI() {
    const style = state.audioState.style || 'standard';
    const transcriptPanel = document.getElementById('player-transcript-panel');
    const aiScriptWrapper = document.getElementById('ai-script-gen-wrapper');
    
    if (style === 'standard') {
        if (transcriptPanel) transcriptPanel.style.display = 'none';
        if (aiScriptWrapper) aiScriptWrapper.style.display = 'none';
    } else {
        if (transcriptPanel) transcriptPanel.style.display = 'block';
        if (aiScriptWrapper) {
            aiScriptWrapper.style.display = state.apiConfig.key ? 'block' : 'none';
        }
    }
}

// Fetch all markdown files from local path to initialize components
async function initApplicationData() {
    const readmeResponse = await fetch('./README.md');
    if (!readmeResponse.ok) throw new Error("Failed to load README.md");
    const readmeText = await readmeResponse.text();
    state.chapters = parseChaptersFromReadme(readmeText);
    renderChapterSidebar();
    
    const glossaryResponse = await fetch('./GLOSSARY.md');
    if (glossaryResponse.ok) {
        const glossaryText = await glossaryResponse.text();
        state.glossary = parseGlossary(glossaryText);
        initFlashcards();
    }
    
    const qBankResponse = await fetch('./00-interview-prep/01-question-bank.md');
    if (qBankResponse.ok) {
        const qBankText = await qBankResponse.text();
        state.questions = parseQuestionBank(qBankText);
        renderQuestionList();
    }

    updateProgressBar();
}

// ==========================================================================
// Parsing & Preprocessing Utilities
// ==========================================================================

function parseChaptersFromReadme(readmeText) {
    const sections = {};

    sections['Root'] = {
        title: 'Root',
        files: [{ title: '🧠 指南簡介 (README)', path: 'README.md' }]
    };

    const regex = /\[([^\]]+)\]\(([^)\s]+\.md)\)/g;
    let match;
    while ((match = regex.exec(readmeText)) !== null) {
        const title = match[1].trim();
        const path = match[2].trim();
        
        if (path.startsWith('http') || path.startsWith('#')) continue;
        
        const pathParts = path.split('/');
        let sectionKey = 'Root';
        if (pathParts.length > 1) {
            sectionKey = pathParts[0];
        }
        
        if (!sections[sectionKey]) {
            sections[sectionKey] = {
                title: sectionKey,
                files: []
            };
        }
        
        if (!sections[sectionKey].files.some(f => f.path === path)) {
            sections[sectionKey].files.push({ title, path });
        }
    }
    
    return sections;
}

function parseGlossary(text) {
    const cards = [];
    const lines = text.split('\n');
    for (let line of lines) {
        line = line.trim();
        if (line.startsWith('**') && (line.includes(' — ') || line.includes(' - '))) {
            const parts = line.split(/ — | - /);
            if (parts.length >= 2) {
                const term = parts[0].replace(/\*\*/g, '').trim();
                const definition = parts.slice(1).join(' — ').trim();
                if (term && definition) {
                    cards.push({ term, definition });
                }
            }
        }
    }
    return cards;
}

function parseQuestionBank(text) {
    const questions = [];
    const lines = text.split('\n');
    
    let currentCategory = "RAG Architecture";
    let currentQuestion = null;
    let currentSection = ''; // 'expectations', 'rubric', 'sample', 'followups'
    
    const categoryMapping = {
        'RAG Architecture': 'rag',
        'Agentic Systems': 'agent',
        'Model Selection': 'model',
        'Optimization': 'optimization',
        'Evaluation': 'evaluation',
        'Production and MLOps': 'mlops',
        'System Design Scenarios': 'scenario',
        'Ensemble Methods': 'advanced',
        'Advanced Questions': 'advanced'
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        const categoryMatch = line.match(/^##\s+(.+?)(?:Questions)?\s*$/);
        if (categoryMatch && !line.includes("Table of Contents") && !line.includes("Coverage at a Glance")) {
            currentCategory = categoryMatch[1].replace('Questions', '').trim();
            continue;
        }
        
        const qMatch = line.match(/^###\s+Q(\d+):\s+(.+)$/);
        if (qMatch) {
            if (currentQuestion) {
                questions.push(currentQuestion);
            }
            
            let categoryTag = 'advanced';
            for (let [key, val] of Object.entries(categoryMapping)) {
                if (currentCategory.toLowerCase().includes(key.toLowerCase())) {
                    categoryTag = val;
                    break;
                }
            }
            
            currentQuestion = {
                id: 'Q' + qMatch[1],
                num: parseInt(qMatch[1]),
                title: qMatch[2].trim(),
                category: currentCategory,
                categoryTag: categoryTag,
                expectations: '',
                rubric: [],
                sampleAnswer: '',
                followUps: ''
            };
            currentSection = '';
            continue;
        }
        
        if (currentQuestion) {
            if (line.startsWith('**What interviewers look for:**')) {
                currentSection = 'expectations';
                continue;
            } else if (line.startsWith('**Strong answer covers:**') || line.startsWith('**Strong answer framework:**')) {
                currentSection = 'rubric';
                continue;
            } else if (line.startsWith('**Sample Answer:**')) {
                currentSection = 'sample';
                continue;
            } else if (line.startsWith('**Follow-up to expect:**') || line.startsWith('**Key insight to mention:**') || line.startsWith('**Follow-ups to expect:**')) {
                currentSection = 'followups';
                continue;
            } else if (line.startsWith('---') || line.startsWith('## ')) {
                currentSection = '';
                continue;
            }
            
            if (currentSection === 'expectations') {
                currentQuestion.expectations += line + '\n';
            } else if (currentSection === 'rubric') {
                const bulletMatch = line.match(/^[-*+]\s+(.+)$/) || line.match(/^\d+\.\s+(.+)$/);
                if (bulletMatch) {
                    currentQuestion.rubric.push(bulletMatch[1].trim());
                } else if (line.trim() !== '') {
                    currentQuestion.rubric.push(line.trim());
                }
            } else if (currentSection === 'sample') {
                currentQuestion.sampleAnswer += line + '\n';
            } else if (currentSection === 'followups') {
                currentQuestion.followUps += line + '\n';
            }
        }
    }
    
    if (currentQuestion) {
        questions.push(currentQuestion);
    }
    
    return questions;
}

// Convert GitHub style alerts: > [!NOTE] into HTML callout cards
function preprocessMarkdownAlerts(text) {
    const lines = text.split('\n');
    const processedLines = [];
    let inAlert = false;
    let alertType = '';
    let alertContent = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const alertMatch = line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i);
        if (alertMatch) {
            inAlert = true;
            alertType = alertMatch[1].toLowerCase();
            alertContent = [];
            continue;
        }
        
        if (inAlert) {
            if (line.startsWith('>')) {
                let contentLine = line.substring(1);
                if (contentLine.startsWith(' ')) contentLine = contentLine.substring(1);
                alertContent.push(contentLine);
            } else {
                processedLines.push(`<div class="markdown-callout ${alertType}">`);
                processedLines.push(`<div class="markdown-callout-title"><i class="fa-solid ${getAlertIcon(alertType)}"></i> ${alertType}</div>`);
                processedLines.push(marked.parse(alertContent.join('\n')));
                processedLines.push(`</div>`);
                inAlert = false;
                processedLines.push(line);
            }
        } else {
            processedLines.push(line);
        }
    }
    if (inAlert) {
        processedLines.push(`<div class="markdown-callout ${alertType}">`);
        processedLines.push(`<div class="markdown-callout-title"><i class="fa-solid ${getAlertIcon(alertType)}"></i> ${alertType}</div>`);
        processedLines.push(marked.parse(alertContent.join('\n')));
        processedLines.push(`</div>`);
    }
    return processedLines.join('\n');
}

function getAlertIcon(type) {
    switch (type) {
        case 'note': return 'fa-circle-info';
        case 'tip': return 'fa-lightbulb';
        case 'important': return 'fa-circle-exclamation';
        case 'warning': return 'fa-triangle-exclamation';
        case 'caution': return 'fa-circle-stop';
        default: return 'fa-circle-info';
    }
}

// Customize Marked JS render engine for syntax highlights & Mermaid
const customRenderer = {
    code(code, infostring, escaped) {
        if (infostring === 'mermaid') {
            return `<div class="mermaid">${code}</div>`;
        }
        return `<pre class="language-${infostring || 'text'}"><code class="language-${infostring || 'text'}">${code}</code></pre>`;
    }
};
marked.use({ renderer: customRenderer });

// Strip markdown tags and code blocks for clean TTS voice synthesis
function stripMarkdownForTTS(text) {
    if (!text) return '';
    return text
        .replace(/```[\s\S]*?```/g, '')             // Remove code blocks
        .replace(/`([^`]+)`/g, '$1')               // Remove inline code ticks
        .replace(/\*\*([^*]+)\*\*/g, '$1')         // Remove bold indicators
        .replace(/\*([^*]+)\*/g, '$1')             // Remove italic indicators
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // Remove links, keep text
        .replace(/^[-\*+]\s+/gm, '')               // Remove list bullet signs
        .replace(/^\d+\.\s+/gm, '')                // Remove numbered bullet signs
        .replace(/^#+\s+/gm, '')                   // Remove headers
        .replace(/>\s*/gm, '')                     // Remove blockquotes arrows
        .replace(/\n+/g, ' ')                      // Replace break lines with spaces
        .trim();
}

// ==========================================================================
// Routing & Panel Navigation
// ==========================================================================
function setupEventListeners() {
    // Global Search box listener
    const searchBox = document.getElementById('global-search');
    if (searchBox) {
        searchBox.addEventListener('input', handleGlobalSearch);
    }

    // Reader page action buttons
    const markReadBtn = document.getElementById('mark-chapter-read-btn');
    if (markReadBtn) {
        markReadBtn.addEventListener('click', toggleChapterReadStatus);
    }

    // Mock Interview interaction buttons
    const qCategoryFilter = document.getElementById('question-category-filter');
    if (qCategoryFilter) qCategoryFilter.addEventListener('change', filterQuestionList);
    const randomQBtn = document.getElementById('random-question-btn');
    if (randomQBtn) randomQBtn.addEventListener('click', selectRandomQuestion);
    const submitAnswerBtn = document.getElementById('submit-answer-btn');
    if (submitAnswerBtn) submitAnswerBtn.addEventListener('click', submitInterviewAnswer);
    const submitSelfEvalBtn = document.getElementById('submit-self-eval-btn');
    if (submitSelfEvalBtn) submitSelfEvalBtn.addEventListener('click', saveSelfEvaluationScore);
    const sendAIChatBtn = document.getElementById('send-ai-chat-btn');
    if (sendAIChatBtn) sendAIChatBtn.addEventListener('click', sendCandidateChatMessage);
    const aiChatInput = document.getElementById('ai-chat-input');
    if (aiChatInput) {
        aiChatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendCandidateChatMessage();
        });
    }

    // Tab buttons inside Mock Interview Workspace
    document.querySelectorAll('.interview-tab-nav .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.interview-tab-nav .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.interview-tab-content .tab-pane').forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const targetPane = document.getElementById(btn.getAttribute('data-tab'));
            targetPane.classList.add('active');
        });
    });

    // Flashcards interaction
    const flashcardEl = document.getElementById('flashcard-element');
    if (flashcardEl) {
        flashcardEl.addEventListener('click', (e) => {
            if (e.target.closest('#card-rate-buttons')) return;
            flashcardEl.classList.toggle('flipped');
        });
    }

    const prevCardBtn = document.getElementById('prev-card-btn');
    if (prevCardBtn) prevCardBtn.addEventListener('click', () => navigateFlashcard(-1));
    const nextCardBtn = document.getElementById('next-card-btn');
    if (nextCardBtn) nextCardBtn.addEventListener('click', () => navigateFlashcard(1));
    const resetCardsBtn = document.getElementById('reset-flashcards-btn');
    if (resetCardsBtn) resetCardsBtn.addEventListener('click', resetFlashcardsProgress);
    
    document.querySelectorAll('#card-rate-buttons .rate-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const status = btn.getAttribute('data-status');
            rateGlossaryCard(status);
        });
    });

    // Commute Audio Player controls listeners
    const audioPlayBtn = document.getElementById('audio-play-btn');
    if (audioPlayBtn) audioPlayBtn.addEventListener('click', toggleCommuteAudioPlayback);
    const audioNextBtn = document.getElementById('audio-next-btn');
    if (audioNextBtn) audioNextBtn.addEventListener('click', () => skipCommuteTrack(1));
    const audioPrevBtn = document.getElementById('audio-prev-btn');
    if (audioPrevBtn) audioPrevBtn.addEventListener('click', () => skipCommuteTrack(-1));
    const audioSourceSelect = document.getElementById('audio-source-select');
    if (audioSourceSelect) audioSourceSelect.addEventListener('change', changeCommuteSource);
    
    const audioStyleSelect = document.getElementById('audio-style-select');
    if (audioStyleSelect) {
        audioStyleSelect.addEventListener('change', (e) => {
            state.audioState.style = e.target.value;
            localStorage.setItem('ai_sys_design_audio_style', state.audioState.style);
            stopCommuteAudio();
            updateAudioStyleUI();
        });
    }

    const aiScriptGenBtn = document.getElementById('ai-script-gen-btn');
    if (aiScriptGenBtn) {
        aiScriptGenBtn.addEventListener('click', generateCustomAIScript);
    }

    const audioSpeedSelect = document.getElementById('audio-speed-select');
    if (audioSpeedSelect) audioSpeedSelect.addEventListener('change', updateUtteranceRate);
    const audioWakelock = document.getElementById('audio-wakelock-checkbox');
    if (audioWakelock) {
        audioWakelock.addEventListener('change', (e) => {
            toggleScreenWakeLock(e.target.checked);
        });
    }

    const audioSplit = document.getElementById('audio-split-checkbox');
    if (audioSplit) {
        audioSplit.addEventListener('change', (e) => {
            state.audioState.enableBilingualSplit = e.target.checked;
            localStorage.setItem('ai_sys_design_audio_split', e.target.checked);
        });
    }

    // Settings page actions
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveAPIConfigSettings);
    const clearProgressBtn = document.getElementById('clear-progress-btn');
    if (clearProgressBtn) clearProgressBtn.addEventListener('click', clearAllLearningProgress);
    
    // Audio Page Settings Selectors
    const audioTtsProviderSelect = document.getElementById('audio-tts-provider-select');
    if (audioTtsProviderSelect) {
        audioTtsProviderSelect.addEventListener('change', (e) => {
            state.audioState.ttsProvider = e.target.value;
            localStorage.setItem('ai_sys_design_tts_provider', state.audioState.ttsProvider);
            stopCommuteAudio();
            updateVoiceSelectors();
        });
    }

    const audioVoiceASelect = document.getElementById('audio-voice-a-select');
    if (audioVoiceASelect) {
        audioVoiceASelect.addEventListener('change', (e) => {
            state.audioState.voiceA = e.target.value;
            localStorage.setItem('ai_sys_design_voice_a', state.audioState.voiceA);
            stopCommuteAudio();
            
            const customInputA = document.getElementById('audio-custom-voice-a-input');
            if (customInputA) {
                customInputA.style.display = (state.audioState.ttsProvider === 'elevenlabs' && e.target.value === 'custom') ? 'block' : 'none';
            }
        });
    }

    const audioVoiceBSelect = document.getElementById('audio-voice-b-select');
    if (audioVoiceBSelect) {
        audioVoiceBSelect.addEventListener('change', (e) => {
            state.audioState.voiceB = e.target.value;
            localStorage.setItem('ai_sys_design_voice_b', state.audioState.voiceB);
            stopCommuteAudio();
            
            const customInputB = document.getElementById('audio-custom-voice-b-input');
            if (customInputB) {
                customInputB.style.display = (state.audioState.ttsProvider === 'elevenlabs' && e.target.value === 'custom') ? 'block' : 'none';
            }
        });
    }

    const customVoiceAInput = document.getElementById('audio-custom-voice-a-input');
    if (customVoiceAInput) {
        customVoiceAInput.addEventListener('input', (e) => {
            state.audioState.customVoiceA = e.target.value.trim();
            localStorage.setItem('ai_sys_design_custom_voice_a', state.audioState.customVoiceA);
        });
    }

    const customVoiceBInput = document.getElementById('audio-custom-voice-b-input');
    if (customVoiceBInput) {
        customVoiceBInput.addEventListener('input', (e) => {
            state.audioState.customVoiceB = e.target.value.trim();
            localStorage.setItem('ai_sys_design_custom_voice_b', state.audioState.customVoiceB);
        });
    }

    // Settings page password toggles
    const toggleVisibility = (btnId, inputId) => {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        if (btn && input) {
            btn.addEventListener('click', () => {
                const icon = btn.querySelector('i');
                if (input.type === 'password') {
                    input.type = 'text';
                    if (icon) icon.className = 'fa-solid fa-eye-slash';
                } else {
                    input.type = 'password';
                    if (icon) icon.className = 'fa-solid fa-eye';
                }
            });
        }
    };
    
    toggleVisibility('toggle-gemini-visibility', 'gemini-key-input');
    toggleVisibility('toggle-openai-visibility', 'openai-key-input');
    toggleVisibility('toggle-elevenlabs-visibility', 'elevenlabs-key-input');
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle-btn i');
    if (icon) {
        if (theme === 'dark') {
            icon.className = 'fa-solid fa-sun';
        } else {
            icon.className = 'fa-solid fa-moon';
        }
    }
}

// Language application processor
function applyLanguage(lang) {
    // Translate data-i18n tags
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            const icon = el.querySelector('i');
            if (icon) {
                el.innerHTML = '';
                el.appendChild(icon);
                el.appendChild(document.createTextNode(' ' + translations[lang][key]));
            } else {
                el.innerText = translations[lang][key];
            }
        }
    });

    // Translate data-i18n-placeholder tags
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    // Update dynamically drawn elements if active on current page
    renderChapterSidebar();
    renderQuestionList();

    // Default welcome card translation
    const welcomeCard = document.querySelector('.welcome-card');
    if (welcomeCard && state.activeChapterPath === 'README.md' && !welcomeCard.querySelector('.markdown-body h1')) {
        welcomeCard.innerHTML = `
            <h2>${translations[lang]['welcome_title']}</h2>
            <p>${translations[lang]['welcome_desc']}</p>
        `;
    }

    // Active Question state translations
    const activeQuestionStatus = document.getElementById('active-question-status');
    if (state.activeQuestion && activeQuestionStatus) {
        const question = state.activeQuestion;
        const score = state.progress.completedQuestions[question.id];
        const isAttempted = score !== undefined;
        
        let statusHtml = '';
        if (isAttempted) {
            statusHtml = `<i class="fa-solid fa-circle-check"></i> ${translations[lang]['completed_status']}${score}`;
        } else {
            statusHtml = `<i class="fa-regular fa-circle-question"></i> ${translations[lang]['unattempted_status']}`;
        }
        activeQuestionStatus.innerHTML = statusHtml;
    }

    // Active Flashcards study stats translations
    const statsText = document.getElementById('flashcard-stats-text');
    if (statsText) {
        statsText.innerHTML = `${translations[lang]['flashcard_stats']}<span id="flashcard-mastered-count">${state.progress.masteredCards.length}</span> / <span id="flashcard-total-count">${state.glossary.length}</span>`;
    }

    // Commute player idle texts translation
    const trackTitle = document.getElementById('player-track-title');
    if (!state.audioState.isPlaying && state.audioState.currentTrackIndex === 0 && trackTitle) {
        trackTitle.innerText = translations[lang]['audio_idle_title'];
        const trackStatus = document.getElementById('player-track-status');
        if (trackStatus) trackStatus.innerText = translations[lang]['audio_idle_status'];
    }

    updateProgressBar();
}

// Progress bars calculation
function updateProgressBar() {
    let totalChaptersCount = 0;
    for (let sec in state.chapters) {
        totalChaptersCount += state.chapters[sec].files.length;
    }
    const readCount = state.progress.readChapters.length;
    const readPct = totalChaptersCount > 0 ? (readCount / totalChaptersCount) * 100 : 0;
    
    const totalQuestionsCount = state.questions.length;
    const answeredCount = Object.keys(state.progress.completedQuestions).length;
    const answeredPct = totalQuestionsCount > 0 ? (answeredCount / totalQuestionsCount) * 100 : 0;
    
    const totalFlashcardsCount = state.glossary.length;
    const masteredCount = state.progress.masteredCards.length;
    const masteredPct = totalFlashcardsCount > 0 ? (masteredCount / totalFlashcardsCount) * 100 : 0;

    const overallPct = Math.round((readPct * 0.4) + (answeredPct * 0.4) + (masteredPct * 0.2));

    const overallProgressPct = document.getElementById('overall-progress-pct');
    if (overallProgressPct) overallProgressPct.innerText = `${overallPct}%`;
    const overallProgressFill = document.getElementById('overall-progress-fill');
    if (overallProgressFill) overallProgressFill.style.width = `${overallPct}%`;
    
    const completedBadge = document.getElementById('flashcard-mastered-count');
    if (completedBadge) completedBadge.innerText = masteredCount;
    const totalBadge = document.getElementById('flashcard-total-count');
    if (totalBadge) totalBadge.innerText = totalFlashcardsCount;
}

// ==========================================================================
// Module 1: Chapter Reader Page
// ==========================================================================
function renderChapterSidebar() {
    const container = document.getElementById('chapter-list-container');
    if (!container) return;
    container.innerHTML = '';
    
    const lang = state.language || 'zh';

    for (let sectionKey in state.chapters) {
        const section = state.chapters[sectionKey];
        
        const heading = document.createElement('h4');
        heading.className = 'chapter-section-title';
        heading.innerText = sectionTranslations[lang][sectionKey] || sectionKey;
        heading.style.margin = '12px 12px 6px';
        heading.style.fontSize = '11px';
        heading.style.color = 'var(--text-muted)';
        heading.style.textTransform = 'uppercase';
        container.appendChild(heading);

        section.files.forEach(file => {
            const isRead = state.progress.readChapters.includes(file.path);
            const item = document.createElement('button');
            item.className = `chapter-item ${isRead ? 'read' : ''} ${state.activeChapterPath === file.path ? 'active' : ''}`;
            
            const textNode = document.createElement('span');
            textNode.className = 'chapter-item-text';
            textNode.innerText = file.title;
            item.appendChild(textNode);
            
            const readIcon = document.createElement('i');
            readIcon.className = `read-icon fa-solid ${isRead ? 'fa-circle-check' : 'fa-regular fa-circle'}`;
            item.appendChild(readIcon);

            item.addEventListener('click', () => loadChapter(file.path));
            container.appendChild(item);
        });
    }
}

async function loadChapter(path) {
    state.activeChapterPath = path;
    renderChapterSidebar();

    const workspaceContent = document.getElementById('reader-content');
    if (!workspaceContent) return;
    workspaceContent.innerHTML = '<div class="skeleton-loader" style="height: 200px;"></div><div class="skeleton-loader" style="height: 100px; margin-top: 16px;"></div>';

    const markBtn = document.getElementById('mark-chapter-read-btn');
    const isRead = state.progress.readChapters.includes(path);
    const lang = state.language || 'zh';
    
    if (markBtn) {
        if (isRead) {
            markBtn.className = 'action-btn secondary';
            markBtn.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> <span>${translations[lang]['already_read_btn']}</span>`;
        } else {
            markBtn.className = 'action-btn secondary';
            markBtn.innerHTML = `<i class="fa-regular fa-circle-check"></i> <span>${translations[lang]['mark_read_btn']}</span>`;
        }
    }

    const ghLink = document.getElementById('github-link');
    if (ghLink) ghLink.href = `https://github.com/ombharatiya/ai-system-design-guide/blob/main/${path}`;

    try {
        const response = await fetch(`./${path}`);
        if (!response.ok) throw new Error("Could not find file");
        let mdText = await response.text();

        mdText = preprocessMarkdownAlerts(mdText);
        workspaceContent.innerHTML = marked.parse(mdText);

        if (window.Prism) {
            Prism.highlightAllUnder(workspaceContent);
        }
        
        if (window.mermaid) {
            document.querySelectorAll('.mermaid').forEach((el, index) => {
                const graphDef = el.textContent;
                const id = `mermaid-svg-${index}`;
                mermaid.render(id, graphDef).then(({ svg }) => {
                    el.innerHTML = svg;
                }).catch(err => {
                    console.error("Mermaid render failed", err);
                    el.innerHTML = `<pre class="error-log">${err}</pre>`;
                });
            });
        }
        
        workspaceContent.scrollTop = 0;

    } catch (err) {
        console.error("Load markdown chapter error:", err);
        showErrorInReader(lang === 'zh' ? "加載章節失敗，可能檔案路徑有誤。" : "Failed to load chapter. File path might be incorrect.");
    }
}

function toggleChapterReadStatus() {
    const path = state.activeChapterPath;
    if (!path) return;

    const index = state.progress.readChapters.indexOf(path);
    if (index > -1) {
        state.progress.readChapters.splice(index, 1);
    } else {
        state.progress.readChapters.push(path);
    }
    
    saveProgress();
    loadChapter(path);
}

function showErrorInReader(msg) {
    const readerContent = document.getElementById('reader-content');
    if (readerContent) {
        readerContent.innerHTML = `
            <div class="welcome-card" style="border-color: var(--danger);">
                <i class="fa-solid fa-circle-exclamation" style="font-size: 40px; color: var(--danger); margin-bottom: 16px;"></i>
                <h3>出現錯誤 / Error</h3>
                <p>${msg}</p>
            </div>
        `;
    }
}

// ==========================================================================
// Module 2: Mock Interview Simulator Page
// ==========================================================================
function renderQuestionList() {
    const container = document.getElementById('interview-question-list');
    if (!container) return;
    container.innerHTML = '';

    const filterSelector = document.getElementById('question-category-filter');
    const filterVal = filterSelector ? filterSelector.value : 'all';
    const searchVal = document.getElementById('global-search').value.toLowerCase();
    const lang = state.language || 'zh';

    const filtered = state.questions.filter(q => {
        const matchesCategory = filterVal === 'all' || q.categoryTag === filterVal;
        const matchesSearch = q.title.toLowerCase().includes(searchVal) || q.expectations.toLowerCase().includes(searchVal);
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-hint" style="padding:20px; text-align:center; color:var(--text-muted); font-size:12px;">${lang === 'zh' ? '無符合的問題' : 'No matching questions'}</div>`;
        return;
    }

    filtered.forEach(q => {
        const item = document.createElement('div');
        const score = state.progress.completedQuestions[q.id];
        const isAttempted = score !== undefined;
        
        item.className = `question-item ${state.activeQuestion && state.activeQuestion.id === q.id ? 'active' : ''}`;
        
        let statusHtml = `<span class="status-badge unattempted"><i class="fa-regular fa-circle-question"></i> ${translations[lang]['unattempted_status']}</span>`;
        if (isAttempted) {
            statusHtml = `<span class="status-badge completed"><i class="fa-solid fa-circle-check"></i> ${translations[lang]['completed_status']}${score}</span>`;
        }

        item.innerHTML = `
            <h4>Q${q.num}: ${q.title}</h4>
            <div class="question-item-footer">
                <span class="badge difficulty">Senior</span>
                ${statusHtml}
            </div>
        `;

        item.addEventListener('click', () => loadQuestion(q));
        container.appendChild(item);
    });
}

function filterQuestionList() {
    renderQuestionList();
}

function loadQuestion(question) {
    state.activeQuestion = question;
    renderQuestionList();

    const emptyCard = document.getElementById('interview-empty-state');
    if (emptyCard) emptyCard.style.display = 'none';
    const activePanel = document.getElementById('active-interview-panel');
    if (activePanel) activePanel.style.display = 'flex';

    const categoryBadge = document.getElementById('active-question-category');
    if (categoryBadge) categoryBadge.innerText = question.category;
    const titleHeader = document.getElementById('active-question-title');
    if (titleHeader) titleHeader.innerText = `Q${question.num}: ${question.title}`;
    const expectationsP = document.getElementById('active-question-expectation');
    if (expectationsP) expectationsP.innerText = question.expectations || "Interviewer will test your design and trade-offs analysis.";
    
    const answerTextarea = document.getElementById('user-answer-textarea');
    if (answerTextarea) answerTextarea.value = '';

    const tabFeedbackBtn = document.getElementById('tab-feedback-btn');
    if (tabFeedbackBtn) tabFeedbackBtn.disabled = true;

    const selfEvalContainer = document.getElementById('self-eval-container');
    if (selfEvalContainer) selfEvalContainer.style.display = 'none';
    const aiEvalContainer = document.getElementById('ai-eval-container');
    if (aiEvalContainer) aiEvalContainer.style.display = 'none';

    state.chatTurnsRemaining = 3;
    state.chatHistory = [];
    const turnsSpan = document.getElementById('chat-turns-count');
    if (turnsSpan) turnsSpan.innerText = state.chatTurnsRemaining;
    const chatHistoryBox = document.getElementById('ai-chat-history');
    if (chatHistoryBox) chatHistoryBox.innerHTML = '';
    const chatInput = document.getElementById('ai-chat-input');
    if (chatInput) chatInput.disabled = false;
    const sendReplyBtn = document.getElementById('send-ai-chat-btn');
    if (sendReplyBtn) sendReplyBtn.disabled = false;

    const suggestedBox = document.getElementById('suggested-answer-content');
    if (suggestedBox) {
        suggestedBox.innerHTML = question.sampleAnswer ? marked.parse(question.sampleAnswer) : "<p>No sample answer available.</p>";
        if (window.Prism) {
            Prism.highlightAllUnder(suggestedBox);
        }
    }

    const lang = state.language || 'zh';
    const copyBtn = document.getElementById('copy-sample-btn');
    if (copyBtn) {
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(question.sampleAnswer);
            copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> ${translations[lang]['copied_btn']}`;
            setTimeout(() => copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> ${translations[lang]['copy_btn']}`, 2000);
        };
    }

    const practiceTab = document.querySelector('[data-tab="tab-practice"]');
    if (practiceTab) practiceTab.click();
}

function selectRandomQuestion() {
    if (state.questions.length === 0) return;
    const rand = state.questions[Math.floor(Math.random() * state.questions.length)];
    loadQuestion(rand);
}

async function submitInterviewAnswer() {
    const answerTextarea = document.getElementById('user-answer-textarea');
    const answer = answerTextarea ? answerTextarea.value.trim() : '';
    if (!answer) {
        showToast(state.language === 'zh' ? "請寫下您的回答後再提交。" : "Please write down your answer before submitting.", 'warning');
        return;
    }

    const modeSelector = document.querySelector('input[name="eval-mode"]:checked');
    const evalMode = modeSelector ? modeSelector.value : 'self';
    
    const tabFeedbackBtn = document.getElementById('tab-feedback-btn');
    if (tabFeedbackBtn) {
        tabFeedbackBtn.disabled = false;
        tabFeedbackBtn.click();
    }

    if (evalMode === 'self') {
        renderSelfEvaluationChecklist();
    } else {
        await runAIEvaluation(answer);
    }
}

function renderSelfEvaluationChecklist() {
    const selfEvalContainer = document.getElementById('self-eval-container');
    if (selfEvalContainer) selfEvalContainer.style.display = 'block';
    const aiEvalContainer = document.getElementById('ai-eval-container');
    if (aiEvalContainer) aiEvalContainer.style.display = 'none';

    const checklistContainer = document.getElementById('self-eval-checklist');
    if (!checklistContainer) return;
    checklistContainer.innerHTML = '';
    const lang = state.language || 'zh';

    const rubricPoints = state.activeQuestion.rubric;
    if (rubricPoints.length === 0) {
        checklistContainer.innerHTML = `<p>${lang === 'zh' ? '此題目無特定檢核點。請直接標記完成此題並給予自己 100 分。' : 'No specific rubric points. Mark completed directly with a score of 100.'}</p>`;
        return;
    }

    rubricPoints.forEach((point, i) => {
        const item = document.createElement('label');
        item.className = 'checklist-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'self-eval-check';
        checkbox.value = '1';
        item.appendChild(checkbox);

        const textSpan = document.createElement('span');
        textSpan.className = 'checklist-item-text';
        textSpan.innerText = point;
        item.appendChild(textSpan);

        checklistContainer.appendChild(item);
    });
}

function saveSelfEvaluationScore() {
    const checks = document.querySelectorAll('.self-eval-check');
    const checked = document.querySelectorAll('.self-eval-check:checked');
    const lang = state.language || 'zh';
    
    let score = 100;
    if (checks.length > 0) {
        score = Math.round((checked.length / checks.length) * 100);
    }

    state.progress.completedQuestions[state.activeQuestion.id] = score;
    saveProgress();
    renderQuestionList();
    
    const alertMsg = lang === 'zh' 
        ? `完成自我評估！您的答題覆蓋率為：${score}%。現在為您顯示標準參考答案。` 
        : `Self evaluation completed! Your rubric coverage score is: ${score}%. Showing sample answer reference now.`;
    showToast(alertMsg, 'success');
    
    const suggestedTab = document.querySelector('[data-tab="tab-suggested"]');
    if (suggestedTab) suggestedTab.click();
}

async function runAIEvaluation(candidateAnswer) {
    const selfEvalContainer = document.getElementById('self-eval-container');
    if (selfEvalContainer) selfEvalContainer.style.display = 'none';
    const aiEvalContainer = document.getElementById('ai-eval-container');
    if (aiEvalContainer) aiEvalContainer.style.display = 'block';

    const strengthsBox = document.getElementById('ai-strengths-content');
    const improvementsBox = document.getElementById('ai-improvements-content');
    if (strengthsBox) strengthsBox.innerHTML = '<div class="skeleton-loader" style="height: 120px;"></div>';
    if (improvementsBox) improvementsBox.innerHTML = '<div class="skeleton-loader" style="height: 120px;"></div>';
    const scoreText = document.getElementById('ai-score-text');
    if (scoreText) scoreText.textContent = '...';
    
    const lang = state.language || 'zh';

    if (!state.apiConfig.key) {
        if (strengthsBox) strengthsBox.innerHTML = `<p style="color:var(--danger)">${lang === 'zh' ? '請至設定頁面中輸入您的 API 金鑰，解鎖 AI 模擬面試官診斷。' : 'Please provide your API key in Settings to unlock AI Evaluation.'}</p>`;
        if (improvementsBox) improvementsBox.innerHTML = `<p>${lang === 'zh' ? '您可以使用「自我檢測評分」進行免費的自評模式。' : 'Alternatively, use "Self Evaluation" mode to self-grade for free.'}</p>`;
        return;
    }

    try {
        const evaluation = await callLLMEvaluate(
            state.apiConfig.provider,
            state.apiConfig.key,
            state.activeQuestion,
            candidateAnswer,
            state.activeQuestion.rubric,
            lang
        );

        const score = parseInt(evaluation.score) || 0;
        const circle = document.getElementById('ai-score-circle');
        if (circle) {
            const radius = 15.9155;
            const circumference = 2 * Math.PI * radius;
            circle.style.strokeDasharray = `${score}, 100`;
        }
        if (scoreText) scoreText.textContent = score;

        const ratingLabel = document.getElementById('ai-rating-label');
        if (ratingLabel) ratingLabel.textContent = evaluation.rating || (score >= 80 ? "Outstanding" : score >= 60 ? "Solid" : "Lacks Depth");
        
        if (strengthsBox) strengthsBox.innerHTML = `<ul>${evaluation.strengths.map(s => `<li>${s}</li>`).join('')}</ul>`;
        if (improvementsBox) improvementsBox.innerHTML = `<ul>${evaluation.improvements.map(i => `<li>${i}</li>`).join('')}</ul>`;

        if (evaluation.followUpQuestion) {
            appendChatMessage('interviewer', evaluation.followUpQuestion);
            state.chatHistory.push({ role: 'interviewer', text: evaluation.followUpQuestion });
        }

        state.progress.completedQuestions[state.activeQuestion.id] = score;
        saveProgress();
        renderQuestionList();

    } catch (e) {
        console.error("AI Evaluation error:", e);
        if (strengthsBox) strengthsBox.innerHTML = `<p style="color:var(--danger)">API Error: ${e.message}</p>`;
        if (improvementsBox) improvementsBox.innerHTML = `<p>Please double check your API key validity and quotas.</p>`;
    }
}

function appendChatMessage(role, text) {
    const chatHistoryBox = document.getElementById('ai-chat-history');
    if (!chatHistoryBox) return;
    const msg = document.createElement('div');
    msg.className = `chat-msg ${role}`;
    msg.innerText = text;
    chatHistoryBox.appendChild(msg);
    chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
}

async function sendCandidateChatMessage() {
    const input = document.getElementById('ai-chat-input');
    if (!input) return;
    const message = input.value.trim();
    if (!message || state.chatTurnsRemaining <= 0) return;

    input.value = '';
    state.chatTurnsRemaining--;
    const turnsCountSpan = document.getElementById('chat-turns-count');
    if (turnsCountSpan) turnsCountSpan.innerText = state.chatTurnsRemaining;
    const lang = state.language || 'zh';

    appendChatMessage('candidate', message);
    state.chatHistory.push({ role: 'candidate', text: message });

    const sendBtn = document.getElementById('send-ai-chat-btn');
    if (state.chatTurnsRemaining <= 0) {
        input.disabled = true;
        if (sendBtn) sendBtn.disabled = true;
    }

    const chatHistoryBox = document.getElementById('ai-chat-history');
    const loadingBubble = document.createElement('div');
    loadingBubble.className = 'chat-msg interviewer loading';
    loadingBubble.innerHTML = `<i class="fa-solid fa-ellipsis fa-bounce"></i> ${lang === 'zh' ? '面試官思考中...' : 'Interviewer thinking...'}`;
    if (chatHistoryBox) {
        chatHistoryBox.appendChild(loadingBubble);
        chatHistoryBox.scrollTop = chatHistoryBox.scrollHeight;
    }

    try {
        const reply = await callLLMChatReply(
            state.apiConfig.provider,
            state.apiConfig.key,
            state.activeQuestion,
            state.chatHistory,
            lang
        );
        
        loadingBubble.remove();
        appendChatMessage('interviewer', reply);
        state.chatHistory.push({ role: 'interviewer', text: reply });

        if (state.chatTurnsRemaining <= 0) {
            const closingMsg = lang === 'zh' 
                ? "今天的模擬面試追問到此結束。感謝您的回答！您可以查看標準答案進行更完整的學習。" 
                : "This concludes today's mock interview follow-ups. Thank you for your responses! Feel free to review the sample answer now.";
            appendChatMessage('interviewer', closingMsg);
        }

    } catch (err) {
        loadingBubble.remove();
        appendChatMessage('interviewer', `[Error: ${err.message}]`);
    }
}

// ==========================================================================
// Module 3: Flashcard Study Mode Page
// ==========================================================================
function initFlashcards() {
    if (state.glossary.length === 0 || !document.getElementById('flashcard-element')) return;
    state.currentCardIndex = 0;
    renderFlashcard();
}

function renderFlashcard() {
    const flashcardEl = document.getElementById('flashcard-element');
    if (!flashcardEl || state.glossary.length === 0) return;
    const card = state.glossary[state.currentCardIndex];
    
    flashcardEl.classList.remove('flipped');
    
    document.getElementById('card-term').textContent = card.term;
    document.getElementById('card-term-back').textContent = card.term;
    document.getElementById('card-definition').textContent = card.definition;
    
    document.getElementById('card-counter-text').textContent = `${state.currentCardIndex + 1} / ${state.glossary.length}`;
}

function navigateFlashcard(direction) {
    if (state.glossary.length === 0) return;
    state.currentCardIndex += direction;
    
    if (state.currentCardIndex < 0) {
        state.currentCardIndex = state.glossary.length - 1;
    } else if (state.currentCardIndex >= state.glossary.length) {
        state.currentCardIndex = 0;
    }
    
    renderFlashcard();
}

function rateGlossaryCard(status) {
    const card = state.glossary[state.currentCardIndex];
    if (!card) return;

    if (status === 'pass') {
        if (!state.progress.masteredCards.includes(card.term)) {
            state.progress.masteredCards.push(card.term);
        }
        const index = state.progress.learningCards.indexOf(card.term);
        if (index > -1) state.progress.learningCards.splice(index, 1);
    } else {
        if (!state.progress.learningCards.includes(card.term)) {
            state.progress.learningCards.push(card.term);
        }
        const index = state.progress.masteredCards.indexOf(card.term);
        if (index > -1) state.progress.masteredCards.splice(index, 1);
    }
    
    saveProgress();
    setTimeout(() => {
        navigateFlashcard(1);
    }, 300);
}

function resetFlashcardsProgress() {
    const lang = state.language || 'zh';
    const confirmMsg = lang === 'zh' 
        ? "您確定要重設所有單字卡片的學習狀態嗎？" 
        : "Are you sure you want to reset the mastery status of all flashcards?";
    if (confirm(confirmMsg)) {
        state.progress.masteredCards = [];
        state.progress.learningCards = [];
        saveProgress();
        initFlashcards();
        showToast(lang === 'zh' ? "卡片進度已歸零！" : "Card progress has been reset!", 'success');
    }
}

// ==========================================================================
// Module 3.5: Commute Audio Player Engine (Web Speech API)
// ==========================================================================
function toggleCommuteAudioPlayback() {
    if (state.audioState.isPlaying) {
        pauseCommuteAudio();
    } else {
        playCommuteAudio();
    }
}

function changeCommuteSource() {
    stopCommuteAudio();
    state.audioState.scriptTurns = [];
    state.audioState.currentTurnIndex = 0;
    const sourceSelect = document.getElementById('audio-source-select');
    if (!sourceSelect) return;
    state.audioState.source = sourceSelect.value;
    state.audioState.currentTrackIndex = 0;
    
    const lang = state.language || 'zh';
    const categorySpan = document.getElementById('player-track-category');
    if (categorySpan) {
        categorySpan.innerText = translations[lang][`cat_${state.audioState.source === 'flashcards' ? 'all' : 'rag'}`] || 'AI Guide';
    }
    const trackTitle = document.getElementById('player-track-title');
    if (trackTitle) trackTitle.innerText = translations[lang]['audio_idle_title'];
    const trackStatus = document.getElementById('player-track-status');
    if (trackStatus) trackStatus.innerText = translations[lang]['audio_idle_status'];
    
    // Clear transcript dialogue view
    const listContainer = document.getElementById('transcript-dialogue-list');
    if (listContainer) listContainer.innerHTML = '';
}

function playCommuteAudio() {
    const playerCard = document.getElementById('audio-player-card');
    if (!playerCard) return;
    state.audioState.isPlaying = true;
    playerCard.classList.add('playing');
    
    const playBtn = document.getElementById('audio-play-btn');
    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    
    const wakelockCheckbox = document.getElementById('audio-wakelock-checkbox');
    const wakeLockChecked = wakelockCheckbox ? wakelockCheckbox.checked : false;
    toggleScreenWakeLock(wakeLockChecked);

    playActiveCommuteTrack();
}

function pauseCommuteAudio() {
    const playerCard = document.getElementById('audio-player-card');
    if (!playerCard) return;
    state.audioState.isPlaying = false;
    playerCard.classList.remove('playing');
    
    const playBtn = document.getElementById('audio-play-btn');
    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    
    if (window.speechSynthesis) {
        speechSynthesis.pause();
    }
    clearRecallTimer();
    
    const lang = state.language || 'zh';
    const trackStatus = document.getElementById('player-track-status');
    if (trackStatus) trackStatus.innerText = translations[lang]['paused_status'];
    toggleScreenWakeLock(false);
}

function stopCommuteAudio() {
    const playerCard = document.getElementById('audio-player-card');
    if (playerCard) playerCard.classList.remove('playing');
    
    const playBtn = document.getElementById('audio-play-btn');
    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    
    if (window.speechSynthesis) {
        speechSynthesis.cancel();
    }
    clearRecallTimer();
    toggleScreenWakeLock(false);
}

function skipCommuteTrack(direction) {
    stopCommuteAudio();
    state.audioState.scriptTurns = [];
    state.audioState.currentTurnIndex = 0;
    
    const playlistLength = state.audioState.source === 'flashcards' ? state.glossary.length : state.questions.length;
    if (playlistLength === 0) return;

    state.audioState.currentTrackIndex += direction;
    if (state.audioState.currentTrackIndex < 0) {
        state.audioState.currentTrackIndex = playlistLength - 1;
    } else if (state.audioState.currentTrackIndex >= playlistLength) {
        state.audioState.currentTrackIndex = 0;
    }

    playCommuteAudio();
}

function playActiveCommuteTrack() {
    const lang = state.language || 'zh';
    const categorySpan = document.getElementById('player-track-category');
    const trackTitle = document.getElementById('player-track-title');
    const trackStatus = document.getElementById('player-track-status');
    const pauseSelect = document.getElementById('audio-pause-select');
    
    const style = state.audioState.style || 'standard';
    
    if (style === 'standard') {
        // Standard mode: hide transcript panels
        const transcriptPanel = document.getElementById('player-transcript-panel');
        if (transcriptPanel) transcriptPanel.style.display = 'none';
        
        if (state.audioState.source === 'flashcards') {
            if (state.glossary.length === 0) return;
            const card = state.glossary[state.audioState.currentTrackIndex];
            
            if (categorySpan) categorySpan.innerText = translations[lang]['card_tag'];
            if (trackTitle) trackTitle.innerText = `${translations[lang]['track_flashcard_prefix']}${card.term}`;
            if (trackStatus) trackStatus.innerText = translations[lang]['playing_status'];
            
            speakTextTTS(card.term, 'en', () => {
                if (!state.audioState.isPlaying) return;
                
                const delaySecs = pauseSelect ? parseInt(pauseSelect.value) : 0;
                if (delaySecs > 0) {
                    runRecallCountdown(delaySecs, () => {
                        if (!state.audioState.isPlaying) return;
                        speakTextTTS(card.definition, lang, autoAdvanceTrack);
                    });
                } else {
                    speakTextTTS(card.definition, lang, autoAdvanceTrack);
                }
            });
        } else {
            if (state.questions.length === 0) return;
            const q = state.questions[state.audioState.currentTrackIndex];
            
            if (categorySpan) categorySpan.innerText = q.category;
            if (trackTitle) trackTitle.innerText = `${translations[lang]['track_interview_prefix']}Q${q.num}: ${q.title}`;
            if (trackStatus) trackStatus.innerText = translations[lang]['playing_status'];
            
            speakTextTTS(`Question ${q.num}. ${q.title}`, 'en', () => {
                if (!state.audioState.isPlaying) return;
                
                const delaySecs = pauseSelect ? parseInt(pauseSelect.value) : 0;
                if (delaySecs > 0) {
                    runRecallCountdown(delaySecs, () => {
                        if (!state.audioState.isPlaying) return;
                        const cleanAnswer = stripMarkdownForTTS(q.sampleAnswer);
                        speakTextTTS(cleanAnswer, lang, autoAdvanceTrack);
                    });
                } else {
                    const cleanAnswer = stripMarkdownForTTS(q.sampleAnswer);
                    speakTextTTS(cleanAnswer, lang, autoAdvanceTrack);
                }
            });
        }
    } else {
        // Double speaker Podcast or Interview Roleplay mode
        const transcriptPanel = document.getElementById('player-transcript-panel');
        if (transcriptPanel) transcriptPanel.style.display = 'block';
        
        // Prepare/Load script if empty
        if (!state.audioState.scriptTurns || state.audioState.scriptTurns.length === 0) {
            prepareCommuteScript();
        }
        
        // Update Title Display
        if (state.audioState.source === 'flashcards') {
            const card = state.glossary[state.audioState.currentTrackIndex];
            if (categorySpan) categorySpan.innerText = translations[lang]['card_tag'];
            if (trackTitle) trackTitle.innerText = `${translations[lang]['track_flashcard_prefix']}${card.term}`;
        } else {
            const q = state.questions[state.audioState.currentTrackIndex];
            if (categorySpan) categorySpan.innerText = q.category;
            if (trackTitle) trackTitle.innerText = `${translations[lang]['track_interview_prefix']}Q${q.num}: ${q.title}`;
        }
        
        if (trackStatus) trackStatus.innerText = translations[lang]['playing_status'];
        
        renderTranscriptDialogueUI();
        playActiveScriptTurn();
    }
}

function prepareCommuteScript() {
    if (state.audioState.source === 'flashcards') {
        const card = state.glossary[state.audioState.currentTrackIndex];
        state.audioState.scriptTurns = generatePodcastScriptForTerm(card);
    } else {
        const q = state.questions[state.audioState.currentTrackIndex];
        state.audioState.scriptTurns = generateInterviewRoleplayScript(q);
    }
    state.audioState.currentTurnIndex = 0;
}

function generatePodcastScriptForTerm(card) {
    const term = card.term;
    const definition = card.definition;
    return [
        { 
            speaker: 'host-a', 
            lang: 'en', 
            text: `Hi everyone. Today we are discussing a crucial concept: ${term}.` 
        },
        { 
            speaker: 'host-b', 
            lang: 'zh', 
            text: `是的，${term} 在系統設計中扮演了非常關鍵的角色。它的定義是：${definition}。` 
        },
        { 
            speaker: 'host-a', 
            lang: 'en', 
            text: `Exactly. Understanding ${term} is essential for scaling production AI systems.` 
        },
        { 
            speaker: 'host-b', 
            lang: 'zh', 
            text: `沒錯，這個名詞在很多系統設計面試中都很常見，大家要記住喔。` 
        }
    ];
}

function generateInterviewRoleplayScript(q) {
    const title = q.title;
    const sampleAnswer = q.sampleAnswer || '';
    const parsedAnswerText = stripMarkdownForTTS(sampleAnswer);
    
    // Split standard answer to turns
    const sentences = parsedAnswerText.split(/[.!?。！？]\s+/).filter(s => s.trim().length > 0);
    const candidateTurns = [];
    
    const batchSize = Math.max(1, Math.ceil(sentences.length / 3));
    for (let i = 0; i < sentences.length; i += batchSize) {
        const batch = sentences.slice(i, i + batchSize).join('. ');
        candidateTurns.push(batch);
    }
    
    const script = [
        {
            speaker: 'interviewer',
            lang: 'en',
            text: `Welcome! Let's start the interview. Can you walk me through your design for: ${title}?`
        }
    ];
    
    if (candidateTurns.length > 0) {
        script.push({
            speaker: 'candidate',
            lang: 'zh',
            text: `好的。針對這個設計問題，我會這樣切入：首先，${candidateTurns[0]}`
        });
    }
    
    if (candidateTurns.length > 1) {
        script.push({
            speaker: 'interviewer',
            lang: 'en',
            text: `Alright, that makes sense. How would you handle the details for the next steps?`
        });
        script.push({
            speaker: 'candidate',
            lang: 'zh',
            text: `接著，對於實作細節，${candidateTurns[1]}`
        });
    }
    
    if (candidateTurns.length > 2) {
        script.push({
            speaker: 'interviewer',
            lang: 'en',
            text: `Excellent. Is there anything else you want to add or optimize?`
        });
        script.push({
            speaker: 'candidate',
            lang: 'zh',
            text: `最後，我們還可以考慮以下優化點：${candidateTurns[2]}`
        });
    }
    
    script.push({
        speaker: 'interviewer',
        lang: 'en',
        text: `Great. That was a solid system design walk through. Thank you.`
    });
    
    return script;
}

async function generateCustomAIScript() {
    const playBtn = document.getElementById('ai-script-gen-btn');
    if (!playBtn) return;
    
    const lang = state.language || 'zh';
    const originalHtml = playBtn.innerHTML;
    
    if (!state.apiConfig.key) {
        showToast(lang === 'zh' ? '請先至設定頁面中輸入 API 金鑰。' : 'Please configure an API key in Settings first.', 'error');
        return;
    }
    
    playBtn.disabled = true;
    playBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${lang === 'zh' ? 'AI 劇本生成中...' : 'Generating script...'}`;
    
    try {
        let topicType = 'flashcard';
        let topicData = null;
        
        if (state.audioState.source === 'flashcards') {
            if (state.glossary.length === 0) throw new Error("No glossary data");
            topicType = 'flashcard';
            topicData = state.glossary[state.audioState.currentTrackIndex];
        } else {
            if (state.questions.length === 0) throw new Error("No interview questions");
            topicType = 'question';
            topicData = state.questions[state.audioState.currentTrackIndex];
        }
        
        const toneSelect = document.getElementById('ai-script-tone-select');
        const tone = toneSelect ? toneSelect.value : 'technical';
        
        const generatedTurns = await callLLMGenerateScript(
            state.apiConfig.provider,
            state.apiConfig.key,
            topicType,
            topicData,
            tone,
            lang
        );
        
        if (Array.isArray(generatedTurns) && generatedTurns.length > 0) {
            state.audioState.scriptTurns = generatedTurns;
            state.audioState.currentTurnIndex = 0;
            
            renderTranscriptDialogueUI();
            
            // Auto start playing
            if (!state.audioState.isPlaying) {
                playCommuteAudio();
            } else {
                stopCommuteAudio();
                playCommuteAudio();
            }
            showToast(lang === 'zh' ? 'AI 劇本生成成功！已開始播放。' : 'AI script generated successfully! Playback started.', 'success');
        } else {
            throw new Error("Invalid script output format from LLM");
        }
    } catch (e) {
        console.error("AI Script generation error:", e);
        showToast((lang === 'zh' ? 'AI 劇本生成失敗：' : 'AI script generation failed: ') + e.message, 'error');
    } finally {
        playBtn.disabled = false;
        playBtn.innerHTML = originalHtml;
    }
}

function playActiveScriptTurn() {
    if (!state.audioState.isPlaying) return;
    
    const turns = state.audioState.scriptTurns;
    const index = state.audioState.currentTurnIndex;
    
    if (index >= turns.length) {
        // Complete play, advance to next track
        autoAdvanceTrack();
        return;
    }
    
    const turn = turns[index];
    
    highlightActiveTranscriptTurn(index);
    
    speakTextTTS(turn.text, turn.lang, () => {
        if (!state.audioState.isPlaying) return;
        state.audioState.currentTurnIndex++;
        setTimeout(() => {
            playActiveScriptTurn();
        }, 800);
    }, turn.speaker);
}

function renderTranscriptDialogueUI() {
    const listContainer = document.getElementById('transcript-dialogue-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    const turns = state.audioState.scriptTurns;
    if (!turns || turns.length === 0) {
        listContainer.innerHTML = `<div class="empty-hint" style="text-align:center; padding: 20px; color: var(--text-secondary); font-size:12px;">無劇本資料。請點擊播放自動生成。</div>`;
        return;
    }
    
    turns.forEach((turn, index) => {
        const item = document.createElement('div');
        item.className = `transcript-turn ${turn.speaker}`;
        item.id = `transcript-turn-${index}`;
        
        let avatarEmoji = '🎤';
        let speakerDisplayName = 'Host A';
        if (turn.speaker === 'host-a') {
            avatarEmoji = '👨‍💼';
            speakerDisplayName = state.language === 'zh' ? '播客主持 A' : 'Host A';
        } else if (turn.speaker === 'host-b') {
            avatarEmoji = '👩‍💼';
            speakerDisplayName = state.language === 'zh' ? '播客主持 B' : 'Host B';
        } else if (turn.speaker === 'interviewer') {
            avatarEmoji = '🕵️‍♂️';
            speakerDisplayName = state.language === 'zh' ? '面試官' : 'Interviewer';
        } else if (turn.speaker === 'candidate') {
            avatarEmoji = '🧑‍💻';
            speakerDisplayName = state.language === 'zh' ? '面試者' : 'Candidate';
        }
        
        item.innerHTML = `
            <div class="transcript-avatar">${avatarEmoji}</div>
            <div class="transcript-bubble">
                <span class="transcript-speaker-name">${speakerDisplayName}</span>
                <p class="transcript-text">${turn.text}</p>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

function highlightActiveTranscriptTurn(activeIndex) {
    const listContainer = document.getElementById('transcript-dialogue-list');
    if (!listContainer) return;
    
    document.querySelectorAll('.transcript-turn').forEach(turn => {
        turn.classList.remove('active');
    });
    
    const activeEl = document.getElementById(`transcript-turn-${activeIndex}`);
    if (activeEl) {
        activeEl.classList.add('active');
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function speakTextTTS(text, langCode, onEndCallback, speaker = null) {
    const provider = state.audioState.ttsProvider || 'webspeech';
    
    // Determine effective speaker role if not provided
    let role = speaker;
    if (!role) {
        role = (langCode === 'zh') ? 'host-b' : 'host-a';
    }
    
    if (provider === 'gemini') {
        const key = state.apiConfig.geminiKey;
        if (!key) {
            showToast(state.language === 'zh' ? '尚未設定 Gemini API 金鑰，已自動切換回本機語音。' : 'Gemini API key not configured. Falling back to local speech.', 'warning');
            speakTextWebSpeech(text, langCode, onEndCallback, role);
            return;
        }
        
        let voiceName = (role === 'host-b' || role === 'candidate') 
            ? (state.audioState.voiceB || 'Kore') 
            : (state.audioState.voiceA || 'Aoede');
            
        // Map prebuilt voice option text in case it contains extra info
        if (voiceName.includes('(')) voiceName = voiceName.split(' ')[0];
        
        speakTextGeminiAudio(text, voiceName, onEndCallback).catch(err => {
            console.warn("Gemini Premium TTS failed, falling back to Web Speech:", err);
            speakTextWebSpeech(text, langCode, onEndCallback, role);
        });
        
    } else if (provider === 'openai') {
        const key = state.apiConfig.openaiKey;
        if (!key) {
            showToast(state.language === 'zh' ? '尚未設定 OpenAI API 金鑰，已自動切換回本機語音。' : 'OpenAI API key not configured. Falling back to local speech.', 'warning');
            speakTextWebSpeech(text, langCode, onEndCallback, role);
            return;
        }
        
        let voiceName = (role === 'host-b' || role === 'candidate') 
            ? (state.audioState.voiceB || 'shimmer') 
            : (state.audioState.voiceA || 'nova');
            
        // Map prebuilt voice option text in case it contains extra info
        if (voiceName.includes('(')) voiceName = voiceName.split(' ')[0];
        
        speakTextOpenAITTS(text, voiceName, onEndCallback).catch(err => {
            console.warn("OpenAI Premium TTS failed, falling back to Web Speech:", err);
            speakTextWebSpeech(text, langCode, onEndCallback, role);
        });
        
    } else if (provider === 'elevenlabs') {
        const key = state.apiConfig.elevenlabsKey;
        if (!key) {
            showToast(state.language === 'zh' ? '尚未設定 ElevenLabs API 金鑰，已自動切換回本機語音。' : 'ElevenLabs API key not configured. Falling back to local speech.', 'warning');
            speakTextWebSpeech(text, langCode, onEndCallback, role);
            return;
        }
        
        let voiceId = '';
        if (role === 'host-b' || role === 'candidate') {
            voiceId = state.audioState.voiceB === 'custom' 
                ? state.audioState.customVoiceB 
                : state.audioState.voiceB;
        } else {
            voiceId = state.audioState.voiceA === 'custom' 
                ? state.audioState.customVoiceA 
                : state.audioState.voiceA;
        }
        
        // Fallback default voice if not specified or empty
        if (!voiceId) {
            voiceId = (role === 'host-b' || role === 'candidate') ? 'EXAVITQu4vr4xnSDxMaL' : '21m00Tcm4TlvDq8ikWAM';
        }
        
        speakTextElevenLabs(text, voiceId, onEndCallback).catch(err => {
            console.warn("ElevenLabs Premium TTS failed, falling back to Web Speech:", err);
            speakTextWebSpeech(text, langCode, onEndCallback, role);
        });
        
    } else {
        // webspeech fallback
        speakTextWebSpeech(text, langCode, onEndCallback, role);
    }
}

function splitMixedText(text) {
    if (!text) return [];
    
    // Regex matching Chinese characters, CJK punctuation, full-width symbols
    const cjkRegex = /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef\uff0c\u3002\u3001\uff1f\uff01\uff1a\uff1b]+/g;
    const segments = [];
    let lastIdx = 0;
    let match;
    
    while ((match = cjkRegex.exec(text)) !== null) {
        const matchIdx = match.index;
        if (matchIdx > lastIdx) {
            const engText = text.substring(lastIdx, matchIdx).trim();
            if (engText) {
                segments.push({ lang: 'en', text: engText });
            }
        }
        const zhText = match[0].trim();
        if (zhText) {
            segments.push({ lang: 'zh', text: zhText });
        }
        lastIdx = cjkRegex.lastIndex;
    }
    
    if (lastIdx < text.length) {
        const remaining = text.substring(lastIdx).trim();
        if (remaining) {
            segments.push({ lang: 'en', text: remaining });
        }
    }
    
    return segments;
}

function speakTextWebSpeech(text, langCode, onEndCallback, speaker = null) {
    if (!window.speechSynthesis) {
        console.error("Speech Synthesis not supported");
        if (onEndCallback) onEndCallback();
        return;
    }

    speechSynthesis.cancel();

    // Use toggle state to decide whether to split text. Default is false (smooth, unified turn reading).
    const enableSplit = state.audioState.enableBilingualSplit || false;
    const segments = (langCode === 'zh' && enableSplit) ? splitMixedText(text) : [{ lang: langCode, text: text }];
    if (segments.length === 0) {
        if (onEndCallback) onEndCallback();
        return;
    }

    let currentSegIdx = 0;

    function playNextSegment() {
        if (!state.audioState.isPlaying) return;

        if (currentSegIdx >= segments.length) {
            if (onEndCallback) onEndCallback();
            return;
        }

        const seg = segments[currentSegIdx];
        const utterance = new SpeechSynthesisUtterance(seg.text);
        state.audioState.currentUtterance = utterance;

        const voices = speechSynthesis.getVoices();
        const selectedVoice = selectVoiceForSpeech(voices, seg.lang, speaker);

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        } else {
            utterance.lang = seg.lang === 'zh' ? 'zh-TW' : 'en-US';
        }

        const speedSelect = document.getElementById('audio-speed-select');
        const baseRate = speedSelect ? parseFloat(speedSelect.value) : 1.0;

        // Keep pitches near 1.0 to avoid robotic metallic distortion
        if (speaker === 'host-a') {
            utterance.pitch = 1.0;
            utterance.rate = baseRate * 1.0;
        } else if (speaker === 'host-b') {
            utterance.pitch = 1.0;
            utterance.rate = baseRate * 0.95;
        } else if (speaker === 'interviewer') {
            utterance.pitch = 0.97;
            utterance.rate = baseRate * 0.95;
        } else if (speaker === 'candidate') {
            utterance.pitch = 1.03;
            utterance.rate = baseRate * 1.0;
        } else {
            utterance.pitch = 1.0;
            utterance.rate = baseRate;
        }

        utterance.onend = () => {
            state.audioState.currentUtterance = null;
            if (!state.audioState.isPlaying) return;
            currentSegIdx++;
            playNextSegment();
        };

        utterance.onerror = (e) => {
            console.error("SpeechSynthesis segment error:", e);
            state.audioState.currentUtterance = null;
            if (!state.audioState.isPlaying) return;
            currentSegIdx++;
            playNextSegment();
        };

        speechSynthesis.speak(utterance);
    }

    playNextSegment();
}

async function speakTextGeminiAudio(text, voiceName, onEndCallback) {
    const key = state.apiConfig.geminiKey;
    // Call Gemini multimodal audio generation
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: `Read the following text exactly, with natural tone and pacing, do not add any comments or extra words: ${text}`
                        }
                    ]
                }
            ],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: voiceName
                        }
                    }
                }
            }
        })
    });
    
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Gemini Audio Error ${response.status}`);
    }
    
    const data = await response.json();
    const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part || !part.inlineData) {
        throw new Error("No audio data returned from Gemini API");
    }
    
    const mimeType = part.inlineData.mimeType;
    const base64Data = part.inlineData.data;
    
    playAudioFromBase64(base64Data, mimeType, onEndCallback);
}

async function speakTextOpenAITTS(text, voiceName, onEndCallback) {
    const key = state.apiConfig.openaiKey;
    const url = 'https://api.openai.com/v1/audio/speech';
    
    const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
            model: 'tts-1',
            input: text,
            voice: voiceName
        })
    });
    
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `OpenAI TTS Error ${response.status}`);
    }
    
    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    
    const audio = new Audio(audioUrl);
    state.audioState.currentUtterance = audio;
    
    audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        state.audioState.currentUtterance = null;
        if (onEndCallback) onEndCallback();
    };
    
    audio.onerror = (e) => {
        console.error("OpenAI TTS playback error:", e);
        URL.revokeObjectURL(audioUrl);
        state.audioState.currentUtterance = null;
        if (onEndCallback) onEndCallback();
    };
    
    audio.play().catch(err => {
        console.error("Audio play failed:", err);
        if (onEndCallback) onEndCallback();
    });
}

function playAudioFromBase64(base64Data, mimeType, onEndCallback) {
    const binaryString = window.atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes.buffer], { type: mimeType });
    const audioUrl = URL.createObjectURL(blob);
    
    const audio = new Audio(audioUrl);
    state.audioState.currentUtterance = audio;
    
    audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        state.audioState.currentUtterance = null;
        if (onEndCallback) onEndCallback();
    };
    
    audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        URL.revokeObjectURL(audioUrl);
        state.audioState.currentUtterance = null;
        if (onEndCallback) onEndCallback();
    };
    
    audio.play().catch(err => {
        console.error("Audio play failed:", err);
        if (onEndCallback) onEndCallback();
    });
}

function formatElevenLabsPayload(text, modelId = 'eleven_multilingual_v2', stability = 0.5, similarityBoost = 0.75) {
    return {
        text: text,
        model_id: modelId,
        voice_settings: {
            stability: stability,
            similarity_boost: similarityBoost
        }
    };
}

async function speakTextElevenLabs(text, voiceId, onEndCallback) {
    const key = state.apiConfig.elevenlabsKey;
    if (!key) {
        throw new Error(state.language === 'zh' 
            ? "請先至設定頁面設定 ElevenLabs API 金鑰！" 
            : "Please configure ElevenLabs API Key in settings first!");
    }
    
    const actualVoiceId = voiceId || '21m00Tcm4TlvDq8ikWAM';
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${actualVoiceId}`;
    
    const payload = formatElevenLabsPayload(text);
    
    const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': key
        },
        body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail?.status || errData.error?.message || `ElevenLabs TTS Error ${response.status}`);
    }
    
    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    
    const audio = new Audio(audioUrl);
    state.audioState.currentUtterance = audio;
    
    audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        state.audioState.currentUtterance = null;
        if (onEndCallback) onEndCallback();
    };
    
    audio.onerror = (e) => {
        console.error("ElevenLabs TTS playback error:", e);
        URL.revokeObjectURL(audioUrl);
        state.audioState.currentUtterance = null;
        if (onEndCallback) onEndCallback();
    };
    
    audio.play().catch(err => {
        console.error("ElevenLabs play failed:", err);
        if (onEndCallback) onEndCallback();
    });
}

function updateVoiceSelectors() {
    const provider = state.audioState.ttsProvider || 'webspeech';
    const selectA = document.getElementById('audio-voice-a-select');
    const selectB = document.getElementById('audio-voice-b-select');
    
    if (!selectA || !selectB) return;
    
    selectA.innerHTML = '';
    selectB.innerHTML = '';
    
    const inputA = document.getElementById('audio-custom-voice-a-input');
    const inputB = document.getElementById('audio-custom-voice-b-input');
    
    if (provider === 'webspeech') {
        if (inputA) inputA.style.display = 'none';
        if (inputB) inputB.style.display = 'none';
        
        const voices = speechSynthesis.getVoices();
        
        const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
        if (enVoices.length === 0) {
            selectA.innerHTML = `<option value="">Default English Voice</option>`;
        } else {
            enVoices.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.name;
                opt.innerText = `${v.name} (${v.lang})`;
                selectA.appendChild(opt);
            });
        }
        
        const zhVoices = voices.filter(v => v.lang.toLowerCase().startsWith('zh'));
        if (zhVoices.length === 0) {
            selectB.innerHTML = `<option value="">Default Chinese Voice</option>`;
        } else {
            zhVoices.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.name;
                opt.innerText = `${v.name} (${v.lang})`;
                selectB.appendChild(opt);
            });
        }
        
    } else if (provider === 'gemini') {
        if (inputA) inputA.style.display = 'none';
        if (inputB) inputB.style.display = 'none';
        
        const geminiVoices = [
            { id: 'Aoede', name: 'Aoede (Female, clear)' },
            { id: 'Charon', name: 'Charon (Male, deep)' },
            { id: 'Fenrir', name: 'Fenrir (Male, neutral)' },
            { id: 'Kore', name: 'Kore (Female, warm)' },
            { id: 'Puck', name: 'Puck (Male, energetic)' }
        ];
        
        geminiVoices.forEach(v => {
            const optA = document.createElement('option');
            optA.value = v.id;
            optA.innerText = v.name;
            selectA.appendChild(optA);
            
            const optB = document.createElement('option');
            optB.value = v.id;
            optB.innerText = v.name;
            selectB.appendChild(optB);
        });
        
    } else if (provider === 'openai') {
        if (inputA) inputA.style.display = 'none';
        if (inputB) inputB.style.display = 'none';
        
        const openaiVoices = [
            { id: 'alloy', name: 'Alloy (Neutral)' },
            { id: 'echo', name: 'Echo (Male)' },
            { id: 'fable', name: 'Fable (Neutral)' },
            { id: 'onyx', name: 'Onyx (Male, deep)' },
            { id: 'nova', name: 'Nova (Female, clear)' },
            { id: 'shimmer', name: 'Shimmer (Female, warm)' }
        ];
        
        openaiVoices.forEach(v => {
            const optA = document.createElement('option');
            optA.value = v.id;
            optA.innerText = v.name;
            selectA.appendChild(optA);
            
            const optB = document.createElement('option');
            optB.value = v.id;
            optB.innerText = v.name;
            selectB.appendChild(optB);
        });
        
    } else if (provider === 'elevenlabs') {
        const elevenVoices = [
            { id: 'custom', name: state.language === 'zh' ? '使用自訂 Voice ID (於下方輸入)' : 'Custom Voice ID (input below)' },
            { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (Female, warm)' },
            { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Female, professional)' },
            { id: 'piTKgcLEGmPEeDFhxNsY', name: 'Nicole (Female, energetic)' },
            { id: '29vD33N1CtxCmqQRPOHJ', name: 'Drew (Male, news)' },
            { id: '2EiwWnXF2V4j26tjLbOC', name: 'Clyde (Male, narrative)' },
            { id: '5Q0t7uMcjTElSk0HO1Gt', name: 'Paul (Male, professional)' }
        ];
        
        elevenVoices.forEach(v => {
            const optA = document.createElement('option');
            optA.value = v.id;
            optA.innerText = v.name;
            selectA.appendChild(optA);
            
            const optB = document.createElement('option');
            optB.value = v.id;
            optB.innerText = v.name;
            selectB.appendChild(optB);
        });
        
        if (state.audioState.voiceA === 'custom') {
            if (inputA) inputA.style.display = 'block';
        } else {
            if (inputA) inputA.style.display = 'none';
        }
        
        if (state.audioState.voiceB === 'custom') {
            if (inputB) inputB.style.display = 'block';
        } else {
            if (inputB) inputB.style.display = 'none';
        }
    }
    
    if (state.audioState.voiceA && selectA.querySelector(`option[value="${state.audioState.voiceA}"]`)) {
        selectA.value = state.audioState.voiceA;
    } else if (selectA.options.length > 0) {
        state.audioState.voiceA = selectA.value;
    }
    
    if (state.audioState.voiceB && selectB.querySelector(`option[value="${state.audioState.voiceB}"]`)) {
        selectB.value = state.audioState.voiceB;
    } else if (selectB.options.length > 0) {
        if (provider === 'gemini') {
            selectB.value = 'Kore';
        } else if (provider === 'openai') {
            selectB.value = 'shimmer';
        } else if (provider === 'elevenlabs') {
            selectB.value = 'EXAVITQu4vr4xnSDxMaL';
        }
        state.audioState.voiceB = selectB.value;
    }
}

// ==========================================================================
// Toast Notification and Resilient Fetch Helpers
// ==========================================================================
function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'circle-check';
    else if (type === 'warning') icon = 'triangle-exclamation';
    else if (type === 'danger' || type === 'error') icon = 'circle-xmark';
    
    toast.innerHTML = `
        <i class="fa-solid fa-${icon}"></i>
        <div class="toast-content">${message}</div>
    `;
    
    container.appendChild(toast);
    
    // Trigger CSS slide-in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove toast after duration
    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error(state.language === 'zh' 
                ? `請求超時（超過 ${timeoutMs / 1000} 秒），請檢查您的網路或 API 金鑰！`
                : `Request timed out after ${timeoutMs / 1000} seconds. Please check your network or API key!`);
        }
        throw error;
    }
}

function selectVoiceForSpeech(voices, targetLang, speaker) {
    if (!voices || voices.length === 0) return null;

    // Check if the user has selected a specific Web Speech voice
    const isChinese = targetLang.toLowerCase().startsWith('zh');
    const selectedVoiceName = isChinese 
        ? state.audioState.voiceB 
        : state.audioState.voiceA;
        
    if (selectedVoiceName && state.audioState.ttsProvider === 'webspeech') {
        const matched = voices.find(v => v.name === selectedVoiceName);
        if (matched) return matched;
    }

    const langPrefix = targetLang.toLowerCase().substring(0, 2); // 'en' or 'zh'
    const langVoices = voices.filter(v => {
        const l = v.lang.toLowerCase().replace('_', '-');
        return l.startsWith(langPrefix);
    });

    if (langVoices.length === 0) {
        return null;
    }

    function getVoiceScore(voice, speaker, langPrefix) {
        const name = voice.name.toLowerCase();
        const locale = voice.lang.toLowerCase().replace('_', '-');
        let score = 0;

        // Siri and natural/premium voices score higher
        if (name.includes('siri') || name.includes('premium') || name.includes('natural') || name.includes('novelty') === false) {
            score += 10;
        }

        if (langPrefix === 'en') {
            if (locale.includes('en-us')) {
                score += 5;
            }
            if (speaker === 'host-a') {
                if (name.includes('female') || name.includes('samantha') || name.includes('karen') || (name.includes('siri') && (name.includes('voice 3') || name.includes('voice 4')))) {
                    score += 8;
                }
            } else if (speaker === 'interviewer') {
                if (name.includes('male') || name.includes('daniel') || (name.includes('siri') && (name.includes('voice 1') || name.includes('voice 2')))) {
                    score += 8;
                }
            }
        } else if (langPrefix === 'zh') {
            if (locale.includes('zh-tw') || locale.includes('zh-hant')) {
                score += 8;
            } else if (locale.includes('zh-hk')) {
                score += 5;
            }
            
            if (speaker === 'candidate') {
                if (name.includes('female') || name.includes('mei-jia') || name.includes('sin-ji') || (name.includes('siri') && name.includes('voice 2'))) {
                    score += 3;
                }
            } else if (speaker === 'host-b') {
                if (name.includes('male') || name.includes('tingting') === false) {
                    score += 2;
                }
            }
        }

        return score;
    }

    langVoices.sort((a, b) => getVoiceScore(b, speaker, langPrefix) - getVoiceScore(a, speaker, langPrefix));
    return langVoices[0];
}

// ==========================================================================
// Client-side API LLM Fetch Handlers
// ==========================================================================
async function callLLMAPI(provider, key, systemPrompt, userPrompt, isJson = false) {
    if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: isJson ? "application/json" : "text/plain"
                }
            })
        });
        
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Empty response from Gemini API");
        return text;
    } else {
        const url = 'https://api.openai.com/v1/chat/completions';
        const messages = [];
        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: userPrompt });
        
        const body = {
            model: 'gpt-4o-mini',
            messages: messages
        };
        if (isJson) {
            body.response_format = { type: "json_object" };
        }
        
        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) throw new Error("Empty response from OpenAI API");
        return text;
    }
}

async function callLLMEvaluate(provider, key, question, candidateAnswer, rubric, lang) {
    const systemPrompt = `You are a Senior/Staff AI System Design Interviewer.`;
    const userPrompt = `Evaluate the candidate's answer to the system design question: "${question.title}".
Interviewer expectations: ${question.expectations}.
Key rubric points that candidate should cover:
${rubric.map((r, i) => `${i+1}. ${r}`).join('\n')}

Analyze the candidate's answer below:
---
${candidateAnswer}
---

Provide your evaluation in JSON format containing:
1. "score": An integer (0 to 100) representing how well the candidate answered based on the rubric points.
2. "rating": A brief summary rating label (e.g., "Outstanding" if score >= 85, "Solid" if score >= 65, "Lacks Depth" if lower).
3. "strengths": An array of 2-3 points they explained well.
4. "improvements": An array of 2-3 gaps or optimizations they should address.
5. "followUpQuestion": A targeted, challenging follow-up question probing a trade-off or scaling issue in their design.

Response language: Please output the strengths, improvements, and followUpQuestion in ${lang === 'zh' ? 'Traditional Chinese (繁體中文)' : 'English'}, but retain standard professional AI terminology in English (e.g. RAG, KV Cache, speculative decoding, MLOps, cross-encoders, agentic).
Respond strictly with valid JSON.`;

    const rawText = await callLLMAPI(provider, key, systemPrompt, userPrompt, true);
    return JSON.parse(cleanJsonStr(rawText));
}

async function callLLMChatReply(provider, key, question, chatHistory, lang) {
    const historyStr = chatHistory.map(h => `${h.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${h.text}`).join('\n');
    const userPrompt = `You are a mock interviewer.
The system design question is: "${question.title}".
Interviewer expectations: ${question.expectations}.

Here is the dialogue history:
${historyStr}

Please reply as the Interviewer. Keep your response brief, professional, and challenging (1-3 sentences maximum). Ask a follow-up question or probe details about the candidate's latest reply.
Response language: Please reply in ${lang === 'zh' ? 'Traditional Chinese (繁體中文)' : 'English'}, but keep technical terms in English.`;

    return await callLLMAPI(provider, key, null, userPrompt, false);
}

async function callLLMGenerateScript(provider, key, topicType, topicData, tone, lang) {
    let userPrompt = '';
    if (topicType === 'flashcard') {
        userPrompt = `Create a short podcast dialogue between Host A (English speaker, introduces the topic and asks questions in English) and Host B (Traditional Chinese speaker, explains technical details in Traditional Chinese, keeping professional terms in English) about the technical term: "${topicData.term}".
Definition of ${topicData.term}: "${topicData.definition}".
The tone of the discussion should be ${tone}.
Generate a dialogue of exactly 4-6 turns.
Output strictly as a JSON array of objects, where each object has:
- "speaker": "host-a" or "host-b"
- "lang": "en" (for host-a) or "zh" (for host-b)
- "text": the spoken text.
Ensure all professional terminology remains in English (e.g. RAG, KV Cache, agentic, Swarm, MLOps).
Output valid JSON only.`;
    } else {
        userPrompt = `Create a mock interview dialogue between an Interviewer (English speaker, asks questions in English) and a Candidate (Traditional Chinese speaker, answers professionally in a mix of Traditional Chinese and English, keeping professional technical terms in English) for the system design question: "${topicData.title}".
Expectations: "${topicData.expectations}".
Sample Answer points: "${topicData.sampleAnswer}".
The tone of the candidate's answers should be ${tone}.
Generate a dialogue of exactly 4-6 turns.
Output strictly as a JSON array of objects, where each object has:
- "speaker": "interviewer" or "candidate"
- "lang": "en" (for interviewer) or "zh" (for candidate)
- "text": the spoken text.
Ensure candidate answers are highly professional and structured, and all professional terminology remains in English (e.g. RAG, KV Cache, speculative decoding).
Output valid JSON only.`;
    }

    const rawText = await callLLMAPI(provider, key, null, userPrompt, true);
    return JSON.parse(cleanJsonStr(rawText));
}

function cleanJsonStr(rawText) {
    if (!rawText) return '';
    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/```\s*([\s\S]*?)\s*```/);
    const cleaned = jsonMatch ? jsonMatch[1] : rawText;
    return cleaned.trim();
}

function updateUtteranceRate() {
    if (state.audioState.isPlaying) {
        playActiveCommuteTrack();
    }
}

function runRecallCountdown(totalSecs, onFinishedCallback) {
    clearRecallTimer();
    
    state.audioState.recallTotalSeconds = totalSecs;
    state.audioState.recallSecondsLeft = totalSecs;
    
    const container = document.getElementById('recall-timer-container');
    const displaySecs = document.getElementById('recall-seconds-left');
    const bar = document.getElementById('recall-progress-fill');
    
    if (!container) return;
    container.style.display = 'block';
    if (displaySecs) displaySecs.innerText = `${totalSecs}s`;
    if (bar) bar.style.width = '100%';
    
    state.audioState.recallTimerId = setInterval(() => {
        state.audioState.recallSecondsLeft -= 0.1;
        
        if (state.audioState.recallSecondsLeft <= 0) {
            clearRecallTimer();
            if (onFinishedCallback) onFinishedCallback();
        } else {
            const displayInt = Math.ceil(state.audioState.recallSecondsLeft);
            if (displaySecs) displaySecs.innerText = `${displayInt}s`;
            const pct = (state.audioState.recallSecondsLeft / state.audioState.recallTotalSeconds) * 100;
            if (bar) bar.style.width = `${pct}%`;
        }
    }, 100);
}

function clearRecallTimer() {
    if (state.audioState.recallTimerId) {
        clearInterval(state.audioState.recallTimerId);
        state.audioState.recallTimerId = null;
    }
    const container = document.getElementById('recall-timer-container');
    if (container) container.style.display = 'none';
}

function autoAdvanceTrack() {
    if (!state.audioState.isPlaying) return;
    
    setTimeout(() => {
        if (!state.audioState.isPlaying) return;
        skipCommuteTrack(1);
    }, 2000);
}

async function toggleScreenWakeLock(enabled) {
    if (enabled && state.audioState.isPlaying) {
        try {
            if ('wakeLock' in navigator) {
                state.audioState.wakeLock = await navigator.wakeLock.request('screen');
                console.log("Screen Wake Lock active");
            }
        } catch (err) {
            console.warn("Could not lock wake status:", err);
        }
    } else {
        if (state.audioState.wakeLock) {
            try {
                await state.audioState.wakeLock.release();
                state.audioState.wakeLock = null;
                console.log("Screen Wake Lock released");
            } catch (err) {
                console.error(err);
            }
        }
    }
}

// ==========================================================================
// Module 4: Settings & Data Management
// ==========================================================================
function saveAPIConfigSettings() {
    const provider = document.getElementById('api-provider-select').value;
    const geminiKey = document.getElementById('gemini-key-input').value.trim();
    const openaiKey = document.getElementById('openai-key-input').value.trim();
    const elevenlabsKey = document.getElementById('elevenlabs-key-input').value.trim();
    const lang = state.language || 'zh';
    
    state.apiConfig.provider = provider;
    state.apiConfig.geminiKey = geminiKey;
    state.apiConfig.openaiKey = openaiKey;
    state.apiConfig.elevenlabsKey = elevenlabsKey;
    
    state.apiConfig.key = provider === 'gemini' ? geminiKey : openaiKey;
    
    localStorage.setItem('ai_sys_design_api_provider', provider);
    localStorage.setItem('ai_sys_design_gemini_key', geminiKey);
    localStorage.setItem('ai_sys_design_openai_key', openaiKey);
    localStorage.setItem('ai_sys_design_elevenlabs_key', elevenlabsKey);
    
    localStorage.setItem('ai_sys_design_api_key', state.apiConfig.key);
    
    showSaveStatusMsg('api-save-status');
    showToast(lang === 'zh' ? "API 金鑰儲存成功！" : "API keys saved successfully!", 'success');
    
    updateAudioStyleUI();
}

function showSaveStatusMsg(elementId) {
    const msg = document.getElementById('save-status-msg');
    if (msg) {
        msg.innerText = state.language === 'zh' ? "儲存成功！" : "Saved!";
        msg.className = "save-status-msg show";
        setTimeout(() => {
            msg.className = "save-status-msg";
        }, 2000);
    }
}

function clearAllLearningProgress() {
    const lang = state.language || 'zh';
    const confirmMsg = lang === 'zh'
        ? "⚠️ 注意！此操作將刪除您所有的學習紀錄（包含已讀章節、答題紀錄與熟練卡片）。此操作無法還原，確定要清除嗎？"
        : "⚠️ Warning! This will delete all of your learning history, progress, card mastery, and interview scores. This cannot be undone. Proceed?";
    if (confirm(confirmMsg)) {
        state.progress = {
            readChapters: [],
            completedQuestions: {},
            masteredCards: [],
            learningCards: []
        };
        saveProgress();
        initApplicationData();
        showToast(lang === 'zh' ? "所有學習進度已成功清除。" : "All learning history wiped.", 'success');
    }
}

// ==========================================================================
// Search & Filter Operations
// ==========================================================================
function handleGlobalSearch() {
    const searchVal = document.getElementById('global-search').value.toLowerCase();
    
    // Check if current page is interview page, if so trigger filtering
    if (document.getElementById('interview-question-list')) {
        renderQuestionList();
    }
}
