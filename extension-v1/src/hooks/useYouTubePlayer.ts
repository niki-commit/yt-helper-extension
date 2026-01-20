import { useState, useEffect, useCallback } from "react";

export function useYouTubePlayer() {
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
    videoElement?.play();
  }, [videoElement]);

  const pause = useCallback(() => {
    videoElement?.pause();
  }, [videoElement]);

  const seekTo = useCallback(
    (seconds: number) => {
      if (videoElement) {
        videoElement.currentTime = seconds;
      }
    },
    [videoElement]
  );

  const getCurrentTime = useCallback(() => {
    return videoElement?.currentTime || 0;
  }, [videoElement]);

  return {
    videoElement,
    play,
    pause,
    seekTo,
    getCurrentTime,
  };
}
