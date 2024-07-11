const peerConnection = new RTCPeerConnection();
const video = document.getElementById('video');

// Capture media
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        video.srcObject = stream;
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    });

// Handle incoming call
peerConnection.ontrack = (event) => {
    const [remoteStream] = event.streams;
    video.srcObject = remoteStream;
};

// ICE candidates exchange
peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
    }
};

socket.on('ice-candidate', (candidate) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// SDP offer/answer exchange
peerConnection.createOffer().then(offer => {
    return peerConnection.setLocalDescription(offer);
}).then(() => {
    socket.emit('sdp-offer', peerConnection.localDescription);
});

socket.on('sdp-answer', (answer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('sdp-offer', (offer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
        return peerConnection.createAnswer();
    }).then(answer => {
        return peerConnection.setLocalDescription(answer);
    }).then(() => {
        socket.emit('sdp-answer', peerConnection.localDescription);
    });
});
