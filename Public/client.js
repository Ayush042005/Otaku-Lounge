document.addEventListener('DOMContentLoaded', () => {
    // Establish a WebSocket connection with the server
    const ws = new WebSocket(`ws://${window.location.host}`);
    ws.onopen = () => console.log('Connected to WebSocket server');
    ws.onclose = () => console.log('Disconnected from WebSocket server');
    ws.onerror = (error) => console.error('WebSocket error:', error);

    // This function runs every time a message is received from the server
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'newMessage') {
            const messagesContainer = document.querySelector(`.anime-card[data-anime-id="${data.animeId}"] .chat-messages`);
            if (messagesContainer) appendMessage(data.message, messagesContainer);
        }
    };

    // Appends a single message to a chat container and scrolls down
    function appendMessage(message, container) {
        const sanitizedText = message.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        container.innerHTML += `<p class="chat-message"><strong>${message.user}:</strong> ${sanitizedText}</p>`;
        container.scrollTop = container.scrollHeight;
    }

    // Sends a message to the server via WebSocket
    function sendMessage(animeId, textInput) {
        const text = textInput.value.trim();
        if (text && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ animeId, text }));
            textInput.value = '';
        }
    }

    // Set up event listeners for all anime cards
    document.querySelectorAll('.anime-card').forEach(card => {
        const animeId = card.dataset.animeId;
        const toggleButton = card.querySelector('.chat-toggle-btn');
        const chatContainer = card.querySelector('.chat-container');

        // Toggle chat visibility and fetch history on first open
        toggleButton.addEventListener('click', async () => {
            const isOpening = !chatContainer.classList.contains('active');
            chatContainer.classList.toggle('active');

            const messagesContainer = card.querySelector('.chat-messages');
            if (isOpening && messagesContainer.children.length === 0) {
                const response = await fetch(`/chats/${animeId}`);
                const history = await response.json();
                history.forEach(message => appendMessage(message, messagesContainer));
            }
        });
        
        // Listen for "Send" button clicks and Enter key presses
        const sendButton = card.querySelector('.chat-send-btn');
        const textInput = card.querySelector('.chat-input');
        sendButton.addEventListener('click', () => sendMessage(animeId, textInput));
        textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage(animeId, textInput);
        });
    });
});
