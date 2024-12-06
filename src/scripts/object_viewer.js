window.onLoadObjectViewerScript = async () => {
    async function initialize() {
      console.log('Loading object viewer script');
      scale = 1.0;
      printDocument = () => printObjDocument();
      document.addEventListener("discard", discard);
      document.addEventListener("CustomEvent", customEventHandler);
      shadow.getElementById('zoom-in').addEventListener('click', zoomInHandler);
      shadow.getElementById('zoom-out').addEventListener('click', zoomOutHandler);
      shadow.getElementById('zoom-reset').addEventListener('click', zoomResetHandler);
      console.debug("Obejct script initialized");
    }
  
    function discard() {
      console.log('Discarding object viewer script');
      printDocument = () => {};
      document.removeEventListener("discard", discard);
      document.removeEventListener("CustomEvent", customEventHandler);
      shadow.getElementById('zoom-in').removeEventListener('click', zoomInHandler);
      shadow.getElementById('zoom-out').removeEventListener('click', zoomOutHandler);
      shadow.getElementById('zoom-reset').removeEventListener('click', zoomResetHandler);
      currentObjectAttachment = null;
      currentMimeType = null;
      console.debug("Obejct script discarded");
    }

    function printObjDocument() {
      console.debug("Printing obj document");
      const disturbingItems = [
        'popup-header',
        'zoom-controls',
        'left-container',
        'right-container'
      ]
      disturbingItems.map(item => {
        console.log("item", item)
        const element = shadow.getElementById(item)
        element?.classList.add("hidden")
      })
      
      window.print();

      disturbingItems.map(item => {
        const element = shadow.getElementById(item)
        element?.classList.remove("hidden")
      })
    }
  
    function handleCustomAttachmentEvent(event) {
        console.debug("Received message in popup.js:", event);
        if (event.detail.action
          && event.detail.action == "injectPopup"
          && event.detail.data) {
          console.debug("Object URL:", event.detail.data);
          currentObjectAttachment = event.detail.data;
          currentMimeType = event.detail.mimeType;
          loadAttachment();
        }
    }
  
    function loadAttachment() {
      console.debug("Loading", currentObjectAttachment, currentMimeType);
      const canvasContainer = shadow.getElementById('attachment-container');
      canvasContainer.innerHTML = ''; // Clear previous content
  
      if (!canvasContainer) {
        console.debug(`Canvas not found`);
        return;
      }
      canvasContainer.clientWidth = "100%";
      canvasContainer.clientHeight = "100%";
  
      const height = canvasContainer.clientHeight * scale;
  
      const canvas = document.createElement('object');
      canvas.style.width = 'auto';
      canvas.style.height = `${height}px`;
      canvas.data = currentObjectAttachment;
      canvas.type = currentMimeType;
      canvasContainer.appendChild(canvas);
      console.debug('File injected into modal');
    }
  
    function zoomIn() {
      console.debug("Zoom in clicked");
      scale += 0.1;
      loadAttachment();
    };
  
    function zoomOut() {
      console.debug("Zoom out clicked");
      scale = Math.max(0.5, scale - 0.1); // minimum zoom level
      loadAttachment();
    }
  
    function zoomReset() {
      console.debug("Zoom reset clicked");
      scale = 1;
      loadAttachment();
    }
  
    const customEventHandler = (event) => handleCustomAttachmentEvent(event);
    const zoomInHandler = () => zoomIn();
    const zoomOutHandler = () => zoomOut();
    const zoomResetHandler = () => zoomReset();
  
    await initialize();
  }
  