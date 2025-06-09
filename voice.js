const clients = new Map();

function initializeVoice(ws) {
    ws.isRecording = false;
    ws.audioChunks = [];
    if (!ws.mediaRecorder) {
        ws.mediaRecorder = null; // Ensure mediaRecorder is initialized
    }
}

function togglePushToTalkInternal(ws, buttonElement) { // Renamed to avoid conflict
    if (!ws.isRecording) {
        if (ws.mediaRecorder) {
            ws.mediaRecorder.stream?.getTracks().forEach(track => track.stop()); // Stop previous stream if exists
        }
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
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
                    ws.mediaRecorder = null; // Clear mediaRecorder
                    buttonElement.classList.remove('active');
                    buttonElement.textContent = 'Tap to Talk';
                    stream.getTracks().forEach(track => track.stop()); // Stop stream
                };
                ws.mediaRecorder.start();
                ws.isRecording = true;
                buttonElement.classList.add('active');
                buttonElement.textContent = 'Tap to Stop';
            })
            .catch(err => {
                console.error('Microphone access denied:', err);
                ws.isRecording = false;
                buttonElement.classList.remove('active');
                buttonElement.textContent = 'Tap to Talk';
            });
    } else if (ws.mediaRecorder && ws.mediaRecorder.state !== 'inactive') {
        ws.mediaRecorder.stop();
    }
}

// Expose functions to global scope only in browser
if (typeof window !== 'undefined') {
    window.initializeVoice = initializeVoice;
    window.togglePushToTalkInternal = togglePushToTalkInternal; // Use renamed function
}