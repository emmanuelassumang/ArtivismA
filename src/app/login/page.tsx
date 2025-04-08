"use client";
import Link from "next/link";

export default function Login() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-900 via-violet-900 to-purple-900 text-white">
      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-md rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Welcome Back</h2>
        <p className="text-gray-300 mb-6">
          Log in to continue exploring street art.
        </p>

        <form className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white focus:ring focus:ring-indigo-400 placeholder-gray-300"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-3 rounded-lg bg-white/20 text-white focus:ring focus:ring-indigo-400 placeholder-gray-300"
              required
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
