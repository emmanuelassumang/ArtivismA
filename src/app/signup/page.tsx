"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("");
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, city }),
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem("token", data.token);
      router.push("/map");
    } else {
      const errorData = await res.json();
      console.error("Sign-up failed:", errorData);
      alert(`Sign-up failed: ${errorData.message || "Try again."}`);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-900 via-violet-900 to-purple-900 text-white">
      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Join Us</h2>
        <p className="text-gray-300 mb-6">
          Create an account to explore street art worldwide.
        </p>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Username"
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white focus:ring focus:ring-indigo-400 placeholder-gray-300"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white focus:ring focus:ring-indigo-400 placeholder-gray-300"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white focus:ring focus:ring-indigo-400 placeholder-gray-300"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Location (Optional)"
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white focus:ring focus:ring-indigo-400 placeholder-gray-300"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-lg font-medium transition-all duration-300"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-6 text-gray-300">
          Already have an account?
          <Link href="/login" className="text-indigo-400 hover:underline">
            {" "}
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
