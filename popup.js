// Popup script for managing enabled sites and settings

const DEFAULT_SITES = ['clipro.tv'];
const DEFAULT_SKIP_NORMAL = 10;
const DEFAULT_SKIP_CTRL = 30;
const DEFAULT_PROGRESS_COLOR = '#e94560';

const siteListEl = document.getElementById('siteList');
const newSiteInput = document.getElementById('newSite');
const addBtn = document.getElementById('addBtn');
const statusEl = document.getElementById('status');
const skipNormalInput = document.getElementById('skipNormal');
const skipCtrlInput = document.getElementById('skipCtrl');
const progressColorInput = document.getElementById('progressColor');

// Load and display sites
async function loadSites() {
  const { sites } = await chrome.storage.sync.get('sites');
  const siteList = sites || DEFAULT_SITES;
  renderSites(siteList);
}

// Load skip interval settings
async function loadSkipSettings() {
  const { skipNormal, skipCtrl } = await chrome.storage.sync.get(['skipNormal', 'skipCtrl']);
  skipNormalInput.value = skipNormal !== undefined ? skipNormal : DEFAULT_SKIP_NORMAL;
  skipCtrlInput.value = skipCtrl !== undefined ? skipCtrl : DEFAULT_SKIP_CTRL;
}

// Load color setting
async function loadColorSetting() {
  const { progressColor } = await chrome.storage.sync.get('progressColor');
  progressColorInput.value = progressColor || DEFAULT_PROGRESS_COLOR;
}

// Save color setting
async function saveColorSetting() {
  const progressColor = progressColorInput.value;
  await chrome.storage.sync.set({ progressColor });
}

// Save skip interval settings
async function saveSkipSettings() {
  const skipNormal = parseInt(skipNormalInput.value, 10);
  const skipCtrl = parseInt(skipCtrlInput.value, 10);

  // Validate
  if (isNaN(skipNormal) || skipNormal < 1 || skipNormal > 300) {
    showStatus('Normal skip must be 1-300 seconds', true);
    return;
  }
  if (isNaN(skipCtrl) || skipCtrl < 1 || skipCtrl > 300) {
    showStatus('Ctrl skip must be 1-300 seconds', true);
    return;
  }

  await chrome.storage.sync.set({ skipNormal, skipCtrl });
  showStatus('Settings saved');
}

// Render site list
function renderSites(sites) {
  if (sites.length === 0) {
    siteListEl.innerHTML = '<div class="empty-state">No sites configured</div>';
    return;
  }

  siteListEl.innerHTML = sites.map(site => `
    <div class="site-item" data-site="${escapeHtml(site)}">
      <span class="site-name">${escapeHtml(site)}</span>
      <button class="remove-btn" title="Remove site">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  `).join('');

  // Add remove handlers
  siteListEl.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const siteItem = e.target.closest('.site-item');
      const site = siteItem.dataset.site;
      await removeSite(site);
    });
  });
}

// Add a new site
async function addSite(site) {
  // Clean up the site input
  site = site.trim().toLowerCase();
  
  // Remove protocol and www
  site = site.replace(/^https?:\/\//, '').replace(/^www\./, '');
  
  // Remove trailing slashes and paths
  site = site.split('/')[0];
  
  if (!site) {
    showStatus('Please enter a valid domain', true);
    return;
  }

  // Basic domain validation
  if (!/^[a-z0-9]+([\-\.][a-z0-9]+)*\.[a-z]{2,}$/i.test(site)) {
    showStatus('Invalid domain format', true);
    return;
  }

  const { sites } = await chrome.storage.sync.get('sites');
  const siteList = sites || DEFAULT_SITES;

  if (siteList.includes(site)) {
    showStatus('Site already exists', true);
    return;
  }

  siteList.push(site);
  await chrome.storage.sync.set({ sites: siteList });
  
  renderSites(siteList);
  newSiteInput.value = '';
  showStatus('Site added successfully');
}

// Remove a site
async function removeSite(site) {
  const { sites } = await chrome.storage.sync.get('sites');
  const siteList = sites || DEFAULT_SITES;
  
  const index = siteList.indexOf(site);
  if (index > -1) {
    siteList.splice(index, 1);
    await chrome.storage.sync.set({ sites: siteList });
    renderSites(siteList);
    showStatus('Site removed');
  }
}

// Show status message
function showStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.className = 'status visible' + (isError ? ' error' : '');
  
  setTimeout(() => {
    statusEl.className = 'status';
  }, 2500);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Debounce helper for auto-save
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Event listeners
addBtn.addEventListener('click', () => addSite(newSiteInput.value));

newSiteInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addSite(newSiteInput.value);
  }
});

// Filter non-numeric input
function filterNumericInput(e) {
  e.target.value = e.target.value.replace(/[^0-9]/g, '');
}

// Auto-save skip settings on change (debounced)
const debouncedSave = debounce(saveSkipSettings, 500);
skipNormalInput.addEventListener('input', (e) => {
  filterNumericInput(e);
  debouncedSave();
});
skipCtrlInput.addEventListener('input', (e) => {
  filterNumericInput(e);
  debouncedSave();
});

// Color picker change listener
progressColorInput.addEventListener('input', saveColorSetting);

// Initialize
loadSites();
loadSkipSettings();
loadColorSetting();