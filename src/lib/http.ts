import { ShopError } from "./shop";

export async function handle(fn: () => Promise<Response> | Response): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ShopError) {
      return Response.json(
        err.field ? { message: err.message, field: err.field } : { message: err.message },
        { status: err.status },
      );
    }
    console.error(err);
    return Response.json({ message: "เกิดข้อผิดพลาดภายในระบบ" }, { status: 500 });
  }
}

/** อ่าน JSON body อย่างปลอดภัย (body ไม่ถูกต้องให้เป็น object ว่าง) */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
