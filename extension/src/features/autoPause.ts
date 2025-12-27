import { pauseVideo, playVideo, getPlayer, getPlayerState } from '@/utils/youtube';
import { localStore } from '@/storage/dexie';

let wasAutoPaused = false;
let isEnabled = false;

// We need to sync this with UI/Settings
export const setAutoPauseEnabled = (enabled: boolean) => {
    console.log('[AutoPause] Feature enabled signal:', enabled);
    isEnabled = enabled;
};

const handleVisibilityChange = () => {
    if (!isEnabled) return;

    if (document.hidden) {
        if (getPlayerState() === 1) { // 1 = Playing
            pauseVideo();
            wasAutoPaused = true;
        }
    } else {
        if (wasAutoPaused) {
            playVideo();
            wasAutoPaused = false;
        }
    }
};

const handleWindowBlur = () => {
    if (!isEnabled) return;
    
    if (getPlayerState() === 1) {
        console.log('[AutoPause] Window blurred, pausing video');
        pauseVideo();
        wasAutoPaused = true;
    }
};

const handleWindowFocus = () => {
    if (!isEnabled) return;
    if (wasAutoPaused) {
        playVideo();
        wasAutoPaused = false;
    }
};

export const initAutoPause = () => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleWindowBlur);
        window.removeEventListener('focus', handleWindowFocus);
    };
};
