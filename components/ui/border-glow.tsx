"use client";

import React, { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BorderGlowProps {
  children: React.ReactNode;
  backgroundColor?: string;
  colors?: string[];
  glowIntensity?: number;
  fillOpacity?: number;
  borderRadius?: number;
  animated?: boolean;
  edgeSensitivity?: number;
  className?: string;
}

export function BorderGlow({
  children,
  backgroundColor = "#021f1d",
  colors = ["#2dd4bf", "#38bdf8", "#22d3ee"],
  glowIntensity = 0.8,
  fillOpacity = 0.2,
  borderRadius = 16,
  animated = true,
  edgeSensitivity = 200,
  className,
}: BorderGlowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn("relative p-[1px] overflow-hidden", className)}
      style={{
        borderRadius: `${borderRadius}px`,
      }}
    >
      {/* Background layer */}
      <div 
        className="absolute inset-0 z-0"
        style={{ backgroundColor }}
      />

      {/* Glow effect that follows mouse */}
      <div
        className={cn(
          "absolute inset-0 z-10 transition-opacity duration-500 pointer-events-none",
          isHovered ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: `radial-gradient(circle ${edgeSensitivity}px at ${mousePosition.x}px ${mousePosition.y}px, ${colors[0]}80, transparent 80%)`,
        }}
      />

      {/* Sweep animation border */}
      {animated && (
        <div 
          className="absolute inset-0 z-20 pointer-events-none opacity-30"
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${colors[0]} 40deg, ${colors[1]} 120deg, transparent 160deg)`,
            animation: "border-sweep 4s linear infinite",
          }}
        />
      )}

      {/* Inner card */}
      <div
        className="relative z-30 m-[1px] flex h-full w-full flex-col justify-between overflow-hidden"
        style={{
          borderRadius: `${borderRadius - 1}px`,
          backgroundColor: backgroundColor,
        }}
      >
        {/* Fill glow on hover */}
        <div 
          className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-500",
            isHovered ? "opacity-100" : "opacity-0"
          )}
          style={{
            background: `radial-gradient(circle ${edgeSensitivity * 0.75}px at ${mousePosition.x}px ${mousePosition.y}px, ${colors[0]}33, transparent 100%)`,
          }}
        />
        <div className="relative z-40 border-glow-inner h-full w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
