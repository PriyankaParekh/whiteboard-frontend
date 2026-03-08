"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Canvas from "@/components/Canvas";
import AestheticLoader from "@/components/AestheticLoader";

export default function RoomPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    const savedRoomId = localStorage.getItem("wb_last_room_id");
    if (!savedRoomId) {
      router.push("/");
    } else {
      // Add a slight artificial delay to show off the cool loader
      const timer = setTimeout(() => {
        setRoomId(savedRoomId);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [router]);

  if (!roomId) {
    return <AestheticLoader />;
  }

  return <Canvas id={roomId} />;
}
