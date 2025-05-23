window.onLoadPdfScript = async () => {

    let pdfjsLib = null;
    let container = null;
    const getPageId = (pageNum) => `page-${pageNum}`;
    // Function to render a single page
    async function renderPage(pageNum) {
        const page = await pdfUrl.getPage(pageNum)
        const pageId = getPageId(pageNum);
        if (shadow.getElementById(pageId)) {
            console.debug(`Page ${pageNum} already rendered`);
            return;
        }
        console.debug(`Rendering page ${pageNum}`);

        const canvas = document.createElement('canvas');
        canvas.id = pageId;
        canvas.classList.add('mb-1');
        container.appendChild(canvas);

        const viewport = page.getViewport({ scale: scale });
        container.style.height = 'auto';
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');

        await page.render({ canvasContext: context, viewport: viewport }).promise
        loadedPages.push(pageNum);

        // Force reflow to update the layout
        // container.style.height = `${container.scrollHeight}px`;
        container.offsetHeight; // Trigger reflow

        // Ensure scroll position stays at the top
        // container.scrollTop = 0;
        console.log(`${pageId} rendered`);
    }

    let loadedPages = [];
    // Lazy load pages based on viewport
    const loadVisiblePages = async () => {
        container = shadow.getElementById('attachment-container');
        const pageHeight = container.scrollHeight / pdfUrl.numPages;
        const scrollTop = container.scrollTop;
        const visibleStartPage = 1;
        const visibleEndPage = Math.min(Math.ceil((scrollTop + (2 * pageHeight)) / pageHeight), pdfUrl.numPages);

        const totalPagesToRender = [];
        for (let i = visibleStartPage; i <= visibleEndPage; i++) {
            totalPagesToRender.push(i);
        }
        const pagesToRender = totalPagesToRender.filter(pageNum => !shadow.getElementById(getPageId(pageNum)));
        pagesToRender.forEach(await renderPage);
    }

    const reloadVisiblePages = async () => {
        for (let pageNum of loadedPages) {
            const canvas = shadow.getElementById(getPageId(pageNum))
            const page = await pdfUrl.getPage(pageNum)
            const viewport = page.getViewport({ scale: scale });
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const context = canvas.getContext('2d');

            await page.render({ canvasContext: context, viewport: viewport }).promise

            // Force reflow to update the layout
            // container.style.height = `${container.scrollHeight}px`;
            container.offsetHeight; // Trigger reflow
        }
    }

    function loadPdf() {
        if (!pdfUrl) {
            console.debug("PDF URL not set");
            return;
        }

        console.debug("Loading PDF:", pdfUrl);
        pdfjsLib.getDocument({ url: pdfUrl }).promise
            .then((pdf) => {
                pdfUrl = pdf;
                loadVisiblePages();
                console.debug("PDF loaded");
            }).then(() => {
                console.debug("Adding scroll event listener");
                container.removeEventListener('scroll', loadVisiblePages);
                container.addEventListener('scroll', loadVisiblePages);
            })
    }

    function handleCustomPdfEvent(event) {
        console.debug("Received message in pdf_viewer:", event);
        if (event?.detail?.action
            && event.detail.action == "injectPopup"
            && event?.detail?.data) {
            console.debug("PDF URL:", event.detail.data);
            pdfUrl = event.detail.data;
            loadPdf();
        }
    }

    async function initialize() {
        scale = 1.0;
        pdfjsLib = await import(chrome.runtime.getURL("pdf.js"));

        // Configure PDF.js to use the local worker script
        pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdf.worker.js');
        console.debug("worker imported");
        printDocument = () => printPdfDocument();
        document.addEventListener('discard', discard);
        document.addEventListener("CustomEvent", customEventHandler);
        shadow.getElementById('zoom-in').addEventListener('click', zoomInHandler);
        shadow.getElementById('zoom-out').addEventListener('click', zoomOutHandler);
        shadow.getElementById('zoom-reset').addEventListener('click', zoomResetHandler);
        console.debug("PDF script initialized");
    }

    function discard() {
        printDocument = () => {};
        document.removeEventListener('discard', discard);
        document.removeEventListener("CustomEvent", customEventHandler);
        shadow.getElementById('zoom-in').removeEventListener('click', zoomInHandler);
        shadow.getElementById('zoom-out').removeEventListener('click', zoomOutHandler);
        shadow.getElementById('zoom-reset').removeEventListener('click', zoomResetHandler);
        container.removeEventListener('scroll', loadVisiblePages);
        container.innerHTML = '';

        if (pdfUrl) {
            pdfUrl.destroy();
            pdfUrl = null;
        }
        console.debug("PDF script discarded");
    };

    function printPdfDocument() {
      console.debug("Printing PDF document");
      if (pdfUrl) {
        pdfUrl.getPage(1).then((page) => {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
    
          page.getOperatorList().then(() => {
            const printContainer = document.createElement('div');
            document.body.appendChild(printContainer);
    
            pdfUrl.getData().then((data) => {
              const blob = new Blob([data], { type: 'application/pdf' });
              const url = URL.createObjectURL(blob);
              iframe.src = url;
              
              iframe.onload = () => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
              };
    
              document.body.appendChild(iframe);
            });
          });
        });
      }
    }

    function zoomIn() {
        console.debug("Zoom in clicked");
        scale += 0.1;
        reloadVisiblePages();
    };

    function zoomOut() {
        console.debug("Zoom out clicked");
        scale = Math.max(0.5, scale - 0.1); // minimum zoom level
        reloadVisiblePages();
    }

    function zoomReset() {
        console.debug("Zoom reset clicked");
        scale = 1;
        reloadVisiblePages();
    }

    const customEventHandler = (event) => handleCustomPdfEvent(event);
    const zoomInHandler = () => zoomIn();
    const zoomOutHandler = () => zoomOut();
    const zoomResetHandler = () => zoomReset();

    await initialize();
};
