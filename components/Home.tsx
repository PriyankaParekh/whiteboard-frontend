"use client";

import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
export default function LandingPage() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDark, setIsDark] = useState(true);
  const [nameFocused, setNameFocused] = useState(false);
  const [roomFocused, setRoomFocused] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const fn = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
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
        @keyframes shimmer {
          0%   { left:-100%; }
          100% { left:200%; }
        }
        @keyframes spin {
          to { transform:rotate(360deg); }
        }

        .rv { animation: reveal 0.9s cubic-bezier(0.22,1,0.36,1) both; }
        .d1{animation-delay:0.05s} .d2{animation-delay:0.18s}
        .d3{animation-delay:0.30s} .d4{animation-delay:0.42s}
        .d5{animation-delay:0.52s} .d6{animation-delay:0.62s}

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
          --glass-shadow:  0 32px 64px rgba(0,0,0,0.55),
                           0 1px 0 rgba(255,255,255,0.14) inset,
                           0 0 0 1px rgba(255,255,255,0.04) inset;
          --inp-bg:    rgba(255,255,255,0.05);
          --inp-bg-f:  rgba(255,255,255,0.10);
          --inp-bd:    rgba(255,255,255,0.09);
          --inp-bd-f:  rgba(139,92,246,0.70);
          --inp-glow:  rgba(139,92,246,0.18);
          --inp-text:  rgba(235,238,255,0.95);
          --inp-ph:    rgba(160,165,200,0.38);
          --lbl:  rgba(195,200,235,0.82);
          --ttl:  #ffffff;
          --sub:  rgba(175,180,220,0.58);
          --ftr:  rgba(130,135,170,0.45);
          --btn-bg:   linear-gradient(135deg, rgba(99,102,241,0.80) 0%, rgba(168,85,247,0.80) 100%);
          --btn-bg-h: linear-gradient(135deg, rgba(99,102,241,1.00) 0%, rgba(168,85,247,1.00) 100%);
          --btn-bd:   rgba(139,92,246,0.55);
          --btn-clr:  rgba(245,242,255,0.98);
          --btn-sh:   0 8px 28px rgba(99,102,241,0.30);
          --btn-sh-h: 0 14px 44px rgba(99,102,241,0.50);
          --badge-bg:  rgba(99,102,241,0.14);
          --badge-bd:  rgba(99,102,241,0.35);
          --badge-clr: rgba(165,170,255,0.88);
          --tgl-bg:  rgba(255,255,255,0.06);
          --tgl-bd:  rgba(255,255,255,0.12);
          --tgl-clr: rgba(200,205,240,0.88);
          --div: rgba(255,255,255,0.06);
          --ring: linear-gradient(135deg, rgba(139,92,246,0.6), rgba(236,72,153,0.4));
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
          --glass-shadow:  0 32px 64px rgba(100,60,200,0.12),
                           0 1px 0 rgba(255,255,255,0.96) inset,
                           0 0 0 1px rgba(200,180,255,0.15) inset;
          --inp-bg:    rgba(255,255,255,0.50);
          --inp-bg-f:  rgba(255,255,255,0.82);
          --inp-bd:    rgba(185,165,245,0.38);
          --inp-bd-f:  rgba(124,58,237,0.60);
          --inp-glow:  rgba(124,58,237,0.12);
          --inp-text:  rgba(25,10,55,0.90);
          --inp-ph:    rgba(120,100,155,0.42);
          --lbl:  rgba(55,30,100,0.82);
          --ttl:  rgba(20,8,50,0.95);
          --sub:  rgba(95,75,145,0.62);
          --ftr:  rgba(110,90,150,0.48);
          --btn-bg:   linear-gradient(135deg, rgba(124,58,237,0.88) 0%, rgba(167,139,250,0.88) 100%);
          --btn-bg-h: linear-gradient(135deg, rgba(109,40,217,1.00) 0%, rgba(139,92,246,1.00) 100%);
          --btn-bd:   rgba(124,58,237,0.42);
          --btn-clr:  rgba(255,252,255,0.98);
          --btn-sh:   0 8px 28px rgba(124,58,237,0.28);
          --btn-sh-h: 0 14px 44px rgba(124,58,237,0.45);
          --badge-bg:  rgba(124,58,237,0.09);
          --badge-bd:  rgba(124,58,237,0.25);
          --badge-clr: rgba(109,40,217,0.88);
          --tgl-bg:  rgba(255,255,255,0.65);
          --tgl-bd:  rgba(185,165,245,0.42);
          --tgl-clr: rgba(55,30,100,0.82);
          --div: rgba(150,120,220,0.10);
          --ring: linear-gradient(135deg, rgba(124,58,237,0.55), rgba(244,114,182,0.35));
        }

        /* ===== ROOT ===== */
        .yio-root {
          position:relative; min-height:100vh; width:100%;
          overflow:hidden; display:flex;
          align-items:center; justify-content:center;
          background: var(--bg);
          font-family: var(--font-body);
          transition: background 0.6s ease;
        }
        .yio-root::after {
          content:''; position:fixed; inset:0; pointer-events:none; z-index:6;
          opacity:0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:220px 220px;
        }

        /* ===== BG MESH ===== */
        .bg-mesh {
          position:fixed; inset:0; pointer-events:none; z-index:0;
          background:
            radial-gradient(ellipse 80% 60% at 25% 15%, var(--mesh1) 0%, transparent 70%),
            radial-gradient(ellipse 60% 80% at 80% 85%, var(--mesh1) 0%, transparent 70%),
            var(--mesh2);
          transition: background 0.6s ease;
        }

        /* ===== ORBS ===== */
        .orb { position:fixed; border-radius:50%; filter:blur(80px); pointer-events:none; z-index:1; mix-blend-mode:var(--blend); transition:background 0.5s ease; }
        .o1 { width:620px;height:620px;top:-170px;left:-120px; background:radial-gradient(circle,var(--o1) 0%,transparent 65%); animation:float1 15s ease-in-out infinite; }
        .o2 { width:520px;height:520px;top:-80px;right:-100px;  background:radial-gradient(circle,var(--o2) 0%,transparent 65%); animation:float2 19s ease-in-out infinite; }
        .o3 { width:480px;height:480px;bottom:-120px;left:18%;  background:radial-gradient(circle,var(--o3) 0%,transparent 65%); animation:float3 17s ease-in-out infinite; }
        .o4 { width:420px;height:420px;bottom:5%;right:8%;      background:radial-gradient(circle,var(--o4) 0%,transparent 65%); animation:float4 21s ease-in-out infinite; }

        /* ===== CURSOR GLOW ===== */
        .cg { position:fixed; border-radius:50%; pointer-events:none; z-index:2; mix-blend-mode:var(--blend); filter:blur(55px); transition:background 0.5s ease; }

        /* ===== TOGGLE — icon only, circular ===== */
        .toggle {
          position:fixed; top:20px; right:20px; z-index:200;
          width:44px; height:44px;
          display:flex; align-items:center; justify-content:center;
          border-radius:50%; cursor:pointer;
          background:var(--tgl-bg);
          border:1px solid var(--tgl-bd);
          color:var(--tgl-clr);
          backdrop-filter:blur(24px);
          -webkit-backdrop-filter:blur(24px);
          transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);
          animation: fadeIn 0.8s ease both;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }
        .toggle:hover { transform:scale(1.12) rotate(15deg); }
        .toggle svg { width:17px; height:17px; }

        /* ===== CONTENT ===== */
        .content { position:relative; z-index:10; width:100%; max-width:420px; padding:20px; }

        /* ===== HEADER ===== */
        .hdr { text-align:center; margin-bottom:42px; }
        .ttl {
          font-family: var(--font-display);
          font-size: clamp(5.5rem, 16vw, 8.5rem);
          font-weight: 800;
          color: var(--ttl);
          letter-spacing: -5px;
          line-height: 0.88;
          margin-bottom: 18px;
          transition: color 0.5s;
        }
        .ttl .gr {
          background: linear-gradient(135deg, #a78bfa 0%, #f472b6 55%, #38bdf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sub {
          font-family: var(--font-body);
          font-size: clamp(0.85rem,2.5vw,0.98rem);
          font-weight: 300; letter-spacing: 0.5px;
          color: var(--sub); line-height: 1.6;
          transition: color 0.5s;
        }

        /* ===== GLASS CARD ===== */
        .card {
          background: var(--glass-bg);
          backdrop-filter: blur(48px) saturate(200%) brightness(1.02);
          -webkit-backdrop-filter: blur(48px) saturate(200%) brightness(1.02);
          border-radius:28px;
          border:1px solid var(--glass-border);
          border-top-color:var(--glass-bdr-top);
          box-shadow:var(--glass-shadow);
          padding:38px 34px;
          transition: background 0.5s ease, box-shadow 0.5s ease, border-color 0.5s ease;
          position:relative; overflow:hidden;
        }
        .card::before {
          content:''; position:absolute;
          top:0;left:0;right:0; height:1px;
          background:linear-gradient(90deg,transparent 0%,var(--glass-bdr-top) 50%,transparent 100%);
        }
        .card::after {
          content:''; position:absolute; inset:0; border-radius:28px; pointer-events:none;
          background:radial-gradient(ellipse 80% 40% at 50% 0%, rgba(255,255,255,0.06) 0%, transparent 60%);
        }

        /* ===== DIVIDER ===== */
        .divider { height:1px; background:var(--div); margin:24px 0; }

        /* ===== FIELD ===== */
        .field { margin-bottom:0; }
        .lbl-row { display:flex; align-items:center; gap:8px; margin-bottom:9px; }
        .lbl {
          font-family:var(--font-body);
          font-size:0.73rem; font-weight:700;
          letter-spacing:0.7px; text-transform:uppercase;
          color:var(--lbl); transition:color 0.5s;
        }
        .badge {
          font-size:0.60rem; font-weight:600; letter-spacing:0.5px; text-transform:uppercase;
          padding:3px 9px; border-radius:100px;
          background:var(--badge-bg); border:1px solid var(--badge-bd); color:var(--badge-clr);
        }

        /* glow ring wrapper */
        .ring-wrap { position:relative; border-radius:14px; transition:box-shadow 0.3s ease; }
        .ring-wrap.on::before {
          content:''; position:absolute; inset:-1.5px;
          border-radius:15px; z-index:0; pointer-events:none;
          background: var(--ring);
        }

        .inp {
          position:relative; z-index:1;
          width:100%; padding:13px 18px; border-radius:13px;
          font-family:var(--font-body); font-size:0.92rem; font-weight:400;
          background:var(--inp-bg); border:1px solid var(--inp-bd);
          color:var(--inp-text); outline:none;
          backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
          transition:background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .inp::placeholder { color:var(--inp-ph); font-weight:300; }
        .inp:focus {
          background:var(--inp-bg-f); border-color:var(--inp-bd-f);
          box-shadow:0 0 0 3px var(--inp-glow), 0 4px 16px rgba(0,0,0,0.06);
        }

        /* ===== BUTTON ===== */
        .btn {
          position:relative; overflow:hidden;
          width:100%; padding:15px 20px; border-radius:14px;
          font-family:var(--font-body); font-size:0.94rem; font-weight:600; letter-spacing:0.25px;
          cursor:pointer;
          background:var(--btn-bg); border:1px solid var(--btn-bd);
          color:var(--btn-clr); box-shadow:var(--btn-sh);
          backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
          transition:transform 0.35s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease, background 0.3s ease;
          margin-top:28px;
        }
        .btn::after {
          content:''; position:absolute; inset:0; pointer-events:none;
          background:linear-gradient(180deg,rgba(255,255,255,0.14) 0%,transparent 55%);
        }
        .btn .sh {
          position:absolute; top:0; bottom:0; width:55%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.16),transparent);
          left:-100%; animation:shimmer 2.6s ease infinite;
        }
        .btn-in { position:relative;z-index:1; display:flex;align-items:center;justify-content:center;gap:9px; }
        .btn:hover:not(:disabled) { transform:translateY(-3px) scale(1.01); box-shadow:var(--btn-sh-h); }
        .btn:active:not(:disabled) { transform:translateY(-1px) scale(1.005); }
        .btn:disabled { opacity:0.44; cursor:not-allowed; }
        .sp { width:17px;height:17px; border:2px solid rgba(255,255,255,0.25); border-top-color:rgba(255,255,255,0.90); border-radius:50%; animation:spin 0.65s linear infinite; }

        /* ===== FOOTER ===== */
        .ftr {
          text-align:center; margin-top:24px;
          font-size:0.73rem; font-weight:300; letter-spacing:0.3px; color:var(--ftr);
          display:flex; align-items:center; justify-content:center; gap:10px; transition:color 0.5s;
        }
        .dot { width:3px;height:3px;border-radius:50%;background:currentColor;opacity:0.5; }

        /* ===== RESPONSIVE ===== */
        @media(max-width:480px){
          .card { padding:26px 18px; border-radius:22px; }
          .content { padding:14px; max-width:100%; }
          .hdr { margin-bottom:30px; }
          .toggle { top:14px; right:14px; width:40px; height:40px; }
        }
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

        {/* toggle — icon only */}
        <button
          className="toggle"
          onClick={() => setIsDark(!isDark)}
          title={isDark ? "Switch to light" : "Switch to dark"}
        >
          {isDark ? (
            <svg
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
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        <div className="content">
          {/* header */}
          <div className="hdr rv d1">
            <h1 className="ttl">
              <span className="gr">YIO</span>
            </h1>
            <p className="sub">
              Collaborate, create &amp; bring ideas&nbsp;to&nbsp;life
            </p>
          </div>

          {/* glass card */}
          <div className="card rv d2">
            <div className="field rv d3">
              <div className="lbl-row">
                <span className="lbl">Your Name</span>
              </div>
              <div className={`ring-wrap ${nameFocused ? "on" : ""}`}>
                <input
                  className="inp"
                  type="text"
                  placeholder="Who are you?"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleStart()}
                />
              </div>
            </div>

            <div className="divider rv d4" />

            <div className="field rv d4">
              <div className="lbl-row">
                <span className="lbl">Room ID</span>
                <span className="badge">optional</span>
              </div>
              <div className={`ring-wrap ${roomFocused ? "on" : ""}`}>
                <input
                  className="inp"
                  type="text"
                  placeholder="Paste a room ID or leave empty"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onFocus={() => setRoomFocused(true)}
                  onBlur={() => setRoomFocused(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleStart()}
                />
              </div>
            </div>

            <button
              className="btn rv d5"
              disabled={!name.trim() || isLoading}
              onClick={handleStart}
            >
              <div className="sh" />
              <div className="btn-in">
                {isLoading ? (
                  <>
                    <div className="sp" />
                    <span>Entering canvas…</span>
                  </>
                ) : (
                  <span>Start Canvas →</span>
                )}
              </div>
            </button>
          </div>

          <div className="ftr rv d6">
            <span>No account needed</span>
            <div className="dot" />
            <span>Share room ID to&nbsp;collaborate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
