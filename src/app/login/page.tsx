"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  
    const data = await res.json();
  
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("authToken", data.token);
      router.push("/map");
    } else {
      console.error("Log in failed:", data);
      alert(`Log in failed: ${data.error || "Try again."}`);
    }
  };

  const router = useRouter();
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-900 via-violet-900 to-purple-900 text-white">
      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Welcome Back</h2>
        <p className="text-gray-300 mb-6">
          Log in to continue exploring street art.
        </p>

        <form className="space-y-4" onSubmit={handleLogIn}>
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white focus:ring focus:ring-indigo-400 placeholder-gray-300"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white focus:ring focus:ring-indigo-400 placeholder-gray-300"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-lg font-medium transition-all duration-300"
          >
            Log In
          </button>
        </form>

        <p className="mt-6 text-gray-300">
          Don't have an account?
          <Link href="/signup" className="text-indigo-400 hover:underline">
            {" "}
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
