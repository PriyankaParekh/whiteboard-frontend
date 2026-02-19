"use client";
import io from "socket.io-client";
import { useEffect, useState } from "react";

const socket = io("http://localhost:3001");

function Whiteboard() {
  const [roomId, setRoomId] = useState("");

  const joinRoom = () => {
    if (roomId !== "") {
      console.log("Joining room:", roomId);
      socket.emit("join_room", roomId);
    }
  };

  useEffect(() => {
    // Dusro ki drawing suno
    socket.on("receive_stroke", (data) => {
      // Canvas pe draw karne ka logic yahan aayega
      console.log("Received drawing from other user:", data);
    });
    // no dependencies: socket is a module-level singleton
  }, []);

  return (
    <div>
      <input
        placeholder="Room ID"
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={joinRoom}>Join Room</button>
      {/* Canvas Logic Here */}
    </div>
  );
}

export default Whiteboard;
