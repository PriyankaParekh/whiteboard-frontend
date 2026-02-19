import Canvas from "@/components/Canvas";
import Toolbar from "@/components/Toolbar";
// import Whiteboard from "@/components/Whiteboard";
import React from "react";

function Home() {
  return (
    <div>
      <Toolbar />
      {/* <Whiteboard /> */}
      <Canvas />
    </div>
  );
}

export default Home;
