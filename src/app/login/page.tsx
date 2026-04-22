import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Paste the API key you received after checkout.
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-neutral-500">
          Lost your key?{" "}
          <a href="mailto:lorenzo@amnura.co" className="hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
