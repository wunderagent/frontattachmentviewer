document.addEventListener('click', async function (event) {
  const element = event.target;
  const isAttachmentButton = Array.from(element.classList).filter(data => data.startsWith("attachmentBase__StyledAttachmentButton")).length > 0;
  if (!element.attributes.role === "button" || !isAttachmentButton) {
    return;
  }
  let url = element.querySelector('img')
    ?.getAttribute('src')
    ?.replace('?action=thumbnail', '?action=view')
    ?.replace('&action=thumbnail', '&action=view');
  if (!url) {
    return;
  }
  event.stopPropagation();
  event.preventDefault();

  // Show dialog/modal
  chrome.runtime.sendMessage({action: "showModal", url: url});
}, true);

const toJson = (target) => !target ? JSON.stringify({}) : JSON.stringify({
  tagName: target.tagName,
  attributes: Array.from(target.attributes).reduce((acc, currAttr) => {
    acc[currAttr.name] = currAttr.value;
    return acc;
  }, {})
});
