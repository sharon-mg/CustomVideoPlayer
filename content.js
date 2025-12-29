// Custom Video Player Controls - Content Script
(function() {
  'use strict';

  // Prevent multiple injections
  if (window.__customVideoControlsInjected) return;
  window.__customVideoControlsInjected = true;

  const SKIP_SECONDS = 10;
  const VOLUME_STEP = 0.1;

  // Track all enhanced videos and their state
  const enhancedVideos = new WeakSet();
  const videoStates = new WeakMap(); // Stores { usingCustomControls: boolean, originalControlsAttr: boolean }

  // Create control bar element
  function createControlBar(video) {
    const wrapper = document.createElement('div');
    wrapper.className = 'cvpc-wrapper';

    const controlBar = document.createElement('div');
    controlBar.className = 'cvpc-control-bar';

    // Skip backward button
    const skipBack = document.createElement('button');
    skipBack.className = 'cvpc-btn cvpc-skip-back';
    skipBack.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/><text x="12" y="15" text-anchor="middle" font-size="7" font-weight="bold">10</text></svg>`;
    skipBack.title = 'Skip back 10 seconds (←)';
    skipBack.addEventListener('click', (e) => {
      e.stopPropagation();
      video.currentTime = Math.max(0, video.currentTime - SKIP_SECONDS);
    });

    // Play/Pause button
    const playPause = document.createElement('button');
    playPause.className = 'cvpc-btn cvpc-play-pause';
    playPause.title = 'Play/Pause (Space)';
    updatePlayPauseIcon(playPause, video.paused);
    playPause.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlayPause(video);
    });

    // Skip forward button
    const skipForward = document.createElement('button');
    skipForward.className = 'cvpc-btn cvpc-skip-forward';
    skipForward.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/><text x="12" y="15" text-anchor="middle" font-size="7" font-weight="bold">10</text></svg>`;
    skipForward.title = 'Skip forward 10 seconds (→)';
    skipForward.addEventListener('click', (e) => {
      e.stopPropagation();
      video.currentTime = Math.min(video.duration || Infinity, video.currentTime + SKIP_SECONDS);
    });

    // Spacer
    const spacer = document.createElement('div');
    spacer.className = 'cvpc-spacer';

    // Volume container
    const volumeContainer = document.createElement('div');
    volumeContainer.className = 'cvpc-volume-container';

    // Mute button
    const muteBtn = document.createElement('button');
    muteBtn.className = 'cvpc-btn cvpc-mute';
    muteBtn.title = 'Mute/Unmute (M)';
    updateVolumeIcon(muteBtn, video.volume, video.muted);
    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      video.muted = !video.muted;
    });

    // Volume slider
    const volumeSlider = document.createElement('input');
    volumeSlider.type = 'range';
    volumeSlider.className = 'cvpc-volume-slider';
    volumeSlider.min = '0';
    volumeSlider.max = '1';
    volumeSlider.step = '0.05';
    volumeSlider.value = video.volume;
    volumeSlider.title = 'Volume (↑/↓)';
    volumeSlider.addEventListener('input', (e) => {
      e.stopPropagation();
      video.volume = parseFloat(volumeSlider.value);
      video.muted = false;
    });

    // Volume percentage
    const volumePercent = document.createElement('span');
    volumePercent.className = 'cvpc-volume-percent';
    volumePercent.textContent = Math.round(video.volume * 100) + '%';

    volumeContainer.appendChild(muteBtn);
    volumeContainer.appendChild(volumeSlider);
    volumeContainer.appendChild(volumePercent);

    // Fullscreen button
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.className = 'cvpc-btn cvpc-fullscreen';
    fullscreenBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`;
    fullscreenBtn.title = 'Fullscreen (F)';
    fullscreenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFullscreen(video, wrapper);
    });

    // Assemble control bar
    controlBar.appendChild(skipBack);
    controlBar.appendChild(playPause);
    controlBar.appendChild(skipForward);
    controlBar.appendChild(spacer);
    controlBar.appendChild(volumeContainer);
    controlBar.appendChild(fullscreenBtn);

    wrapper.appendChild(controlBar);

    // Event listeners for video state changes
    video.addEventListener('play', () => updatePlayPauseIcon(playPause, false));
    video.addEventListener('pause', () => updatePlayPauseIcon(playPause, true));
    video.addEventListener('volumechange', () => {
      volumeSlider.value = video.volume;
      volumePercent.textContent = Math.round(video.volume * 100) + '%';
      updateVolumeIcon(muteBtn, video.volume, video.muted);
    });

    // Show/hide control bar on hover
    wrapper.addEventListener('mouseenter', () => {
      controlBar.classList.add('cvpc-visible');
    });
    wrapper.addEventListener('mouseleave', () => {
      controlBar.classList.remove('cvpc-visible');
    });

    // Also show on video click (for touch devices)
    wrapper.addEventListener('click', (e) => {
      if (e.target === wrapper || e.target === video) {
        controlBar.classList.toggle('cvpc-visible');
      }
    });

    return wrapper;
  }

  function updatePlayPauseIcon(button, isPaused) {
    if (isPaused) {
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`;
    } else {
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
    }
  }

  function updateVolumeIcon(button, volume, muted) {
    if (muted || volume === 0) {
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`;
    } else if (volume < 0.5) {
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></svg>`;
    } else {
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;
    }
  }

  function togglePlayPause(video) {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  function toggleFullscreen(video, wrapper) {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      (wrapper || video).requestFullscreen();
    }
  }

  // Toggle between custom and native controls for a video
  function toggleVideoControls(video) {
    const state = videoStates.get(video);
    if (!state) return;

    const wrapper = video.closest('.cvpc-wrapper');
    const controlBar = wrapper?.querySelector('.cvpc-control-bar');

    if (state.usingCustomControls) {
      // Switch to native controls
      video.controls = true;
      if (controlBar) controlBar.style.display = 'none';
      state.usingCustomControls = false;
      showNotification(video, 'Native Controls');
    } else {
      // Switch to custom controls
      video.controls = false;
      if (controlBar) controlBar.style.display = '';
      state.usingCustomControls = true;
      showNotification(video, 'Custom Controls');
    }
  }

  // Show a brief notification on the video
  function showNotification(video, message) {
    const wrapper = video.closest('.cvpc-wrapper');
    if (!wrapper) return;

    // Remove existing notification
    const existing = wrapper.querySelector('.cvpc-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'cvpc-notification';
    notification.textContent = message;
    wrapper.appendChild(notification);

    // Trigger animation
    requestAnimationFrame(() => {
      notification.classList.add('cvpc-notification-visible');
    });

    // Remove after animation
    setTimeout(() => {
      notification.classList.remove('cvpc-notification-visible');
      setTimeout(() => notification.remove(), 300);
    }, 1500);
  }

  // Wrap video element with custom controls
  function enhanceVideo(video) {
    if (enhancedVideos.has(video)) return;
    enhancedVideos.add(video);

    // Wait for video to have dimensions
    if (video.videoWidth === 0) {
      video.addEventListener('loadedmetadata', () => enhanceVideoNow(video), { once: true });
    } else {
      enhanceVideoNow(video);
    }
  }

  function enhanceVideoNow(video) {
    // Store original controls state
    const originalControlsAttr = video.controls || video.hasAttribute('controls');
    
    // Initialize state for this video
    videoStates.set(video, {
      usingCustomControls: true,
      originalControlsAttr: originalControlsAttr
    });

    // Hide native controls by default
    video.controls = false;

    // Create wrapper and insert it
    const wrapper = createControlBar(video);
    
    // Position the wrapper around the video
    const parent = video.parentElement;
    if (!parent) return;

    // Check if video already has our wrapper
    if (parent.classList.contains('cvpc-wrapper')) return;

    // Insert wrapper
    parent.insertBefore(wrapper, video);
    wrapper.appendChild(video);

    // Make sure wrapper matches video's size
    const computedStyle = window.getComputedStyle(video);
    if (computedStyle.width !== 'auto') {
      wrapper.style.width = computedStyle.width;
    }
    if (computedStyle.maxWidth) {
      wrapper.style.maxWidth = computedStyle.maxWidth;
    }
    if (computedStyle.height !== 'auto') {
      wrapper.style.height = computedStyle.height;
    }
    if (computedStyle.maxHeight) {
      wrapper.style.maxHeight = computedStyle.maxHeight;
    }

    // Copy some important styles
    wrapper.style.display = 'inline-block';
    wrapper.style.position = 'relative';

    console.log('[Custom Video Controls] Enhanced video:', video.src || video.currentSrc);
  }

  // Find video by src URL (used when receiving message from context menu)
  function findVideoByUrl(srcUrl) {
    const videos = document.querySelectorAll('video');
    for (const video of videos) {
      if (video.src === srcUrl || video.currentSrc === srcUrl) {
        return video;
      }
    }
    // If no exact match, return the first enhanced visible video
    for (const video of videos) {
      if (enhancedVideos.has(video) && isVideoVisible(video)) {
        return video;
      }
    }
    return null;
  }

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleControls') {
      const video = findVideoByUrl(message.srcUrl);
      if (video && enhancedVideos.has(video)) {
        toggleVideoControls(video);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Video not found' });
      }
    }
    return true; // Keep message channel open for async response
  });

  // Keyboard shortcuts handler
  function handleKeyboard(e) {
    // Find the focused or first visible video
    const videos = document.querySelectorAll('video');
    let activeVideo = null;

    for (const video of videos) {
      if (enhancedVideos.has(video) && isVideoVisible(video)) {
        activeVideo = video;
        break;
      }
    }

    if (!activeVideo) return;

    // Don't capture if user is typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return;
    }

    // Check if using custom controls - if not, don't handle shortcuts
    const state = videoStates.get(activeVideo);
    if (state && !state.usingCustomControls) {
      return; // Let native controls handle it
    }

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlayPause(activeVideo);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        activeVideo.currentTime = Math.max(0, activeVideo.currentTime - SKIP_SECONDS);
        break;
      case 'ArrowRight':
        e.preventDefault();
        activeVideo.currentTime = Math.min(activeVideo.duration || Infinity, activeVideo.currentTime + SKIP_SECONDS);
        break;
      case 'ArrowUp':
        e.preventDefault();
        activeVideo.volume = Math.min(1, activeVideo.volume + VOLUME_STEP);
        activeVideo.muted = false;
        break;
      case 'ArrowDown':
        e.preventDefault();
        activeVideo.volume = Math.max(0, activeVideo.volume - VOLUME_STEP);
        break;
      case 'KeyF':
        e.preventDefault();
        const wrapper = activeVideo.closest('.cvpc-wrapper');
        toggleFullscreen(activeVideo, wrapper);
        break;
      case 'KeyM':
        e.preventDefault();
        activeVideo.muted = !activeVideo.muted;
        break;
    }
  }

  function isVideoVisible(video) {
    const rect = video.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && 
           rect.top < window.innerHeight && rect.bottom > 0;
  }

  // Observe DOM for new video elements
  function observeVideos() {
    // Enhance existing videos
    document.querySelectorAll('video').forEach(enhanceVideo);

    // Watch for new videos
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeName === 'VIDEO') {
            enhanceVideo(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('video').forEach(enhanceVideo);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Initialize
  document.addEventListener('keydown', handleKeyboard);
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeVideos);
  } else {
    observeVideos();
  }

  console.log('[Custom Video Controls] Extension loaded');
})();
