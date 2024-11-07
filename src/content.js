document.addEventListener('click', async function (event) {

  // TODO masto: also include the case where the user clicks anywhere inside Modal
  if (["closeModal", "downloadButton", "zoom-in", "zoom-out"].includes(event.target.id)) {
    return;
  }

  console.debug('Click event detected:', event.target.id);
  let element = event.target;

  // get root attachment element
  while (element && Array.from(element.classList).filter(data => data.startsWith("attachmentBase__StyledAttachmentButton")).length === 0) {
    element = element.parentElement;
  }
  if (!element) {
    console.debug('No attachment element found, exiting');
    return;
  }

  let url = element.querySelector('img')
    ?.getAttribute('src')
    ?.replace('?action=thumbnail', '?action=view')
    ?.replace('&action=thumbnail', '&action=view');

  if (!url) {
    console.debug('No URL found, exiting');
    return;
  }

  event.stopPropagation();
  event.preventDefault();
  console.debug('Event propagation stopped and default prevented');

  url = "https://app.frontapp.com" + url;
  let fileName = element.querySelector('div[class*="StyledNameDiv"]')?.textContent?.trim() || null;
  const popup = createPopup(fileName);
  const mimeType = getMimeType(fileName?.split('.')?.pop() || null);

  switch (mimeType) {
    case 'application/pdf':
      await injectPDFViewer();
      break;
    default:
      await injectObjectViewer();
      break;
  }
  
  findAttachments(element, popup);
  adjustDownloadButton(fileName, url);
  injectFileToModal(url, mimeType);
  console.debug('File injected into modal');

}, true);

function createPopup(fileName) {
  const popup = document.createElement('div');
  popup.id = 'attachment-popup';
  popup.classList.add('layer');
  popup.style.backgroundColor = "rgba(0,0,0,0.8)";
  popup.style.pointerEvents = 'auto';
  popup.style.overflow = "hidden";
  document.body.appendChild(popup);

  // popup header
  const popupHeader = document.createElement('div');
  popupHeader.id = 'popup-header';
  popupHeader.style.height = '4rem';
  popupHeader.style.display = 'flex';
  popupHeader.style.backgroundColor = 'black';

  // download button
  const button_placeholder = document.createElement('div');
  button_placeholder.id = 'download-button-placeholder';
  const downloadButton = document.createElement('button');
  downloadButton.id = 'downloadButton';
  downloadButton.textContent = 'Download';
  button_placeholder.appendChild(downloadButton);
  popupHeader.appendChild(button_placeholder);

  //title
  const popupHeaderTitle = document.createElement('h1');
  popupHeaderTitle.style.color = 'white';
  popupHeaderTitle.innerText = fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName;
  popupHeader.prepend(popupHeaderTitle);

  // close button
  const closeButtonContainer = document.createElement('div');
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.id = 'closeModal';
  closeButton.addEventListener('click', () => {
    const modal = document.getElementById('attachment-popup');
    if (modal) {
      modal.remove();
    }
  });
  closeButtonContainer.appendChild(closeButton);
  popupHeader.prepend(closeButtonContainer);

  popup.appendChild(popupHeader);


  // add attachment container
  const canvasContainer = document.createElement('div');
  canvasContainer.id = "attachment-container";
  canvasContainer.style.overflowY = 'auto';
  canvasContainer.style.height = '88vh'; // Adjust height as needed
  canvasContainer.style.display = "flex";
  canvasContainer.style.flexDirection = 'column';
  canvasContainer.style.justifyContent = "center";
  canvasContainer.style.alignItems = 'center'; // Center items horizontally
  canvasContainer.style.marginTop = '0.5rem';
  popup.appendChild(canvasContainer);

  // zoom controls
  const controls = document.createElement("div");
  controls.id = "zoom-controls";
  controls.classList.add("layer");
  controls.style.display = "flex";
  controls.style.justifyContent = "center";
  controls.style.alignItems = "end";
  controls.style.paddingBottom = "1rem";
  const button_zoom_in = document.createElement("button");
  button_zoom_in.id = "zoom-in";
  button_zoom_in.style.pointerEvents = 'auto';
  button_zoom_in.innerHTML = "+";
  const button_zoom_out = document.createElement("button");
  button_zoom_out.id = "zoom-out";
  button_zoom_out.style.pointerEvents = 'auto';
  button_zoom_out.innerHTML = "-";

  controls.appendChild(button_zoom_in);
  controls.appendChild(button_zoom_out);
  popup.appendChild(controls);
  return popup;
}

