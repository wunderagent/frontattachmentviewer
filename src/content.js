document.addEventListener('click', async function (event) {
  const element = event.target;
  const isAttachmentButton = Array.from(element.classList).filter(data => data.startsWith("attachmentBase__StyledAttachmentButton")).length > 0;
  if (!element.attributes.role === "button" || !isAttachmentButton) {
    return;
  }
  let url = element.querySelector('img')
    ?.getAttribute('src')
    ?.replace('?action=thumbnail', '?action=view')
    ?.replace('&action=thumbnail', '&action=view')

  if (!url) {
    return;
  }
  url = url + '&embedded=true';

  let pdfNameDiv = element.querySelector('div[class*="StyledNameDiv"]');
  let pdfName = pdfNameDiv ? pdfNameDiv.textContent.trim() : null;
  let fileExtension = pdfName ? pdfName.split('.').pop() : null;


  if (fileExtension !== 'pdf') {
    return;
  }

  event.stopPropagation();
  event.preventDefault();

  const modal = showModal();

  await chrome.runtime.sendMessage({ action: "fetchFile", fileUrl: "https://app.frontapp.com" + url },
    (response) => {
      if (document.body.contains(modal)) {
        injectFileToModal(response.data, pdfName)
      }
    });

}, true);

function showModal() {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="position:fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;">
      <div style="display:flex; flex-direction:column; background: white; margin: 12rem 18rem; padding: 2rem; border-radius: 1rem; width: 100%; height: 90%;">
        <div style="display:flex;">
          <button id="closeModal" style="margin-bottom: 2rem; width: 8rem;">Close</button>
          <div id="download-button-placeholder"></div>
        </div>
        <div id="attachment-placeholder" style="width: 100%; flex-grow: 1; height: 100%;"><p style="font-size: 2rem;">Loading...</p></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document?.getElementById('closeModal')?.addEventListener('click', function () {
    modal.remove();
  });

  return modal;
}


function injectFileToModal(base64Pdf, filename) {
  const byteCharacters = atob(base64Pdf.split(",")[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  const placeholder = document?.getElementById("attachment-placeholder");
  placeholder.innerHTML = `
    <object id="pdf" data="${blobUrl}" type="application/pdf" style="width: 100%; height: 100%;"></object>
  `;

  const button_placeholder = document?.getElementById("download-button-placeholder");
  const downloadButton = document.createElement('button');
  downloadButton.textContent = 'Download';
  button_placeholder.innerHTML = downloadButton.outerHTML;
  button_placeholder.onclick = () => {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.click();
  };
}
