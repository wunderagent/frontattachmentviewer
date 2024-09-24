chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    console.log(message)
    if (message.url && message.url.endsWith(".pdf")) {
      chrome.scripting.executeScript({
        target: {tabId: message.tabId},
        files: ["modal.js"]
      });
    }
    return true;
  }
);
