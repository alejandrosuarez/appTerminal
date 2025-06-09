const clients = new Map();

function initializeVoice(ws) {
    ws.isRecording = false;
    ws.audioChunks = [];
    if (!ws.mediaRecorder) {
        ws.mediaRecorder = null; // Ensure mediaRecorder is initialized
    }
}

function togglePushToTalk(ws, buttonElement) {
    if (!ws.isRecording) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                if (ws.mediaRecorder) {
                    ws.mediaRecorder.stream.getTracks().forEach(track => track.stop()); // Stop previous stream if exists
                }
                ws.mediaRecorder = new MediaRecorder(stream);
                ws.audioChunks = []; // Reset chunks
                ws.mediaRecorder.ondataavailable = event => ws.audioChunks.push(event.data);
                ws.mediaRecorder.onstop = () => {
                    if (ws.audioChunks.length > 0) {
                        const audioBlob = new Blob(ws.audioChunks, { type: 'audio/wav' });
                        const reader = new FileReader();
                        reader.onload = function() {
                            ws.send(reader.result);
                        };
                        reader.readAsDataURL(audioBlob);
                    }
                    ws.audioChunks = [];
                    ws.isRecording = false;
                    buttonElement.classList.remove('active');
                    buttonElement.textContent = 'Push to Talk';
                    stream.getTracks().forEach(track => track.stop()); // Stop the stream
                };
                ws.mediaRecorder.start();
                ws.isRecording = true;
                buttonElement.classList.add('active');
                buttonElement.textContent = 'Release to Send';
            })
            .catch(err => {
                console.error('Microphone access denied:', err);
                buttonElement.classList.remove('active');
                buttonElement.textContent = 'Push to Talk';
            });
    } else {
        if (ws.mediaRecorder && ws.mediaRecorder.state !== 'inactive') {
            ws.mediaRecorder.stop();
        }
    }
}

function broadcastVoiceMessage(senderWs, audioData) {
    for (const [clientWs] of clients.entries()) {
        if (clientWs !== senderWs && clientWs.readyState === 1) {
            clientWs.send(audioData);
        }
    }
}

function handleVoiceMessage(ws, message) {
    if (message.toString().trim().startsWith('data:audio/')) {
        const client = clients.get(ws);
        if (client?.state === 'active') {
            broadcast(`${client.name} sent a voice message.`, ws, true);
        }
        return true;
    }
    return false;
}

module.exports = {
    initializeVoice,
    togglePushToTalk,
    handleVoiceMessage,
    broadcastVoiceMessage
};