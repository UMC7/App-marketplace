import { timingSafeEqual } from "crypto";

function safeEqual(received, expected) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return receivedBuffer.length === expectedBuffer.length
    && timingSafeEqual(receivedBuffer, expectedBuffer);
}

/**
 * Protects server-to-server endpoints. These handlers use privileged keys and
 * must never fall back to accepting public traffic when configuration is absent.
 */
export function requireInternalKey(req, res) {
  const expected = process.env.WEB_API_INTERNAL_KEY;
  if (!expected) {
    console.error("Internal API key is not configured");
    res.status(503).json({ error: "Service unavailable" });
    return false;
  }

  const header = req.headers["x-internal-key"];
  const received = Array.isArray(header) ? header[0] : header;
  if (typeof received !== "string" || !safeEqual(received, expected)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  return true;
}
