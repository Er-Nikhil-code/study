"use client";

import dynamic from "next/dynamic";
import React from "react";

interface ChessPieceProps {
  role: string;
  progressPct?: number;
}

const ChessPiece3DInner = dynamic(() => import("./ChessPiece3DInner"), {
  ssr: false,
});

export default function ChessPiece3D(props: ChessPieceProps) {
  return (
    <div className="w-full h-full relative">
      <ChessPiece3DInner {...props} />
    </div>
  );
}
