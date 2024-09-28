const handleRequest = async (sendResponse, url) => {
  const response = await fetch(url);
  const fileBlob = await response.blob();

  // Convert Blob to Base64
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64data = reader.result;
    sendResponse({ success: true, base64data });
  };
  reader.readAsDataURL(fileBlob); // Read file as Base64
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const url = request.fileUrl;
  handleRequest(sendResponse, url) // makes sure that the return statement is not being sent before this method is executed
  return true; // Indicates that sendResponse will be called asynchronously
});

// async function getCurrentTab() {
//   let queryOptions = { active: true, lastFocusedWindow: true };
//   // `tab` will either be a `tabs.Tab` instance or `undefined`.
//   let [tab] = await chrome.tabs.query(queryOptions);
//   return tab;
// }

// const bla = (response) => {
//   // Create an iframe to display the file
//   const iframe = document.createElement("iframe");
//   iframe.src = response;
//   iframe.style.width = "100%";
//   iframe.style.height = "100vh";
  
//   document.body.appendChild(iframe);
  
//   // Optionally remove the iframe after some time or based on user action
//   setTimeout(() => {
//     iframe.remove();
//   }, 60000); // Example: after 60 seconds
// }

// function myShowModal(pdfUrl) {
//   console.log('Modal script executed');
//   let modal = document.createElement('div');
//   modal.innerHTML = `
//     <div style="position:fixed; top: 0; left: 0; width: 100%; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;">
//       <div style="background: white; padding: 20px; border-radius: 10px; max-width: 600px;">
//         <button id="closeModal">Close</button>
//         <iframe width="100%" height="100%" src="${pdfUrl}"></iframe>
//       </div>
//     </div>
//   `;
//   document.body.appendChild(modal);

//   document?.getElementById('closeModal')?.addEventListener('click', function () {
//     modal.remove();
//   });
// }