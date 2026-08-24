import React, { useEffect, useState } from "react";
import {
  Coins,
  Hexagon,
  LogOut,
  Menu,
  MessageSquare,
  PanelLeftIcon,
  PenSquare,
  Plus,
  User,
  X,
} from "lucide-react";
import { getConversations } from "../features/getConversations";
import { useDispatch, useSelector } from "react-redux";
import {
  addConversation,
  setConversation,
  setSelectedConversation,
} from "../redux/conversationSlice";
import { createConversation } from "../features/createConversation";
import logOut from "../features/logOut";
import { setUserData } from "../redux/userSlice";
import BillingDrawer from "./BillingDrawer";

function SideBar() {
  const [collapsed, setCollapsed] = useState(false);
  const [imageError, setImageError] = useState(false);

  const dispatch = useDispatch();

  const { conversation, selectedConversation } = useSelector(
    (state) => state.conversation
  );

  const { userData } = useSelector((state) => state.user);
  const [showBilling, setShowBilling] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // On mobile the drawer always shows full labels, regardless of the
  // desktop "collapsed" preference — only desktop actually narrows.
  const showLabels = !collapsed || mobileOpen;

  useEffect(() => {
    const getConv = async () => {
      try {
        const data = await getConversations();
        dispatch(setConversation(data));
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
      }
    };

    getConv();
  }, [dispatch]);

  // Reset the broken-image fallback whenever the avatar URL itself changes,
  // otherwise a single failed load permanently hides the <img> for good.
  useEffect(() => {
    setImageError(false);
  }, [userData?.avatar]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleCreateConversation = async () => {
    try {
      const data = await createConversation();

      if (!data) {
        console.error("Failed to create new conversation");
        return;
      }

      dispatch(addConversation(data));
      dispatch(setSelectedConversation(data));
      setMobileOpen(false);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleSelectConversation = (conv) => {
    dispatch(setSelectedConversation(conv));
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logOut();
      dispatch(setUserData(null));
      setMobileOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getPlanName = (plan) => {
    if (!plan) return "Free";

    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  // Shared classes for any text/element that should fade & shrink away
  // instead of popping in/out when the sidebar collapses.
  const labelTransition =
    "transition-all duration-200 ease-out overflow-hidden";
  const labelState = showLabels
    ? "opacity-100 max-w-[200px]"
    : "opacity-0 max-w-0 pointer-events-none";

  return (
    <>
      {/* Mobile top bar trigger */}
      <button
        className={`lg:hidden fixed top-3.5 left-4 z-50 flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 text-slate-300 transition-all duration-200 cursor-pointer active:scale-95 ${
          mobileOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        style={{
          background: "linear-gradient(160deg, #14151F 0%, #0A0B12 100%)",
          boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
        }}
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu size={16} />
      </button>

      {/* Mobile backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`lg:hidden fixed inset-0 z-45 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 h-screen shrink-0 border-r border-white/[0.08] transition-all duration-300 ease-in-out overflow-hidden w-[280px] ${
          collapsed ? "lg:w-16" : "lg:w-[276px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{
          background:
            "radial-gradient(120% 100% at 0% 0%, #12131C 0%, #0A0B12 55%, #08090F 100%)",
          boxShadow: mobileOpen ? "8px 0 40px rgba(0,0,0,0.5)" : "none",
          transitionProperty: "width, transform, box-shadow",
        }}
      >
        {/* ambient top glow for depth */}
        <div
          className="pointer-events-none absolute -top-24 -left-16 w-64 h-64 rounded-full opacity-[0.15] blur-3xl"
          style={{
            background: "radial-gradient(circle, #8B7CFF 0%, transparent 70%)",
          }}
        />

        <div className="relative flex flex-col h-full">
          {/* Header */}
          <div
            className={`flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.07] transition-all duration-200 ease-out ${
              !showLabels ? "justify-center px-2" : ""
            }`}
          >
            {/* Desktop collapse toggle */}
            <button
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-200 bg-transparent border-none cursor-pointer shrink-0 hover:scale-105 active:scale-95"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label="Toggle sidebar width"
            >
              <PanelLeftIcon
                size={18}
                className="transition-transform duration-300 ease-out"
                style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            {/* Mobile close */}
            <button
              className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-all duration-200 bg-transparent border-none cursor-pointer shrink-0 active:scale-95"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>

            <div
              className="flex items-center justify-center w-7 h-7 rounded-[9px] shrink-0 transition-shadow duration-300 ring-1 ring-white/10"
              style={{
                background:
                  "linear-gradient(135deg, #9B8CFF 0%, #5B9CFF 50%, #4F8FFF 100%)",
                boxShadow:
                  "0 0 18px rgba(139,124,255,0.55), inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              <Hexagon
                size={14}
                className="text-white fill-white/25"
                strokeWidth={2.2}
              />
            </div>

            <span
              className={`text-[15.5px] font-semibold text-slate-100 tracking-tight flex-1 whitespace-nowrap ${labelTransition} ${labelState}`}
            >
              Nexus
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #A79BFF 0%, #6BA6FF 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                AI
              </span>
            </span>

            <span
              className={`text-[10px] font-medium text-slate-400 bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-full tracking-wide whitespace-nowrap hover:border-[#8B7CFF]/40 hover:text-slate-300 ${labelTransition} ${labelState} ${
                showLabels ? "" : "!px-0 !border-0"
              }`}
            >
              {getPlanName(userData?.plan)}
            </span>

            <button
              className={`flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 hover:text-[#B4A9FF] hover:bg-white/[0.06] transition-all duration-200 bg-transparent border-none cursor-pointer hover:scale-105 active:scale-95 ${labelState}`}
              onClick={handleCreateConversation}
              aria-label="New chat"
            >
              <PenSquare size={16} />
            </button>
          </div>

          {/* New Chat */}
          <div
            className={`px-4 pt-4 pb-1 transition-all duration-200 ease-out ${
              !showLabels ? "px-2" : ""
            }`}
          >
            <button
              className={`group relative w-full flex items-center justify-center gap-2 text-sm font-semibold text-white rounded-xl py-[10px] border-none cursor-pointer overflow-hidden transition-all duration-200 ease-out hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98] ${
                !showLabels ? "px-0" : ""
              }`}
              style={{
                background:
                  "linear-gradient(135deg, #9B8CFF 0%, #6B9EFF 55%, #4F8FFF 100%)",
                boxShadow:
                  "0 4px 16px rgba(79,143,255,0.32), inset 0 1px 0 rgba(255,255,255,0.2)",
                transitionProperty:
                  "box-shadow, transform, padding",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 8px 26px rgba(139,124,255,0.5), inset 0 1px 0 rgba(255,255,255,0.28)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 4px 16px rgba(79,143,255,0.32), inset 0 1px 0 rgba(255,255,255,0.2)";
              }}
              onClick={handleCreateConversation}
              title={!showLabels ? "New Chat" : ""}
            >
              {/* subtle sheen sweep on hover */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent" />

              <Plus size={15} className="relative shrink-0" />

              <span
                className={`relative whitespace-nowrap ${labelTransition} ${labelState}`}
              >
                New Chat
              </span>
            </button>
          </div>

          {/* Conversation Heading */}
          <div
            className={`px-5 pt-4 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-slate-600 whitespace-nowrap ${labelTransition} ${labelState}`}
          >
            {conversation.length === 0
              ? "No Recent Conversations"
              : "Recent Conversations"}
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-2.5">
            {conversation.map((conv) => {
              const isActive = selectedConversation?._id === conv?._id;

              return (
                <div
                  key={conv?._id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`
                    group relative flex items-center gap-2.5 cursor-pointer mb-0.5
                    rounded-[10px] border transition-all duration-200 ease-out
                    ${!showLabels ? "justify-center px-2 py-2.5" : "pl-3.5 pr-3 py-2.5"}
                    ${
                      isActive
                        ? "border-white/[0.1]"
                        : "bg-transparent border-transparent hover:bg-white/[0.045] hover:border-white/[0.07] hover:translate-x-[2px]"
                    }
                  `}
                  style={
                    isActive
                      ? {
                          background:
                            "linear-gradient(90deg, rgba(155,140,255,0.16) 0%, rgba(79,143,255,0.06) 100%)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                        }
                      : undefined
                  }
                  title={!showLabels ? conv?.title || "New Chat" : ""}
                >
                  {/* Active connector */}
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full transition-all duration-200 ease-out ${
                      isActive ? "h-[60%] opacity-100" : "h-0 opacity-0"
                    }`}
                    style={{
                      background: "linear-gradient(180deg, #9B8CFF, #4F8FFF)",
                      boxShadow: isActive
                        ? "0 0 8px rgba(139,124,255,0.7)"
                        : "none",
                    }}
                  />

                  <div
                    className={`
                      flex items-center justify-center shrink-0 w-[28px] h-[28px]
                      rounded-lg transition-all duration-200
                      ${
                        isActive
                          ? "bg-gradient-to-br from-[#9B8CFF]/30 to-[#4F8FFF]/30 text-[#C1B7FF] ring-1 ring-white/10"
                          : "bg-white/[0.05] text-slate-500 group-hover:text-slate-300"
                      }
                    `}
                  >
                    <MessageSquare size={13} />
                  </div>

                  <span
                    className={`
                      text-[13px] font-medium truncate whitespace-nowrap
                      ${labelTransition} ${labelState}
                      ${isActive ? "text-slate-100" : "text-slate-400"}
                    `}
                  >
                    {conv?.title || "New Chat"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="mx-2.5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* User Profile */}
          <div
            className={`py-3.5 px-3.5 transition-all duration-200 ease-out ${
              !showLabels ? "px-2" : ""
            }`}
          >
            {userData ? (
              <div
                className={`flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2.5 border border-transparent hover:bg-white/[0.05] hover:border-white/[0.07] transition-all duration-200 ${
                  !showLabels ? "justify-center px-0" : ""
                }`}
              >
                <div className="relative shrink-0 group">
                  {userData?.avatar && !imageError ? (
                    <img
                      className="w-10 h-10 rounded-[10px] object-cover border-2 border-white/15 transition-transform duration-200 ease-out"
                      src={userData.avatar}
                      alt="User avatar"
                      referrerPolicy="no-referrer"
                      onLoad={() => {
                        setImageError(false);
                      }}
                      onError={(e) => {
                        setImageError(true);
                      }}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-[10px] flex items-center justify-center border border-white/10 transition-all duration-200 group-hover:border-[#9B8CFF]/50"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(155,140,255,0.35) 0%, rgba(79,143,255,0.35) 100%)",
                      }}
                    >
                      <User size={15} className="text-[#C1B7FF]" />
                    </div>
                  )}

                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0A0B12] shadow-[0_0_6px_rgba(52,211,153,0.7)] transition-transform duration-200" />
                </div>

                <div
                  className={`flex-1 min-w-0 ${labelTransition} ${labelState}`}
                >
                  <p className="text-[13.5px] font-semibold text-slate-100 truncate">
                    {userData?.username || "User"}
                  </p>

                  <p className="text-[11px] text-slate-500 mt-px whitespace-nowrap">
                    {getPlanName(userData?.plan)} Plan
                  </p>
                </div>

                <div
                  className={`flex gap-1 ${labelTransition} ${labelState}`}
                >
                  <button
                    onClick={() => setShowBilling(true)}
                    type="button"
                    className="flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-amber-500/80 cursor-pointer hover:bg-amber-400/10 hover:text-amber-400 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <Coins size={16} />
                  </button>

                  <button
                    type="button"
                    className="flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-slate-500 cursor-pointer hover:bg-rose-400/10 hover:text-rose-400 transition-all duration-200 hover:scale-105 active:scale-95"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="flex items-center justify-center gap-2 text-sm w-full font-semibold rounded-xl py-[11px] cursor-pointer transition-all duration-200 text-slate-100 border border-white/10 hover:border-[#9B8CFF]/40 hover:-translate-y-[1px] active:translate-y-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(155,140,255,0.14) 0%, rgba(79,143,255,0.1) 100%)",
                  transitionProperty: "background, box-shadow, transform",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, rgba(155,140,255,0.24) 0%, rgba(79,143,255,0.18) 100%)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 18px rgba(139,124,255,0.28)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(135deg, rgba(155,140,255,0.14) 0%, rgba(79,143,255,0.1) 100%)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {showLabels ? (
                  <span className={`${labelTransition} ${labelState}`}>
                    Login
                  </span>
                ) : (
                  <User size={17} />
                )}
              </button>
            )}
          </div>
        </div>

        <BillingDrawer open={showBilling} onClose={() => setShowBilling(false)} />
      </div>

      <style>{`
        @keyframes nexusFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default SideBar;