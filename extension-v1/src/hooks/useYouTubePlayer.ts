import { useState, useEffect, useCallback } from "react";

export interface PlayerOptions {
  isDashboard?: boolean;
  videoId?: string | null;
}

export function useYouTubePlayer(options: PlayerOptions = {}) {
  const { isDashboard, videoId } = options;
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  );

  // Find the video element on mount and observe for changes
  useEffect(() => {
    const findVideo = () => {
      const video = document.querySelector(
        "video.html5-main-video"
      ) as HTMLVideoElement;
      if (video) setVideoElement(video);
    };

    findVideo();

    const observer = new MutationObserver(findVideo);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const play = useCallback(() => {
    if (isDashboard) {
      window.postMessage({ type: "YT_PLAY" }, "*");
      return;
    }
    videoElement?.play();
  }, [videoElement, isDashboard]);

  const pause = useCallback(() => {
    if (isDashboard) {
      window.postMessage({ type: "YT_PAUSE" }, "*");
      return;
    }
    videoElement?.pause();
  }, [videoElement, isDashboard]);

  const seekTo = useCallback(
    (seconds: number) => {
      if (isDashboard) {
        window.postMessage({ type: "SEEK_TO", seconds }, "*");
        return;
      }
      if (videoElement) {
        videoElement.currentTime = seconds;
      }
    },
    [videoElement, isDashboard]
  );

  const getCurrentTime = useCallback(() => {
    if (isDashboard) {
      // In Dashboard, we'll need another way to fetch time if needed,
      // but for "Review Mode", we mostly jump TO notes.
      return 0;
    }
    return videoElement?.currentTime || 0;
  }, [videoElement, isDashboard]);

  return {
    videoElement,
    play,
    pause,
    seekTo,
    getCurrentTime,
  };
}
