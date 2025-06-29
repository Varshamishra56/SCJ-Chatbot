import React, { useState } from "react";
import { FaCommentDots } from "react-icons/fa";
import ChatWindow from "./ChatWindow";
import { AnimatePresence } from "framer-motion";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Persist messages and suggestions between opens
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi there! How can I help you today?" },
  ]);
  const [suggestions, setSuggestions] = useState([]);

  return (
    <>
      {/* Floating bubble icon */}
      <div
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg cursor-pointer z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaCommentDots />
      </div>

      {/* AnimatePresence wraps conditional render */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <ChatWindow
            key="chat"
            onClose={() => setIsOpen(false)}
            messages={messages}
            setMessages={setMessages}
            suggestions={suggestions}
            setSuggestions={setSuggestions}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
