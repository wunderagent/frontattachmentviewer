let shadow = null;
let scale = 1.0;
let pdfUrl = null;
let currentObjectAttachment = null;
let currentMimeType = null;
let attachments = [];

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

  // download button
  const button_placeholder = document.createElement('div');
  button_placeholder.id = 'download-button-placeholder';
  const downloadButton = document.createElement('a');
  downloadButton.id = 'downloadButton';
  downloadButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" width="24" height="24">
<path d="M5.625 15C5.625 14.5858 5.28921 14.25 4.875 14.25C4.46079 14.25 4.125 14.5858 4.125 15H5.625ZM4.875 16H4.125H4.875ZM19.275 15C19.275 14.5858 18.9392 14.25 18.525 14.25C18.1108 14.25 17.775 14.5858 17.775 15H19.275ZM11.1086 15.5387C10.8539 15.8653 10.9121 16.3366 11.2387 16.5914C11.5653 16.8461 12.0366 16.7879 12.2914 16.4613L11.1086 15.5387ZM16.1914 11.4613C16.4461 11.1347 16.3879 10.6634 16.0613 10.4086C15.7347 10.1539 15.2634 10.2121 15.0086 10.5387L16.1914 11.4613ZM11.1086 16.4613C11.3634 16.7879 11.8347 16.8461 12.1613 16.5914C12.4879 16.3366 12.5461 15.8653 12.2914 15.5387L11.1086 16.4613ZM8.39138 10.5387C8.13662 10.2121 7.66533 10.1539 7.33873 10.4086C7.01212 10.6634 6.95387 11.1347 7.20862 11.4613L8.39138 10.5387ZM10.95 16C10.95 16.4142 11.2858 16.75 11.7 16.75C12.1142 16.75 12.45 16.4142 12.45 16H10.95ZM12.45 5C12.45 4.58579 12.1142 4.25 11.7 4.25C11.2858 4.25 10.95 4.58579 10.95 5H12.45ZM4.125 15V16H5.625V15H4.125ZM4.125 16C4.125 18.0531 5.75257 19.75 7.8 19.75V18.25C6.61657 18.25 5.625 17.2607 5.625 16H4.125ZM7.8 19.75H15.6V18.25H7.8V19.75ZM15.6 19.75C17.6474 19.75 19.275 18.0531 19.275 16H17.775C17.775 17.2607 16.7834 18.25 15.6 18.25V19.75ZM19.275 16V15H17.775V16H19.275ZM12.2914 16.4613L16.1914 11.4613L15.0086 10.5387L11.1086 15.5387L12.2914 16.4613ZM12.2914 15.5387L8.39138 10.5387L7.20862 11.4613L11.1086 16.4613L12.2914 15.5387ZM12.45 16V5H10.95V16H12.45Z" fill="#ffffff"/>
</svg>`;
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
  closeButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#C4C7C5"></path><path d="M0 0h24v24H0z" fill="none"></path></svg>`;
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
  button_zoom_in.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 12H20M12 4V20" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  button_zoom_in.classList.add('text-white', 'mx-2', 'h-6', 'w-6', 'btn', 'btn-circle', 'border-none', 'pointer-events-auto');
  const button_zoom_out = document.createElement("button");
  button_zoom_out.id = "zoom-out";
  button_zoom_out.style.pointerEvents = 'auto';
  button_zoom_out.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <g id="Complete"><g id="minus"><line fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="4" x2="20" y1="12" y2="12" /></g></g>
</svg>`;
  button_zoom_out.classList.add('text-white', 'mx-2', 'h-6', 'w-6', 'btn', 'btn-circle', 'border-none', 'pointer-events-auto');
  const button_zoom_reset = document.createElement("button");
  button_zoom_reset.id = "zoom-reset";
  button_zoom_reset.style.pointerEvents = 'auto';
  button_zoom_reset.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.8053 15.8013L21 21M10.5 7.5V13.5M7.5 10.5H13.5M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
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
  leftArrow.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M15.7071 4.29289C16.0976 4.68342 16.0976 5.31658 15.7071 5.70711L9.41421 12L15.7071 18.2929C16.0976 18.6834 16.0976 19.3166 15.7071 19.7071C15.3166 20.0976 14.6834 20.0976 14.2929 19.7071L7.29289 12.7071C7.10536 12.5196 7 12.2652 7 12C7 11.7348 7.10536 11.4804 7.29289 11.2929L14.2929 4.29289C14.6834 3.90237 15.3166 3.90237 15.7071 4.29289Z" fill="#ffffff"/>
</svg>`;
  leftArrow.classList.add('pointer-events-auto', 'btn', 'btn-circle', 'h-8', 'w-8', 'border-none');
  leftArrow.onclick = moveToPreviousAttachment;
  const leftContainer = shadow.getElementById('left-container');
  leftContainer.appendChild(leftArrow);

  const rightArrow = document.createElement('button');
  rightArrow.id = 'rightArrow';
  rightArrow.classList.add('mr-8', 'pointer-events-auto', 'btn', 'btn-circle', 'h-8', 'w-8', 'border-none');
  rightArrow.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M8.29289 4.29289C8.68342 3.90237 9.31658 3.90237 9.70711 4.29289L16.7071 11.2929C17.0976 11.6834 17.0976 12.3166 16.7071 12.7071L9.70711 19.7071C9.31658 20.0976 8.68342 20.0976 8.29289 19.7071C7.90237 19.3166 7.90237 18.6834 8.29289 18.2929L14.5858 12L8.29289 5.70711C7.90237 5.31658 7.90237 4.68342 8.29289 4.29289Z" fill="#ffffff"/>
</svg>`;
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
