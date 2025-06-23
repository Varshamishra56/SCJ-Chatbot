import React, { useState } from "react";

const ChatBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! How can I assist you today?", type: "received" },
    { text: "Looking for an answer? Ask me about it", type: "received" },
  ]);
  const [input, setInput] = useState("");

  const toggleChat = () => setIsOpen(!isOpen);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { text: input, type: "sent" }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch("http://127.0.0.1:5000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0 && data[0].Answer) {
        // Show only the best matched answer
        setMessages((prev) => [
          ...prev,
          { text: data[0].Answer, type: "received" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { text: "Sorry, no answer found.", type: "received" },
        ]);
      }
    } catch (err) {
      console.error(err);
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
    <>
      <div className={`chat-container ${isOpen ? "open" : ""}`}>
        <div className="chat-header">
          <span>SCJ ChatBot</span>
          <button className="close-btn" onClick={toggleChat}>
            ×
          </button>
        </div>
        <div className="chat-body">
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.type}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Ask me something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      </div>

      <button className="chat-toggle" onClick={toggleChat}>
        💬
      </button>
    </>
  );
};

export default ChatBubble;
