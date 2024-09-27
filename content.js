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

  // Show dialog/modal
  // myShowModal(url);
  chrome.runtime.sendMessage({action: "showModal", url: url});
}, true);

const toJson = (target) => !target ? JSON.stringify({}) : JSON.stringify({
  tagName: target.tagName,
  attributes: Array.from(target.attributes).reduce((acc, currAttr) => {
    acc[currAttr.name] = currAttr.value;
    return acc;
  }, {})
});


// function myShowModal(pdfUrl) {
//   console.log('Modal script executed');
//   let modal = document.createElement('div');
//   modal.innerHTML = `
//     <div style="position:fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;">
//       <div style="background: white; padding: 20px; border-radius: 10px; max-width: 600px;">
//         <button id="closeModal">Close</button>
//         <object type="application/pdf" data="https://app.frontapp.com${pdfUrl}" width="100%" height="500px">
//         </object>
//         <embed src="https://app.frontapp.com${pdfUrl}" type="application/pdf" width="100%" height="100%">
//       </div>
//     </div>
//   `;
//   document.body.appendChild(modal);

//   document?.getElementById('closeModal')?.addEventListener('click', function () {
//     modal.remove();
//   });
// }