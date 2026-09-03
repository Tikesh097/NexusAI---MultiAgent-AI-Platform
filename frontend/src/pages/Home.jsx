import React from 'react';
import { auth, googleProvider } from '../utils/firebase';
import api from '../utils/axios';

import { signInWithPopup } from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';

import { useSelector, useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';

import SideBar from '../components/SideBar';
import ChatArea from '../components/ChatArea';
import Artifact from '../components/Artifact';

function Home() {
    const { userData } = useSelector(
        (state) => state.user
    );

    const dispatch = useDispatch();

    const handleLogin = async (token) => {
        try {
            const { data } = await api.post(
                '/api/auth/login',
                {
                    token,
                }
            );

            dispatch(setUserData(data.user));

            console.log(
                'User data stored successfully:',
                data
            );
        } catch (error) {
            console.error(
                'Error during login:',
                error.response?.data || error.message
            );
        }
    };

    const googleLogin = async () => {
        try {
            const result = await signInWithPopup(
                auth,
                googleProvider
            );

            const token =
                await result.user.getIdToken();

            console.log(
                'Google login successful'
            );

            await handleLogin(token);

            console.log(
                'User logged in successfully:',
                result.user
            );
        } catch (error) {
            console.error(
                'Google login failed:',
                error
            );
        }
    };

    return (
        <div
            className="relative flex h-screen w-full items-center justify-center overflow-hidden text-white"
            style={{
                background:
                    'radial-gradient(120% 100% at 50% 0%, #12131C 0%, #0A0B12 55%, #050509 100%)',
            }}
        >

            {userData ? (

                <div className="flex h-full w-full min-w-0 overflow-hidden">

                    <SideBar />

                    <ChatArea />

                    <Artifact />

                </div>

            ) : (

                <>

                    <style>{`

                        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

                        .font-display {
                            font-family: 'Space Grotesk', sans-serif;
                        }

                        .font-body {
                            font-family: 'Inter', sans-serif;
                        }

                        @keyframes card-in {

                            from {
                                opacity: 0;
                                transform: translateY(8px) scale(0.98);
                            }

                            to {
                                opacity: 1;
                                transform: translateY(0) scale(1);
                            }

                        }

                        .card-enter {
                            animation: card-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
                        }

                        @keyframes glow-drift {
                            0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(1); }
                            50% { opacity: 0.55; transform: translate(-50%, -50%) scale(1.08); }
                        }

                        @keyframes glow-drift-alt {
                            0%, 100% { opacity: 0.22; transform: translate(-50%, -50%) scale(1); }
                            50% { opacity: 0.38; transform: translate(-50%, -50%) scale(1.12); }
                        }

                        .ambient-glow {
                            animation: glow-drift 6s ease-in-out infinite;
                        }

                        .ambient-glow-alt {
                            animation: glow-drift-alt 7.5s ease-in-out infinite;
                        }

                        .login-card {
                            transition: border-color 0.3s ease, box-shadow 0.3s ease;
                        }

                        .login-card:hover {
                            border-color: rgba(155,140,255,0.24);
                            box-shadow: 0 0 0 1px rgba(255,255,255,0.02), 0 25px 70px -15px rgba(0,0,0,0.9), 0 0 44px -8px rgba(139,124,255,0.18);
                        }

                        @media (prefers-reduced-motion: reduce) {

                            .card-enter {
                                animation: none;
                            }

                            .ambient-glow,
                            .ambient-glow-alt {
                                animation: none;
                            }

                        }

                    `}</style>


                    {/* Background */}

                    <div className="absolute inset-0">

                        <div
                            className="absolute inset-0 opacity-[0.06]"
                            style={{
                                backgroundImage:
                                    'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',

                                backgroundSize:
                                    '64px 64px',
                            }}
                        />

                        {/* Ambient brand glow — primary (violet, top-left of center) */}
                        <div
                            className="ambient-glow absolute left-[42%] top-[40%] w-[560px] h-[560px] rounded-full pointer-events-none"
                            style={{
                                background:
                                    'radial-gradient(circle, rgba(155,140,255,0.18) 0%, rgba(79,143,255,0.09) 45%, transparent 70%)',
                                filter: 'blur(20px)',
                            }}
                        />

                        {/* Ambient brand glow — secondary (blue, offset for depth) */}
                        <div
                            className="ambient-glow-alt absolute left-[58%] top-[58%] w-[440px] h-[440px] rounded-full pointer-events-none"
                            style={{
                                background:
                                    'radial-gradient(circle, rgba(79,143,255,0.16) 0%, transparent 70%)',
                                filter: 'blur(24px)',
                            }}
                        />

                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_75%)]" />

                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                    </div>


                    {/* Login Card */}

                    <div className="login-card card-enter relative z-10 mx-4 flex w-full max-w-95 flex-col gap-7 rounded-2xl border border-white/10 bg-white/[0.035] p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_25px_70px_-15px_rgba(0,0,0,0.9)] backdrop-blur-xl">


                        {/* Logo */}

                        <div className="flex items-center gap-2.5">

                            <div
                                className="relative flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ring-1 ring-white/10"
                                style={{
                                    background: 'linear-gradient(135deg, #9B8CFF 0%, #6B9EFF 55%, #4F8FFF 100%)',
                                    boxShadow: '0 0 18px rgba(139,124,255,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
                                }}
                            >

                                <span className="font-display text-[15px] font-bold text-white">
                                    N
                                </span>

                            </div>

                            <span className="font-display text-[15px] font-semibold tracking-tight text-slate-300">
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
                            </span>

                        </div>


                        {/* Heading */}

                        <div className="flex flex-col gap-2">

                            <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-white">
                                Welcome back
                            </h1>

                            <p className="font-body text-[13.5px] leading-relaxed text-slate-400">
                                Sign in to pick up right where
                                you left off. One click, no
                                passwords to remember.
                            </p>

                        </div>


                        {/* Google Login */}

                        <button
                            onClick={googleLogin}
                            className="font-body group relative flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-medium text-black shadow-lg shadow-black/40 transition-all duration-200 hover:bg-slate-100 hover:-translate-y-[1px] active:translate-y-0 active:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-[#9B8CFF]/60 focus:ring-offset-2 focus:ring-offset-black"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 10px 32px -6px rgba(139,124,255,0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = '';
                            }}
                        >

                            <FcGoogle size={18} />

                            <span>
                                Continue with Google
                            </span>

                        </button>


                        {/* Divider */}

                        <div className="flex items-center gap-3">

                            <div className="h-px flex-1 bg-white/10" />

                            <span className="font-body text-[11px] uppercase tracking-widest text-slate-600">
                                Secure sign-in
                            </span>

                            <div className="h-px flex-1 bg-white/10" />

                        </div>


                        {/* Footer */}

                        <p className="font-body text-center text-[11.5px] leading-relaxed text-slate-600">

                            By continuing, you agree to NexusAI's{' '}

                            <span className="cursor-pointer text-slate-500 underline underline-offset-2 transition-colors duration-200 hover:text-[#C1B7FF]">
                                Terms
                            </span>

                            {' '}and{' '}

                            <span className="cursor-pointer text-slate-500 underline underline-offset-2 transition-colors duration-200 hover:text-[#C1B7FF]">
                                Privacy Policy
                            </span>.

                        </p>

                    </div>

                </>

            )}

        </div>
    );
}

export default Home;