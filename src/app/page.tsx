"use client";

import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import DOMPurify from "dompurify";
import MenuIcon from "@mui/icons-material/Menu";

type Message = {
  role: "assistant" | "user";
  content: string;
};

// Define the type for the function that updates messages
interface SetMessages {
  (messages: (prevMessages: Message[]) => Message[]): void;
}

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

  // Function to scroll to the bototm of the messages container
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Use effect to scroll to bottom whenver messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return; // Don't send empty messages
    setIsLoading(true);
    setMessage(""); // Clear input field
    // Add the user's message and a placeholder for the assistant's response
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    try {
// Send the message to the server
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
        return processText(next); // Continue reading the next chunk of the response
      };
      await reader.read().then(processText);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          content:
            "I'm sorry, but I encountered an error. Please try again later.",
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
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            BatteryBrain Virtual Assistant
          </Typography>
        </Toolbar>
      </AppBar>
      <Stack
        direction={"column"}
        width="500px"
        height="700px"
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
              <Box
                bgcolor={
                  message.role === "assistant"
                    ? "primary.main"
                    : "grey.500"
                }
                color="white"
                borderRadius={2}
                p={2}
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
          />
          <Button
            variant="contained"
            onClick={() => sendMessage(message)}
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
