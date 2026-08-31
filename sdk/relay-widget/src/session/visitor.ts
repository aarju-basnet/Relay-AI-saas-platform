const STORAGE_KEY = "relay_visitor_id";

function generateVisitorId() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let id = "vis_";

  for (let i = 0; i < 12; i++) {
    id += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return id;
}

export function getVisitorId() {
  let visitorId =
    localStorage.getItem(STORAGE_KEY);

  if (!visitorId) {
    visitorId = generateVisitorId();

    localStorage.setItem(
      STORAGE_KEY,
      visitorId
    );
  }

  return visitorId;
}