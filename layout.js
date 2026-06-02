/**
 * AI System Design Guide - Shared Layout Manager
 * Dynamically injects unified Sidebar and Header across separate HTML documents.
 */

document.addEventListener('DOMContentLoaded', () => {
    injectLayout();
});

function injectLayout() {
    const container = document.querySelector('.app-container');
    if (!container) return;

    // Detect Current Page based on URL pathname
    const path = window.location.pathname;
    let activePage = 'reader';
    if (path.includes('interview.html')) activePage = 'interview';
    else if (path.includes('flashcards.html')) activePage = 'flashcards';
    else if (path.includes('audio.html')) activePage = 'audio';
    else if (path.includes('settings.html')) activePage = 'settings';

    // 1. Create Sidebar Element
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.id = 'app-sidebar';
    sidebar.innerHTML = `
        <div class="sidebar-header">
            <div class="logo">
                <span class="logo-emoji">🧠</span>
                <div class="logo-text">
                    <h1>AI System Design</h1>
                    <span class="logo-subtitle">Production & Interview</span>
                </div>
            </div>
            <button class="mobile-close-btn" id="mobile-sidebar-close" aria-label="Close sidebar">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
        
        <nav class="sidebar-menu">
            <a href="index.html" class="menu-item ${activePage === 'reader' ? 'active' : ''}">
                <i class="fa-solid fa-book-open"></i>
                <span data-i18n="menu_reader">教材閱讀</span>
            </a>
            <a href="interview.html" class="menu-item ${activePage === 'interview' ? 'active' : ''}">
                <i class="fa-solid fa-comments"></i>
                <span data-i18n="menu_interview">模擬面試</span>
            </a>
            <a href="flashcards.html" class="menu-item ${activePage === 'flashcards' ? 'active' : ''}">
                <i class="fa-solid fa-layer-group"></i>
                <span data-i18n="menu_flashcards">閃卡複習</span>
            </a>
            <a href="audio.html" class="menu-item ${activePage === 'audio' ? 'active' : ''}">
                <i class="fa-solid fa-circle-play"></i>
                <span data-i18n="menu_audio">通勤聽書</span>
            </a>
            <a href="settings.html" class="menu-item ${activePage === 'settings' ? 'active' : ''}">
                <i class="fa-solid fa-sliders"></i>
                <span data-i18n="menu_settings">設定</span>
            </a>
        </nav>

        <div class="sidebar-footer">
            <div class="progress-widget">
                <div class="progress-widget-header">
                    <span data-i18n="progress_title">學習進度</span>
                    <span id="overall-progress-pct">0%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" id="overall-progress-fill" style="width: 0%"></div>
                </div>
            </div>
            <a href="settings.html" class="settings-btn" style="text-decoration:none; display:flex;">
                <i class="fa-solid fa-gear"></i>
                <span data-i18n="quick_api_btn">API 金鑰設定</span>
            </a>
        </div>
    `;
    container.insertBefore(sidebar, container.firstChild);

    // 2. Create Header Element in Main Content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        const header = document.createElement('header');
        header.className = 'main-header';
        header.innerHTML = `
            <div class="header-left">
                <button class="menu-toggle-btn" id="mobile-sidebar-toggle" aria-label="Toggle sidebar">
                    <i class="fa-solid fa-bars"></i>
                </button>
                <h2 id="current-page-title" data-i18n="menu_${activePage}">教材閱讀</h2>
            </div>
            <div class="header-right">
                <div class="search-box">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    <input type="text" id="global-search" placeholder="搜尋教材、問題或單字..." data-i18n-placeholder="search_placeholder">
                </div>
                <button class="theme-toggle" id="lang-toggle-btn" title="切換語言 / Toggle Language" aria-label="Toggle language">
                    <i class="fa-solid fa-language"></i>
                </button>
                <button class="theme-toggle" id="theme-toggle-btn" aria-label="Toggle theme">
                    <i class="fa-solid fa-moon"></i>
                </button>
            </div>
        `;
        mainContent.insertBefore(header, mainContent.firstChild);
    }

    // 3. Bind Header and Mobile Sidebar events
    bindLayoutEvents();
}

function bindLayoutEvents() {
    // Mobile Sidebar Toggles
    const toggleBtn = document.getElementById('mobile-sidebar-toggle');
    const closeBtn = document.getElementById('mobile-sidebar-close');
    const sidebar = document.getElementById('app-sidebar');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => sidebar.classList.add('open'));
    }
    if (closeBtn && sidebar) {
        closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));
    }

    // Theme toggler
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('ai_sys_design_theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    // Language Toggler
    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            if (typeof state !== 'undefined' && typeof applyLanguage === 'function') {
                const nextLang = state.language === 'zh' ? 'en' : 'zh';
                state.language = nextLang;
                localStorage.setItem('ai_sys_design_lang', nextLang);
                applyLanguage(nextLang);
            }
        });
    }
}
