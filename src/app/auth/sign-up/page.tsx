import { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";
export const metadata = { title: "Sign up — PetSquare" };
export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <AuthForm mode="sign-up" />
    </Suspense>
  );
}
