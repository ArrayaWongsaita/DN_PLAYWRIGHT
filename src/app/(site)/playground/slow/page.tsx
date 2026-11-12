import { SlowClient } from "./SlowClient";

export const metadata = {
  title: "Slow - Playground | DN Shop",
};

export default async function SlowPage({ searchParams }: { searchParams: Promise<{ delay?: string }> }) {
  const { delay } = await searchParams;
  const n = Number(delay);
  return <SlowClient delay={delay !== undefined && Number.isFinite(n) && n >= 0 ? n : 2000} />;
}
