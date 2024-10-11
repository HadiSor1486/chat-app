const socket = io();
const messageInput = document.getElementById('messageInput');
const messagesContainer = document.getElementById('messages');
const sendBtn = document.getElementById('sendBtn');
const recordBtn = document.getElementById('recordBtn');
let mediaRecorder;
let recordedChunks = [];

sendBtn.addEventListener('click', sendMessage);
recordBtn.addEventListener('click', toggleRecording);

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('chat message', message);
        displayMessage(message, true);
        messageInput.value = '';
        sendBtn.style.display = 'none'; // Hide send button
    }
}

function toggleRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    } else {
        startRecording();
    }
}

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            recordBtn.textContent = '⏹️'; // Stop icon
            mediaRecorder.ondataavailable = event => {
                recordedChunks.push(event.data);
            };
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                socket.emit('audio message', url);
                recordedChunks = []; // Reset for next recording
            };
        });
}

function displayMessage(message, isMine) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(isMine ? 'my-message' : 'other-message');
    messageDiv.innerText = message;

    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = 'Delete';
    deleteBtn.onclick = () => {
        messagesContainer.removeChild(messageDiv);
        socket.emit('delete message', message);
    };
    messageDiv.appendChild(deleteBtn);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom
}

socket.on('chat message', message => displayMessage(message, false));
socket.on('audio message', url => {
    const audio = new Audio(url);
    audio.play();
});
socket.on('delete message', message => {
    const messages = document.querySelectorAll('.message');
    messages.forEach(msg => {
        if (msg.innerText.includes(message)) {
            messagesContainer.removeChild(msg);
        }
    });
});

messageInput.addEventListener('input', () => {
    sendBtn.style.display = messageInput.value.trim() ? 'inline' : 'none'; // Show send button when there is input
});
