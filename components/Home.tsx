"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
export default function LandingPage() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [viewMode, setViewMode] = useState<"choice" | "create" | "join">(
    "choice",
  );
  const [hasHistory, setHasHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDark, setIsDark] = useState(true);
  const [nameFocused, setNameFocused] = useState(false);
  const [roomFocused, setRoomFocused] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const savedTheme = localStorage.getItem("wb_theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("wb_theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const fn = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", fn);

    // Load from localStorage
    const savedName = localStorage.getItem("wb_user_name");
    const savedRoomId = localStorage.getItem("wb_last_room_id");
    if (savedName) setName(savedName);
    if (savedRoomId) {
      setRoomId(savedRoomId);
      setHasHistory(true);
    }

    return () => window.removeEventListener("mousemove", fn);
  }, []);

  const handleStart = (mode: "create" | "join" | "continue") => {
    if (mode === "continue") {
      if (!name.trim() || !roomId.trim()) return;
    } else {
      if (!name.trim()) return;
      if (mode === "join" && !roomId.trim()) return;
    }

    setIsLoading(true);
    let finalRoomId = roomId.trim();
    if (mode === "create") {
      finalRoomId = uuidv4();
    }

    // Save to localStorage
    localStorage.setItem("wb_user_name", name.trim());
    localStorage.setItem("wb_last_room_id", finalRoomId);

    router.push(`/room`);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div style={{ fontFamily: "inherit" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --font-display: 'Syne', sans-serif;
          --font-body: 'Plus Jakarta Sans', sans-serif;
        }

        @keyframes float1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%  { transform: translate(50px,-60px) scale(1.06); }
          66%  { transform: translate(-25px, 35px) scale(0.96); }
        }
        @keyframes float2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%  { transform: translate(-55px, 45px) scale(1.08); }
          75%  { transform: translate(30px,-25px) scale(0.94); }
        }
        @keyframes float3 {
          0%,100% { transform: translate(0,0); }
          50%  { transform: translate(25px,-45px); }
        }
        @keyframes float4 {
          0%,100% { transform: translate(0,0); }
          50%  { transform: translate(-35px, 28px); }
        }
        @keyframes reveal {
          from { opacity:0; transform:translateY(36px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity:0; } to { opacity:1; }
        }
        @keyframes shm {
          0% { left:-100%; }
          100% { left:200%; }
        }
        @keyframes spin {
          to { transform:rotate(360deg); }
        }

        .rv { animation: reveal 0.7s cubic-bezier(0.22,1,0.36,1) both; }
        .d1{animation-delay:0.05s} .d2{animation-delay:0.18s}
        .d3{animation-delay:0.30s} .d4{animation-delay:0.42s}

        /* ===== DARK ===== */
        .dk {
          --bg: #05060f;
          --mesh1: rgba(79,70,229,0.18);
          --mesh2: rgba(15,23,42,1);
          --o1: rgba(99,102,241,0.60);
          --o2: rgba(236,72,153,0.50);
          --o3: rgba(34,211,238,0.42);
          --o4: rgba(168,85,247,0.45);
          --blend: screen;
          --cl1: rgba(99,102,241,0.14);
          --cl2: rgba(168,85,247,0.09);
          --glass-bg:      rgba(12,16,32,0.45);
          --glass-border:  rgba(255,255,255,0.09);
          --glass-bdr-top: rgba(255,255,255,0.22);
          --glass-shadow:  0 32px 64px rgba(0,0,0,0.55);
          --inp-bg:    rgba(255,255,255,0.05);
          --inp-bd:    rgba(255,255,255,0.09);
          --inp-bd-f:  rgba(139,92,246,0.70);
          --inp-text:  #ffffff;
          --lbl:  rgba(195,200,235,0.82);
          --ttl:  #ffffff;
          --sub:  rgba(175,180,220,0.58);
          --opt-bg: rgba(255,255,255,0.03);
          --opt-bd: rgba(255,255,255,0.08);
          --opt-h-bg: rgba(139,92,246,0.1);
          --opt-h-bd: rgba(139,92,246,0.4);
          --btn-bg: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
        }

        /* ===== LIGHT ===== */
        .lt {
          --bg: #f5f0ff;
          --mesh1: rgba(167,139,250,0.14);
          --mesh2: rgba(245,240,255,1);
          --o1: rgba(124,58,237,0.30);
          --o2: rgba(244,114,182,0.28);
          --o3: rgba(56,189,248,0.26);
          --o4: rgba(167,139,250,0.32);
          --blend: multiply;
          --cl1: rgba(124,58,237,0.09);
          --cl2: rgba(167,139,250,0.07);
          --glass-bg:      rgba(255,255,255,0.52);
          --glass-border:  rgba(200,185,255,0.38);
          --glass-bdr-top: rgba(255,255,255,0.92);
          --glass-shadow:  0 32px 64px rgba(100,60,200,0.12);
          --inp-bg:    #ffffff;
          --inp-bd:    rgba(185,165,245,0.38);
          --inp-bd-f:  #7c3aed;
          --inp-text:  #1a0b3c;
          --lbl:  #371e64;
          --ttl:  #140832;
          --sub:  #5f4b91;
          --opt-bg: rgba(255,255,255,0.6);
          --opt-bd: rgba(185,165,245,0.2);
          --opt-h-bg: rgba(124,58,237,0.05);
          --opt-h-bd: rgba(124,58,237,0.3);
          --btn-bg: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
        }

        .yio-root {
          position:relative; min-height:100vh; width:100%;
          overflow:hidden; display:flex; align-items:center; justify-content:center;
          background: var(--bg); font-family: var(--font-body); transition: background 0.6s ease;
        }
        .yio-root::after {
          content:''; position:fixed; inset:0; pointer-events:none; z-index:6;
          opacity:0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:220px 220px;
        }

        .bg-mesh {
          position:fixed; inset:0; pointer-events:none; z-index:0;
          background:
            radial-gradient(ellipse 80% 60% at 25% 15%, var(--mesh1) 0%, transparent 70%),
            radial-gradient(ellipse 60% 80% at 80% 85%, var(--mesh1) 0%, transparent 70%),
            var(--mesh2);
          transition: background 0.6s ease;
        }

        .orb { position:fixed; border-radius:50%; filter:blur(80px); pointer-events:none; z-index:1; mix-blend-mode:var(--blend); transition:background 0.5s ease; }
        .o1 { width:620px;height:620px;top:-170px;left:-120px; background:radial-gradient(circle,var(--o1) 0%,transparent 65%); animation:float1 15s ease-in-out infinite; }
        .o2 { width:520px;height:520px;top:-80px;right:-100px;  background:radial-gradient(circle,var(--o2) 0%,transparent 65%); animation:float2 19s ease-in-out infinite; }
        .o3 { width:480px;height:480px;bottom:-120px;left:18%;  background:radial-gradient(circle,var(--o3) 0%,transparent 65%); animation:float3 17s ease-in-out infinite; }
        .o4 { width:420px;height:420px;bottom:5%;right:8%;      background:radial-gradient(circle,var(--o4) 0%,transparent 65%); animation:float4 21s ease-in-out infinite; }

        .cg { position:fixed; border-radius:50%; pointer-events:none; z-index:2; mix-blend-mode:var(--blend); filter:blur(55px); transition:background 0.5s ease; }

        .toggle {
          position:fixed; top:24px; right:24px; z-index:200; width:44px; height:44px;
          display:flex; align-items:center; justify-content:center; border-radius:50%;
          cursor:pointer; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
          color:var(--ttl); backdrop-filter:blur(20px); transition: 0.3s;
        }
        .toggle:hover { transform:scale(1.1); background:rgba(255,255,255,0.1); }

        .content { position:relative; z-index:10; width:100%; max-width:480px; padding:24px; }
        .hdr { text-align:center; margin-bottom:48px; }
        .ttl { font-family: var(--font-display); font-size: clamp(6rem, 18vw, 8.5rem); font-weight: 800; color: var(--ttl); letter-spacing: -5px; line-height: 1; margin-bottom: 12px; }
        .ttl span { background: linear-gradient(135deg, #a78bfa 0%, #f472b6 55%, #38bdf8 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .sub { font-size: 1rem; color: var(--sub); opacity: 0.8; letter-spacing: 0.5px; }

        .card {
          background: var(--glass-bg); backdrop-filter: blur(40px); border-radius:32px;
          border:1px solid var(--glass-border); border-top-color:var(--glass-bdr-top);
          padding:28px; box-shadow:var(--glass-shadow); position:relative; overflow:hidden;
        }

        /* Options Flow */
        .option-grid { display: grid; gap: 12px; margin-top: 4px; }
        .opt-card {
          background: var(--opt-bg); border: 1px solid var(--opt-bd); padding: 18px;
          border-radius: 18px; cursor: pointer; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex; flex-direction: column; gap: 4px; position: relative; overflow: hidden;
        }
        .opt-card:hover { background: var(--opt-h-bg); border-color: var(--opt-h-bd); transform: translateY(-4px); }
        .opt-ttl { font-family: var(--font-display); font-size: 1.1rem; color: var(--ttl); }
        .opt-desc { font-size: 0.8rem; color: var(--sub); opacity: 0.7; }
        .opt-icon { font-size: 1.2rem; margin-bottom: 2px; color: var(--ttl); display: flex; align-items: center; }
        .opt-icon svg { width: 22px; height: 22px; stroke: currentColor; opacity: 0.9; }

        /* Form Elements */
        .form-wrap { display: flex; flex-direction: column; gap: 18px; }
        .field { display: flex; flex-direction: column; gap: 8px; }
        .lbl { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--lbl); letter-spacing: 1px; }
        .inp {
          width: 100%; padding: 14px; border-radius: 12px; background: var(--inp-bg);
          border: 1px solid var(--inp-bd); color: var(--inp-text); font-family: inherit; font-size: 0.95rem;
          transition: 0.3s; outline: none;
        }
        .inp:focus { border-color: var(--inp-bd-f); box-shadow: 0 0 0 4px rgba(139,92,246,0.1); }

        .btn {
          width: 100%; padding: 16px; border-radius: 14px; background: var(--btn-bg);
          color: #ffffff; font-weight: 700; border: none; cursor: pointer; transition: 0.3s;
          display: flex; align-items: center; justify-content:center; gap: 8px; font-size: 0.95rem;
        }
        .btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); filter: brightness(1.1); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .back-btn {
          background: none; border: none; color: var(--sub); font-size: 0.85rem;
          cursor: pointer; display: flex; align-items: center; gap: 6px; margin-bottom: 20px;
          opacity: 0.6; transition: 0.2s;
        }
        .back-btn:hover { opacity: 1; transform: translateX(-4px); }

        .sp { width:20px; height:20px; border:3px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.8s linear infinite; }
      `}</style>

      <div className={`yio-root ${isDark ? "dk" : "lt"}`}>
        <div className="bg-mesh" />
        <div className="orb o1" />
        <div className="orb o2" />
        <div className="orb o3" />
        <div className="orb o4" />

        {/* cursor glow */}
        <div
          className="cg"
          style={{
            width: 520,
            height: 520,
            background: `radial-gradient(circle,var(--cl1) 0%,transparent 65%)`,
            left: mousePos.x - 260,
            top: mousePos.y - 260,
            transition: "left 0.07s ease-out,top 0.07s ease-out",
          }}
        />
        <div
          className="cg"
          style={{
            width: 320,
            height: 320,
            background: `radial-gradient(circle,var(--cl2) 0%,transparent 60%)`,
            left: mousePos.x - 160 + 70,
            top: mousePos.y - 160 - 55,
            transition: "left 0.13s ease-out,top 0.13s ease-out",
          }}
        />

        <button className="toggle" onClick={toggleTheme}>
          {isDark ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>

        <div className="content">
          <div className="hdr rv d1">
            <h1 className="ttl">
              <span>YIO</span>
            </h1>
            <p className="sub">Collaborate, create &amp; bring ideas to life</p>
          </div>

          <div className="card rv d2">
            {viewMode === "choice" && (
              <div className="option-grid">
                {hasHistory && (
                  <div
                    className="opt-card"
                    onClick={() => handleStart("continue")}
                  >
                    <span className="opt-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                    </span>
                    <h3 className="opt-ttl">Join Last Session</h3>
                    <p className="opt-desc">
                      Continue where you left off in Room: {roomId.slice(0, 8)}
                      ...
                    </p>
                  </div>
                )}

                <div className="opt-card" onClick={() => setViewMode("create")}>
                  <span className="opt-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
                      <path d="M12 8v8" />
                      <path d="M8 12h8" />
                    </svg>
                  </span>
                  <h3 className="opt-ttl">Create New Room</h3>
                  <p className="opt-desc">
                    Start a fresh canvas and invite others to collaborate.
                  </p>
                </div>

                <div className="opt-card" onClick={() => setViewMode("join")}>
                  <span className="opt-icon">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </span>
                  <h3 className="opt-ttl">Join via ID</h3>
                  <p className="opt-desc">
                    Enter a specific Room ID shared by a collaborator.
                  </p>
                </div>
              </div>
            )}

            {viewMode === "create" && (
              <div className="form-wrap">
                <button
                  className="back-btn"
                  onClick={() => setViewMode("choice")}
                >
                  ← Back to options
                </button>
                <div className="field">
                  <span className="lbl">Your Name</span>
                  <input
                    className="inp"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>
                <button
                  className="btn"
                  disabled={!name.trim() || isLoading}
                  onClick={() => handleStart("create")}
                >
                  {isLoading ? <div className="sp" /> : "Create & Start →"}
                </button>
              </div>
            )}

            {viewMode === "join" && (
              <div className="form-wrap">
                <button
                  className="back-btn"
                  onClick={() => setViewMode("choice")}
                >
                  ← Back to options
                </button>
                <div className="field">
                  <span className="lbl">Room ID</span>
                  <input
                    className="inp"
                    placeholder="Paste Room ID here"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="field">
                  <span className="lbl">Your Name</span>
                  <input
                    className="inp"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <button
                  className="btn"
                  disabled={!name.trim() || !roomId.trim() || isLoading}
                  onClick={() => handleStart("join")}
                >
                  {isLoading ? <div className="sp" /> : "Join Room →"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
