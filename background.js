chrome.runtime.onMessage.addListener(
  async (message) => {
    let currentTab = await getCurrentTab();
    if (message.url && currentTab?.id) {
      chrome.scripting.executeScript({
        target: {tabId: currentTab.id, allFrames: true},
        // files: ['modal.js'],
        injectImmediately: true,
        function: myShowModal,
        args: [message.url]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        } else {
          console.log('Script injected successfully');
        }
      });
    }
    return true;
  }
);

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  // `tab` will either be a `tabs.Tab` instance or `undefined`.
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function myShowModal(pdfUrl) {
  console.log('Modal script executed');
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