const input = document.getElementById("minutes");
const status = document.getElementById("status");

chrome.storage.sync.get(["cooldownMinutes"], (res) => {
    input.value = res.cooldownMinutes || 4;
});

document.getElementById("save").onclick = () => {
    const val = parseInt(input.value, 10);
    if (val < 1) return;

    chrome.storage.sync.set({ cooldownMinutes: val }, () => {
        status.textContent = "Kaydedildi ✔️";
        setTimeout(() => status.textContent = "", 1500);
    });
};
