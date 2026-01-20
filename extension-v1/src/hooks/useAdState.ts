import { useState, useEffect } from "react";

export function useAdState() {
  const [isAdActive, setIsAdActive] = useState(false);

  useEffect(() => {
    const player = document.querySelector("#movie_player");
    if (!player) return;

    const checkAdState = () => {
      const isAd =
        player.classList.contains("ad-showing") ||
        player.classList.contains("ad-interrupting");
      setIsAdActive(isAd);
    };

    // Initial check
    checkAdState();

    const observer = new MutationObserver(checkAdState);
    observer.observe(player, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return { isAdActive };
}
