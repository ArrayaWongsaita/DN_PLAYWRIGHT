import { HelpWidgetClient } from "./HelpWidgetClient";

export const metadata = {
  title: "กล่องแชทช่วยเหลือ | DN Shop",
};

export default function HelpWidgetPage() {
  return (
    <main className="embed">
      <HelpWidgetClient />
    </main>
  );
}
