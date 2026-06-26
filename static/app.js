// Application State
let state = {
    updates: [],
    activeFilter: 'All',
    searchQuery: '',
    selectedUpdateForTweet: null
};

// DOM Elements
const elements = {
    btnRefresh: document.getElementById('btn-refresh'),
    refreshIcon: document.getElementById('refresh-icon'),
    lastUpdatedText: document.getElementById('last-updated-text'),
    updatesFeed: document.getElementById('updates-feed'),
    loader: document.getElementById('loader'),
    errorContainer: document.getElementById('error-container'),
    errorMessage: document.getElementById('error-message'),
    btnRetry: document.getElementById('btn-retry'),
    emptyState: document.getElementById('empty-state'),
    
    // Search & Filters
    searchInput: document.getElementById('search-input'),
    filterTabs: document.querySelectorAll('.filter-tab'),
    statCards: document.querySelectorAll('.stat-card'),
    
    // Counters
    countAll: document.getElementById('count-all'),
    countFeatures: document.getElementById('count-features'),
    countChanges: document.getElementById('count-changes'),
    countDeprecations: document.getElementById('count-deprecations'),
    
    // Tweet Modal
    tweetModal: document.getElementById('tweet-modal'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCounter: document.getElementById('char-counter'),
    progressRingFill: document.getElementById('progress-ring-fill'),
    btnSubmitTweet: document.getElementById('btn-submit-tweet')
};

// Circular Progress Ring Configuration for Char Counter
const RING_CIRCUMFERENCE = 2 * Math.PI * 10; // Radius = 10, Circumference ≈ 62.83

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    setupEventListeners();
    fetchUpdates();
    elements.progressRingFill.style.strokeDasharray = `${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`;
    elements.progressRingFill.style.strokeDashoffset = RING_CIRCUMFERENCE;
}

// Event Listeners
function setupEventListeners() {
    // Refresh buttons
    elements.btnRefresh.addEventListener('click', fetchUpdates);
    elements.btnRetry.addEventListener('click', fetchUpdates);
    
    // Search input (with simple input listener)
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        renderUpdates();
    });
    
    // Filter tabs
    elements.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            setActiveFilter(tab.dataset.filter);
        });
    });
    
    // Dashboard Stat Cards
    elements.statCards.forEach(card => {
        card.addEventListener('click', () => {
            setActiveFilter(card.dataset.filter);
        });
    });
    
    // Modal Close
    elements.btnCloseModal.addEventListener('click', hideTweetModal);
    elements.tweetModal.addEventListener('click', (e) => {
        if (e.target === elements.tweetModal) hideTweetModal();
    });
    
    // Tweet text area character count listener
    elements.tweetTextarea.addEventListener('input', handleTweetInput);
    
    // Submit Tweet
    elements.btnSubmitTweet.addEventListener('click', submitTweet);
}

// Set Active Filter
function setActiveFilter(filter) {
    state.activeFilter = filter;
    
    // Update active tab UI
    elements.filterTabs.forEach(tab => {
        if (tab.dataset.filter === filter) {
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
        } else {
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
        }
    });
    
    renderUpdates();
}

// Fetch data from Flask API
async function fetchUpdates() {
    showLoader();
    elements.refreshIcon.classList.add('spinning');
    
    try {
        const response = await fetch('/api/releases');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        state.updates = data.updates || [];
        updateLastCheckedTime();
        updateDashboardCounters();
        renderUpdates();
        hideError();
    } catch (error) {
        console.error('Fetch error:', error);
        showError(error.message);
    } finally {
        hideLoader();
        elements.refreshIcon.classList.remove('spinning');
    }
}

// UI States Control
function showLoader() {
    elements.loader.classList.remove('hidden');
    elements.updatesFeed.classList.add('hidden');
    elements.errorContainer.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
}

function hideLoader() {
    elements.loader.classList.add('hidden');
    elements.updatesFeed.classList.remove('hidden');
}

function showError(msg) {
    elements.errorMessage.textContent = msg || 'Could not fetch release notes.';
    elements.errorContainer.classList.remove('hidden');
    elements.updatesFeed.classList.add('hidden');
    elements.loader.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
}

function hideError() {
    elements.errorContainer.classList.add('hidden');
}

function updateLastCheckedTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    elements.lastUpdatedText.textContent = `Last checked: ${timeStr}`;
}

// Update Counts Dashboard
function updateDashboardCounters() {
    const counts = { All: 0, Feature: 0, Change: 0, Deprecation: 0 };
    
    state.updates.forEach(upd => {
        counts.All++;
        if (counts[upd.type] !== undefined) {
            counts[upd.type]++;
        }
    });
    
    elements.countAll.textContent = counts.All;
    elements.countFeatures.textContent = counts.Feature;
    elements.countChanges.textContent = counts.Change;
    elements.countDeprecations.textContent = counts.Deprecation;
}

