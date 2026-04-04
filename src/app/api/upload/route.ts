import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "images";
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "Nessun file fornito" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo di file non supportato. Usa JPG, PNG, WebP o GIF." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File troppo grande. Dimensione massima: 5MB" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop();
    const fileName = `${folder}/${user.id}/${Date.now()}.${ext}`;

    const { data, error } = await admin.storage
      .from(bucket)
      .upload(fileName, file, { cacheControl: "3600", upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = admin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl, path: data.path });
  } catch {
    return NextResponse.json({ error: "Errore nel caricamento file" }, { status: 500 });
  }
}
