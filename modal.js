function showModal(pdfUrl) {
  alert("hello")
  let modal = document.createElement('div');
  modal.innerHTML = `
    <div style="position:fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;">
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%;">Marcel is the best</div>  
    <div style="background: white; padding: 20px; border-radius: 10px; max-width: 600px;">
        <p>You clicked on a PDF link: <a href="${pdfUrl}" target="_blank">${pdfUrl}</a></p>
        <button id="closeModal">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document?.getElementById('closeModal')?.addEventListener('click', function () {
    modal.remove();
  });
}

// Listening to messages from the content script
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'showModal') {
    showModal(request.url);
  }
  return true;
});
