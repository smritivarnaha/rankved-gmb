"use client";

import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import { Loader2 } from "lucide-react";

export function LottieWrapper({ url, className }: { url: string; className?: string }) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Lottie fetch error:", err));
  }, [url]);

  if (!animationData) return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return <Lottie animationData={animationData} loop={true} className={className} />;
}
