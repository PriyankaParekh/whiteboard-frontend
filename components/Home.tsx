"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleStart = () => {
    if (!name.trim()) return;

    setIsLoading(true);

    let finalRoomId = roomId.trim();

    // If no room ID provided → generate one
    if (!finalRoomId) {
      finalRoomId = uuidv4();
    }

    router.push(`/room/${finalRoomId}?name=${encodeURIComponent(name)}`);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-gray-950"
    >
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(20px); }
        }

        .animate-slide-up {
          animation: slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .stagger-1 { animation-delay: 0.1s; opacity: 0; }
        .stagger-2 { animation-delay: 0.25s; opacity: 0; }
        .stagger-3 { animation-delay: 0.4s; opacity: 0; }
        .stagger-4 { animation-delay: 0.5s; opacity: 0; }
        .stagger-5 { animation-delay: 0.6s; opacity: 0; }

        .glass-card {
          background: rgba(20, 30, 48, 0.5);
          backdrop-filter: blur(30px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.15);
        }

        .glass-input {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border: 1.5px solid rgba(255, 255, 255, 0.15);
          transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .glass-input:focus {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(100, 200, 255, 0.5);
          box-shadow: 0 0 20px rgba(100, 200, 255, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.1);
          outline: none;
        }

        .glass-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .button-glass {
          background: linear-gradient(135deg, rgba(100, 180, 255, 0.25) 0%, rgba(150, 100, 255, 0.25) 100%);
          border: 1.5px solid rgba(100, 200, 255, 0.4);
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: hidden;
          color: rgba(200, 230, 255, 0.9);
          font-weight: 600;
        }

        .button-glass::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .button-glass:hover:not(:disabled)::before {
          left: 100%;
        }

        .button-glass:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(100, 180, 255, 0.4) 0%, rgba(150, 100, 255, 0.4) 100%);
          border-color: rgba(100, 200, 255, 0.7);
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(100, 200, 255, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.2);
        }

        .button-glass:active:not(:disabled) {
          transform: translateY(-1px);
        }

        .button-glass:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .label-text {
          color: rgba(200, 220, 255, 0.95);
          font-weight: 600;
          font-size: 0.95rem;
          letter-spacing: 0.3px;
        }

        .heading-text {
          color: rgba(220, 240, 255, 0.98);
          font-weight: 700;
          letter-spacing: -0.8px;
        }

        .subheading-text {
          color: rgba(160, 190, 230, 0.75);
          font-weight: 400;
          letter-spacing: 0.2px;
        }

        .optional-badge {
          background: rgba(100, 180, 255, 0.15);
          color: rgba(150, 200, 255, 0.8);
          font-size: 0.65rem;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: 600;
          border: 1px solid rgba(100, 180, 255, 0.3);
        }

        .bokeh-orb {
          position: absolute;
          border-radius: 50%;
          mix-blend-mode: screen;
        }

        .bokeh-red {
          background: radial-gradient(circle, rgba(255, 80, 100, 0.3) 0%, rgba(255, 50, 80, 0.1) 50%, transparent 70%);
        }

        .bokeh-blue {
          background: radial-gradient(circle, rgba(80, 150, 255, 0.35) 0%, rgba(50, 120, 255, 0.15) 50%, transparent 70%);
        }

        .bokeh-purple {
          background: radial-gradient(circle, rgba(180, 100, 255, 0.3) 0%, rgba(150, 70, 255, 0.1) 50%, transparent 70%);
        }

        .bokeh-orange {
          background: radial-gradient(circle, rgba(255, 140, 60, 0.25) 0%, rgba(255, 110, 40, 0.08) 50%, transparent 70%);
        }

        .cursor-light {
          position: fixed;
          pointer-events: none;
          border-radius: 50%;
          filter: blur(40px);
          mix-blend-mode: screen;
          z-index: 1;
        }
      `}</style>

      {/* Background gradient dark base */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950" />

      {/* Animated bokeh orbs */}
      <div
        className="bokeh-orb bokeh-blue absolute top-20 left-20 w-96 h-96"
        style={{ animation: "float 8s ease-in-out infinite" }}
      />
      <div
        className="bokeh-orb bokeh-red absolute top-32 right-24 w-80 h-80"
        style={{ animation: "float 10s ease-in-out infinite 1s" }}
      />
      <div
        className="bokeh-orb bokeh-purple absolute bottom-20 left-1/3 w-72 h-72"
        style={{ animation: "float 12s ease-in-out infinite 2s" }}
      />
      <div
        className="bokeh-orb bokeh-orange absolute -bottom-10 right-1/4 w-96 h-96"
        style={{ animation: "float 14s ease-in-out infinite 1.5s" }}
      />

      {/* Cursor-following lights */}
      <div
        className="cursor-light"
        style={{
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(circle, rgba(100, 180, 255, 0.15) 0%, rgba(100, 180, 255, 0.05) 40%, transparent 70%)",
          left: `${mousePos.x - 250}px`,
          top: `${mousePos.y - 250}px`,
          transition: "all 0.08s ease-out",
        }}
      />

      <div
        className="cursor-light"
        style={{
          width: "350px",
          height: "350px",
          background:
            "radial-gradient(circle, rgba(180, 100, 255, 0.1) 0%, transparent 60%)",
          left: `${mousePos.x - 175 + 80}px`,
          top: `${mousePos.y - 175 - 60}px`,
          transition: "all 0.15s ease-out",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-16 animate-slide-up stagger-1">
            <h1 className="heading-text text-6xl md:text-7xl mb-4">YIO</h1>
            <p className="subheading-text text-lg md:text-xl">
              Collaborate, create, and bring ideas to life
            </p>
          </div>

          {/* Glass Form Card */}
          <div className="glass-card rounded-3xl p-10 md:p-12 animate-slide-up stagger-2 backdrop-blur-xl">
            {/* Name Input */}
            <div className="mb-8 animate-slide-up stagger-3">
              <label className="label-text block mb-3">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="glass-input w-full px-6 py-3.5 rounded-lg text-white font-medium"
              />
            </div>

            {/* Room ID Input */}
            <div className="mb-12 animate-slide-up stagger-4">
              <div className="flex items-center gap-3 mb-3">
                <label className="label-text">Room ID</label>
                <span className="optional-badge">Optional</span>
              </div>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Leave empty to create new room"
                className="glass-input w-full px-6 py-3.5 rounded-lg text-white font-medium"
              />
            </div>

            {/* Start Button */}
            <button
              onClick={handleStart}
              disabled={!name.trim() || isLoading}
              className="button-glass w-full py-4 rounded-lg animate-slide-up stagger-5 transition-all duration-300"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <circle cx="12" cy="12" r="10" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" className="opacity-75" />
                  </svg>
                  Starting...
                </span>
              ) : (
                "Start Canvas"
              )}
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-400 text-sm mt-10 animate-slide-up stagger-5">
            No account needed • Share room ID to collaborate
          </p>
        </div>
      </div>
    </div>
  );
}
