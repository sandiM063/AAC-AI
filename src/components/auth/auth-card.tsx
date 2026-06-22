"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Suspense, useCallback, useEffect, useState } from "react";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

type AuthMode = "register" | "login";

const slideTransition = {
  type: "spring" as const,
  stiffness: 280,
  damping: 32,
  mass: 0.9,
};

const fadeTransition = {
  duration: 0.28,
  ease: [0.4, 0, 0.2, 1] as const,
};

function useIsDesktopLayout() {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 900px)");

    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

function GreenPanelContent({
  mode,
  onSwitch,
}: {
  mode: AuthMode;
  onSwitch: (mode: AuthMode) => void;
}) {
  const isRegister = mode === "register";

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={fadeTransition}
        className="flex flex-1 flex-col justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-sm font-bold">
            AAC
          </span>
          <span className="font-semibold tracking-wide">AAC Communicate</span>
        </div>

        <div className="my-8 space-y-4">
          <h2 className="text-3xl font-bold md:text-4xl">
            {isRegister ? "Welcome back!" : "Hello, friend!"}
          </h2>
          <p className="max-w-xs text-sm text-white/90 md:text-base">
            {isRegister
              ? "Already have an account? Sign in to continue your communication journey."
              : "New here? Create your account to get started with AAC Communicate."}
          </p>
          <button
            type="button"
            onClick={() => onSwitch(isRegister ? "login" : "register")}
            className="auth-ghost-button"
          >
            {isRegister ? "Sign in" : "Sign up"}
          </button>
        </div>

        <p className="text-xs text-white/70">Accessible communication for everyone</p>
      </motion.div>
    </AnimatePresence>
  );
}

export function AuthCard() {
  const [mode, setMode] = useState<AuthMode>("register");
  const isDesktop = useIsDesktopLayout();
  const prefersReducedMotion = useReducedMotion();
  const isRegister = mode === "register";

  const switchMode = useCallback((next: AuthMode) => {
    setMode(next);
  }, []);

  if (isDesktop === null) {
    return (
      <div className="auth-card">
        <div className="auth-card-inner auth-card-inner-desktop min-h-[36rem]" />
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div className="auth-card">
        <div className="auth-card-inner auth-card-inner-mobile">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={prefersReducedMotion ? false : { opacity: 0, x: isRegister ? 24 : -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, x: isRegister ? -24 : 24 }}
              transition={fadeTransition}
              className="flex flex-col"
            >
              <aside className="auth-panel auth-panel-green auth-panel-green-mobile">
                <div className="auth-panel-decor" aria-hidden />
                <div className="relative z-10 p-8">
                  <GreenPanelContent mode={mode} onSwitch={switchMode} />
                </div>
              </aside>

              <section className="auth-panel auth-panel-white overflow-hidden p-8">
                {isRegister ? (
                  <>
                    <h1 className="text-2xl font-bold text-aac-primary">Create account</h1>
                    <p className="mt-1 text-sm text-aac-muted">
                      Register with email or phone — we&apos;ll send a verification code.
                    </p>
                    <div className="mt-6">
                      <RegisterForm onSwitchToLogin={() => switchMode("login")} />
                    </div>
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-aac-primary">Sign in</h1>
                    <p className="mt-1 text-sm text-aac-muted">
                      Use the email or phone number you registered with.
                    </p>
                    <div className="mt-6">
                      <Suspense fallback={null}>
                        <LoginForm onSwitchToRegister={() => switchMode("register")} />
                      </Suspense>
                    </div>
                  </>
                )}
              </section>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-card-inner auth-card-inner-desktop">
        <motion.div
          className="auth-slider"
          data-side={isRegister ? "left" : "right"}
          aria-hidden
          initial={false}
          animate={{
            left: isRegister ? "0%" : "50%",
          }}
          transition={
            prefersReducedMotion
              ? { duration: 0.01 }
              : slideTransition
          }
        >
          <div className="auth-panel-decor" aria-hidden />
        </motion.div>

        <div className="auth-form-columns">
          <div className="auth-form-pane auth-form-pane-left">
            <AnimatePresence mode="wait" initial={false}>
              {isRegister ? (
                <motion.div
                  key="green-left"
                  className="auth-form-pane-green"
                  initial={
                    prefersReducedMotion ? false : { opacity: 0, x: -20 }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  exit={
                    prefersReducedMotion ? undefined : { opacity: 0, x: 20 }
                  }
                  transition={fadeTransition}
                >
                  <GreenPanelContent mode={mode} onSwitch={switchMode} />
                </motion.div>
              ) : (
                <motion.div
                  key="login-form"
                  className="auth-form-pane-content"
                  initial={
                    prefersReducedMotion ? false : { opacity: 0, x: -20 }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  exit={
                    prefersReducedMotion ? undefined : { opacity: 0, x: 20 }
                  }
                  transition={fadeTransition}
                >
                  <h1 className="text-2xl font-bold text-aac-primary md:text-3xl">
                    Sign in
                  </h1>
                  <p className="mt-1 text-sm text-aac-muted">
                    Use the email or phone number you registered with.
                  </p>
                  <div className="mt-6">
                    <Suspense fallback={null}>
                      <LoginForm onSwitchToRegister={() => switchMode("register")} />
                    </Suspense>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="auth-form-pane auth-form-pane-right">
            <AnimatePresence mode="wait" initial={false}>
              {isRegister ? (
                <motion.div
                  key="register-form"
                  className="auth-form-pane-content"
                  initial={
                    prefersReducedMotion ? false : { opacity: 0, x: 20 }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  exit={
                    prefersReducedMotion ? undefined : { opacity: 0, x: -20 }
                  }
                  transition={fadeTransition}
                >
                  <h1 className="text-2xl font-bold text-aac-primary md:text-3xl">
                    Create account
                  </h1>
                  <p className="mt-1 text-sm text-aac-muted">
                    Register with email or phone — we&apos;ll send a verification code.
                  </p>
                  <div className="mt-6 min-w-0">
                    <RegisterForm onSwitchToLogin={() => switchMode("login")} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="green-right"
                  className="auth-form-pane-green"
                  initial={
                    prefersReducedMotion ? false : { opacity: 0, x: 20 }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  exit={
                    prefersReducedMotion ? undefined : { opacity: 0, x: -20 }
                  }
                  transition={fadeTransition}
                >
                  <GreenPanelContent mode={mode} onSwitch={switchMode} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
