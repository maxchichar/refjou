"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { clientAuth } from "@/lib/firebaseClient";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Create the Firebase Auth account client-side.
      const credential = await createUserWithEmailAndPassword(clientAuth(), email, password);
      await updateProfile(credential.user, { displayName: name });
      const idToken = await credential.user.getIdToken();

      // 2. Exchange the ID token for a session cookie + create the Firestore profile.
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, mode: "register", name, username }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Roll back: the Auth user was created but the profile wasn't (e.g. username taken).
        await credential.user.delete().catch(() => {});
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      router.push("/new");
      router.refresh();
    } catch (err: unknown) {
      setError(firebaseErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="font-display text-2xl italic text-paper">Join refjou</h1>
      <p className="mt-1 text-sm text-muted">Start your streak today.</p>

      <div className="mt-6">
        <GoogleSignInButton />
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-line" />
        or
        <div className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Name">
          <input
            className="w-full rounded bg-surface px-3 py-2 text-paper placeholder:text-muted"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            required
          />
        </Field>
        <Field label="Username">
          <input
            className="w-full rounded bg-surface px-3 py-2 text-paper placeholder:text-muted"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ada"
            required
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className="w-full rounded bg-surface px-3 py-2 text-paper placeholder:text-muted"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ada@example.com"
            required
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            className="w-full rounded bg-surface px-3 py-2 text-paper placeholder:text-muted"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
          />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          disabled={loading}
          className="rounded-full bg-ember px-4 py-2 font-medium text-ink transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-ember hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      {children}
    </label>
  );
}

function firebaseErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with that email already exists.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    default:
      return "Something went wrong. Try again.";
  }
}