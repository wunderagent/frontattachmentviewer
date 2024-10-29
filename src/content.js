document.addEventListener('click', async function (event) {
  console.log('Click event detected');
  let element = event.target;

  if (["closeModal", "downloadButton"].includes(element.id)) {
    console.log('Click on closeModal or downloadButton, exiting');
    return;
  }

  // get root attachment element
  while (element && Array.from(element.classList).filter(data => data.startsWith("attachmentBase__StyledAttachmentButton")).length === 0) {
    element = element.parentElement;
  }
  if (!element) {
    console.log('No attachment element found, exiting');
    return;
  }

  let url = element.querySelector('img')
    ?.getAttribute('src')
    ?.replace('?action=thumbnail', '?action=view')
    ?.replace('&action=thumbnail', '&action=view');

  if (!url) {
    console.log('No URL found, exiting');
    return;
  }

  event.stopPropagation();
  event.preventDefault();
  console.log('Event propagation stopped and default prevented');
  
  url = url + '&embedded=true';
  console.log('URL:', url);

  let fileName = element.querySelector('div[class*="StyledNameDiv"]')?.textContent?.trim() || null;
  let fileExtension = fileName?.split('.')?.pop() || null;
  console.log('File name:', fileName);
  console.log('File extension:', fileExtension);

  const modal = showModal();
  console.log('Modal shown');

  await chrome.runtime.sendMessage({ action: "fetchFile", fileUrl: "https://app.frontapp.com" + url },
    (response) => {
      console.log('File fetched from backend');
      if (document.body.contains(modal)) {
        injectFileToModal(response.data, fileName, getMimeType(fileExtension));
        console.log('File injected into modal');
        findAttachments(element, modal);
      }
    });

}, true);

function findAttachments(element, modal) {
  console.log('Finding attachments');
  const attachmentElements = Array.from(document.querySelectorAll('[class*="attachmentBase__StyledAttachmentButton"]'));
  if (attachmentElements.length <= 1) {
    console.log('No other attachments found');
    return;
  }
  let currentIndex = attachmentElements.indexOf(element);
  console.log('Current attachment index:', currentIndex);

  const navigateAttachments = (direction) => {
    console.log('Navigating attachments, direction:', direction);
    let newIndex = currentIndex + direction;
    console.log('New index calculated:', newIndex);

    if (newIndex < 0) {
      console.log('New index is less than 0, exiting');
      return;
    }
    if (newIndex >= attachmentElements.length) {
      console.log('New index is greater than or equal to attachment elements length, exiting');
      return;
    }

    const newElement = attachmentElements[newIndex];
    const newUrl = newElement.querySelector('img')
      ?.getAttribute('src')
      ?.replace('?action=thumbnail', '?action=view')
      ?.replace('&action=thumbnail', '&action=view') + '&embedded=true';

    console.log('New URL:', newUrl);

    chrome.runtime.sendMessage({ action: "fetchFile", fileUrl: "https://app.frontapp.com" + newUrl },
      (response) => {
        console.log('New file fetched from backend');
        if (document.body.contains(modal)) {
          filename = newElement.querySelector('div[class*="StyledNameDiv"]')?.textContent?.trim();
          injectFileToModal(response.data, filename, getMimeType(filename.split('.').pop()));
          console.log('New file injected into modal');
        }
        currentIndex = newIndex;
      });
  };

  const leftArrow = document.createElement('button');
  leftArrow.id = 'leftArrow';
  leftArrow.textContent = '<';
  leftArrow.onclick = () => navigateAttachments(-1);
  modal.querySelector('div').appendChild(leftArrow);
  console.log('Left arrow added to modal');

  const rightArrow = document.createElement('button');
  rightArrow.id = 'rightArrow';
  rightArrow.textContent = '>';
  rightArrow.onclick = () => navigateAttachments(1);
  modal.querySelector('div').appendChild(rightArrow);
  console.log('Right arrow added to modal');
}

function getMimeType(fileExtension) {
  console.log('Getting MIME type for extension:', fileExtension);
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
  console.log('Showing modal');
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
    console.log('Closing modal');
    modal.remove();
  });

  return modal;
}

function injectFileToModal(base64data, filename, mimeType) {
  console.log('Injecting file to modal');
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
  downloadButton.id = 'downloadButton';
  downloadButton.textContent = 'Download';
  button_placeholder.innerHTML = downloadButton.outerHTML;
  button_placeholder.onclick = () => {
    console.log('Downloading file');
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.click();
  };
}
