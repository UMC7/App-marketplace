// src/components/cv/candidate/sectionscomponents/documents/documentssectioncontroller/docmanager/useSignedUrl.js
import { useCallback, useState } from "react";
import supabase from "../../../../../../supabase";

export default function useSignedUrl() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getSignedUrl = useCallback(async ({ bucket, path, expiresIn = 60, downloadName } = {}) => {
    setLoading(true);
    setError(null);
    setUrl("");

    try {
      if (!bucket || !path) {
        throw new Error("Missing bucket or path");
      }

      // Supabase Storage signed URL
      const options = {};
      if (downloadName) options.download = downloadName;

      const { data, error: err } = await supabase
        .storage
        .from(bucket)
        .createSignedUrl(path, expiresIn, options);

      if (err) throw err;
      const signed = data?.signedUrl || "";
      setUrl(signed);
      return signed;
    } catch (e) {
      setError(e);
      return "";
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setUrl("");
    setError(null);
    setLoading(false);
  }, []);

  return { url, loading, error, getSignedUrl, reset };
}

export async function openSignedInNewTab({ bucket, path, expiresIn = 60, downloadName } = {}) {
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .createSignedUrl(path, expiresIn, downloadName ? { download: downloadName } : undefined);

  if (error || !data?.signedUrl) return false;
  try {
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    return true;
  } catch {
    return false;
  }
}