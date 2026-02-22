import Canvas from "@/components/Canvas";

interface RoomParams {
  params: {
    id: string;
  };
}

const Room = async ({ params }: RoomParams) => {
  const para = await params;
  const roomId = para.id;
  return <Canvas id={roomId} />;
};

export default Room;
