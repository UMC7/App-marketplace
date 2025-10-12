// src/components/cv/candidate/sectionscomponents/references/referencesApi.js
import supabase from "../../../../../supabase";

export async function uploadReferenceFile(file, { refFolderId } = {}) {
  if (!(file instanceof File)) {
    throw new Error("uploadReferenceFile: 'file' debe ser un File válido.");
  }

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user?.id) throw new Error("No hay sesión activa.");

  const safeId =
    refFolderId ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

  const cleanName = sanitizeFilename(file.name || "attachment");
  const objectPath = `${user.id}/refs/${safeId}/${cleanName}`;

  const { error: uploadErr } = await supabase.storage
    .from("cv-docs")
    .upload(objectPath, file, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
    });

  if (uploadErr) throw uploadErr;

  return { path: objectPath, name: cleanName };
}

export async function upsertReference(refInput = {}) {
  const {
    id,
    profile_id,
    name,
    role,
    vessel_company,
    phone = null,
    email = null,
    file,
  } = refInput;

  if (!profile_id) throw new Error("profile_id es requerido.");
  if (!name || !role || !vessel_company) {
    throw new Error("name, role y vessel_company son requeridos.");
  }

  // Verifica sesión (necesaria para rutas de storage)
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  if (!user?.id) throw new Error("No hay sesión activa.");

  // Si hay archivo, súbelo primero
  let attachment_path = null;
  let attachment_name = null;

  if (typeof File !== "undefined" && file instanceof File) {
    const folderId =
      id ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

    const uploaded = await uploadReferenceFile(file, { refFolderId: folderId });
    attachment_path = uploaded.path; // "<uid>/refs/<folderId>/<filename>"
    attachment_name = uploaded.name;
  }

  const payload = {
    profile_id,
    name,
    role,
    vessel_company,
    phone,
    email,
  };

  if (attachment_path) {
    payload.attachment_path = attachment_path;
    payload.attachment_name = attachment_name;
  }

  if (!id) {
    // INSERT
    const { data, error } = await supabase
      .from("public_references")
      .insert([payload])
      .select("*")
      .single();
    if (error) throw error;
    return data;
  } else {
    // UPDATE
    const { data, error } = await supabase
      .from("public_references")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }
}

/**
 * Lista referencias por profile_id.
 */
export async function listReferencesByProfile(profileId) {
  if (!profileId) throw new Error("profileId requerido.");
  const { data, error } = await supabase
    .from("public_references")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Elimina una referencia por id (NO borra el archivo del storage).
 */
export async function deleteReference(id) {
  if (!id) throw new Error("id requerido.");
  const { data, error } = await supabase
    .from("public_references")
    .delete()
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/**
 * Obtiene una URL firmada temporal para descargar/ver el adjunto privado.
 * `path` es el storage.objects.name (sin el bucket), p.ej.: "<uid>/refs/<folderId>/<filename>"
 */
export async function getAttachmentSignedUrl(path, expiresInSec = 60) {
  if (!path) throw new Error("path requerido.");
  const { data, error } = await supabase.storage
    .from("cv-docs")
    .createSignedUrl(path, expiresInSec);
  if (error) throw error;
  return data?.signedUrl || null;
}

// Helpers
function sanitizeFilename(name) {
  return String(name)
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 200);
}