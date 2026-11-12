import { FlakyClient } from "./FlakyClient";

export const metadata = {
  title: "Flaky - Playground | DN Shop",
};

export default async function FlakyPage({
  searchParams,
}: {
  searchParams: Promise<{ failRate?: string; delayMax?: string }>;
}) {
  const { failRate, delayMax } = await searchParams;
  const num = (v: string | undefined) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  return <FlakyClient failRate={num(failRate)} delayMax={num(delayMax)} />;
}