function adjustDownloadButton(fileName, url, mimeType) {
  const downloadButton = document?.getElementById("download-button-placeholder");
  downloadButton.onclick = () => {
    console.log('Open file downloader');
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.mimeType = mimeType;
    link.click();
  };
}

function findAttachments(element, modal) {
  console.debug('Finding attachments');
  const attachmentElements = Array.from(document.querySelectorAll('[class*="attachmentBase__StyledAttachmentButton"]'));
  if (attachmentElements.length <= 1) {
    console.debug('No other attachments found');
    return;
  }
  let currentIndex = attachmentElements.indexOf(element);
  console.debug('Current attachment index:', currentIndex);

  const navigateAttachments = async (direction) => {
    console.debug('Navigating attachments, direction:', direction);
    let newIndex = currentIndex + direction;
    console.debug('New index calculated:', newIndex);

    if (newIndex < 0 || newIndex >= attachmentElements.length) {
      console.debug('New index out of bounds, exiting');
      return;
    }

    const newElement = attachmentElements[newIndex];
    const newUrl = newElement.querySelector('img')
      ?.getAttribute('src')
      ?.replace('?action=thumbnail', '?action=view')
      ?.replace('&action=thumbnail', '&action=view') + '&embedded=true';

    console.debug('New URL:', newUrl);

    const fileName = newElement.querySelector('div[class*="StyledNameDiv"]')?.textContent?.trim();
    const mimeType = getMimeType(fileName?.split('.')?.pop() || null);

    const title = document.getElementById('popup-header').querySelector('h1');
    title.innerText = fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName

    switch (mimeType) {
      case 'application/pdf':
        await injectPDFViewer();
        break;
      default:
        await injectObjectViewer();
        break;
    }

    const url = "https://app.frontapp.com" + newUrl
    if (document.body.contains(modal)) {
      adjustDownloadButton(fileName, url);
      injectFileToModal(url, mimeType);
      console.debug('New file injected into modal');
    }
    currentIndex = newIndex;
  };

  const leftArrow = document.createElement('button');
  leftArrow.id = 'leftArrow';
  leftArrow.textContent = '<';
  leftArrow.onclick = async () => await navigateAttachments(-1);
  modal.querySelector('div').appendChild(leftArrow);
  console.debug('Left arrow added to modal');

  const rightArrow = document.createElement('button');
  rightArrow.id = 'rightArrow';
  rightArrow.textContent = '>';
  rightArrow.onclick = async () => await navigateAttachments(1);
  modal.querySelector('div').appendChild(rightArrow);
  console.debug('Right arrow added to modal');
}

function getMimeType(fileExtension) {
  console.debug('Getting MIME type for extension:', fileExtension);
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
  console.debug('Showing modal');
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="position:fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; flex-direction:column; justify-content: center; align-items: center;">
      <div id="modal-head" style="position:fixed; top:0; left:0; width:100%; height:8rem; display:flex; background:black; padding:2rem;">
        <h1 style="color: white; font-size: 2rem; flex-grow:1;">Attachment Viewer</h1>
        <div id="download-button-placeholder"></div>
        <button id="closeModal" style="margin-bottom: 2rem; width: 8rem;">Close</button>
      </div>
      <div id="modal-content" style="display:flex; flex-direction:column; background: white; margin: 12rem 18rem; padding: 2rem; border-radius: 1rem; width: 100%; height: 90%;">
        
        <div id="attachment-placeholder" style="width: 100%; flex-grow: 1; height: 100%;"><p style="font-size: 2rem;">Loading...</p></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document?.getElementById('closeModal')?.addEventListener('click', function () {
    console.debug('Closing modal');
    modal.remove();
  });

  return modal;
}

function removeCurrentInjectedContent() {
  const currentScript = document.getElementById('attachment-viewer-script');
  if (currentScript)
    document.head.removeChild(currentScript);
  const placeholder = document.getElementById('attachment-placeholder');
  if (placeholder)
    placeholder.remove();
}

