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

  // Reads IndexedDB from Main World using chrome.scripting to bypass CSP restrictions
  if (request.action === 'readIndexedDB') {
    if (!sender.tab || !sender.tab.id) {
      sendResponse([]);
      return;
    }

    const tabId = sender.tab.id;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      func: () => {
        return new Promise((resolve) => {
          if (!window.indexedDB) { resolve([]); return; }

          const tryOpenDb = (dbName) => {
            const request = window.indexedDB.open(dbName);
            request.onerror = () => resolve([]);
            request.onsuccess = (event) => {
              const db = event.target.result;
              const storeName = db.objectStoreNames.contains('chat') ? 'chat' : 
                               (db.objectStoreNames.contains('chats') ? 'chats' : null);
              if (!storeName) {
                db.close();
                resolve([]);
                return;
              }

              try {
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                const getAllReq = store.getAll();

                getAllReq.onerror = () => { db.close(); resolve([]); };
                getAllReq.onsuccess = () => {
                  const records = getAllReq.result || [];
                  const extracted = records
                    .filter(r => r.id && r.id.includes('@c.us'))
                    .map(r => {
                      const phone = r.id.split('@')[0].replace(/\D/g, '');
                      return {
                        phone,
                        name: r.name || phone,
                        lastMessage: r.preview || '',
                        unreadCount: r.unreadCount || 0,
                        photo: r.avatar || ''
                      };
                    });
                  db.close();
                  resolve(extracted);
                };
              } catch (e) {
                db.close();
                resolve([]);
              }
            };
          };

          if (window.indexedDB.databases) {
            window.indexedDB.databases().then((databases) => {
              const dbInfo = databases.find(db => db.name && db.name.startsWith('model-storage'));
              if (dbInfo) {
                tryOpenDb(dbInfo.name);
              } else {
                tryOpenDb('model-storage');
              }
            }).catch(() => tryOpenDb('model-storage'));
          } else {
            tryOpenDb('model-storage');
          }
        });
      }
    }).then((results) => {
      const data = (results && results[0] && results[0].result) ? results[0].result : [];
      sendResponse(data);
    }).catch((err) => {
      console.error('[CRM Background] executeScript error:', err);
      sendResponse([]);
    });
    return true; // Keep message channel open for async response
  }

  // When CRM opens a chat: briefly focus WhatsApp tab so Chrome renders it,
  // then return focus to CRM tab. This forces the conversation panel to render.
  if (request.action === 'focusWhatsAppForChat') {
    const crmTabId = sender.tab ? sender.tab.id : null;
    chrome.tabs.query({ url: '*://web.whatsapp.com/*' }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        sendResponse({ success: false, error: 'Aba do WhatsApp não encontrada' });
        return;
      }
      const waTab = tabs[0];
      const waWindowId = waTab.windowId;

      // Focus the WhatsApp tab
      chrome.tabs.update(waTab.id, { active: true }, () => {
        if (waWindowId) chrome.windows.update(waWindowId, { focused: true });

        // After 2 seconds, return focus to CRM tab
        setTimeout(() => {
          if (crmTabId) {
            chrome.tabs.get(crmTabId, (crmTab) => {
              if (chrome.runtime.lastError || !crmTab) return;
              chrome.tabs.update(crmTabId, { active: true });
              if (crmTab.windowId) chrome.windows.update(crmTab.windowId, { focused: true });
            });
          }
        }, 2000);
      });
      sendResponse({ success: true, waTabId: waTab.id });
    });
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
