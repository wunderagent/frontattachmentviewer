let shadow = null;
let scale = 1.0;
let pdfUrl = null;
let currentObjectAttachment = null;
let currentMimeType = null;
let attachments = [];
let printDocument = () => {}

const handleKeyPress = (event) => handleKeyPressGlobal(event);

const handleMouseClick = async function (event) {
  // Check if download button is clicked within Front App
  if (event.target.getAttribute('href') === '#icon-downloadCircle') {
    return;
  }

  // Check if the click event is within the popup
  if (event.target.id === "extension-container" || event.target.closest('#attachment-popup')) {
    return;
  }

  console.debug('Click event detected:', event.target);
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
  attachments = [];
  printDocument = () => {};

  url = "https://app.frontapp.com" + url;
  let fileName = element.querySelector('div[class*="StyledNameDiv"]')?.textContent?.trim() || null;
  // Create a container element
  const container = document.createElement('div');
  container.id = "extension-container";
  container.classList.add('layer');
  container.style.pointerEvents = 'auto';
  container.style.backgroundColor = 'rgba(0,0,0,0.9)';


  // Attach a shadow DOM to the container
  shadow = container.attachShadow({ mode: 'open' });

  // Add Tailwind CSS and HTML content to the shadow DOM
  shadow.innerHTML = `
    <link rel="stylesheet" href="chrome-extension://${chrome.runtime.id}/styles/tailwind.css">
    <div id="shadow-root" class="w-full h-full"></div>
  `;

  // Append the container to the body or a specific element on the page
  document.body.appendChild(container);

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

  attachments = findOtherAttachments(element);
  if (attachments.length > 1)
    addMultiAttachmentButtonsAndLogic(element, popup);
  adjustDownloadButton(fileName, url);
  adjustPrintButton();
  injectFileToModal(url, mimeType);
}

