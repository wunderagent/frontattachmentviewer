let shadow = null;
let scale = 1.0;
let pdfUrl = null;
let currentObjectAttachment = null;
let currentMimeType = null;
let currentFileName = null;
let attachments = [];
let printDocument = () => {}
let attachmentProcessor = null;
const BASE_PATH = "/cell-00016/api/1/companies/ab15a3e2e8561d957cb4/attachments/"

const handleKeyPress = (event) => handleKeyPressGlobal(event);

const shouldBeIgnored = (element) => {
  const ref = element.getAttribute('href');
  const dataTestId = element.getAttribute('data-testid');
  const toBeIgnoredHrefs = ['#icon-downloadCircle', '#icon-downloadTiny', "#icon-x-circle"];
  const toBeIgnoredDataTestIds = ['crossCircle', "x-circle"];
  // Check if download button is clicked within Front App
  if (toBeIgnoredHrefs.some(name => ref.includes(name))
    // Close / Erase button etc. should be ignored
    || toBeIgnoredDataTestIds.some(name => dataTestId.includes(name))
    // Check if the click event is within the popup
    || element.id === "extension-container"
    || element.closest('#attachment-popup')) {
    return true;
  }
  return false;
}

const handleMouseClick = async function (event) {
  console.debug('Click event detected:', event.target);
  let element = event.target;

  // get root attachment element
  while (element){

    if (shouldBeIgnored(element)) {
      return;
    }

    if (Array.from(element.classList).filter(data => data.startsWith("attachmentBase__StyledAttachmentButton")).length > 0
    || Array.from(element.classList).filter(data => data.startsWith("commentAttachment__StyledAttachmentBase")).length > 0
    || Array.from(element.classList).filter(data => data.startsWith("commentViewerSingleImageAttachment__StyledAttachmentDragSource")).length > 0) {
      break;
    }
    else {
      element = element.parentElement;
    }
  }
  if (!element) {
    console.debug('No attachment element found, exiting');
    return;
  }

  let attachmentId = getAttachmentId(element);
  if (!attachmentId) {
    console.debug('No URL found, exiting');
    return;
  }
  let url = BASE_PATH + attachmentId + "?action=view";

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
  adjustOpenTabButton(url)
  injectFileToModal(url, mimeType, fileName);
}

const addHoverEffect = (element) => {
  element.style.transition = 'background-color 0.2s';
  element.style.borderRadius = '9999px';
  element.style.position = 'relative';
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'center';
  element.onmouseover = () => element.style.backgroundColor = 'rgb(55, 65, 81)'; // gray-700
  element.onmouseout = () => element.style.backgroundColor = 'transparent';
};

