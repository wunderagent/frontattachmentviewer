window.handleKeyPressGlobal = (event) => {
    if (!document.getElementById('extension-container')) {
      return;
    }
  
    event.stopPropagation();
    event.preventDefault();
    event.stopImmediatePropagation();
    event.cancelBubble = true;
    if (event.key === 'Escape') {
        handleEscape();
    } else if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        handleArrowKeys(event.key);
    }
  }

const handleEscape = () => {
    console.log('ESC key pressed');
    removeModal();
}

const handleArrowKeys = (key) => {
    console.log(`${key} key pressed`);
    if (!attachments || attachments.length <= 1) {
        return;
    }
    
    switch (key) {
        case 'ArrowLeft':
            moveToPreviousAttachment();
            break;
        case 'ArrowRight':
            moveToNextAttachment();
            break;
    }
}
