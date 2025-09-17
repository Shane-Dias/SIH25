import Footer from "@/components/Footer";
import React, { useState, useEffect, useRef } from "react";
import PageTransition from "@/components/PageTransition";

const Chatbot = () => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [micClick, setMicClick] = useState(false);
  const chatContainerRef = useRef(null);
  const API_HOST = import.meta.env.VITE_API_HOST;
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() === "") return;
    setMessages([...messages, { text: input, sender: "user" }]);
    setInput("");
  };

  const handleVoiceInput = () => {
    const recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();

    setMicClick(!micClick);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Voice recognition error:", event.error);
    };

    recognition.onend = () => {
      console.log("Voice recognition ended.");
    };
  };

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    const newUserMessage = `User: ${userInput}`;
    setChatHistory((prev) => [...prev, newUserMessage]);
    setUserInput("");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/chat-t/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_input: userInput,
          chat_history: chatHistory,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const botMessage = `Saathi AI: ${data.bot_response}`;
        setChatHistory((prev) => [...prev, botMessage]);
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Request failed:", error);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      sendMessage();
    }
  };

  return (
    <PageTransition>
      <>
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-950 to-black">
          <div className="container mx-auto px-1 lg:py-12">
            {/* Header Section */}
            <div className="text-center mb-8 lg:mb-10">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-4 drop-shadow-[0_0_10px_cyan]">
                🔵 Saathi AI
              </h1>
              <p className="text-sm sm:text-lg text-gray-400 max-w-2xl mx-auto px-2">
                Get real-time guidance, emotional support, and safety tips. Ask
                questions, seek help, or learn about your legal rights.
              </p>
            </div>

            {/* Chatbot Container */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 lg:p-8 border border-cyan-500 shadow-[0_0_10px_cyan]">
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent text-center mb-6">
                  💬 Chat with Saathi AI
                </h2>

                {/* Chat Display */}
                <div
                  ref={chatContainerRef}
                  className="h-64 sm:h-80 lg:h-96 overflow-y-auto rounded-xl p-3 sm:p-4 bg-slate-800 border border-slate-700 mb-6 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
                >
                  {chatHistory.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400 text-center italic text-sm sm:text-base">
                        Start a conversation...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {chatHistory.map((message, index) => {
                        const formattedMessage = message
                          .replace("User:", "")
                          .replace("Saathi AI:", "");
                        const parts = formattedMessage
                          .split(/(\*\*.*?\*\*|\*.*?\*)/g)
                          .filter(Boolean);

                        return (
                          <div
                            key={index}
                            className={`flex ${
                              message.startsWith("User:")
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[85%] sm:max-w-[80%] lg:max-w-[75%] p-3 sm:p-4 text-sm sm:text-base break-words rounded-xl ${
                                message.startsWith("User:")
                                  ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-br-sm"
                                  : "bg-gradient-to-r from-slate-700 to-slate-600 text-white rounded-bl-sm"
                              }`}
                            >
                              {parts.map((part, partIndex) => {
                                const isDoubleAsterisk =
                                  part.startsWith("**") && part.endsWith("**");
                                const isSingleAsterisk =
                                  part.startsWith("*") && part.endsWith("*");

                                if (isDoubleAsterisk) {
                                  return (
                                    <h2
                                      key={partIndex}
                                      className="text-base sm:text-lg font-bold mb-2 border-b border-white/20 pb-1"
                                    >
                                      {part.replace(/\*\*/g, "")}
                                    </h2>
                                  );
                                } else if (isSingleAsterisk) {
                                  return (
                                    <h3
                                      key={partIndex}
                                      className="text-sm sm:text-base font-extrabold mb-1"
                                    >
                                      {part.replace(/\*/g, "")}
                                    </h3>
                                  );
                                } else {
                                  return (
                                    <span
                                      key={partIndex}
                                      className="inline-block mb-1"
                                    >
                                      {part}
                                    </span>
                                  );
                                }
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Loading Animation */}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="max-w-[75%] p-4 bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl rounded-bl-sm">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce"></div>
                            <div
                              className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="h-2 w-2 bg-cyan-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                          <span className="text-gray-300 text-sm">
                            Saathi AI is thinking...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Section */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type your message..."
                      className="flex-1 bg-slate-800 text-gray-100 px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all duration-200 text-sm sm:text-base placeholder-gray-400"
                      disabled={loading}
                    />

                    {/* Voice Input Button */}
                    <button
                      onClick={handleVoiceInput}
                      className={`px-3 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center min-w-[44px] ${
                        micClick
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-slate-700 hover:bg-slate-600 text-gray-300"
                      }`}
                      disabled={loading}
                    >
                      <span className="text-lg">🎤</span>
                    </button>
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={sendMessage}
                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base whitespace-nowrap ${
                      loading
                        ? "bg-slate-700 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-cyan-500/20"
                    }`}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="hidden sm:inline">Sending...</span>
                      </div>
                    ) : (
                      "Send"
                    )}
                  </button>
                </div>
              </div>
              {/* Disclaimer */}
              <div className="mt-6 mx-auto max-w-2xl p-4 rounded-xl bg-slate-900/50 border border-blue-500/30">
                <p className="text-blue-200 text-sm sm:text-base">
                  ⚠️ <strong>Disclaimer:</strong> Saathi AI offers general legal
                  and safety information, but it is <strong>not</strong> a
                  substitute for professional legal counsel. Please consult a
                  licensed attorney for legal advice.
                </p>
              </div>
            </div>

            {/* Tips Section */}
            <div className="max-w-4xl mx-auto mt-8">
              <div className="bg-slate-900/50 rounded-2xl p-4 sm:p-6 border border-slate-700">
                <h4 className="text-lg font-semibold text-white mb-3 text-center sm:text-left">
                  💡 Chat Tips
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-400 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>Ask about legal rights and safety measures</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>Use voice input for hands-free interaction</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>Get emotional support and guidance</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1">•</span>
                    <span>Press Enter to send messages quickly</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    </PageTransition>
  );
};

export default Chatbot;
