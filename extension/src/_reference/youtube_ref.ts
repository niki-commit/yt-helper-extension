export const getPlayer = (): HTMLVideoElement | null => {
  const mainVideo = document.querySelector(
    "video.html5-main-video"
  ) as HTMLVideoElement;
  if (mainVideo) return mainVideo;

  // Fallback to any visible video
  const videos = Array.from(document.querySelectorAll("video"));
  return videos.find((v) => v.offsetWidth > 0 && v.offsetHeight > 0) || null;
};

export const isPlayerReady = (): boolean => {
  const video = getPlayer();
  if (!video) return false;
  // A video is ready if it has basic metadata and readyState >= 1 (HAVE_METADATA)
  const ready = !isNaN(video.duration) && video.readyState >= 1;
  if (!ready) {
    console.debug(
      "[PlayerCheck] video exists but metadata not ready. duration:",
      video.duration,
      "readyState:",
      video.readyState
    );
  }
  return ready;
};

export const waitForPlayer = async (
  timeoutMs: number = 10000
): Promise<boolean> => {
  console.log("[waitForPlayer] Waiting for video element...");
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (isPlayerReady()) {
      console.log(`[waitForPlayer] Video ready (${Date.now() - startTime}ms)`);
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.error(`[waitForPlayer] Video not ready after ${timeoutMs}ms`);
  return false;
};

export const getCurrentTime = (): number => {
  const video = getPlayer();
  return video ? video.currentTime : 0;
};

export const seekTo = (seconds: number, allowSeekAhead: boolean = true) => {
  const video = getPlayer();
  if (video) {
    video.currentTime = seconds;
  }
};

export const playVideo = () => {
  const video = getPlayer();
  if (video) {
    video.play().catch((err) => console.error("Error playing video:", err));
  }
};

export const pauseVideo = () => {
  const video = getPlayer();
  if (video) {
    video.pause();
  }
};

export const getPlayerState = (): number => {
  const video = getPlayer();
  if (!video) return 0; // Unstarted
  if (video.ended) return 0;
  if (video.paused) return 2; // Paused
  return 1; // Playing
};

export const getDuration = (): number => {
  const video = getPlayer();
  return video ? video.duration : 0;
};

export const isAdRunning = (): boolean => {
  const player = document.querySelector("#movie_player");
  if (!player) return false;

  // These classes are the most reliable indicators of an active ad
  return (
    player.classList.contains("ad-showing") ||
    player.classList.contains("ad-interrupting")
  );
};

export const getVideoId = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("v");
};

export const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return "0:00";
  const date = new Date(0);
  date.setSeconds(seconds);
  const result = date.toISOString().substr(11, 8);
  return result.startsWith("00:") ? result.substr(3) : result;
};
