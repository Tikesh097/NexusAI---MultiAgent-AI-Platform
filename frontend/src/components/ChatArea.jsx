import React, { useEffect } from "react";
import Nav from "./Nav";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { useDispatch, useSelector } from "react-redux";
import { getMessages } from "../features/getMessages";
import { setArtifacts, setMessages } from "../redux/messageSlice";

const ChatArea = () => {
  const { selectedConversation } = useSelector(
    (state) => state.conversation
  );

  const dispatch = useDispatch();

  useEffect(() => {
    const getMesg = async () => {
      // No conversation selected
      if (!selectedConversation?._id) {
        dispatch(setMessages([]));
        dispatch(setArtifacts([]));
        return;
      }

      try {
        // New Chat = fresh empty conversation
        if (selectedConversation.title === "New Chat") {
          dispatch(setMessages([]));
          dispatch(setArtifacts([]));
          return;
        }

        // Fetch messages for selected conversation
        const data = await getMessages(selectedConversation._id);

        const messages = Array.isArray(data) ? data : [];

        dispatch(setMessages(messages));

        // Find latest message containing artifacts
        const latestArtifactsMessage = [...messages]
          .reverse()
          .find(
            (msg) => Array.isArray(msg?.artifacts) && msg.artifacts.length > 0
          );

        dispatch(setArtifacts(latestArtifactsMessage?.artifacts || []));
      } catch (error) {
        console.error("❌ Failed to load conversation:", error);

        dispatch(setMessages([]));
        dispatch(setArtifacts([]));
      }
    };

    getMesg();
  }, [selectedConversation?._id, selectedConversation?.title, dispatch]);

  return (
    <div
      className="relative flex h-full flex-1 flex-col min-w-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(140% 100% at 100% 0%, #12131C 0%, #0A0B12 55%, #08090F 100%)",
      }}
    >
      {/* Ambient top-right glow */}
      <div
        className="pointer-events-none absolute -top-32 right-0 w-[420px] h-[420px] rounded-full opacity-[0.10] blur-3xl"
        style={{
          background: "radial-gradient(circle, #4F8FFF 0%, transparent 70%)",
        }}
      />

      {/* Ambient bottom glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 w-[360px] h-[360px] rounded-full opacity-[0.07] blur-3xl"
        style={{
          background: "radial-gradient(circle, #9B8CFF 0%, transparent 70%)",
        }}
      />

      <div className="relative flex h-full flex-col min-w-0">
        <Nav />

        {/*
          Safe-area padding for the fixed mobile hamburger button
          (top-3.5 left-4, ~36px tall). Nav only renders once a
          conversation is selected, so without one the button would
          otherwise sit directly on top of the empty-state content.
        */}
        <div
          className={`flex-1 min-h-0 flex flex-col ${
            selectedConversation ? "" : "pt-14 lg:pt-0"
          }`}
        >
          <MessageList />
        </div>

        {/*
          Input dock: full-bleed on mobile so the composer genuinely
          spans the screen width edge to edge (minus a small safe
          margin), then settles into a comfortable centered reading
          width on larger viewports instead of stretching edge to edge.
        */}
        <div className="w-full px-3 pb-3 pt-2 sm:px-6 sm:pb-5 sm:pt-2">
          <div className="w-full max-w-3xl mx-auto">
            <ChatInput />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;