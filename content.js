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
  event.stopPropagation();
  event.preventDefault();

  const loading = showLoadingModal();

  await chrome.runtime.sendMessage({ action: "fetchFile", fileUrl: "https://app.frontapp.com" + url },
    (response) => {
      loading.remove();
      if (document.body.contains(loading)) {
        console.log('Loading modal has been removed');
      } else {
        console.log('Loading modal is still present');
      }
      myShowModal(response.base64data)
    });

}, true);

function showLoadingModal() {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="position:fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;">
      <div style="display:flex; flex-direction: column; background: white; margin: 12rem 18rem; padding: 2rem; border-radius: 1rem; width: 100%; height: 90%;">
        <button id="closeModal" style="margin-bottom: 2rem; width: 8rem;">Close</button>
        <p style="font-size: 2rem;">Loading...</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document?.getElementById('closeModal')?.addEventListener('click', function () {
    modal.remove();
  });

  return modal;
}

function showLoadingModal2() {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="position:fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;">
      <div style="display:flex; flex-direction: column; background: white; margin: 12rem 18rem; padding: 2rem; border-radius: 1rem; width: 100%; height: 90%;">
        <button id="closeModal" style="margin-bottom: 2rem; width: 8rem;">Close</button>
        <div id="attachment-placeholder"><p style="font-size: 2rem;">Loading...</p></div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document?.getElementById('closeModal')?.addEventListener('click', function () {
    modal.remove();
  });

  return modal;
}


function myShowModal2(base64Pdf) {
  console.log('Modal script executed');
  console.log("base64 string: " + base64Pdf);
  let modal = document.createElement('div');
  const byteCharacters = atob(base64Pdf.split(",")[1]);
  // const byteCharacters = atob(base64Pdf);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  modal.innerHTML = `
    <div style="position:fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;">
      <div style="display:flex; flex-direction: column; background: white; margin: 12rem 18rem; padding: 2rem; border-radius: 1rem; width: 100%; height: 90%;">
        <button id="closeModal" style="margin-bottom: 2rem; width: 8rem;">Close</button>
        <object id="pdf" data="${blobUrl}" type="application/pdf" style="width: 100%; flex-grow: 1;"></object>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document?.getElementById('closeModal')?.addEventListener('click', function () {
    modal.remove();
  });
}


function myShowModal(base64Pdf) {
  console.log('Modal script executed');
  console.log("base64 string: " + base64Pdf);
  let modal = document.createElement('div');
  const byteCharacters = atob(base64Pdf.split(",")[1]);
  // const byteCharacters = atob(base64Pdf);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  modal.innerHTML = `
    <div style="position:fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;">
      <div style="display:flex; flex-direction: column; background: white; margin: 12rem 18rem; padding: 2rem; border-radius: 1rem; width: 100%; height: 90%;">
        <button id="closeModal" style="margin-bottom: 2rem; width: 8rem;">Close</button>
        <object id="pdf" data="${blobUrl}" type="application/pdf" style="width: 100%; flex-grow: 1;"></object>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document?.getElementById('closeModal')?.addEventListener('click', function () {
    modal.remove();
  });
}