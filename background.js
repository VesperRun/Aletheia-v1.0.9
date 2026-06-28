/**
 * Aletheia background — local message routing only (no network).
 */

function isRestrictedUrl(url) {
  if (!url) return true;
  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("devtools://") ||
    url.startsWith("view-source:") ||
    url.startsWith("chrome-untrusted://")
  );
}

async function sendToActiveTab(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || isRestrictedUrl(tab.url || "")) return false;
  try {
    await chrome.tabs.sendMessage(tab.id, message);
    return true;
  } catch {
    return false;
  }
}

chrome.action.onClicked.addListener(async () => {
  await sendToActiveTab({ type: "ALETHEIA_TOGGLE_PANEL" });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "aletheia_toggle_reading") return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || isRestrictedUrl(tab.url || "")) return;

  await sendToActiveTab({ type: "ALETHEIA_TOGGLE_READING" });
});
