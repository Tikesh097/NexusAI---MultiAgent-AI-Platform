import { useEffect, useRef } from 'react'
import { Hexagon } from 'lucide-react'
import { useSelector } from 'react-redux'
import MessageBubble from './MessageBubble'
import LoadingAnimation from './LoadingAnimation'

function MessageList() {

  const { selectedConversation } = useSelector(state => state.conversation)
  const { messages, isLoading, loadingAgent} = useSelector(state => state.message)
  const bottomRef=useRef(null)

  useEffect(()=>{
   requestAnimationFrame(()=>{
    bottomRef?.current?.scrollIntoView({
      behavior:"smooth",
      block:"end"
    })
   })
  },[messages?.length,isLoading])

  return (
    <div className='min-h-0 flex-1 overflow-y-auto bg-transparent px-3 py-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
      {messages.length == 0 || !selectedConversation ? (
        <div className='h-full flex flex-col items-center justify-center gap-4 text-center'>

          <div
            className='relative flex items-center justify-center w-11 h-11 rounded-[12px] mb-1 transition-shadow duration-500 ring-1 ring-white/10'
            style={{
              background: 'linear-gradient(135deg, #9B8CFF 0%, #6B9EFF 55%, #4F8FFF 100%)',
              boxShadow: '0 0 24px rgba(139,124,255,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
              animation: 'nexus-pulse 3.5s ease-in-out infinite',
            }}
          >
            <Hexagon size={20} className='text-white fill-white/20' strokeWidth={2.2} />
          </div>

          <div className='flex flex-col gap-1.5'>
            <h1 className='text-[20px] font-semibold text-slate-100 tracking-tight'>
              Nexus
              <span
                style={{
                  background: 'linear-gradient(135deg, #A79BFF 0%, #6BA6FF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                AI
              </span>
            </h1>
            <p className='text-[15px] font-semibold text-slate-400 tracking-tight'>How can I help you?</p>
            <p className='text-[13px] text-slate-600 max-w-[260px] leading-relaxed'>
              Ask me anything — code, ideas, explanations, or just a quick question.
            </p>
          </div>

          <div className='flex flex-wrap justify-center gap-2 mt-1'>
            {["Write a Netflix clone", "Explain Redis", "Build a dashboard"].map((s) => (
              <button
                key={s}
                className='text-[12px] text-slate-400 bg-white/[0.05] border border-white/10 px-3.5 py-1.5 rounded-lg hover:bg-white/[0.09] hover:text-slate-100 hover:border-[#9B8CFF]/40 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.97] transition-all duration-200 ease-out cursor-pointer'
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(139,124,255,0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <style>{`
            @keyframes nexus-pulse {
              0%, 100% { box-shadow: 0 0 24px rgba(139,124,255,0.45), inset 0 1px 0 rgba(255,255,255,0.25); }
              50% { box-shadow: 0 0 34px rgba(139,124,255,0.7), inset 0 1px 0 rgba(255,255,255,0.3); }
            }
          `}</style>

        </div>
      ) :
        <div className='space-y-5'>
          {messages.map((msg, i) => (
            <div key={msg._id || i} className='animate-[fadeInUp_0.3s_ease-out]'>
              <MessageBubble role={msg.role} content={msg.content} images={msg.images || []} />
            </div>
          ))}
            {isLoading &&  <LoadingAnimation agent={loadingAgent} /> }
            

          <style>{`
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      }
      <div ref={bottomRef}/>
    </div>
  )
}

export default MessageList