import { requireUserId } from "@/lib/auth";
import { uploadDocument } from "@/lib/data/documents";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

// Upload via a route handler (not a server action) so the browser can report
// real upload progress through XHR.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: clientId } = await params;
  const userId = await requireUserId();

  let file: FormDataEntryValue | null = null;
  try {
    const form = await req.formData();
    file = form.get("file");
  } catch {
    return Response.json({ ok: false, error: "Invalid upload" }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return Response.json(
      { ok: false, error: "No file selected" },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { ok: false, error: "File too large (max 25 MB)" },
      { status: 413 },
    );
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await uploadDocument(userId, clientId, {
      name: file.name,
      mime: file.type || null,
      size: file.size,
      bytes,
    });
  } catch (e) {
    return Response.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
