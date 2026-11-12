import { test, expect } from "@playwright/test";

// ================================================
// บทที่ 06: คลิก ดับเบิลคลิก และ hover
// ฝึก: click, dblclick, hover, toHaveValue, toBeDisabled, toBeEnabled
// อ่านเนื้อหาก่อนที่ README.md ในโฟลเดอร์นี้
// ================================================


// ------------------------------------------------
// ตัวอย่างที่ 1: กดปุ่ม "เพิ่มจำนวน" แล้วจำนวนต้องเป็น 2 (click + toHaveValue)
// ------------------------------------------------
test("หน้าสินค้า p01 กดเพิ่มจำนวนหนึ่งครั้งแล้วต้องเป็น 2", async ({ page }) => {
  await page.goto("/products/p01");
  // click จะรอให้ปุ่มพร้อมกดก่อน (มองเห็น, ไม่ถูกบัง, ไม่ disabled) แล้วจึงคลิกจริง
  await page.getByRole("button", { name: "เพิ่มจำนวน" }).click();
  // ช่องจำนวนคือ <input aria-label="จำนวน"> จึงหาด้วย role "textbox" ชื่อ "จำนวน"
  // toHaveValue ตรวจ "ค่าที่อยู่ในช่อง" (ไม่ใช่ข้อความที่ผู้ใช้เห็นแบบ toHaveText)
  await expect(page.getByRole("textbox", { name: "จำนวน" })).toHaveValue("2");
});


// ------------------------------------------------
// ตัวอย่างที่ 2: เอาเมาส์ชี้ปุ่ม "ข้อมูลการจัดส่ง" แล้วต้องเห็น tooltip (hover)
// ------------------------------------------------
test("หน้าสินค้า p01 hover ข้อมูลการจัดส่งแล้วต้องเห็น tooltip", async ({ page }) => {
  await page.goto("/products/p01");
  // hover = ย้ายเมาส์ไปอยู่บน element โดยไม่คลิก
  await page.getByRole("button", { name: "ข้อมูลการจัดส่ง" }).hover();
  // tooltip ที่ขึ้นมามี role="tooltip" ใช้ getByRole("tooltip") หาได้เลย
  await expect(page.getByRole("tooltip")).toHaveText("จัดส่งภายใน 1–3 วันทำการ");
});


// ------------------------------------------------
// ข้อ 1: หน้าสินค้า p01 กดเพิ่มจำนวน 2 ครั้ง ช่องจำนวนต้องเป็น 3
// แนวทาง: เหมือนตัวอย่างที่ 1 แต่เรียก click() สองบรรทัดติดกัน
//        (ช่องจำนวนเริ่มที่ 1 ดังนั้นกดสองครั้งต้องได้ 3)
// ------------------------------------------------
test("หน้าสินค้า p01 กดเพิ่มจำนวน 2 ครั้งแล้วต้องเป็น 3", async ({ page }) => {
  await page.goto("/products/p01");
  const increase = page.getByRole("button", { name: "เพิ่มจำนวน" });
  // ทำไมคลิกสองบรรทัด: แต่ละ click รอจนปุ่มพร้อมและกดเสร็จก่อนค่อยไปบรรทัดถัดไป จึงไม่ต้องรอเอง
  await increase.click();
  await increase.click();
  // ทำไม toHaveValue("3"): ช่องจำนวนเป็น <input> ค่าอยู่ใน value ไม่ใช่ข้อความ (และเป็น string เสมอ)
  await expect(page.getByRole("textbox", { name: "จำนวน" })).toHaveValue("3");
});


// ------------------------------------------------
// ข้อ 2: ปุ่ม "ลดจำนวน" ต้องกดไม่ได้ตอนจำนวนเป็น 1 และกดได้เมื่อกดเพิ่มแล้ว
// แนวทาง: ใช้ getByRole("button", { name: "ลดจำนวน" }) เก็บไว้ในตัวแปร
//        ตรวจด้วย toBeDisabled() ก่อน แล้วกด "เพิ่มจำนวน" แล้วตรวจด้วย toBeEnabled()
//        (ปุ่ม disabled คือปุ่มที่กดไม่ได้ ผู้ใช้เห็นเป็นสีจาง)
// ------------------------------------------------
test("หน้าสินค้า p01 ปุ่มลดจำนวนต้องกดไม่ได้ตอนจำนวนเป็น 1", async ({ page }) => {
  await page.goto("/products/p01");
  // เก็บ locator ไว้ในตัวแปรเพราะใช้สองครั้ง locator ไม่ได้เก็บผล มันหา element ใหม่ทุกครั้งที่ใช้
  const decrease = page.getByRole("button", { name: "ลดจำนวน" });
  // ทำไม toBeDisabled: จำนวนเริ่มที่ 1 แอปจึงกดลดไม่ได้ ตรวจที่ปุ่มตรงๆ เท่ากับตรวจกติกาของหน้า
  await expect(decrease).toBeDisabled();
  await page.getByRole("button", { name: "เพิ่มจำนวน" }).click();
  // หลังเพิ่มเป็น 2 ปุ่มลดต้องกลับมากดได้ (expect รอจนสถานะเปลี่ยน จึงไม่ต้อง sleep)
  await expect(decrease).toBeEnabled();
});


