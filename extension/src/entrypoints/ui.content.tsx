import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import VideoNotes from '@/components/VideoNotes';
import '@/styles/globals.css';

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'video-notes-ui',
      position: 'inline',
      anchor: 'ytd-watch-flexy #secondary', // More specific to watch page
      append: 'first',
      onMount: (container) => {
        
        // Block YouTube shortcuts
        const handleKeys = (e: KeyboardEvent) => {
            const path = e.composedPath();
            const isInside = path.includes(container);
            if (isInside) {
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        };

        window.addEventListener('keydown', handleKeys, true);
        window.addEventListener('keyup', handleKeys, true);
        window.addEventListener('keypress', handleKeys, true);

        const VideoNotesWrapper = () => {
            const getVid = () => new URLSearchParams(window.location.search).get('v') || '';
            const [vid, setVid] = React.useState(getVid);

            React.useEffect(() => {
                const check = () => {
                    const currentVid = getVid();
                    if (currentVid !== vid) {
                        setVid(currentVid);
                    }
                    
                    // Force secondary container to be visible whenever we are on a watch page
                    if (currentVid) {
                        const sec = document.querySelector('#secondary');
                        if (sec instanceof HTMLElement && sec.style.display === 'none') {
                            sec.style.display = 'block';
                            sec.style.visibility = 'visible';
                        }
                    }
                };
                
                window.addEventListener('yt-navigate-finish', check);
                window.addEventListener('popstate', check);
                window.addEventListener('yt-page-data-updated', check);
                const interval = setInterval(check, 1000);
                
                return () => {
                    window.removeEventListener('yt-navigate-finish', check);
                    window.removeEventListener('popstate', check);
                    window.removeEventListener('yt-page-data-updated', check);
                    clearInterval(interval);
                };
            }, [vid]);

            if (!vid) {
                return null;
            }

            return <VideoNotes key={vid} videoId={vid} />;
        };
        
        const root = ReactDOM.createRoot(container);
        root.render(<VideoNotesWrapper />);
        
        return {
            unmount: () => {
                window.removeEventListener('keydown', handleKeys, true);
                window.removeEventListener('keyup', handleKeys, true);
                window.removeEventListener('keypress', handleKeys, true);
                root.unmount();
            }
        };
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });
    
    // Use autoMount for standard lifecycle
    ui.autoMount();
    
    // Persistence Guard: YouTube's SPA sometimes swallows the initial mount if it happens during a transition.
    // This loop ensures we are mounted if we are on a watch page.
    const ensurePersistence = () => {
        const hasVid = !!new URLSearchParams(window.location.search).get('v');
        const hasAnchor = !!document.querySelector('ytd-watch-flexy #secondary');
        
        if (hasVid && hasAnchor && !ui.mounted) {
            ui.mount();
        }
    };
    
    // Check frequently during the first 10 seconds of any page life
    setInterval(ensurePersistence, 1000);

    // Initialize Features with Settings
    import('@/storage/settings').then(({ getSettings, watchSettings }) => {
      import('@/features/autoPause').then(({ setAutoPauseEnabled, initAutoPause }) => {
        initAutoPause(); // Always attach listeners, they check the flag inside
        
        // Initial load
        getSettings().then(s => {
          setAutoPauseEnabled(s.autoPauseEnabled);
          // Distraction mode initial apply
          import('@/features/distraction').then(({ setDistractionFreeMode }) => {
            setDistractionFreeMode(s.distractionFreeEnabled);
          });
        });

        // Watch for changes
        watchSettings((newSettings) => {
          setAutoPauseEnabled(newSettings.autoPauseEnabled);
          import('@/features/distraction').then(({ setDistractionFreeMode }) => {
            setDistractionFreeMode(newSettings.distractionFreeEnabled);
          });
        });
      });
    });
  },
});
