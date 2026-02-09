chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "SCHEDULE_NOTIFICATION") {
        const { alarmName, triggerAt, title, message, url } = msg;

        chrome.alarms.create(alarmName, {
            when: triggerAt
        });

        chrome.storage.local.set({
            [alarmName]: { title, message, url }
        });
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    chrome.storage.local.get(alarm.name, (data) => {
        const info = data[alarm.name];
        if (!info) return;

        chrome.notifications.create(alarm.name, {
            type: "basic",
            iconUrl: chrome.runtime.getURL("icons/icon128.png"),
            title: info.title,
            message: info.message,
            riority: 2
        });
    });
});

chrome.notifications.onClicked.addListener((notificationId) => {	
    chrome.storage.local.get(notificationId, (data) => {
        const info = data[notificationId];		
        if (!info || !info.url) return;

        const targetUrl = info.url;

        chrome.tabs.query({}, (tabs) => {
            const existingTab = tabs.find(t =>
  		  t.url === targetUrl
	    );

            if (existingTab) {
                chrome.windows.update(existingTab.windowId, {
                    focused: true,
					drawAttention: true
                });

                chrome.tabs.update(existingTab.id, { active: true });
            } else {                
                chrome.tabs.create({
                    url: targetUrl,
                    active: true
                }, (tab) => { });
            }
        });

        chrome.storage.local.remove(notificationId);
    });
});