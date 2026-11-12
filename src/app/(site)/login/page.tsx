import { LoginClient } from "./LoginClient";

export const metadata = {
  title: "เข้าสู่ระบบ | DN Shop",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <LoginClient next={next} />;
}
