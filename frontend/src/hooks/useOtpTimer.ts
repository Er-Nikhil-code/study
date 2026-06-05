import { useEffect, useState } from "react";

export function useOtpTimer(initialSeconds: number = 600) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setIsExpired(true);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return {
    secondsLeft,
    minutes,
    seconds,
    isExpired,
    formattedTime: `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`,
  };
}
