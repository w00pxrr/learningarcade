"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type AuthMode = "login" | "register" | "forgot-password" | "phone-verification";

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "verify" | "reset" | "verify-phone">("phone");
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus trap for accessibility
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen, mode]);

  const handleAuth = async (endpoint: "login" | "register") => {
    if (!username || !password) {
      setStatus("Enter a username and password.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch(`/api/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error || "Request failed.");
        return;
      }
      setStatus(endpoint === "login" ? "Logged in." : "Account created.");
      setPassword("");
      onSuccess?.();
      onClose();
      router.refresh();
    } catch {
      setStatus("Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (step === "phone") {
      if (!phoneNumber) {
        setStatus("Enter your phone number.");
        return;
      }
      setLoading(true);
      setStatus("");
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus(data?.error || "Request failed.");
          return;
        }
        setStatus("Verification code sent to your phone.");
        setStep("verify");
      } catch {
        setStatus("Request failed.");
      } finally {
        setLoading(false);
      }
    } else if (step === "verify") {
      if (!verificationCode) {
        setStatus("Enter the verification code.");
        return;
      }
      setLoading(true);
      setStatus("");
      try {
        const res = await fetch("/api/auth/verify-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber, code: verificationCode }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus(data?.error || "Invalid code.");
          return;
        }
        setStatus("Code verified. Enter your new password.");
        setStep("reset");
      } catch {
        setStatus("Request failed.");
      } finally {
        setLoading(false);
      }
    } else if (step === "reset") {
      if (!newPassword) {
        setStatus("Enter a new password.");
        return;
      }
      setLoading(true);
      setStatus("");
      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber, code: verificationCode, newPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus(data?.error || "Request failed.");
          return;
        }
        setStatus("Password reset successful. Please login.");
        setMode("login");
        setStep("phone");
        setPhoneNumber("");
        setVerificationCode("");
        setNewPassword("");
      } catch {
        setStatus("Request failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePhoneVerification = async () => {
    if (step === "phone") {
      if (!phoneNumber) {
        setStatus("Enter your phone number.");
        return;
      }
      setLoading(true);
      setStatus("");
      try {
        const res = await fetch("/api/auth/send-verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber, purpose: "verification" }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus(data?.error || "Request failed.");
          return;
        }
        setStatus("Verification code sent to your phone.");
        setStep("verify-phone");
      } catch {
        setStatus("Request failed.");
      } finally {
        setLoading(false);
      }
    } else if (step === "verify-phone") {
      if (!verificationCode) {
        setStatus("Enter the verification code.");
        return;
      }
      setLoading(true);
      setStatus("");
      try {
        const res = await fetch("/api/auth/verify-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber, code: verificationCode }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus(data?.error || "Invalid code.");
          return;
        }
        setStatus("Phone number verified successfully.");
        setMode("login");
        setStep("phone");
        setPhoneNumber("");
        setVerificationCode("");
      } catch {
        setStatus("Request failed.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSocialLogin = (provider: "gravatar") => {
    // Redirect to OAuth provider
    window.location.href = `/api/auth/${provider}`;
  };

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setPhoneNumber("");
    setVerificationCode("");
    setNewPassword("");
    setStatus("");
    setStep("phone");
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div
      className="login-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <div className="login-modal" ref={modalRef}>
        <button
          className="login-modal-close"
          onClick={onClose}
          aria-label="Close login modal"
          type="button"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="login-modal-header">
          <h2 id="login-modal-title" className="login-modal-title">
            {mode === "login" && "Welcome Back"}
            {mode === "register" && "Create Account"}
            {mode === "forgot-password" && "Reset Password"}
            {mode === "phone-verification" && "Verify Phone Number"}
          </h2>
          <p className="login-modal-subtitle">
            {mode === "login" && "Sign in to continue to GAMS"}
            {mode === "register" && "Join the GAMS community"}
            {mode === "forgot-password" && "Enter your phone number to reset password"}
            {mode === "phone-verification" && "Enter your phone number to verify"}
          </p>
        </div>

        <div className="login-modal-body">
          {mode === "login" || mode === "register" || mode === "phone-verification" ? (
            <>
              <div className="login-modal-form">
                <label className="login-modal-label">
                  Username
                  <input
                    ref={firstInputRef}
                    className="login-modal-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="Enter your username"
                    aria-required="true"
                  />
                </label>
                <label className="login-modal-label">
                  Password
                  <input
                    className="login-modal-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder="Enter your password"
                    aria-required="true"
                  />
                </label>
                {mode === "login" && (
                  <button
                    className="login-modal-forgot"
                    onClick={() => handleModeChange("forgot-password")}
                    type="button"
                  >
                    Forgot password?
                  </button>
                )}
                {mode === "register" && (
                  <button
                    className="login-modal-forgot"
                    onClick={() => handleModeChange("phone-verification")}
                    type="button"
                  >
                    Verify phone number
                  </button>
                )}
              </div>

              <div className="login-modal-actions">
                <button
                  className="login-modal-btn login-modal-btn-primary"
                  onClick={() => {
                    if (mode === "phone-verification") {
                      handlePhoneVerification();
                    } else {
                      handleAuth(mode === "login" ? "login" : "register");
                    }
                  }}
                  disabled={loading}
                  type="button"
                >
                  {loading
                    ? mode === "login"
                      ? "Signing in..."
                      : mode === "register"
                      ? "Creating..."
                      : "Verifying..."
                    : mode === "login"
                    ? "Sign In"
                    : mode === "register"
                    ? "Create Account"
                    : "Verify Phone"}
                </button>
              </div>

              <div className="login-modal-divider">
                <span>or continue with</span>
              </div>

              <div className="login-modal-social">
                <button
                  className="login-modal-social-btn login-modal-social-gravatar"
                  onClick={() => handleSocialLogin("gravatar")}
                  type="button"
                  aria-label="Sign in with Gravatar"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path
                      fill="#1D4ED8"
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-9c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm-2 0c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4z"
                    />
                  </svg>
                  <span>Gravatar</span>
                </button>
              </div>

              <div className="login-modal-switch">
                {mode === "login" ? (
                  <p>
                    Don't have an account?{" "}
                    <button
                      onClick={() => handleModeChange("register")}
                      type="button"
                    >
                      Sign up
                    </button>
                  </p>
                ) : mode === "register" ? (
                  <p>
                    Already have an account?{" "}
                    <button
                      onClick={() => handleModeChange("login")}
                      type="button"
                    >
                      Sign in
                    </button>
                  </p>
                ) : (
                  <p>
                    <button
                      onClick={() => handleModeChange("login")}
                      type="button"
                    >
                      Back to login
                    </button>
                  </p>
                )}
              </div>
            </>
          ) : mode === "forgot-password" ? (
            <>
              <div className="login-modal-form">
                {step === "phone" && (
                  <label className="login-modal-label">
                    Phone Number
                    <input
                      ref={firstInputRef}
                      className="login-modal-input"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter your phone number"
                      aria-required="true"
                    />
                  </label>
                )}
                {step === "verify" && (
                  <label className="login-modal-label">
                    Verification Code
                    <input
                      ref={firstInputRef}
                      className="login-modal-input"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter verification code"
                      aria-required="true"
                    />
                  </label>
                )}
                {step === "reset" && (
                  <label className="login-modal-label">
                    New Password
                    <input
                      ref={firstInputRef}
                      className="login-modal-input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      aria-required="true"
                    />
                  </label>
                )}
              </div>

              <div className="login-modal-actions">
                <button
                  className="login-modal-btn login-modal-btn-primary"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  type="button"
                >
                  {loading
                    ? "Processing..."
                    : step === "phone"
                    ? "Send Code"
                    : step === "verify"
                    ? "Verify Code"
                    : "Reset Password"}
                </button>
              </div>

              <div className="login-modal-switch">
                <p>
                  Remember your password?{" "}
                  <button
                    onClick={() => handleModeChange("login")}
                    type="button"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="login-modal-form">
                {step === "phone" && (
                  <label className="login-modal-label">
                    Phone Number
                    <input
                      ref={firstInputRef}
                      className="login-modal-input"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter your phone number"
                      aria-required="true"
                    />
                  </label>
                )}
                {step === "verify-phone" && (
                  <label className="login-modal-label">
                    Verification Code
                    <input
                      ref={firstInputRef}
                      className="login-modal-input"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter verification code"
                      aria-required="true"
                    />
                  </label>
                )}
              </div>

              <div className="login-modal-actions">
                <button
                  className="login-modal-btn login-modal-btn-primary"
                  onClick={handlePhoneVerification}
                  disabled={loading}
                  type="button"
                >
                  {loading
                    ? "Processing..."
                    : step === "phone"
                    ? "Send Code"
                    : "Verify Code"}
                </button>
              </div>

              <div className="login-modal-switch">
                <p>
                  <button
                    onClick={() => handleModeChange("login")}
                    type="button"
                  >
                    Back to login
                  </button>
                </p>
              </div>
            </>
          )}

          {status && (
            <p className="login-modal-status" role="alert">
              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
