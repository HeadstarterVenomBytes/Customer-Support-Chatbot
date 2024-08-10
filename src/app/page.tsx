"use client";

import {
  Box,
  Stack,
  TextField,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Button,
} from "@mui/material";
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import DOMPurify from "isomorphic-dompurify";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SyncIcon from "@mui/icons-material/Sync";
import ThemeProviderWrapper from './ThemeProviderWrapper';

type Message = {
  role: "assistant" | "user";
  content: string;
};

// Define the type for the function that updates messages

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm the Battery Brain support assistant. How can I help you today?",
    },
  ]);

  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Create a ref for the end of the messages container
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  // Function to scroll to the bottom of the messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Use effect to scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;
    setIsLoading(true);
    setMessage(""); // Clear input field
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: message },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([...messages, { role: "user", content: message }]),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Failed to get response reader");
      }

      let result = "";

      // Process the text from the response
      const processText = async ({
        done,
        value,
      }: ReadableStreamReadResult<Uint8Array>): Promise<string> => {
        if (done) {
          return result;
        }

        const text = decoder.decode(value || new Uint8Array(), {
          stream: true,
        });
        result += text;

        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1]; // Get the last message (assistant's placeholder)
          const otherMessages = prevMessages.slice(0, -1); // Get all other messages
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + text }, // Append the decoded text to the assistant's message
          ];
        });

        const next = await reader.read();
        return processText(next);
      };
      await reader.read().then(processText);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content: "I'm sorry, but I encountered an error. Please try again later.",
        },
      ]);
    }
    setIsLoading(false);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(message);
    }
  };

  const sanitizeMarkdown = (markdown: string) => {
    return DOMPurify.sanitize(markdown);
  };

  return (
    <ThemeProviderWrapper>
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        bgcolor="background.default"
      >
        <AppBar position="static" sx={{ bgcolor: "background.default", margin: 0, padding: 0 }}>
          <Toolbar sx={{ justifyContent: "center", padding: 0 }}>
            <Typography
              variant="h4"
              component="div"
              sx={{
                flexGrow: 1,
                color: "primary.main",
                textAlign: "center",
                textShadow: "2px 2px 8px rgba(184, 134, 11, 0.7)",
                fontWeight: "bold",
              }}
            >
              BatteryBrain Virtual Assistant
            </Typography>
          </Toolbar>
        </AppBar>
        <Stack
          direction={"column"}
          width="90%"
          maxWidth="600px"
          height="80vh"
          border="1px solid"
          borderColor="primary.main"
          p={2}
          spacing={3}
          mt={2}
          bgcolor="background.paper"
          boxShadow={3}
          borderRadius={2}
        >
          <Stack
            direction={"column"}
            spacing={2}
            flexGrow={1}
            overflow="auto"
            maxHeight="100%"
          >
            {messages.map((message, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent={
                  message.role === "assistant" ? "flex-start" : "flex-end"
                }
              >
                {message.role === "assistant" && (
                  <SmartToyIcon
                    sx={{ color: "primary.main", fontSize: 40, marginRight: 2 }}
                  />
                )}
                <Box
                  sx={{
                    bgcolor: message.role === "assistant" ? "primary.main" : "#555555",
                    color: "text.primary",
                    borderRadius: 3,
                    padding: "12px 16px",
                    maxWidth: "75%",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                    backgroundImage: message.role === "assistant"
                      ? "linear-gradient(135deg, #B8860B 0%, #FFD700 100%)"
                      : "linear-gradient(135deg, #555555 0%, #666666 100%)",
                    fontSize: "16px",
                    lineHeight: "1.6",
                  }}
                >
                  <ReactMarkdown>
                    {sanitizeMarkdown(message.content)}
                  </ReactMarkdown>
                </Box>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Message"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              InputProps={{
                sx: {
                  bgcolor: "text.primary",
                  color: "text.secondary",
                  borderRadius: "5px",
                },
              }}
              InputLabelProps={{
                sx: {
                  color: "text.primary",
                },
              }}
            />
            <IconButton
              color="primary"
              onClick={() => sendMessage(message)}
              disabled={isLoading}
              sx={{ 
                bgcolor: "primary.main", 
                color: "black", 
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "scale(1.1)",
                },
              }} 
            >
              {isLoading ? <SyncIcon /> : <SendIcon />}
            </IconButton>
          </Stack>
        </Stack>
      </Box>
    </ThemeProviderWrapper>
  );
}
