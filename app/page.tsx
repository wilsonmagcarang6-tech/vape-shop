import { LoginForm } from "@/components/login-form"
import { default as Aurora } from "@/components/Aurora";


export default function Page() {
  return (
    <div style={{ position: "relative", minHeight: "100vh", width: "100vw" }}>
      <Aurora colorStops={["#7cff67", "#B497CF", "#5227FF"]} blend={0.5} amplitude={1.0} speed={1} />
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10" style={{ position: "relative", zIndex: 1 }}>
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
