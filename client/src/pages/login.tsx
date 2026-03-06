import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export function Login() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [accountType, setAccountType] = useState<"work" | "personal">("personal");
  const [workMode, setWorkMode] = useState<"join" | "create">("join");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyKey: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.username, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords don't match");
          setLoading(false);
          return;
        }
        await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          account_type: accountType,
          company_name: accountType === "work" && workMode === "create" ? formData.companyName : undefined,
          company_key: accountType === "work" && workMode === "join" ? formData.companyKey : undefined,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 10, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-500/15 dark:bg-violet-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -25, 15, 0], y: [0, 15, -25, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-blue-500/12 dark:bg-blue-500/8 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 20, -10, 0], y: [0, -10, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 right-1/3 w-48 h-48 bg-pink-500/10 dark:bg-pink-500/5 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-tr from-violet-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground">SynergySphere</h1>
          <p className="text-xs text-muted-foreground mt-1">Team Collaboration Platform</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl shadow-black/5">
          {/* Toggle */}
          <div className="flex bg-secondary rounded-xl p-1 mb-5">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 text-xs font-medium py-2 rounded-lg transition-all ${
                isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 text-xs font-medium py-2 rounded-lg transition-all ${
                !isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-xs rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? "login" : "register"}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Username</label>
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter username"
                  required
                  className="h-9 text-sm"
                />
              </div>

              {!isLogin && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1.5">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                      className="h-9 text-sm"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-medium text-foreground mb-2">Account Type</label>
                    <div className="flex gap-2 mb-3">
                      <Button
                        type="button"
                        variant={accountType === "personal" ? "default" : "outline"}
                        className="flex-1 text-xs h-8"
                        onClick={() => setAccountType("personal")}
                      >
                        🏠 Personal
                      </Button>
                      <Button
                        type="button"
                        variant={accountType === "work" ? "default" : "outline"}
                        className="flex-1 text-xs h-8"
                        onClick={() => setAccountType("work")}
                      >
                        💼 Work
                      </Button>
                    </div>
                  </div>

                  {accountType === "work" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-3 pt-1 border-t border-border mt-2"
                    >
                      <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 mb-2">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed italic">
                          Already have credentials from your manager? 
                          <button 
                            type="button"
                            onClick={() => setIsLogin(true)}
                            className="ml-1 font-black underline hover:text-blue-700 transition-colors"
                          >
                            Sign In instead
                          </button>
                        </p>
                      </div>
                      <div className="flex bg-secondary/50 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => setWorkMode("join")}
                          className={`flex-1 text-[10px] font-bold py-1 rounded-md transition-all ${
                            workMode === "join" ? "bg-card text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          Join Company
                        </button>
                        <button
                          type="button"
                          onClick={() => setWorkMode("create")}
                          className={`flex-1 text-[10px] font-bold py-1 rounded-md transition-all ${
                            workMode === "create" ? "bg-card text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          Create New
                        </button>
                      </div>

                      {workMode === "join" ? (
                        <div>
                          <label className="block text-[10px] font-bold text-foreground mb-1 px-1">Unique Company Key</label>
                          <Input
                            type="text"
                            value={formData.companyKey}
                            onChange={(e) => setFormData({ ...formData, companyKey: e.target.value })}
                            placeholder="ABCD-1234"
                            required
                            className="h-8 text-xs bg-secondary/30"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-bold text-foreground mb-1 px-1">Company Name</label>
                          <Input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            placeholder="e.g. Acme Corp"
                            required
                            className="h-8 text-xs bg-secondary/30"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">Password</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  className="h-9 text-sm"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1.5">Confirm Password</label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="h-9 text-sm"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white shadow-lg shadow-violet-500/20 mt-4"
              >
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Get Started"}
              </Button>
            </motion.form>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
