import { LoginForm } from "@/components/login-form"
import GradientAurora from "@/components/GradientAurora";

export default function Page() {
  return (
    <div style={{ position: "relative", minHeight: "100vh", width: "100vw" }}>
      <GradientAurora colorStops={["#7cff67", "#B497CF", "#5227FF"]} blend={0.5} />
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10" style={{ position: "relative", zIndex: 1 }}>
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
