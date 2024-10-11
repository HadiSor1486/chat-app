const socket = io();
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesDiv = document.getElementById('messages');
const imageButton = document.getElementById('imageButton');
const recordButton = document.getElementById('recordButton');
const sendRecordingButton = document.getElementById('sendRecordingButton');
let recording = false;
let mediaRecorder;
let audioChunks = [];

// Function to create a message element
function createMessageElement(content, isSent) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isSent ? 'sent' : 'received');

    if (typeof content === 'string') {
        messageElement.textContent = content;
    } else {
        messageElement.appendChild(content); // Add image or audio
    }

    return messageElement;
}

// Send a text message
sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    if (message) {
        socket.emit('chat-message', message);
        messagesDiv.appendChild(createMessageElement(message, true));
        messageInput.value = '';
        messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom
    }
});

// Receive a text message
socket.on('chat-message', (message) => {
    messagesDiv.appendChild(createMessageElement(message, false));
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom
});

// Handle image sending
imageButton.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = event => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            const img = document.createElement('img');
            img.src = reader.result;
            img.style.maxWidth = '100%'; // Make sure it fits within the chat bubble
            socket.emit('chat-image', img.src);
            messagesDiv.appendChild(createMessageElement(img, true));
            messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom
        };
        if (file) {
            reader.readAsDataURL(file);
        }
    };
    input.click();
});

// Receive image message
socket.on('chat-image', (imgSrc) => {
    const img = document.createElement('img');
    img.src = imgSrc;
    img.style.maxWidth = '100%'; // Make sure it fits within the chat bubble
    messagesDiv.appendChild(createMessageElement(img, false));
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom
});

// Handle recording
recordButton.addEventListener('click', () => {
    if (!recording) {
        startRecording();
    } else {
        stopRecording();
    }
});

function startRecording() {
    recording = true;
    recordButton.textContent = 'Stop Recording';
    sendRecordingButton.style.display = 'none';
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                audioChunks = []; // Reset chunks

                // Create audio element
                const audioElement = document.createElement('audio');
                audioElement.src = audioUrl;
                audioElement.controls = true;

                // Emit audio message and show it in the chat
                socket.emit('audio-message', audioUrl);
                messagesDiv.appendChild(createMessageElement(audioElement, true));

                // Reset buttons
                sendRecordingButton.style.display = 'none';
                messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom
            };
        })
        .catch(err => console.error('Error accessing microphone:', err));
}

function stopRecording() {
    recording = false;
    recordButton.textContent = '🎤';
    mediaRecorder.stop();
}

// Receive audio message
socket.on('audio-message', (audioUrl) => {
    const audioElement = document.createElement('audio');
    audioElement.src = audioUrl;
    audioElement.controls = true;
    messagesDiv.appendChild(createMessageElement(audioElement, false));
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom
});
