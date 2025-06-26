import React, { useState } from "react";
import { FaCommentDots } from "react-icons/fa";
import ChatWindow from "./ChatWindow";
import { AnimatePresence } from "framer-motion";

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  const openChat = () => {
    // Only send welcome if it's the first time
    if (!isOpen) {
      setMessages([
        {
          sender: "bot",
          text: "👋 Hey there! Need help with something? I’m all ears!",
        },
      ]);
    }
    setIsOpen(true);
  };

  return (
    <>
      {/* Floating bubble icon */}
      <div
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg cursor-pointer z-50"
        onClick={openChat}
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
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