// Main Render Function
function renderUpdates() {
    // Clear feed
    elements.updatesFeed.innerHTML = '';
    
    // Filter updates
    const filtered = state.updates.filter(upd => {
        // Category Filter
        const matchesCategory = (state.activeFilter === 'All') || (upd.type === state.activeFilter);
        
        // Search Filter
        const matchesSearch = !state.searchQuery || 
            upd.date.toLowerCase().includes(state.searchQuery) ||
            upd.type.toLowerCase().includes(state.searchQuery) ||
            upd.text_content.toLowerCase().includes(state.searchQuery);
            
        return matchesCategory && matchesSearch;
    });
    
    // Render logic
    if (filtered.length === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.updatesFeed.classList.add('hidden');
        return;
    }
    
    elements.emptyState.classList.add('hidden');
    elements.updatesFeed.classList.remove('hidden');
    
    // Create card element for each update
    filtered.forEach(upd => {
        const card = createCardElement(upd);
        elements.updatesFeed.appendChild(card);
    });
}

// Create individual card elements
function createCardElement(update) {
    const card = document.createElement('article');
    
    // Map style classes to types
    let cardClass = 'card-general';
    let badgeClass = 'badge-general';
    const typeLower = update.type.toLowerCase();
    
    if (typeLower.includes('feature')) {
        cardClass = 'card-feature';
        badgeClass = 'badge-feature';
    } else if (typeLower.includes('change')) {
        cardClass = 'card-change';
        badgeClass = 'badge-change';
    } else if (typeLower.includes('deprecation') || typeLower.includes('security')) {
        cardClass = 'card-deprecation';
        badgeClass = 'badge-deprecation';
    }
    
    card.className = `update-card ${cardClass}`;
    card.id = `card-${update.id}`;
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-metadata">
                <span class="badge ${badgeClass}">${update.type}</span>
                <span class="card-date">${update.date}</span>
            </div>
        </div>
        <div class="card-body">
            ${update.content}
        </div>
        <div class="card-actions">
            <a href="${update.link}" target="_blank" rel="noopener" class="btn-card">
                <i class="fa-solid fa-arrow-up-right-from-square"></i>
                <span>View Docs</span>
            </a>
            <button class="btn-card btn-card-tweet" data-id="${update.id}">
                <i class="fa-brands fa-x-twitter"></i>
                <span>Tweet Update</span>
            </button>
        </div>
    `;
    
    // Attach listener specifically for the tweet button
    const btnTweet = card.querySelector('.btn-card-tweet');
    btnTweet.addEventListener('click', () => {
        showTweetModal(update);
    });
    
    return card;
}

// Tweet Modal Composer Handling
function showTweetModal(update) {
    state.selectedUpdateForTweet = update;
    
    // Construct default tweet content
    // Structure: BQ Update [Date] | [Type]\n\n[Body truncated to keep total tweet within 280 chars]\n\n[Link]
    const headerStr = `Google Cloud BigQuery Update (${update.date}) - [${update.type}]:\n`;
    const linkStr = `\n\nDocs: ${update.link}`;
    
    // Calculate maximum body character length allowed
    const remainingForBody = 280 - headerStr.length - linkStr.length - 5; // buffer for ellipsis
    
    let bodyText = update.text_content;
    if (bodyText.length > remainingForBody) {
        bodyText = bodyText.substring(0, remainingForBody) + '...';
    }
    
    const defaultTweetText = `${headerStr}${bodyText}${linkStr}`;
    
    // Set textarea content
    elements.tweetTextarea.value = defaultTweetText;
    
    // Open modal
    elements.tweetModal.classList.remove('hidden');
    elements.tweetTextarea.focus();
    
    // Trigger count refresh
    handleTweetInput();
}

function hideTweetModal() {
    elements.tweetModal.classList.add('hidden');
    state.selectedUpdateForTweet = null;
}

function handleTweetInput() {
    const text = elements.tweetTextarea.value;
    const length = text.length;
    const remaining = 280 - length;
    
    // Update character text display
    elements.charCounter.textContent = remaining;
    
    // Calculate Circular Progress fill
    const fillPercent = Math.min(length / 280, 1);
    const offset = RING_CIRCUMFERENCE - (fillPercent * RING_CIRCUMFERENCE);
    elements.progressRingFill.style.strokeDashoffset = offset;
    
    // Color indicators based on characters remaining
    if (remaining < 0) {
        elements.charCounter.style.color = '#ef4444'; // Red
        elements.progressRingFill.style.stroke = '#ef4444';
        elements.btnSubmitTweet.disabled = true;
        elements.btnSubmitTweet.style.opacity = '0.5';
    } else if (remaining <= 20) {
        elements.charCounter.style.color = '#f97316'; // Orange warning
        elements.progressRingFill.style.stroke = '#f97316';
        elements.btnSubmitTweet.disabled = false;
        elements.btnSubmitTweet.style.opacity = '1';
    } else {
        elements.charCounter.style.color = 'var(--text-secondary)';
        elements.progressRingFill.style.stroke = 'var(--color-primary)';
        elements.btnSubmitTweet.disabled = false;
        elements.btnSubmitTweet.style.opacity = '1';
    }
}

function submitTweet() {
    const text = elements.tweetTextarea.value;
    if (!text || text.length > 280) return;
    
    // Encode text and build URL
    const encodedText = encodeURIComponent(text);
    const twitterUrl = `https://x.com/intent/tweet?text=${encodedText}`;
    
    // Open X/Twitter intent in new tab
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    
    // Close modal
    hideTweetModal();
}
