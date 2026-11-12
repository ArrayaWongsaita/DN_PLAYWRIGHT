"use client";

import { useEffect, useState } from "react";

export function Today() {
  const [text, setText] = useState("");
  useEffect(
    () => setText(new Intl.DateTimeFormat(navigator.language, { dateStyle: "full" }).format(new Date())),
    [],
  );
  return <p data-testid="today">{text}</p>;
}
