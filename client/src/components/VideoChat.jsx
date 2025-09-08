import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import Peer from "simple-peer";

const socket = io("http://localhost:5000"); // backend server

export default function VideoChat() {
  const [stream, setStream] = useState(null);
  const [me, setMe] = useState("");
  const [callAccepted, setCallAccepted] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
            setStream(currentStream);
            myVideo.current.srcObject = currentStream;
        });

        socket.on("me", (id) => setMe(id));

        socket.on("callUser", (data) => {
            setCaller(data.from);
            setCallerSignal(data.signal);
        });
    }, []);

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (data) => {
      socket.emit("callUser", { userToCall: id, signalData: data, from: me });
    });

    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });
    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  return (
    <div>
      <h2>Video Call</h2>
      <div>
        {stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />}
        {callAccepted && <video playsInline ref={userVideo} autoPlay style={{ width: "300px" }} />}
      </div>
      <p>Your ID: {me}</p>
      <button onClick={() => callUser(prompt("Enter ID to call"))}>Call</button>
      {caller && !callAccepted ? (
        <button onClick={answerCall}>Answer Call</button>
      ) : null}
    </div>
  );
}