function createPopup(fileName) {
  const popup = document.createElement('div');
  popup.id = 'attachment-popup';
  popup.classList.add('w-full', 'h-full', 'flex', 'flex-col', 'pointer-events-auto', 'overflow-hidden', 'items-center', 'relative');
  shadow.getElementById("shadow-root").appendChild(popup);

  // popup header
  const popupHeader = document.createElement('div');
  popupHeader.id = 'popup-header';
  popupHeader.classList.add('h-16', 'flex', 'items-center', 'w-full', 'pointer-events-auto');

  // print button
  const print_button_placeholder = document.createElement('div');
  print_button_placeholder.id = 'print-button-placeholder';
  const printButton = document.createElement('a');
  printButton.id = 'printButton';
  printButton.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/images/svg/print.svg" alt="Drucken" width="18" height="18" />`;
  printButton.style.width = '32px';
  printButton.style.height = '32px';
  printButton.classList.add('mx-4', 'btn', 'btn-circle', 'h-8', 'w-8', 'border-none', 'pointer-events-auto');
  print_button_placeholder.appendChild(printButton);
  popupHeader.appendChild(print_button_placeholder);

  // download button
  const button_placeholder = document.createElement('div');
  button_placeholder.id = 'download-button-placeholder';
  const downloadButton = document.createElement('a');
  downloadButton.id = 'downloadButton';
  downloadButton.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/images/svg/download.svg" alt="Herunterladen" width="24" height="24" />`;
  downloadButton.style.width = '32px';
  downloadButton.style.height = '32px';
  downloadButton.classList.add('mx-4', 'btn', 'btn-circle', 'h-8', 'w-8', 'border-none', 'pointer-events-auto');
  button_placeholder.appendChild(downloadButton);
  popupHeader.appendChild(button_placeholder);

  // title
  const popupHeaderTitle = document.createElement('p');
  popupHeaderTitle.id = 'popup-header-title';
  popupHeaderTitle.classList.add('text-xl', 'text-white', 'ml-2', 'flex-grow', 'pointer-events-auto');
  popupHeaderTitle.innerText = fileName;
  popupHeader.prepend(popupHeaderTitle);

  // close button
  const closeButtonContainer = document.createElement('div');
  closeButtonContainer.classList.add('flex', 'justify-center', 'items-center', 'pointer-events-auto');
  const closeButton = document.createElement('button');
  closeButton.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/images/svg/close.svg" alt="Schliessen" width="24" height="24" />`;
  closeButton.id = 'closeModalButton';
  closeButton.classList.add('mx-4', 'btn', 'btn-circle', 'h-8', 'w-8', 'border-none', 'pointer-events-auto');
  closeButton.addEventListener('click', removeModal);
  closeButtonContainer.appendChild(closeButton);
  popupHeader.prepend(closeButtonContainer);

  popup.appendChild(popupHeader);


  // add main container
  const mainContainer = document.createElement('div');
  mainContainer.id = "popup-main";
  mainContainer.classList.add('h-full', 'w-full', 'flex', 'justify-center', 'overflow-hidden', 'pointer-events-auto');
  popup.appendChild(mainContainer);


  // add left arrow container
  const previousArrowContainer = document.createElement('div');
  previousArrowContainer.id = "left-container";
  previousArrowContainer.classList.add('pointer-events-auto', 'h-full', 'w-20', 'pl-8', 'flex', 'justify-center', 'items-center', 'absolute', 'top-1/2', 'transform', '-translate-y-1/2', 'left-0', 'pointer-events-auto');
  mainContainer.appendChild(previousArrowContainer);


  // add attachment container
  const canvasContainer = document.createElement('div');
  canvasContainer.id = "attachment-container";
  canvasContainer.classList.add('overflow-y-auto', 'h-full', 'w-fit', 'p-4', 'flex', 'flex-col', 'justify-start', 'items-center', 'pointer-events-auto');
  mainContainer.appendChild(canvasContainer);


  // add right arrow container
  const nextArrowContainer = document.createElement('div');
  nextArrowContainer.id = "right-container";
  nextArrowContainer.classList.add('pointer-events-auto', 'h-full', 'w-20', 'pr-8', 'flex', 'justify-center', 'items-center', 'absolute', 'top-1/2', 'transform', '-translate-y-1/2', 'right-0');
  mainContainer.appendChild(nextArrowContainer);

  // zoom controls
  const controls = document.createElement("div");
  controls.id = "zoom-controls";
  controls.classList.add('flex', 'justify-center', 'items-center', 'mb-4', 'p-1', 'w-fit', 'rounded-full', 'bg-black', 'bg-opacity-90', 'bg-scroll', 'absolute', 'bottom-2.5', 'left-1/2', 'transform', '-translate-x-1/2', 'pointer-events-auto');
  const button_zoom_in = document.createElement("button");
  button_zoom_in.id = "zoom-in";
  button_zoom_in.style.pointerEvents = 'auto';
  button_zoom_in.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/images/svg/plus.svg" alt="Vergrössern" width="24" height="24" />`;
  button_zoom_in.classList.add('text-white', 'mx-2', 'h-6', 'w-6', 'btn', 'btn-circle', 'border-none', 'pointer-events-auto');
  const button_zoom_out = document.createElement("button");
  button_zoom_out.id = "zoom-out";
  button_zoom_out.style.pointerEvents = 'auto';
  button_zoom_out.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/images/svg/minus.svg" alt="Verkleinern" width="24" height="24" />`;
  button_zoom_out.classList.add('text-white', 'mx-2', 'h-6', 'w-6', 'btn', 'btn-circle', 'border-none', 'pointer-events-auto');
  const button_zoom_reset = document.createElement("button");
  button_zoom_reset.id = "zoom-reset";
  button_zoom_reset.style.pointerEvents = 'auto';
  button_zoom_reset.innerHTML =  `<img src="chrome-extension://${chrome.runtime.id}/images/svg/zoom.svg" alt="Reset" width="24" height="24" />`;
  button_zoom_reset.classList.add('text-white', 'mx-4', 'text-lg', 'h-8', 'w-8', 'pointer-events-auto');

  controls.appendChild(button_zoom_out);
  controls.appendChild(button_zoom_reset);
  controls.appendChild(button_zoom_in);
  popup.appendChild(controls);
  return popup;
}

const removeModal = () => {
  const modal = document.getElementById('extension-container');
  if (modal) {
    const closeButton = shadow.getElementById('closeModalButton');
    closeButton.removeEventListener('click', removeModal);
    document.removeEventListener('keydown', handleKeyPress);
    removeCurrentInjectedContent();
    modal.remove();
  }
};

function adjustPrintButton() {
  const printButton = shadow.getElementById("printButton");
  printButton.onclick = printDocument;
}

function adjustDownloadButton(fileName, url, mimeType) {
  const downloadButton = shadow.getElementById("downloadButton");
  downloadButton.href = url;
  downloadButton.download = fileName;
  downloadButton.mimeType = mimeType;
}

function findOtherAttachments(currentStyledAttachmentButton) {
  console.debug('Finding attachments');
  let rootAttachmentElement = currentStyledAttachmentButton;

  // get root attachment element
  while (rootAttachmentElement && Array.from(rootAttachmentElement.classList).filter(data => data.startsWith("messageViewerAttachments__StyledAttachmentsDiv")).length === 0) {
    rootAttachmentElement = rootAttachmentElement.parentElement;
  }
  if (!rootAttachmentElement) {
    console.debug('No attachments root found, exiting');
    return []
  }
  return Array.from(rootAttachmentElement.querySelectorAll('[class*="attachmentBase__StyledAttachmentButton"]'));
}

