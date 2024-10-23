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
  const url = request.fileUrl;
  handleRequest(sendResponse, url) // makes sure that the return statement is not being sent before this method is executed
  return true; // Indicates that sendResponse will be called asynchronously
});
