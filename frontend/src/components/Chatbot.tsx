'use client';

import { useState } from 'react';

interface Message {
    type: 'bot' | 'user';
    text: string;
}

// Rule-based responses
const CHATBOT_RESPONSES: Record<string, string> = {
    'hello': 'Hello! Welcome to Civic Sense Portal. How can I help you today?',
    'hi': 'Hello! Welcome to Civic Sense Portal. How can I help you today?',
    'help': 'I can help you with:\n• How to submit a grievance\n• What is not treated as a grievance\n• How to track your complaint status\n\nJust type your question!',
    'submit': 'To submit a grievance:\n1. Click "Lodge Grievance" in the menu\n2. Select your grievance category\n3. Describe your issue in detail\n4. Upload any supporting images\n5. Submit and note your Complaint ID',
    'grievance': 'To submit a grievance:\n1. Click "Lodge Grievance" in the menu\n2. Select your grievance category\n3. Describe your issue in detail\n4. Upload any supporting images\n5. Submit and note your Complaint ID',
    'track': 'To track your grievance:\n1. Click "Track Status" in the menu\n2. Enter your Complaint ID\n3. View the current status and timeline',
    'status': 'To track your grievance:\n1. Click "Track Status" in the menu\n2. Enter your Complaint ID\n3. View the current status and timeline',
    'not grievance': 'The following are NOT treated as grievances:\n• RTI matters\n• Court-related/Sub-judice matters\n• Religious matters\n• Suggestions only\n• Service matters of Govt employees',
    'rti': 'RTI (Right to Information) matters are NOT treated as grievances here. Please visit the RTI portal for such requests.',
    'time': 'Grievances are typically processed within 30 days. High priority complaints are addressed within 7 days.',
    'priority': 'Priority levels:\n• HIGH: Safety/emergency issues\n• MEDIUM: Utility/service issues\n• LOW: General requests',
    'default': 'I\'m sorry, I didn\'t understand that. Try asking about:\n• How to submit a grievance\n• How to track status\n• What is not a grievance\n\nOr type "help" for more options.'
};

function getResponse(input: string): string {
    const lowered = input.toLowerCase();

    for (const [key, response] of Object.entries(CHATBOT_RESPONSES)) {
        if (key === 'default') continue;
        if (lowered.includes(key)) {
            return response;
        }
    }

    return CHATBOT_RESPONSES['default'];
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { type: 'bot', text: 'Hello! I\'m your Civic Sense Assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');

    const handleSend = () => {
        if (!input.trim()) return;

        // Add user message
        const userMessage: Message = { type: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);

        // Get bot response
        const response = getResponse(input);
        const botMessage: Message = { type: 'bot', text: response };

        // Simulate typing delay
        setTimeout(() => {
            setMessages(prev => [...prev, botMessage]);
        }, 500);

        setInput('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="chatbot-container">
            {/* Chat Window */}
            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header flex justify-between items-center">
                        <span>💬 Civic Sense Assistant</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white hover:opacity-80"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="chatbot-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`chatbot-message ${msg.type}`}>
                                {msg.text.split('\n').map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div className="chatbot-input">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your question..."
                        />
                        <button onClick={handleSend}>Send</button>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                className="chatbot-button"
                onClick={() => setIsOpen(!isOpen)}
                title="Chat with Assistant"
            >
                {isOpen ? '✕' : '💬'}
            </button>
        </div>
    );
}
