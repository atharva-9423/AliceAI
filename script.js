class AIChatBot {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.chatMessages = document.getElementById('chatMessages');
        this.suggestionCards = document.querySelectorAll('.suggestion-card');
        this.conversationList = document.getElementById('conversationList');

        this.currentConversationId = null;
        this.conversations = this.loadConversations();
        this.guestTimeoutId = null;
        this.guestWarningTimeoutId = null;

        this.initializeEventListeners();
        this.initializeAnimations();
        this.renderConversationHistory();
        this.loadLastConversation();
        this.checkGuestSession();
    }

    initializeEventListeners() {
        // Initialize Google OAuth
        this.initializeGoogleAuth();
        
        // Send button click
        this.sendBtn.addEventListener('click', () => this.sendMessage());

        // Enter key press
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Character count update
        this.messageInput.addEventListener('input', () => {
            const characterCount = document.querySelector('.character-count');
            const count = this.messageInput.value.length;
            characterCount.textContent = `${count} / 3000`;
        });

        // Minimal suggestion card animations
        this.suggestionCards.forEach((card, index) => {
            card.addEventListener('click', () => {
                // Simple, elegant click animation
                gsap.to(card, {
                    scale: 0.95,
                    duration: 0.05,
                    ease: "power2.out",
                    onComplete: () => {
                        gsap.to(card, {
                            scale: 1,
                            duration: 0.1,
                            ease: "back.out(1.7)"
                        });
                    }
                });

                setTimeout(() => {
                    const title = card.querySelector('.card-title').textContent;
                    this.messageInput.value = title;
                    this.sendMessage();
                }, 150);
            });

            // Subtle hover animation
            card.addEventListener('mouseenter', () => {
                const icon = card.querySelector('.card-icon');

                gsap.to(card, {
                    y: -4,
                    scale: 1.02,
                    duration: 0.15,
                    ease: "power2.out"
                });

                gsap.to(icon, {
                    scale: 1.1,
                    rotation: 5,
                    duration: 0.15,
                    ease: "power2.out"
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    y: 0,
                    scale: 1,
                    duration: 0.15,
                    ease: "power2.out"
                });

                gsap.to(card.querySelector('.card-icon'), {
                    scale: 1,
                    rotation: 0,
                    duration: 0.15,
                    ease: "power2.out"
                });
            });

            // Removed floating animation to keep cards stable
        });

        // Simple new thread button animation
        document.querySelector('.new-thread-btn').addEventListener('click', () => {
            gsap.to('.new-thread-btn', {
                scale: 0.95,
                duration: 0.05,
                ease: "power2.out",
                onComplete: () => {
                    gsap.to('.new-thread-btn', {
                        scale: 1,
                        duration: 0.1,
                        ease: "back.out(1.7)"
                    });
                }
            });
            this.clearChat();
        });

        // New conversation button
        document.getElementById('newConversationBtn').addEventListener('click', () => {
            this.startNewConversation();
        });

        // Clear history button
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearAllConversations();
        });

        // Simple send button animation
        this.sendBtn.addEventListener('click', () => {
            gsap.to(this.sendBtn, {
                scale: 0.9,
                duration: 0.05,
                ease: "power2.out",
                onComplete: () => {
                    gsap.to(this.sendBtn, {
                        scale: 1,
                        duration: 0.1,
                        ease: "back.out(1.7)"
                    });
                }
            });
        });

        // Mobile hamburger menu functionality
        this.initializeMobileMenu();
    }

    initializeAnimations() {
        // Simple page load animation
        const masterTl = gsap.timeline();

        // Set initial states
        masterTl.set('.sidebar', { x: -100, opacity: 0 })
        .set('.chat-header h1', { y: 30, opacity: 0 })
        .set('.suggestion-card', { y: 40, opacity: 0 })
        .set('.chat-input-container', { y: 50, opacity: 0 })
        .set('.right-sidebar', { x: 100, opacity: 0 });

        // Clean entrance animations
        masterTl.to('.sidebar', {
            x: 0,
            opacity: 1,
            duration: 0.3,
            ease: "power2.out"
        })
        .to('.chat-header h1', {
            y: 0,
            opacity: 1,
            duration: 0.25,
            ease: "power2.out"
        }, "-=0.2")
        .to('.suggestion-card', {
            y: 0,
            opacity: 1,
            duration: 0.2,
            ease: "power2.out"
        }, "-=0.15")
        .to('.chat-input-container', {
            y: 0,
            opacity: 1,
            duration: 0.2,
            ease: "power2.out"
        }, "-=0.1")
        .to('.right-sidebar', {
            x: 0,
            opacity: 1,
            duration: 0.25,
            ease: "power2.out"
        }, "-=0.15");

        // Subtle logo animation
        gsap.to('.logo-icon', {
            y: -4,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        // Simple nav item animations
        document.querySelectorAll('.nav-item').forEach((item) => {
            item.addEventListener('mouseenter', () => {
                const icon = item.querySelector('.nav-icon');

                gsap.to(icon, {
                    scale: 1.1,
                    duration: 0.1,
                    ease: "power2.out"
                });

                gsap.to(item, {
                    x: 4,
                    duration: 0.1,
                    ease: "power2.out"
                });
            });

            item.addEventListener('mouseleave', () => {
                gsap.to([item.querySelector('.nav-icon'), item], {
                    scale: 1,
                    x: 0,
                    duration: 0.1,
                    ease: "power2.out"
                });
            });
        });

        // Simple input focus animation
        this.messageInput.addEventListener('focus', () => {
            gsap.to('.input-wrapper', {
                scale: 1.01,
                duration: 0.1,
                ease: "power2.out"
            });
        });

        this.messageInput.addEventListener('blur', () => {
            gsap.to('.input-wrapper', {
                scale: 1,
                duration: 0.1,
                ease: "power2.out"
            });
        });
    }



    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Start new conversation if none exists
        if (!this.currentConversationId) {
            this.startNewConversation();
        }

        // Hide suggestion cards after first message
        this.hideSuggestionCards();

        // Add user message
        this.addMessage(message, 'user');
        this.saveMessageToConversation(message, 'user');

        // Clear input
        this.messageInput.value = '';
        this.updateCharacterCount();

        // Show typing indicator and immediately call AI
        this.showTypingIndicator();
        this.generateAIResponse(message);
    }

    addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';

        if (sender === 'user') {
            messageDiv.innerHTML = `<div class="user-message">${this.escapeHtml(content)}</div>`;
        } else {
            messageDiv.innerHTML = `<div class="bot-message">${content}</div>`;
        }

        // Simple initial state
        gsap.set(messageDiv, {
            opacity: 0,
            y: 20,
            scale: 0.95
        });

        this.chatMessages.appendChild(messageDiv);

        // Clean message appearance
        gsap.to(messageDiv, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.15,
            ease: "power2.out"
        });

        this.scrollToBottom();
    }



    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <span>AI is thinking</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;

        // Simple fade in
        gsap.set(typingDiv, {
            opacity: 0,
            y: 10
        });

        this.chatMessages.appendChild(typingDiv);

        gsap.to(typingDiv, {
            opacity: 1,
            y: 0,
            duration: 0.15,
            ease: "power2.out"
        });

        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    formatAIResponse(response) {
        // Convert markdown-style formatting to HTML
        response = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        response = response.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Convert numbered lists
        response = response.replace(/^\d+\.\s/gm, '<br>$&');

        // Convert bullet points
        response = response.replace(/^[\-\*]\s/gm, '<br>• ');

        // Convert double line breaks to paragraphs
        response = response.replace(/\n\n/g, '<br><br>');

        // Convert single line breaks to br tags
        response = response.replace(/\n/g, '<br>');

        return response;
    }

    async generateAIResponse(userMessage) {
        // Add timeout for faster failure detection
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased to 10 seconds for better model

        try {
            console.log('Sending request to Groq API...');
            console.log('User message:', userMessage);

            // Using Groq API for ultra-fast responses
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer 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'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-8b-instant',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful AI assistant. Provide clear, accurate, and informative responses. Be conversational but professional.'
                        },
                        {
                            role: 'user',
                            content: userMessage
                        }
                    ],
                    max_tokens: 1024,
                    temperature: 0.7,
                    top_p: 0.9,
                    stream: false
                })
            });

            clearTimeout(timeoutId);

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Groq API Error Response:', errorText);

                // Check for specific error types
                if (response.status === 401) {
                    throw new Error('API key is invalid or expired');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded');
                } else if (response.status === 400) {
                    throw new Error('Bad request - check your request format');
                } else {
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                }
            }

            const data = await response.json();
            console.log('Groq API Response:', data);

            this.hideTypingIndicator();

            if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
                let aiResponse = data.choices[0].message.content.trim();

                // Format the response for better display
                aiResponse = this.formatAIResponse(aiResponse);

                console.log('AI Response content:', aiResponse);
                this.addMessage(aiResponse, 'bot');
                this.saveMessageToConversation(aiResponse, 'bot');
            } else {
                console.error('Invalid response format from Groq:', data);
                const errorMsg = 'I received an unexpected response format. Please try again.';
                this.addMessage(errorMsg, 'bot');
                this.saveMessageToConversation(errorMsg, 'bot');
            }

        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Groq API Error Details:', error);

            this.hideTypingIndicator();

            // Fallback response when Groq API fails
            const fallbackMsg = "I'm having some connectivity issues right now, but I'm here to help! Could you try asking your question again?";
            this.addMessage(fallbackMsg, 'bot');
            this.saveMessageToConversation(fallbackMsg, 'bot');
        }
    }

    initializeMobileMenu() {
        const mobileHamburger = document.getElementById('mobileHamburger');
        const mobileNavOverlay = document.getElementById('mobileNavOverlay');
        const mobileNavClose = document.getElementById('mobileNavClose');
        const mobileNavHome = document.getElementById('mobileNavHome');
        const mobileNavNew = document.getElementById('mobileNavNew');
        const mobileNavClear = document.getElementById('mobileNavClear');
        const mobileConversationList = document.getElementById('mobileConversationList');

        // Open mobile menu
        mobileHamburger.addEventListener('click', () => {
            mobileNavOverlay.classList.add('active');
            this.renderMobileConversationList();

            // Animate hamburger button
            gsap.to(mobileHamburger, {
                scale: 0.9,
                duration: 0.1,
                ease: "power2.out",
                onComplete: () => {
                    gsap.to(mobileHamburger, {
                        scale: 1,
                        duration: 0.1,
                        ease: "power2.out"
                    });
                }
            });
        });

        // Close mobile menu
        const closeMobileMenu = () => {
            mobileNavOverlay.classList.remove('active');
        };

        mobileNavClose.addEventListener('click', closeMobileMenu);

        // Close when clicking overlay background
        mobileNavOverlay.addEventListener('click', (e) => {
            if (e.target === mobileNavOverlay) {
                closeMobileMenu();
            }
        });

        // Mobile menu actions
        mobileNavHome.addEventListener('click', () => {
            this.clearChat();
            closeMobileMenu();
        });

        mobileNavNew.addEventListener('click', () => {
            this.startNewConversation();
            this.clearChat();
            closeMobileMenu();
        });

        mobileNavClear.addEventListener('click', () => {
            this.clearAllConversations();
            closeMobileMenu();
        });
    }

    renderMobileConversationList() {
        const mobileConversationList = document.getElementById('mobileConversationList');
        const conversationIds = Object.keys(this.conversations);

        if (conversationIds.length === 0) {
            mobileConversationList.innerHTML = `
                <div class="mobile-empty-conversations">
                    <i class="fas fa-comments"></i>
                    <div>No conversations yet</div>
                </div>
            `;
            return;
        }

        // Sort conversations by most recent
        const sortedConversations = conversationIds
            .map(id => this.conversations[id])
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 10); // Show only 10 most recent

        mobileConversationList.innerHTML = sortedConversations.map(conv => `
            <div class="mobile-conversation-item" data-conversation-id="${conv.id}">
                <div class="mobile-conversation-info">
                    <div class="mobile-conversation-title">${this.escapeHtml(conv.title)}</div>
                    <div class="mobile-conversation-preview">
                        ${conv.messages.length > 0 ? this.escapeHtml(conv.messages[conv.messages.length - 1].content.substring(0, 50)) + (conv.messages[conv.messages.length - 1].content.length > 50 ? '...' : '') : 'No messages'}
                    </div>
                </div>
                <button class="mobile-conversation-delete" data-conversation-id="${conv.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        // Add click listeners for mobile conversation items
        mobileConversationList.querySelectorAll('.mobile-conversation-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.mobile-conversation-delete')) {
                    return;
                }

                const conversationId = item.dataset.conversationId;
                this.loadConversation(conversationId);
                document.getElementById('mobileNavOverlay').classList.remove('active');
            });
        });

        // Add click listeners for mobile delete buttons
        mobileConversationList.querySelectorAll('.mobile-conversation-delete').forEach(deleteBtn => {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();

                const conversationId = deleteBtn.dataset.conversationId;
                const conversation = this.conversations[conversationId];

                if (confirm(`Delete "${conversation.title}"?`)) {
                    this.deleteConversation(conversationId);
                    this.renderMobileConversationList(); // Refresh the mobile list
                }
            });
        });
    }

    hideSuggestionCards() {
        const suggestionCards = document.querySelector('.suggestion-cards');
        const chatHeader = document.querySelector('.chat-header');
        const mobileHamburger = document.getElementById('mobileHamburger');

        if (suggestionCards && !suggestionCards.classList.contains('hidden')) {
            gsap.to([suggestionCards, chatHeader], {
                opacity: 0,
                y: -20,
                duration: 0.3,
                ease: "power2.in",
                onComplete: () => {
                    suggestionCards.style.display = 'none';
                    chatHeader.style.display = 'none';
                    suggestionCards.classList.add('hidden');

                    // Show hamburger menu on mobile when in chat
                    if (window.innerWidth <= 767) {
                        mobileHamburger.classList.add('show');
                    }
                }
            });
        }
    }

    clearChat() {
        // Simple messages exit animation
        const messages = this.chatMessages.querySelectorAll('.message, .typing-indicator');
        if (messages.length > 0) {
            gsap.to(messages, {
                opacity: 0,
                y: -10,
                duration: 0.2,
                stagger: 0.02,
                ease: "power2.in",
                onComplete: () => {
                    this.chatMessages.innerHTML = '';
                }
            });
        } else {
            this.chatMessages.innerHTML = '';
        }

        this.messageInput.value = '';
        this.updateCharacterCount();
        this.currentConversationId = null;

        // Simple suggestion cards reappearance
        const suggestionCards = document.querySelector('.suggestion-cards');
        const chatHeader = document.querySelector('.chat-header');
        const mobileHamburger = document.getElementById('mobileHamburger');

        if (suggestionCards.classList.contains('hidden')) {
            suggestionCards.style.display = 'grid';
            chatHeader.style.display = 'block';
            suggestionCards.classList.remove('hidden');

            // Hide hamburger menu when returning to home
            mobileHamburger.classList.remove('show');

            gsap.fromTo([chatHeader, suggestionCards], {
                opacity: 0,
                y: 20
            }, {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "power2.out",
                delay: 0.1
            });
        }
    }

    updateCharacterCount() {
        const characterCount = document.querySelector('.character-count');
        const count = this.messageInput.value.length;
        characterCount.textContent = `${count} / 3000`;
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // Conversation Management Methods
    loadConversations() {
        const saved = localStorage.getItem('aiChatConversations');
        return saved ? JSON.parse(saved) : {};
    }

    saveConversations() {
        localStorage.setItem('aiChatConversations', JSON.stringify(this.conversations));
    }

    startNewConversation() {
        this.currentConversationId = 'conv_' + Date.now();
        this.conversations[this.currentConversationId] = {
            id: this.currentConversationId,
            title: 'New Conversation',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.saveConversations();
        this.renderConversationHistory();
    }

    saveMessageToConversation(content, sender) {
        if (!this.currentConversationId) return;

        const conversation = this.conversations[this.currentConversationId];
        if (!conversation) return;

        conversation.messages.push({
            content,
            sender,
            timestamp: new Date().toISOString()
        });

        // Update conversation title with first user message
        if (sender === 'user' && conversation.messages.filter(m => m.sender === 'user').length === 1) {
            conversation.title = content.length > 40 ? content.substring(0, 40) + '...' : content;
        }

        conversation.updatedAt = new Date().toISOString();
        this.saveConversations();
        this.renderConversationHistory();
    }

    loadConversation(conversationId) {
        const conversation = this.conversations[conversationId];
        if (!conversation) return;

        this.currentConversationId = conversationId;
        this.chatMessages.innerHTML = '';
        this.hideSuggestionCards();

        // Load all messages
        conversation.messages.forEach(msg => {
            this.addMessage(msg.content, msg.sender);
        });

        this.scrollToBottom();
    }

    deleteConversation(conversationId) {
        delete this.conversations[conversationId];
        this.saveConversations();
        this.renderConversationHistory();

        if (this.currentConversationId === conversationId) {
            this.clearChat();
        }
    }

    clearAllConversations() {
        if (confirm('Are you sure you want to clear all conversation history?')) {
            this.conversations = {};
            this.saveConversations();
            this.renderConversationHistory();
            this.clearChat();
        }
    }

    loadLastConversation() {
        const conversationIds = Object.keys(this.conversations);
        if (conversationIds.length > 0) {
            // Load the most recently updated conversation
            const lastConversation = conversationIds
                .map(id => this.conversations[id])
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];

            if (lastConversation && lastConversation.messages.length > 0) {
                this.loadConversation(lastConversation.id);
            }
        }
    }

    formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return date.toLocaleDateString();
    }

    renderConversationHistory() {
        const conversationIds = Object.keys(this.conversations);

        if (conversationIds.length === 0) {
            this.conversationList.innerHTML = `
                <div class="empty-conversations">
                    <i class="fas fa-comments"></i>
                    <div>No conversations yet</div>
                    <div>Start chatting to see your history here</div>
                </div>
            `;
            return;
        }

        // Sort conversations by most recent
        const sortedConversations = conversationIds
            .map(id => this.conversations[id])
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        this.conversationList.innerHTML = sortedConversations.map(conv => `
            <div class="project-item conversation-item" data-conversation-id="${conv.id}">
                <button class="conversation-delete-btn" data-conversation-id="${conv.id}" title="Delete conversation">
                    <i class="fas fa-trash"></i>
                </button>
                <div class="project-title">${this.escapeHtml(conv.title)}</div>
                <div class="project-subtitle">
                    ${conv.messages.length > 0 ? this.escapeHtml(conv.messages[conv.messages.length - 1].content.substring(0, 80)) + (conv.messages[conv.messages.length - 1].content.length > 80 ? '...' : '') : 'No messages'}
                </div>
                <div class="conversation-meta">
                    <span class="conversation-time">${this.formatTimeAgo(conv.updatedAt)}</span>
                    <span class="conversation-count">${conv.messages.filter(m => m.sender === 'user').length} msgs</span>
                </div>
            </div>
        `).join('');

        // Add click listeners for conversation items
        this.conversationList.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Don't load conversation if delete button was clicked
                if (e.target.closest('.conversation-delete-btn')) {
                    return;
                }

                const conversationId = item.dataset.conversationId;
                this.loadConversation(conversationId);

                // Visual feedback
                gsap.to(item, {
                    scale: 0.95,
                    duration: 0.05,
                    ease: "power2.out",
                    onComplete: () => {
                        gsap.to(item, {
                            scale: 1,
                            duration: 0.05,
                            ease: "power2.out"
                        });
                    }
                });
            });
        });

        // Add click listeners for delete buttons
        this.conversationList.querySelectorAll('.conversation-delete-btn').forEach(deleteBtn => {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent conversation from loading

                const conversationId = deleteBtn.dataset.conversationId;
                const conversation = this.conversations[conversationId];
                const confirmMessage = `Delete "${conversation.title}"?`;

                if (confirm(confirmMessage)) {
                    // Add delete animation
                    const conversationItem = deleteBtn.closest('.conversation-item');
                    gsap.to(conversationItem, {
                        opacity: 0,
                        x: -20,
                        scale: 0.9,
                        duration: 0.3,
                        ease: "power2.in",
                        onComplete: () => {
                            this.deleteConversation(conversationId);
                        }
                    });
                }
            });

            // Add hover effects to delete button
            deleteBtn.addEventListener('mouseenter', () => {
                gsap.to(deleteBtn, {
                    scale: 1.1,
                    duration: 0.1,
                    ease: "power2.out"
                });
            });

            deleteBtn.addEventListener('mouseleave', () => {
                gsap.to(deleteBtn, {
                    scale: 1,
                    duration: 0.1,
                    ease: "power2.out"
                });
            });
        });
    }

    initializeGoogleAuth() {
        // Load stored user profile and display it
        this.loadStoredUserProfile();

        // Setup logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleSignOut();
            });
        }

        // Initialize Google OAuth for potential re-authentication
        const GOOGLE_CLIENT_ID = '528620317376-j0v8n7304obhb8vfag8upeqhitmoeoih.apps.googleusercontent.com';
        
        const initGoogle = () => {
            console.log('Attempting to initialize Google OAuth...');
            console.log('Google available:', typeof google !== 'undefined');
            console.log('Google accounts available:', typeof google !== 'undefined' && google.accounts);
            
            if (typeof google !== 'undefined' && google.accounts) {
                try {
                    google.accounts.id.initialize({
                        client_id: GOOGLE_CLIENT_ID,
                        callback: this.handleGoogleSignIn.bind(this)
                    });
                    console.log('Google OAuth initialized successfully');

                    const googleBtn = document.getElementById('googleSignIn');
                    console.log('Google button found:', !!googleBtn);
                    
                    if (googleBtn) {
                        // Keep the original button and just add click handler
                        googleBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            console.log('Google sign-in button clicked');
                            google.accounts.id.prompt();
                        });
                        
                        console.log('Google button event listener added');
                    }
                } catch (error) {
                    console.error('Error initializing Google OAuth:', error);
                }
            } else {
                // Retry if Google script not loaded yet
                console.log('Google script not ready, retrying...');
                setTimeout(initGoogle, 200);
            }
        };

        // Multiple initialization attempts
        setTimeout(initGoogle, 100);
        setTimeout(initGoogle, 500);
        setTimeout(initGoogle, 1000);
        
        // Also initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(initGoogle, 100);
            });
        }
        
        // Listen for the Google script load event
        window.addEventListener('load', () => {
            setTimeout(initGoogle, 100);
        });
    }

    loadStoredUserProfile() {
        const userProfileData = localStorage.getItem('userProfile');
        if (userProfileData) {
            const profile = JSON.parse(userProfileData);
            this.displayUserProfile(profile);
        }
    }

    handleGoogleSignIn(response) {
        const credential = response.credential;
        const payload = this.parseJwt(credential);
        
        this.displayUserProfile({
            name: payload.name,
            email: payload.email,
            picture: payload.picture
        });
    }

    displayUserProfile(user) {
        const authButtons = document.getElementById('authButtons');
        const userProfile = document.getElementById('userProfile');
        
        authButtons.style.display = 'none';
        userProfile.style.display = 'block';
        
        document.getElementById('userName').textContent = user.name;
        document.getElementById('userEmail').textContent = user.email;
        
        if (user.picture) {
            document.getElementById('userAvatar').src = user.picture;
        } else {
            // Use a default avatar with initials
            document.getElementById('userAvatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6366f1&color=fff&size=64`;
        }
    }

    handleSignOut() {
        const userProfile = localStorage.getItem('userProfile');
        
        // Clear any stored user data
        localStorage.removeItem('userProfile');
        localStorage.removeItem('aiChatConversations');
        
        // Clear any active guest timers
        if (this.guestTimeoutId) {
            clearTimeout(this.guestTimeoutId);
            this.guestTimeoutId = null;
        }
        if (this.guestWarningTimeoutId) {
            clearTimeout(this.guestWarningTimeoutId);
            this.guestWarningTimeoutId = null;
        }
        if (this.guestTimerInterval) {
            clearInterval(this.guestTimerInterval);
            this.guestTimerInterval = null;
        }
        
        // If user was a guest, mark that Google login is now required
        if (userProfile) {
            const profile = JSON.parse(userProfile);
            if (profile.provider === 'guest') {
                localStorage.setItem('requireGoogleLogin', 'true');
            }
        }
        
        // Redirect to sign-in page
        window.location.href = 'signin.html';
    }

    parseJwt(token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    }

    checkGuestSession() {
        const userProfile = localStorage.getItem('userProfile');
        if (!userProfile) return;

        const profile = JSON.parse(userProfile);
        
        // Only check timeout for guest users
        if (profile.provider === 'guest' && profile.expiresAt) {
            const now = Date.now();
            const timeRemaining = profile.expiresAt - now;

            if (timeRemaining <= 0) {
                // Session already expired
                this.handleGuestTimeout();
                return;
            }

            // Show warning 5 minutes before expiry
            const warningTime = timeRemaining - (5 * 60 * 1000); // 5 minutes before
            if (warningTime > 0) {
                this.guestWarningTimeoutId = setTimeout(() => {
                    this.showGuestExpiryWarning();
                }, warningTime);
            } else {
                // Less than 5 minutes remaining, show warning immediately
                this.showGuestExpiryWarning();
            }

            // Set timeout for automatic logout
            this.guestTimeoutId = setTimeout(() => {
                this.handleGuestTimeout();
            }, timeRemaining);

            // Update session timer display
            this.updateGuestTimer();
            this.guestTimerInterval = setInterval(() => {
                this.updateGuestTimer();
            }, 1000);
        }
    }

    updateGuestTimer() {
        const userProfile = localStorage.getItem('userProfile');
        if (!userProfile) return;

        const profile = JSON.parse(userProfile);
        if (profile.provider !== 'guest' || !profile.expiresAt) return;

        const now = Date.now();
        const timeRemaining = Math.max(0, profile.expiresAt - now);
        const minutes = Math.floor(timeRemaining / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        // Update timer in sidebar if exists
        let timerElement = document.getElementById('guestTimer');
        if (!timerElement && timeRemaining > 0) {
            // Create timer element
            const sidebar = document.querySelector('.auth-section');
            if (sidebar) {
                const timerHtml = `
                    <div class="guest-timer" id="guestTimer">
                        <div class="timer-icon">⏰</div>
                        <div class="timer-text">
                            <div class="timer-label">Guest Session</div>
                            <div class="timer-value" id="timerValue">${minutes}:${seconds.toString().padStart(2, '0')}</div>
                        </div>
                    </div>
                `;
                sidebar.insertAdjacentHTML('afterbegin', timerHtml);
                timerElement = document.getElementById('guestTimer');
            }
        }

        if (timerElement) {
            const timerValue = document.getElementById('timerValue');
            if (timeRemaining > 0) {
                timerValue.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                // Change color when less than 5 minutes remaining
                if (timeRemaining < 5 * 60 * 1000) {
                    timerElement.classList.add('warning');
                }
            } else {
                timerElement.remove();
            }
        }
    }

    showGuestExpiryWarning() {
        const warningHtml = `
            <div class="guest-expiry-overlay" id="guestExpiryOverlay">
                <div class="guest-expiry-modal">
                    <div class="expiry-icon">
                        <i class="fas fa-hourglass-end"></i>
                    </div>
                    <h2>Session Expiring Soon</h2>
                    <p>Your guest session will expire in less than 5 minutes.</p>
                    <p>Sign in with Google to continue using the app without interruption.</p>
                    <div class="expiry-actions">
                        <button class="expiry-btn google-btn" id="signInNow">
                            <i class="fab fa-google"></i>
                            Sign in with Google
                        </button>
                        <button class="expiry-btn dismiss-btn" id="dismissWarning">
                            Continue as Guest
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', warningHtml);

        const overlay = document.getElementById('guestExpiryOverlay');
        const modal = overlay.querySelector('.guest-expiry-modal');

        // Animate modal
        gsap.set(overlay, { opacity: 0 });
        gsap.set(modal, { scale: 0.8, opacity: 0 });
        gsap.to(overlay, { opacity: 1, duration: 0.3 });
        gsap.to(modal, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" });

        // Event listeners
        document.getElementById('signInNow').addEventListener('click', () => {
            this.redirectToSignIn();
        });

        document.getElementById('dismissWarning').addEventListener('click', () => {
            overlay.remove();
        });
    }

    handleGuestTimeout() {
        // Clear timers
        if (this.guestTimeoutId) {
            clearTimeout(this.guestTimeoutId);
            this.guestTimeoutId = null;
        }
        if (this.guestWarningTimeoutId) {
            clearTimeout(this.guestWarningTimeoutId);
            this.guestWarningTimeoutId = null;
        }
        if (this.guestTimerInterval) {
            clearInterval(this.guestTimerInterval);
            this.guestTimerInterval = null;
        }

        // Show timeout modal
        const timeoutHtml = `
            <div class="guest-timeout-overlay" id="guestTimeoutOverlay">
                <div class="guest-timeout-modal">
                    <div class="timeout-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <h2>Guest Session Expired</h2>
                    <p>Your 1-hour guest session has expired.</p>
                    <p>Please sign in with Google to continue using Alice AI.</p>
                    <div class="timeout-actions">
                        <button class="timeout-btn" id="signInRequired">
                            <i class="fab fa-google"></i>
                            Sign in with Google
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', timeoutHtml);

        const overlay = document.getElementById('guestTimeoutOverlay');
        const modal = overlay.querySelector('.guest-timeout-modal');

        gsap.set(overlay, { opacity: 0 });
        gsap.set(modal, { scale: 0.8, opacity: 0 });
        gsap.to(overlay, { opacity: 1, duration: 0.3 });
        gsap.to(modal, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" });

        document.getElementById('signInRequired').addEventListener('click', () => {
            this.redirectToSignIn();
        });

        // Disable all app functionality
        this.disableApp();
    }

    disableApp() {
        // Disable input and buttons
        this.messageInput.disabled = true;
        this.sendBtn.disabled = true;
        
        // Add overlay to prevent interaction
        const disableOverlay = document.createElement('div');
        disableOverlay.className = 'app-disabled-overlay';
        disableOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            z-index: 999;
            pointer-events: all;
        `;
        document.body.appendChild(disableOverlay);
    }

    redirectToSignIn() {
        // Clear all data
        localStorage.removeItem('userProfile');
        localStorage.removeItem('aiChatConversations');
        
        // Redirect to sign-in page
        window.location.href = 'signin.html';
    }
}

// Loading screen and app initialization
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication first
    const userProfile = localStorage.getItem('userProfile');
    
    if (!userProfile) {
        // No authentication found, redirect to sign-in
        window.location.href = 'signin.html';
        return;
    }

    const profile = JSON.parse(userProfile);
    if (!profile.authenticated) {
        // User not authenticated, redirect to sign-in
        window.location.href = 'signin.html';
        return;
    }

    const loadingScreen = document.getElementById('loadingScreen');
    const appContainer = document.querySelector('.app-container');

    // Simulate loading time and initialize app
    setTimeout(() => {
        // Initialize the chatbot
        new AIChatBot();

        // Start fade out animation
        loadingScreen.classList.add('fade-out');

        // Show main app with smooth transition
        setTimeout(() => {
            appContainer.classList.add('loaded');
        }, 300);

        // Remove loading screen from DOM
        setTimeout(() => {
            loadingScreen.remove();
        }, 1000);

    }, 3000); // 3 second loading time
});

// Add smooth transitions for suggestion cards
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        .suggestion-cards {
            transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .chat-header {
            transition: opacity 0.3s ease, transform 0.3s ease;
        }
    `;
    document.head.appendChild(style);
});
