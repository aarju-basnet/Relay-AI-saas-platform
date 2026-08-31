const STORAGE_KEY = "relay_session_id";

function generateSessionId() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let id = "sess_";

  for (let i = 0; i < 12; i++) {
    id += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return id;
}

export function getSessionId() {
  let sessionId =
    sessionStorage.getItem(STORAGE_KEY);

  if (!sessionId) {
    sessionId = generateSessionId();

    sessionStorage.setItem(
      STORAGE_KEY,
      sessionId
    );
  }

  return sessionId;
}