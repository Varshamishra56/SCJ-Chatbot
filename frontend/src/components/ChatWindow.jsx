import React, { useState, useRef, useLayoutEffect, useEffect } from "react";
import axios from "axios";
import ChatBubble from "./ChatBubble";
import { AnimatePresence, motion } from "framer-motion";
import { FaRegQuestionCircle } from "react-icons/fa";

const ChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const chatRef = useRef(null);

	useEffect(() => {
		setMessages([{ sender: 'bot', text: '👋 Hey there! Need help with something? I’m all ears!' }]);
	}, []);


	// Scroll to bottom on update
	useLayoutEffect(() => {
		if (chatRef.current) {
			chatRef.current.scrollTo({
				top: chatRef.current.scrollHeight,
				behavior: 'smooth',
			});
		}
	}, [messages, suggestions, isLoading]);

	const handleSuggestionClick = (faq) => {
		setSuggestions([]);
		const userSelection = { sender: 'user', text: faq.Question };
		const botReply = { sender: 'bot', text: faq.Answer };
		setMessages((prev) => [...prev, userSelection, botReply]);
	};


  // 👋 Show welcome message when chat opens
  useEffect(() => {
    const welcomeMessage = {
      sender: "bot",
      text: "👋 Hi there! How can I assist you today?",
    };
    setMessages([welcomeMessage]);
  }, []);

  // Handle FAQ suggestion click
  const handleSuggestionClick = (faq) => {
    setSuggestions([]);
    const userSelection = { sender: "user", text: faq.Question };
    const botReply = { sender: "bot", text: faq.Answer };
    setMessages((prev) => [...prev, userSelection, botReply]);
  };

  // Send message to backend
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/ask", {
        query: userMsg.text,
      });
      const data = res.data;

      const onlyFallback =
        Array.isArray(data) &&
        data.length === 1 &&
        data[0].Answer?.toLowerCase().includes("no relevant answer");

			{/* Chat body */}
			<div ref={chatRef} className="flex-1 p-2 overflow-y-auto space-y-2">
				{/* Messages */}
				{messages.map((msg, idx) => (
					<motion.div
						key={`msg-${idx}`}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.25 }}
					>
						<ChatBubble sender={msg.sender} text={msg.text} />
					</motion.div>
				))}

				{/* Suggestions */}
				{suggestions.length > 0 && (
					<motion.div
						key="suggestions-block"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.25 }}
						className="space-y-1"
					>
						<ChatBubble sender="bot" text="Did you mean one of these?" />
						{suggestions.map((item, idx) => (
							<div
								key={`suggestion-${idx}`}
								onClick={() => handleSuggestionClick(item)}
								className="cursor-pointer bg-white hover:bg-blue-50 border border-blue-300 text-sm px-4 py-2 rounded-lg shadow transition-all duration-200 hover:scale-[1.02]"
							>
								<div className="flex items-start gap-2">
									<FaRegQuestionCircle className="text-blue-500 shrink-0 mt-1" size={16} />
									<span className="text-sm">{item.Question}</span>
								</div>
							</div>

						))}
					</motion.div>
				)}
			</div>


        {/* Suggestions */}
        {suggestions.length > 0 && (
          <motion.div
            key="suggestions-block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="space-y-1"
          >
            <ChatBubble sender="bot" text="Did you mean one of these?" />
            {suggestions.map((item, idx) => (
              <div
                key={`suggestion-${idx}`}
                onClick={() => handleSuggestionClick(item)}
                className="cursor-pointer bg-white hover:bg-blue-50 border border-blue-300 text-sm px-4 py-2 rounded-lg shadow transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="flex items-start gap-2">
                  <FaRegQuestionCircle
                    className="text-blue-500 shrink-0 mt-1"
                    size={16}
                  />
                  <span className="text-sm">{item.Question}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Input box */}
      <div className="p-2 border-t flex gap-2">
        <input
          className="flex-1 border rounded p-1 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask your question..."
          disabled={suggestions.length > 0}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
          disabled={suggestions.length > 0}
        >
          Send
        </button>
      </div>
    </motion.div>
  );
};

export default ChatWindow;
