const clients = new Map();

function initializeVoice(ws) {
    ws.isRecording = false;
    ws.audioChunks = [];
}

function togglePushToTalk(ws, buttonElement) {
    if (!ws.isRecording) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.ondataavailable = event => ws.audioChunks.push(event.data);
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(ws.audioChunks, { type: 'audio/wav' });
                    const reader = new FileReader();
                    reader.onload = function() {
                        ws.send(reader.result);
                    };
                    reader.readAsDataURL(audioBlob);
                    ws.audioChunks = [];
                    buttonElement.classList.remove('active');
                    buttonElement.textContent = 'Push to Talk';
                };
                mediaRecorder.start();
                ws.isRecording = true;
                buttonElement.classList.add('active');
                buttonElement.textContent = 'Release to Send';
            });
    } else {
        ws.mediaRecorder.stop();
        ws.isRecording = false;
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
        broadcastVoiceMessage(ws, message);
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