"use client";

import { useState, type DragEvent } from "react";

const COLUMNS = ["ต้องทำ", "กำลังทำ", "เสร็จแล้ว"] as const;
type Column = (typeof COLUMNS)[number];

const INITIAL: Record<string, Column> = {
  แพ็กสินค้า: "ต้องทำ",
  ส่งของ: "ต้องทำ",
  ตอบแชทลูกค้า: "ต้องทำ",
};

export function DragDropClient() {
  const [cards, setCards] = useState(INITIAL);

  function drop(e: DragEvent, column: Column) {
    e.preventDefault();
    const name = e.dataTransfer.getData("text/plain");
    if (name in cards) setCards((c) => ({ ...c, [name]: column }));
  }

  return (
    <>
      <h1>Drag and drop</h1>
      <div className="board">
        {COLUMNS.map((column) => (
          <section
            key={column}
            aria-label={column}
            className="board-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => drop(e, column)}
          >
            <h2>{column}</h2>
            <ul>
              {Object.entries(cards)
                .filter(([, col]) => col === column)
                .map(([name]) => (
                  <li
                    key={name}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", name)}
                  >
                    {name}
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
