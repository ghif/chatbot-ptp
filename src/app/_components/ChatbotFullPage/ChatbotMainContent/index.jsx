"use client";

import { useEffect, useState, useRef, useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./style.module.css";
import { PiPaperPlaneRightFill } from "react-icons/pi";
import Markdown from "react-markdown";
import { MessageHistoryContext } from "@/contexts/MessageHistory";

export default function ChatbotMainContent(props) {
  const messageHistoryCtx = useContext(MessageHistoryContext);
  const [userMessage, setUserMessage] = useState("");

  const chatInputRef = useRef(null);
  const chatBoxRef = useRef(null);

  const handleUserMessage = (event) => {
    const chatInput = chatInputRef.current;
    const chatBox = chatBoxRef.current;
    if (!chatInput || !chatBox) return;

    setUserMessage(event.target.value);
  };

  const handleSendMessage = async () => {
    const chatInput = chatInputRef.current;
    const chatBox = chatBoxRef.current;
    if (!chatInput || !chatBox) return;

    const message = userMessage.trim();
    if (!message) return;

    setUserMessage("");

    messageHistoryCtx.insert({
      type: "outgoing",
      value: message,
    });
    chatBox.scrollTo(0, chatBox.scrollHeight);

    messageHistoryCtx.insert({
      type: "incoming",
      value: "",
      sourceDocuments: [],
    });

    try {
      const response = await fetch("/chatbot/api/chatbot", {
        method: "POST",
        body: JSON.stringify({
          modelType: props.modelType,
          prompt: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = "";

      while (true) {
        const { value, done } = await reader.read();
      
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                messageHistoryCtx.replace({
                  type: "incoming",
                  value: "An error occurred while generating the response.",
                  sourceDocuments: [],
                  modelType: data.modelType
                });
                break;
              }

              if (data.done) {
                messageHistoryCtx.replace({
                  type: "incoming",
                  value: accumulatedResponse,
                  sourceDocuments: data.sourceDocuments || [],
                  modelType: data.modelType
                });
                break;
              }

              if (data.text) {
                accumulatedResponse += data.text;
                messageHistoryCtx.replace({
                  type: "incoming",
                  value: accumulatedResponse,
                  sourceDocuments: [],
                  modelType: data.modelType
                });
              }
            } catch (e) {
              console.error("Error parsing SSE data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      messageHistoryCtx.replace({
        type: "incoming",
        value: "An error occurred while generating the response.",
        sourceDocuments: [],
      });
    }
  };

  return (
    <div className="col-span-12 bg-[#FFFFFF] p-4 md:col-span-9 md:p-12">
      <div className="w-full">
        <ul ref={chatBoxRef} className={styles["chatbox"]}>
          <li className={`${styles["chat"]} ${styles["incoming"]}`}>
            <span>
              <Image
                src="/chatbot/assets/images/mascot.png"
                alt=""
                width={50}
                height={50}
              />
            </span>
            <div className={styles["chat-bubble"]}>
              <p>
                Selamat datang di Chatbot PTP, silahkan tanya seputar PTP 👋
              </p>
            </div>
          </li>
          {messageHistoryCtx.message.map((message, index) => (
            <li
              key={index}
              className={`${styles["chat"]} ${styles[message.type]}`}
            >
              {message.type === "incoming" && (
                <span>
                  <Image
                    src="/chatbot/assets/images/mascot.png"
                    alt=""
                    width={100}
                    height={100}
                  />
                </span>
              )}
              <div className={styles["chat-bubble"]}>
                <Markdown>{message.value}</Markdown>
                {message?.sourceDocuments &&
                  message?.sourceDocuments.length > 0 && (
                    <>
                      <strong>Sumber:</strong>
                      <ul className={styles["source-documents"]}>
                        {message.sourceDocuments.map((doc, docIndex) => (
                          <li key={docIndex}>
                            {message.modelType === "peraturan" ? (
                              <Link
                                href={`/assets/documents/pdf/${message.modelType}/${doc}`}
                                target="_blank"
                              >
                                {doc}
                              </Link>
                            ) : (
                              <span>{doc}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center justify-between border-t border-gray-300 drop-shadow-lg">
        <textarea
          ref={chatInputRef}
          placeholder="Masukan pesan di sini..."
          spellCheck="false"
          value={userMessage}
          onChange={handleUserMessage}
          onKeyDown={(e) => {
            // "Enter": send message
            // "Shift + Enter": new line
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
          }}}
          required
          className="h-16 w-full resize-none pl-2 pt-1 outline-none"
        ></textarea>
        <span
          className="flex h-16 w-16 cursor-pointer items-center justify-center bg-blue-900 text-white hover:bg-blue-800"
          onClick={handleSendMessage}
        >
          <PiPaperPlaneRightFill />
        </span>
      </div>
      <p className="mt-3 text-center">
        Chatbot dapat membuat kesalahan. Periksa kembali informasi penting.
      </p>
    </div>
  );
}