function createPopup(fileName) {

  const popup = document.createElement('div');
  popup.id = 'attachment-popup';
  popup.classList.add('w-full', 'h-full', 'flex', 'flex-col', 'pointer-events-auto', 'overflow-hidden', 'items-center', 'relative');
  shadow.getElementById("shadow-root").appendChild(popup);

  // popup header
  const popupHeader = document.createElement('div');
  popupHeader.id = 'popup-header';
  popupHeader.classList.add('h-16', 'flex', 'items-center', 'w-full', 'pointer-events-auto');

  // open in new tab button
  const open_tab_button_placeholder = document.createElement('div');
  open_tab_button_placeholder.id = 'open-tab-button-placeholder';
  const open_tabButton = document.createElement('button');
  open_tabButton.id = 'open-tab-Button';
  open_tabButton.title = 'In neuem Tab öffnen';
  open_tabButton.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/images/svg/open-tab.svg" alt="In neuem Tab öffnen" width="18" height="18" />`;
  open_tabButton.style.width = '32px';
  open_tabButton.style.height = '32px';
  open_tabButton.classList.add('mx-4', 'h-8', 'w-8', 'border-none', 'pointer-events-auto');
  addHoverEffect(open_tabButton);
  open_tab_button_placeholder.appendChild(open_tabButton);
  popupHeader.appendChild(open_tab_button_placeholder);

  // print button
  const print_button_placeholder = document.createElement('div');
  print_button_placeholder.id = 'print-button-placeholder';
  const printButton = document.createElement('button');
  printButton.id = 'printButton';
  printButton.title = 'Drucken';
  printButton.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/images/svg/print.svg" alt="Drucken" width="18" height="18" />`;
  printButton.style.width = '32px';
  printButton.style.height = '32px';
  printButton.classList.add('mx-2', 'h-8', 'w-8', 'border-none', 'pointer-events-auto');
  addHoverEffect(printButton);
  print_button_placeholder.appendChild(printButton);
  popupHeader.appendChild(print_button_placeholder);

  // download button
  const button_placeholder = document.createElement('div');
  button_placeholder.id = 'download-button-placeholder';
  const downloadButton = document.createElement('button');
  downloadButton.id = 'downloadButton';
  downloadButton.title = 'Herunterladen';
  downloadButton.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/images/svg/download.svg" alt="Herunterladen" width="24" height="24" />`;
  downloadButton.style.width = '32px';
  downloadButton.style.height = '32px';
  downloadButton.classList.add('mx-4', 'h-8', 'w-8', 'border-none', 'pointer-events-auto');
  addHoverEffect(downloadButton);
  button_placeholder.appendChild(downloadButton);
  popupHeader.appendChild(button_placeholder);

  // title
  const popupHeaderTitle = document.createElement('p');
  popupHeaderTitle.id = 'popup-header-title';
  popupHeaderTitle.classList.add('text-xl', 'text-white', 'ml-2', 'flex-grow', 'pointer-events-auto');
  
  const updateTitle = (fileName) => {
    if (!fileName) {
      popupHeaderTitle.innerText = '';
      return;
    }
    const maxLength = Math.floor(window.innerWidth * 0.3 / 8);
    const title = fileName.length > maxLength ? fileName.slice(0, Math.floor(maxLength/2)) + '...' + fileName.slice(-Math.floor(maxLength/2)) : fileName;
    popupHeaderTitle.innerText = title;
  };
  
  updateTitle(fileName);
  window.addEventListener('resize', () => updateTitle(fileName));
  popupHeader.prepend(popupHeaderTitle);

  // close button
  const closeButtonContainer = document.createElement('div');
  closeButtonContainer.classList.add('flex', 'justify-center', 'items-center', 'pointer-events-auto');
  const closeButton = document.createElement('button');
  closeButton.title = 'Schliessen';
  closeButton.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/images/svg/close.svg" alt="Schliessen" width="24" height="24" />`;
  closeButton.id = 'closeModalButton';
  closeButton.classList.add('mx-4', 'h-8', 'w-8', 'border-none', 'pointer-events-auto');
  addHoverEffect(closeButton);
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
  controls.classList.add('flex', 'justify-center', 'items-center', 'mt-4', 'mb-4', 'w-fit', 'rounded-full', 'bg-black', 'bg-opacity-90', 'bg-scroll', 'absolute', 'bottom-2.5', 'left-1/2', 'transform', '-translate-x-1/2', 'pointer-events-auto');
  const button_zoom_in = document.createElement("button");
  button_zoom_in.id = "zoom-in";
  button_zoom_in.title = "Vergrössern";
  button_zoom_in.style.pointerEvents = 'auto';
  button_zoom_in.style.borderRadius = '9999px';
  button_zoom_in.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/images/svg/plus.svg" alt="Vergrössern" width="24" height="24" />`;
  button_zoom_in.classList.add('text-white', 'mx-2', 'h-6', 'w-6', 'border-none', 'pointer-events-auto');
  addHoverEffect(button_zoom_in);
  const button_zoom_out = document.createElement("button");
  button_zoom_out.id = "zoom-out";
  button_zoom_out.title = "Verkleinern";
  button_zoom_out.style.pointerEvents = 'auto';
  button_zoom_out.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/images/svg/minus.svg" alt="Verkleinern" width="24" height="24" />`;
  button_zoom_out.classList.add('text-white', 'mx-2', 'h-6', 'w-6', 'border-none', 'pointer-events-auto');
  addHoverEffect(button_zoom_out);
  const button_zoom_reset = document.createElement("button");
  button_zoom_reset.id = "zoom-reset";
  button_zoom_reset.title = "Reset";
  button_zoom_reset.style.pointerEvents = 'auto';
  button_zoom_reset.innerHTML =  `<img src="chrome-extension://${chrome.runtime.id}/images/svg/zoom.svg" alt="Reset" width="24" height="24" />`;
  button_zoom_reset.classList.add('text-white', 'mx-4', 'text-lg', 'h-8', 'w-8', 'pointer-events-auto');
  addHoverEffect(button_zoom_reset);

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
  downloadButton.onclick = async () => {
    console.debug('Downloading file:', fileName);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      shadow.appendChild(link);
      link.click();
      shadow.removeChild(link);
      
      // Clean up the blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback to direct download if fetch fails
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.setAttribute('target', '_blank');
      shadow.appendChild(link);
      link.click();
      shadow.removeChild(link);
    }
  };
}

function adjustOpenTabButton(url) {
  const openTabButton = shadow.getElementById("open-tab-Button");
  openTabButton.onclick = () => window.open(url, '_blank', 'noopener,noreferrer');
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

const getAttachmentId = (element) => {
  if (Array.from(element.classList).filter(data => data.startsWith("commentViewerSingleImageAttachment__StyledAttachmentDragSource")).length > 0) {
    const src = element.querySelector('img')?.src;
    if (src) {
      const parts = src.split("/attachments/");
      if (parts.length > 1) {
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes("?")) {
          return lastPart.split("?")[0];
        }
        else {
          return lastPart;
        }
      }
    }
  }

  const dataTestId = element.getAttribute('data-testid');
  if (dataTestId) {
    const parts = dataTestId.split("-");
    return parts[parts.length - 1];
  }
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
  let attachmentId = getAttachmentId(newElement);
  let newUrl = BASE_PATH + attachmentId + "?action=view";

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
  adjustOpenTabButton(url)
  injectFileToModal(url, mimeType, fileName);
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
  leftArrow.title = "Vorherige";
  leftArrow.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/images/svg/arrow-left.svg" alt="Vorherige" width="24" height="24" />`;
  leftArrow.classList.add('pointer-events-auto', 'h-8', 'w-8', 'border-none');
  addHoverEffect(leftArrow);
  leftArrow.onclick = moveToPreviousAttachment;
  const leftContainer = shadow.getElementById('left-container');
  leftContainer.appendChild(leftArrow);

  const rightArrow = document.createElement('button');
  rightArrow.id = 'rightArrow';
  rightArrow.title = "Nächste";
  rightArrow.classList.add('mr-8', 'pointer-events-auto', 'h-8', 'w-8', 'border-none');
  rightArrow.innerHTML = `<img src="chrome-extension://${chrome.runtime.id}/images/svg/arrow-right.svg" alt="Nächste" width="24" height="24" />`;
  addHoverEffect(rightArrow);
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
    doc: 'application/msword',
    xls: 'application/vnd.ms-excel',
    // Add more mappings as needed
  };

  return mimeTypes[fileExtension.toLowerCase()];
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
function injectFileToModal(url, mimeType, fileName) {
  const event = new CustomEvent("CustomEvent", { detail: { action: "injectPopup", data: url, mimeType: mimeType, fileName: fileName } });
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
