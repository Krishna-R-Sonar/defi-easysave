// defi-easysave/frontend/src/components/Chatbot.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const Chatbot = ({ activeTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I’m the DeFi EasySave Assistant. Ask me how to use the platform or about its features!' },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    setMessages([...messages, { sender: 'user', text: input }]);
    setInput('');

    try {
      // Construct prompt with context
      const prompt = `
        You are the DeFi EasySave Assistant, helping users understand and use the DeFi EasySave platform. 
        Current tab: ${activeTab}.
        Knowledge base: 
        DeFi EasySave is a decentralized savings platform on Ethereum Sepolia testnet. 
        - Features: Deposit mUSDC, mDAI, mUSDT with dynamic APY (5%, 4%, 3%), lock funds for +2% APY, set savings goals, join social pools, view analytics.
        - How to use: Connect MetaMask to Sepolia, deposit tokens, lock funds, set goals, contribute to pools, check balances in Dashboard/Analytics.
        - Max deposit: 1M tokens per user per token.
        - Interest: (balance * APY * time) / (365 days * 100), capped at 1 year. Locked funds get APY + 2%.
        - Social pools: Collective savings with a target amount and deadline.
        - Common issues: Ensure Sepolia network, sufficient ETH for gas, valid token addresses.
        - Contracts: SavingsPool (0x8a26E3a9a73968A9A0CdaB240b511510Ebec1ed2), mUSDC (0x5f688565FB0aFF417c32b7a46D1630dD7cBF50E2), mDAI (0x4FE7472392f2980a36c061522Aee0fB3b10aFf02), mUSDT (0x5b42a66fe05011F10D5d9961AD4ac1ad096b39C5), Mock Oracle (0xb9eA92f19138dD81488f2A09D85943F5E0a16950).
        Answer the following user query concisely and clearly, considering the active tab (${activeTab}):
        Query: ${input}
      `;

      // Call backend API
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/chatbot`, { prompt });
      const botResponse = response.data.response;
      setMessages([...messages, { sender: 'user', text: input }, { sender: 'bot', text: botResponse }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages([
        ...messages,
        { sender: 'user', text: input },
        { sender: 'bot', text: 'Sorry, I couldn’t process your request. Please try again!' },
      ]);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-orbitron">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-blue-600 to-pink-500 text-white py-3 px-6 rounded-lg shadow-lg hover:scale-105 transition-transform duration-200"
      >
        {isOpen ? 'Close Chat' : 'Chat with Assistant'}
      </button>
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] bg-gray-900/90 border border-green-400 rounded-lg shadow-xl flex flex-col mt-2">
          <div className="p-4 border-b border-blue-600">
            <h3 className="text-lg font-semibold text-green-400">DeFi EasySave Assistant</h3>
            <p className="text-sm text-gray-300">Ask about deposits, social pools, or anything else!</p>
          </div>
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white self-end'
                    : 'bg-green-400 text-gray-900 self-start'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form
            onSubmit={handleSendMessage}
            className="flex p-4 border-t border-blue-600"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1 p-2 bg-gray-800 text-gray-200 border border-blue-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-pink-500 text-white p-2 rounded-r-lg hover:scale-105 transition-transform duration-200"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;