let pdfDoc = null; 
async function injectPDFViewer() {
  removeCurrentInjectedContent();
  const script = document.createElement("script");
  script.id = "attachment-viewer-script";
  script.src = chrome.runtime.getURL("pdf.js");
  script.type = "module";

  // Set up PDF rendering in the injected script
  script.onload = async () => {
    const pdfjsLib = await import(chrome.runtime.getURL("pdf.js"))
     {
        console.debug("script loaded");
        let scale = 1.0;

        document.addEventListener("CustomEvent", async (event) => {
          console.debug("Received message in popup.js:", event);
          if (event.detail.action
            && event.detail.action == "injectPopup"
            && event.detail.data) {
            console.debug("PDF URL:", event.detail.data);
            pdfDoc = await pdfjsLib.getDocument({ url: event.detail.data }).promise;
            loadPdf();
          }
        });

        document.getElementById('zoom-in').addEventListener('click', () => {
          console.debug("Zoom in clicked");
          scale += 0.1;
          loadPdf();
        });

        document.getElementById('zoom-out').addEventListener('click', () => {
          console.debug("Zoom out clicked");
          scale = Math.max(0.5, scale - 0.1); // minimum zoom level
          loadPdf();
        });

        // Configure PDF.js to use the local worker script
        pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.js');
        console.debug("worker imported");

        function loadPdf() {
          // Load the PDF and render the first page
          console.debug("pdfDoc:", pdfDoc);
              const numPages = pdfDoc.numPages;
              const canvasContainer = document.getElementById('attachment-container');
              canvasContainer.innerHTML = ''; // Clear previous content

              const outputScale = window.devicePixelRatio || 1;

              for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                pdfDoc.getPage(pageNum)
                  .then(page => {
                    const viewport = page.getViewport({ scale: scale });
                    const canvas = document.createElement('canvas');
                    canvas.style.marginBottom = '1rem';
                    canvas.width = Math.floor(viewport.width * outputScale);
                    canvas.height = Math.floor(viewport.height * outputScale);
                    canvas.style.width = `${viewport.width}px`;
                    canvas.style.height = `${viewport.height}px`;
                    const context = canvas.getContext('2d');
                    context.scale(outputScale, outputScale);

                    const renderContext = {
                      canvasContext: context,
                      viewport: viewport
                    };

                    canvasContainer.appendChild(canvas);
                    page.render(renderContext);
                  })
                  .catch(error => {
                    console.error("Error loading PDF:", error);
                  });
              }
        }
      };
  };

  // Append the script to the DOM to load it
  document.head.appendChild(script);
  return await new Promise(resolve => setTimeout(resolve, 200));
}

let currentObjectAttachment = null;
let currentMimeType = null;
async function injectObjectViewer() {
  removeCurrentInjectedContent();

  // const container = document.getElementById('attachment-container');
  // const canvas = document.createElement('div');
  // canvas.id = 'attachment-placeholder';
  // canvas.style.marginTop = '1rem';
  // container.appendChild(canvas);

  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("object_viewer.js");
  script.id = "attachment-viewer-script";
  script.type = "module";

  // Set up Object rendering in the injected script
  script.onload = () => {
    console.debug("script loaded");
    let scale = 1.0;

    document.addEventListener("CustomEvent", (event) => {
      console.debug("Received message in popup.js:", event);
      if (event.detail.action
        && event.detail.action == "injectPopup"
        && event.detail.data) {
        currentObjectAttachment = event.detail.data;
        currentMimeType = event.detail.mimeType;
        loadAttachment();
      }
    });

    document.getElementById('zoom-in').addEventListener('click', () => {
      console.debug("Zoom in clicked");
      scale += 0.1;
      loadAttachment();
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
      console.debug("Zoom out clicked");
      scale = Math.max(0.5, scale - 0.1); // minimum zoom level
      loadAttachment();
    });

    // Configure PDF.js to use the local worker script
    console.debug("worker imported");

    function loadAttachment() {
      const canvasContainer = document.getElementById('attachment-container');
      canvasContainer.innerHTML = ''; // Clear previous content

      if (!canvasContainer) {
        console.debug(`Canvas not found`,);
        return;
      }
      canvasContainer.clientWidth = "100%";
      canvasContainer.clientHeight = "100%";
      canvasContainer.style.width = `100%`;
      canvasContainer.style.height = `100%`;

      const width = canvasContainer.clientWidth * scale;
      const height = canvasContainer.clientHeight * scale;
      // canvasContainer.style.width = `${width}px`;
      // canvasContainer.style.height = `${height}px`;

      const canvas = document.createElement('object');
      canvas.style.width = 'auto';
      canvas.style.height = `${height}px`;
      canvas.data = currentObjectAttachment;
      canvas.type = currentMimeType;
      canvasContainer.appendChild(canvas);

    }
  };

  // Append the script to the DOM to load it
  document.head.appendChild(script);
  return await new Promise(resolve => setTimeout(resolve, 200));
}

// Convert Base64 to Uint8Array
function injectFileToModal(url, mimeType) {
  const event = new CustomEvent("CustomEvent", { detail: { action: "injectPopup", data: url, mimeType: mimeType } });
  console.debug("Dispatch event");
  document.dispatchEvent(event);
}
