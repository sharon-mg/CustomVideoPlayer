// Background service worker for managing dynamic content script injection

const DEFAULT_SITES = ['clipro.tv'];

// Initialize default sites and context menu on install
chrome.runtime.onInstalled.addListener(async () => {
  const { sites } = await chrome.storage.sync.get('sites');
  if (!sites) {
    await chrome.storage.sync.set({ sites: DEFAULT_SITES });
  }

  // Create context menu for toggling controls
  chrome.contextMenus.create({
    id: 'toggle-video-controls',
    title: 'Toggle Custom/Native Controls',
    contexts: ['video']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'toggle-video-controls' && tab?.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        action: 'toggleControls',
        srcUrl: info.srcUrl
      });
    } catch (err) {
      console.log('Could not send message to tab:', err.message);
    }
  }
});

// Listen for tab updates to inject content script on matching sites
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  
  const { sites } = await chrome.storage.sync.get('sites');
  const siteList = sites || DEFAULT_SITES;
  
  const url = new URL(tab.url);
  const hostname = url.hostname.replace(/^www\./, '');
  
  const isMatchingSite = siteList.some(site => {
    const cleanSite = site.replace(/^www\./, '');
    return hostname === cleanSite || hostname.endsWith('.' + cleanSite);
  });
  
  if (isMatchingSite) {
    try {
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ['styles.css']
      });
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
    } catch (err) {
      // Script may already be injected or page not accessible
      console.log('Could not inject scripts:', err.message);
    }
  }
});