// ------------------------------------------------
// ข้อ 3: ดับเบิลคลิกรูปสินค้า p01 แล้วข้อความใต้รูปต้องเปลี่ยนเป็น "ดับเบิลคลิกเพื่อย่อรูป"
// แนวทาง: ก่อนดับเบิลคลิก ข้อความใต้รูปคือ "ดับเบิลคลิกเพื่อขยายรูป" ตรวจก่อนด้วย toBeVisible
//        หารูปด้วย getByAltText("หูฟังไร้สาย DN Buds") แล้วเรียก dblclick()
//        แล้วตรวจข้อความใหม่ด้วย getByText
// ------------------------------------------------
test("หน้าสินค้า p01 ดับเบิลคลิกรูปแล้วข้อความใต้รูปต้องเปลี่ยน", async ({ page }) => {
  await page.goto("/products/p01");
  // ตรวจสถานะก่อนทำ เพื่อให้รู้ว่าที่เปลี่ยนเป็นผลของ dblclick จริง ไม่ใช่ค่าเริ่มต้นอยู่แล้ว
  await expect(page.getByText("ดับเบิลคลิกเพื่อขยายรูป")).toBeVisible();
  // ทำไมใช้ dblclick ไม่ใช่ click สองครั้ง: โค้ดของหน้าฟัง event dblclick ซึ่ง click() สองครั้งไม่ได้ยิง
  await page.getByAltText("หูฟังไร้สาย DN Buds").dblclick();
  await expect(page.getByText("ดับเบิลคลิกเพื่อย่อรูป")).toBeVisible();
  // ข้อความเก่าต้องหายไปด้วย
  await expect(page.getByText("ดับเบิลคลิกเพื่อขยายรูป")).not.toBeVisible();
});


// ------------------------------------------------
// ข้อ 4: หน้า /playground/hover เอาเมาส์ชี้ปุ่ม "บริการลูกค้า" แล้วต้องเห็นลิงก์ "ติดตามพัสดุ" และ "คืนสินค้า"
// แนวทาง: ก่อน hover เมนูยังซ่อนอยู่ ลองตรวจ not.toBeVisible() ของลิงก์ "ติดตามพัสดุ" ก่อน
//        แล้ว hover() ปุ่มแล้วตรวจว่าลิงก์ทั้งสองมองเห็น (getByRole("link", ...))
// ------------------------------------------------
test("หน้า /playground/hover hover บริการลูกค้าแล้วต้องเห็นเมนู", async ({ page }) => {
  await page.goto("/playground/hover");
  const trackLink = page.getByRole("link", { name: "ติดตามพัสดุ" });
  const returnLink = page.getByRole("link", { name: "คืนสินค้า" });
  // ก่อน hover เมนูซ่อนอยู่ ตรวจไว้เพื่อยืนยันว่า hover เป็นตัวทำให้เมนูโผล่
  await expect(trackLink).not.toBeVisible();
  await page.getByRole("button", { name: "บริการลูกค้า" }).hover();
  // ทำไมใช้ toBeVisible: expect รอจนเมนูแสดง (อาจมี animation) ไม่ต้องหน่วงเวลาเอง
  await expect(trackLink).toBeVisible();
  await expect(returnLink).toBeVisible();
});


// ------------------------------------------------
// ข้อ 5: หน้าสินค้า p01 กดเพิ่มจำนวน 2 ครั้ง (เป็น 3) แล้วกดลดจำนวน 1 ครั้ง ช่องจำนวนต้องเป็น 2
// แนวทาง: ตรวจ toHaveValue("3") หลังกดเพิ่ม แล้วกด getByRole("button", { name: "ลดจำนวน" }).click()
//        แล้วตรวจ toHaveValue("2") (ตรวจค่าทุกขั้น จะรู้ว่าพลาดตรงไหน)
// ------------------------------------------------
test("หน้าสินค้า p01 เพิ่มแล้วลดจำนวนต้องได้ค่าที่ถูกต้อง", async ({ page }) => {
  await page.goto("/products/p01");
  const quantity = page.getByRole("textbox", { name: "จำนวน" });
  await page.getByRole("button", { name: "เพิ่มจำนวน" }).click();
  await page.getByRole("button", { name: "เพิ่มจำนวน" }).click();
  // ตรวจค่าหลังกดเพิ่ม เพื่อให้รู้ว่าถ้าพลาดคือพลาดที่ขั้นเพิ่มหรือขั้นลด
  await expect(quantity).toHaveValue("3");
  await page.getByRole("button", { name: "ลดจำนวน" }).click();
  // 3 - 1 = 2 (toHaveValue รอจนค่าอัปเดต ไม่ต้องหน่วงเวลา)
  await expect(quantity).toHaveValue("2");
});
