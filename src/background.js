const handleRequest = async (sendResponse, url) => {
  const response = await fetch(url);
  const fileBlob = await response.blob();

  // Convert Blob to Base64
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64data = reader.result;
    sendResponse({ success: true, data: base64data });
  };
  reader.readAsDataURL(fileBlob); // Read file as Base64
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateBadge") {
    updateBadge(request.isEnabled);
    return true;
  }
  if (request.action != "fetchFile")
    return true;

  chrome.storage.sync.get("isEnabled", (data) => {
    if (!data || !data.isEnabled) {
      return true;
    }
    const url = request.fileUrl;
    handleRequest(sendResponse, url) // makes sure that the return statement is not being sent before this method is executed
    return true; // Indicates that sendResponse will be called asynchronously
  });
});


// Update the extension badge
function updateBadge(isEnabled) {
  if (isEnabled) {
    chrome.action.setBadgeText({ text: "" });
  } else {
    chrome.action.setBadgeText({ text: "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: "red" });
  }
}

// Initialize badge on startup based on stored setting
chrome.storage.sync.get("isEnabled", (data) => {
  updateBadge(data.isEnabled ?? true);
});