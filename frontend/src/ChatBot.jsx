import React, { useState } from "react";
import "./ChatBot.css";

const ChatBot = () => {
  const [showChat, setShowChat] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([
    { text: "Hello! How can I assist you today?", type: "received" },
    { text: "Looking for an answer? Ask me about it", type: "received" },
  ]);

  const toggleChat = () => setShowChat((prev) => !prev);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const currentMessage = userInput;
    setMessages((prev) => [...prev, { text: currentMessage, type: "sent" }]);
    setUserInput("");

    try {
      const res = await fetch("http://127.0.0.1:5000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: currentMessage }),
      });

      const data = await res.json();

      if (res.ok && data?.Answer) {
        setMessages((prev) => [
          ...prev,
          { text: data.Answer, type: "received" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: "Sorry, no answer found.", type: "received" },
        ]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setMessages((prev) => [
        ...prev,
        { text: "Error contacting bot.", type: "received" },
      ]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div>
      {!showChat && (
        <div className="chat-bubble-icon" onClick={toggleChat}>
          💬
        </div>
      )}
      {showChat && (
        <div className="chat-container">
          <div className="chat-header">
            <span className="close-btn" onClick={toggleChat}>
              ×
            </span>
            FUOYE ChatBot
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.type}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Ask me something..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
