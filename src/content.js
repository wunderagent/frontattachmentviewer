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

  let fileName = element.querySelector('div[class*="StyledNameDiv"]')?.textContent?.trim() || null;
  let fileExtension = fileName?.split('.')?.pop() || null;

  mimeType = getMimeType(fileExtension);

  event.stopPropagation();
  event.preventDefault();

  const modal = showModal();

  await chrome.runtime.sendMessage({ action: "fetchFile", fileUrl: "https://app.frontapp.com" + url },
    (response) => {
      if (document.body.contains(modal)) {
        injectFileToModal(response.data, fileName, mimeType)
      }
    });

}, true);

function getMimeType(fileExtension) {
  const mimeTypes = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    xml: 'application/xml',
    csv: 'text/csv',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    // Add more mappings as needed
  };

  return mimeTypes[fileExtension];
}

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


function injectFileToModal(base64data, filename, mimeType) {
  const byteCharacters = atob(base64data.split(",")[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  const blobUrl = URL.createObjectURL(blob);

  const placeholder = document?.getElementById("attachment-placeholder");
  placeholder.innerHTML = `
    <object data="${blobUrl}" type="${mimeType}" style="width: 100%; height: 100%;"></object>
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
