const clients = new Map();

function initializeVoice(ws) {
    ws.isRecording = false;
    ws.audioChunks = [];
    if (!ws.mediaRecorder) {
        ws.mediaRecorder = null; // Ensure mediaRecorder is initialized
    }
}

function togglePushToTalkInternal(ws, buttonElement) {
    if (!ws.isRecording) {
        if (ws.mediaRecorder) {
            ws.mediaRecorder.stream?.getTracks().forEach(track => track.stop());
        }
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                // Specify a more compatible mimeType if possible
                const options = { mimeType: 'audio/webm' };
                try {
                    ws.mediaRecorder = new MediaRecorder(stream, options);
                } catch (e) {
                    console.warn("audio/webm not supported, using browser default.");
                    ws.mediaRecorder = new MediaRecorder(stream);
                }
                
                ws.audioChunks = [];
                ws.mediaRecorder.ondataavailable = event => {
                    if (event.data.size > 0) {
                        ws.audioChunks.push(event.data);
                    }
                };
                
                ws.mediaRecorder.onstop = () => {
                    if (ws.audioChunks.length > 0) {
                        // Use the recorder's mimeType to create the Blob correctly
                        const mimeType = ws.mediaRecorder.mimeType || 'audio/webm';
                        const audioBlob = new Blob(ws.audioChunks, { type: mimeType });
                        const reader = new FileReader();
                        
                        reader.onload = function() {
                            // The reader.result will now be a valid Data URL with the correct type
                            // e.g., "data:audio/webm;base64,..."
                            ws.send(reader.result);
                        };
                        reader.readAsDataURL(audioBlob);
                    }
                    ws.audioChunks = [];
                    ws.isRecording = false;
                    ws.mediaRecorder = null;
                    buttonElement.classList.remove('active');
                    buttonElement.textContent = 'Tap to Talk';
                    stream.getTracks().forEach(track => track.stop());
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