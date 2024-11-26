// Reference the toggle button and status text
const toggleButton = document.getElementById("toggle");
const statusText = document.getElementById("status");
const statusSym = document.getElementById("status_sym");

// Get the current status on popup load
chrome.storage.sync.get("isEnabled", (data) => {
  const isEnabled = data.isEnabled ?? true;
  updateUI(isEnabled);
});

// Toggle the extension status when the button is clicked
toggleButton.addEventListener("click", () => {
  chrome.storage.sync.get("isEnabled", (data) => {
    const isEnabled = data.isEnabled ?? true;
    const newStatus = !isEnabled;

    // Save the new status and update the UI
    chrome.storage.sync.set({ isEnabled: newStatus }, () => {
      updateUI(newStatus);
    });

    // Notify background script to update the badge
    chrome.runtime.sendMessage({ action: "updateBadge", isEnabled: newStatus });
  });
});

function updateUI(isEnabled) {
  toggleButton.checked = isEnabled;
  statusSym.classList.remove("text-green-500", "text-red-500");
  statusSym.classList = [`text-${isEnabled ? "green" : "red"}-500`];
  statusText.innerHTML = isEnabled ? "Enabled" : "Disabled";
}
