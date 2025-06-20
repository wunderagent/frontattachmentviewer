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
      currentFileName = null;
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
        console.debug("Received message in object_viewer:", event);
        if (event.detail.action
          && event.detail.action == "injectPopup"
          && event.detail.data) {
          console.debug("Object URL:", event.detail.data);
          currentObjectAttachment = event.detail.data;
          currentMimeType = event.detail.mimeType;
          currentFileName = event.detail.fileName;
          loadAttachment();
        }
    }
  
    function getLocalizedMessage() {
      const messages = {
        'en': 'This file type cannot be previewed. Please download the file to view it.',
        'es': 'Este tipo de archivo no se puede previsualizar. Por favor, descargue el archivo para verlo.',
        'fr': 'Ce type de fichier ne peut pas être prévisualisé. Veuillez télécharger le fichier pour le consulter.',
        'de': 'Dieser Dateityp kann nicht in der Vorschau angezeigt werden. Bitte laden Sie die Datei herunter, um sie anzusehen.',
        'it': 'Questo tipo di file non può essere visualizzato in anteprima. Scarica il file per visualizzarlo.',
        'pt': 'Este tipo de arquivo não pode ser visualizado. Por favor, baixe o arquivo para visualizá-lo.'
      };

      const browserLang = navigator.language.split('-')[0]; // Get primary language code
      return messages[browserLang] || messages['en']; // Fallback to English if language not supported
    }

    function loadAttachment() {
      console.debug("Loading", currentObjectAttachment, currentMimeType, currentFileName);
      const canvasContainer = shadow.getElementById('attachment-container');
      canvasContainer.innerHTML = ''; // Clear previous content
  
      if (!canvasContainer) {
        console.debug(`Canvas not found`);
        return;
      }
      canvasContainer.clientWidth = "100%";
      canvasContainer.clientHeight = "100%";
  
      const height = canvasContainer.clientHeight * scale;

      // Handle .doc and .xls files with error message and download button
      if (!currentMimeType ||currentMimeType === 'application/msword' || currentMimeType === 'application/vnd.ms-excel') {
        const errorContainer = document.createElement('div');
        errorContainer.style.display = 'flex';
        errorContainer.style.flexDirection = 'column';
        errorContainer.style.alignItems = 'center';
        errorContainer.style.justifyContent = 'center';
        errorContainer.style.height = '100%';
        errorContainer.style.gap = '20px';

        const errorMessage = document.createElement('p');
        errorMessage.textContent = getLocalizedMessage();
        errorMessage.style.color = '#fff';
        errorMessage.style.fontSize = '16px';
        errorMessage.style.textAlign = 'center';

        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download';
        downloadButton.style.padding = '10px 20px';
        downloadButton.style.backgroundColor = '#007bff';
        downloadButton.style.color = 'white';
        downloadButton.style.border = 'none';
        downloadButton.style.borderRadius = '4px';
        downloadButton.style.cursor = 'pointer';
        downloadButton.onclick = async () => {
          console.debug('Downloading file:', currentFileName);
          try {
            const response = await fetch(currentObjectAttachment);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = currentFileName || 'download';
            shadow.appendChild(link);
            link.click();
            shadow.removeChild(link);
            
            // Clean up the blob URL after a short delay
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
          } catch (error) {
            console.error('Error downloading file:', error);
            // Fallback to direct download if fetch fails
            const link = document.createElement('a');
            link.href = currentObjectAttachment;
            link.download = currentFileName || 'download';
            link.setAttribute('target', '_blank');
            shadow.appendChild(link);
            link.click();
            shadow.removeChild(link);
          }
        };

        errorContainer.appendChild(errorMessage);
        errorContainer.appendChild(downloadButton);
        canvasContainer.appendChild(errorContainer);
        return;
      }

      // Handle images with img element
      if (currentMimeType.startsWith('image/')) {
        const img = document.createElement('img');
        img.style.width = 'auto';
        img.style.height = `${height}px`;
        img.src = currentObjectAttachment;
        img.alt = 'Attachment preview';
        canvasContainer.appendChild(img);
      } else {
        // Fallback to object element for other file types
        const canvas = document.createElement('object');
        canvas.style.width = 'auto';
        canvas.style.height = `${height}px`;
        canvas.data = currentObjectAttachment;
        canvas.type = currentMimeType;
        canvasContainer.appendChild(canvas);
      }
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
  