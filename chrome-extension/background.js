// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('Clean Tech Smart CRM Extension instalada.');
});

// Listener for runtime messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openKanbanTab') {
    chrome.tabs.create({ url: chrome.runtime.getURL('crm.html') });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === 'scheduleReminder') {
    const { phone, name, time } = request;
    const alarmTime = new Date(time).getTime();
    
    if (alarmTime > Date.now()) {
      const alarmName = `reminder_${phone}_${alarmTime}`;
      chrome.alarms.create(alarmName, { when: alarmTime });
      
      // Store alarm details in storage to look up later
      chrome.storage.local.get(['reminders'], (res) => {
        const reminders = res.reminders || {};
        reminders[alarmName] = { phone, name, time };
        chrome.storage.local.set({ reminders });
      });

      sendResponse({ success: true, alarmName });
    } else {
      sendResponse({ success: false, error: 'Horário no passado' });
    }
    return true; // Keep message channel open for async response
  }
});

// Listener for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  const alarmName = alarm.name;
  if (alarmName.startsWith('reminder_')) {
    chrome.storage.local.get(['reminders'], (res) => {
      const reminders = res.reminders || {};
      const reminder = reminders[alarmName];
      
      if (reminder) {
        // Display native notification
        chrome.notifications.create(alarmName, {
          type: 'basic',
          iconUrl: 'icon.png', // Optional, standard chrome icon fallback if absent
          title: 'Retornar Contato - CRM',
          message: `Lembrete: Entrar em contato com ${reminder.name} (${reminder.phone}).`,
          priority: 2,
          requireInteraction: true
        });

        // Clean up reminder from storage
        delete reminders[alarmName];
        chrome.storage.local.set({ reminders });
      }
    });
  }
});
