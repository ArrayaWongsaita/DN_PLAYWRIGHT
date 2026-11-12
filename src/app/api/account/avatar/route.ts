import { requireUser } from "@/lib/guard";
import { handle } from "@/lib/http";
import { getData } from "@/lib/session";
import { ShopError } from "@/lib/shop";

export const dynamic = "force-dynamic";

const MAX_BYTES = 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg"];

export function POST(req: Request) {
  return handle(async () => {
    await requireUser();
    const invalid = new ShopError(400, "รองรับเฉพาะไฟล์ PNG หรือ JPG ขนาดไม่เกิน 1MB");
    let file: FormDataEntryValue | null = null;
    try {
      file = (await req.formData()).get("avatar");
    } catch {
      throw invalid;
    }
    if (!(file instanceof File) || !ALLOWED.includes(file.type) || file.size > MAX_BYTES) throw invalid;
    const d = await getData();
    d.avatarFileName = file.name;
    return Response.json({ fileName: file.name });
  });
}
