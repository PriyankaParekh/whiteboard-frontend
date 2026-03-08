"use client";

import React, { useEffect, useState } from "react";

export default function AestheticLoader() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("wb_theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
    }
  }, []);

  return (
    <div className={`loader-container ${isDark ? "dk" : "lt"}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        .loader-container {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          transition: background 0.8s ease;
          overflow: hidden;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .loader-container.dk {
          background: #05060f;
          --mesh: rgba(79,70,229,0.15);
          --text: #ffffff;
          --sub: rgba(175,180,220,0.58);
        }

        .loader-container.lt {
          background: #f5f0ff;
          --mesh: rgba(167,139,250,0.12);
          --text: #1a0b3c;
          --sub: #5f4b91;
        }

        .mesh {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: 
            radial-gradient(circle at 30% 30%, var(--mesh) 0%, transparent 60%),
            radial-gradient(circle at 70% 70%, var(--mesh) 0%, transparent 60%);
          filter: blur(80px);
          animation: meshFloat 10s ease-in-out infinite alternate;
        }

        @keyframes meshFloat {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(50px, -30px) scale(1.1); }
        }

        .brand-wrap {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        /* ✅ Matches landing page exactly */
        .yio-logo {
          font-family: 'Syne', sans-serif;
          font-size: clamp(6rem, 18vw, 8.5rem);
          font-weight: 800;
          letter-spacing: -5px;
          line-height: 1;
          margin-bottom: 12px;
          animation: popIn 1s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        .yio-logo span {
          background: linear-gradient(135deg, #a78bfa 0%, #f472b6 55%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); filter: blur(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }

        .progress-bar {
          width: 140px;
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          overflow: hidden;
          position: relative;
        }
        .loader-container.lt .progress-bar {
          background: rgba(0, 0, 0, 0.05);
        }

        .progress-fill {
          position: absolute;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, #a78bfa, #f472b6, transparent);
          animation: sweep 2s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }

        @keyframes sweep {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .loading-msg {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 3px;
          color: var(--sub);
          margin-top: 10px;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }

        .grain {
          position: absolute;
          inset: 0;
          opacity: 0.03;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
      `}</style>

      <div className="mesh" />
      <div className="grain" />

      <div className="brand-wrap">
        {/* Logo matches landing page exactly */}
        <h1 className="yio-logo">
          <span>YIO</span>
        </h1>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div className="progress-bar">
            <div className="progress-fill" />
          </div>
          <span className="loading-msg">Loading Workspace...</span>
        </div>
      </div>
    </div>
  );
}