const navigateAttachments = async (attachmentElements, direction) => {
  console.debug('Navigating attachments, direction:', direction);
  let newIndex = currentAttachmentIndex + direction;
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

  const title = shadow.getElementById('popup-header-title');
  title.innerText = fileName

  switch (mimeType) {
    case 'application/pdf':
      await injectPDFViewer();
      break;
    default:
      await injectObjectViewer();
      break;
  }

  const url = "https://app.frontapp.com" + newUrl
  adjustDownloadButton(fileName, url);
  adjustPrintButton();
  injectFileToModal(url, mimeType);
  console.debug('New file injected into modal');
  currentAttachmentIndex = newIndex;
};

let currentAttachmentIndex;
const moveToPreviousAttachment = async () => await navigateAttachments(attachments, -1, currentAttachmentIndex);
const moveToNextAttachment = async () => await navigateAttachments(attachments, 1, currentAttachmentIndex);

function addMultiAttachmentButtonsAndLogic(element) {
  currentAttachmentIndex = attachments.indexOf(element);
  console.debug('Current attachment index:', currentAttachmentIndex);

  // controls
  const leftArrow = document.createElement("button");
  leftArrow.id = "leftArrow";
  leftArrow.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/images/svg/arrow-left.svg" alt="Vorherige" width="24" height="24" />`;
  leftArrow.classList.add('pointer-events-auto', 'btn', 'btn-circle', 'h-8', 'w-8', 'border-none');
  leftArrow.onclick = moveToPreviousAttachment;
  const leftContainer = shadow.getElementById('left-container');
  leftContainer.appendChild(leftArrow);

  const rightArrow = document.createElement('button');
  rightArrow.id = 'rightArrow';
  rightArrow.classList.add('mr-8', 'pointer-events-auto', 'btn', 'btn-circle', 'h-8', 'w-8', 'border-none');
  rightArrow.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/images/svg/arrow-right.svg" alt="Nächste" width="24" height="24" />`;
  rightArrow.onclick = moveToNextAttachment;
  const rightContainer = shadow.getElementById('right-container');
  rightContainer.appendChild(rightArrow);
  // end controls
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

function removeCurrentInjectedContent() {
  const event = new Event("discard");
  console.debug("Dispatch 'discard' event");
  document.dispatchEvent(event);

  const currentScript = shadow.getElementById('attachment-viewer-script');
  if (currentScript)
    document.head.removeChild(currentScript);
  const placeholder = shadow.getElementById('attachment-placeholder');
  if (placeholder)
    placeholder.remove();
}

async function injectPDFViewer() {
  removeCurrentInjectedContent();
  const script = document.createElement("script");
  script.id = "attachment-viewer-script";
  script.src = chrome.runtime.getURL("pdf.js");
  script.type = "module";
  script.onload = onLoadPdfScript;
  document.head.appendChild(script);
  return await new Promise(resolve => setTimeout(resolve, 200));
}

async function injectObjectViewer() {
  removeCurrentInjectedContent();
  const script = document.createElement("script");
  script.id = "attachment-viewer-script";
  script.src = chrome.runtime.getURL("placeholder.js");
  console.debug('Placeholder script src:', script.src);
  script.type = "module";
  script.onload = onLoadObjectViewerScript;
  document.head.appendChild(script);
  return await new Promise(resolve => setTimeout(resolve, 200));
}

// Convert Base64 to Uint8Array
function injectFileToModal(url, mimeType) {
  const event = new CustomEvent("CustomEvent", { detail: { action: "injectPopup", data: url, mimeType: mimeType } });
  console.debug("Dispatch 'injectPopup' event");
  document.dispatchEvent(event);
}

// Listen for changes to chrome.storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.isEnabled) {
    const isEnabled = changes.isEnabled.newValue ?? true;
    if (isEnabled) {
      document.addEventListener('click', handleMouseClick, true);
      document.addEventListener('keydown', handleKeyPress, true);
    } else {
      document.removeEventListener('click', handleMouseClick, true);
      document.removeEventListener('keydown', handleKeyPress, true);
    }
  }
});

// Initial setup
chrome.storage.sync.get("isEnabled", (data) => {
  if (data.isEnabled ?? true) {
    document.addEventListener('click', handleMouseClick, true);
    document.addEventListener('keydown', handleKeyPress, true);
  }
});
