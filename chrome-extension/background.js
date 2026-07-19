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
          if (!window.indexedDB) {
            resolve({ chats: [], dbs: [], selectedDb: '', storeNames: [], error: 'IndexedDB not supported', recordsCount: 0 });
            return;
          }

          const getDbNames = () => {
            if (window.indexedDB.databases) {
              return window.indexedDB.databases().then(list => list.map(d => d.name)).catch(e => ['Error listing dbs: ' + e.message]);
            }
            return Promise.resolve(['databases() not supported']);
          };

          getDbNames().then((dbNames) => {
            const dbName = dbNames.find(name => name && name.startsWith('model-storage')) || 'model-storage';
            
            let request;
            let timeoutId = setTimeout(() => {
              resolve({ chats: [], dbs: dbNames, selectedDb: dbName, storeNames: [], error: 'Database open timeout', recordsCount: 0 });
            }, 3000);

            try {
              request = window.indexedDB.open(dbName);
            } catch (err) {
              clearTimeout(timeoutId);
              resolve({ chats: [], dbs: dbNames, selectedDb: dbName, storeNames: [], error: 'open throw: ' + err.message, recordsCount: 0 });
              return;
            }

            request.onerror = (event) => {
              clearTimeout(timeoutId);
              const errCode = event.target?.error?.name || 'unknown';
              const errMsg = event.target?.error?.message || '';
              resolve({ chats: [], dbs: dbNames, selectedDb: dbName, storeNames: [], error: `open error: ${errCode} - ${errMsg}`, recordsCount: 0 });
            };

            request.onsuccess = (event) => {
              clearTimeout(timeoutId);
              const db = event.target.result;
              const storeNames = Array.from(db.objectStoreNames);
              const storeName = storeNames.includes('chat') ? 'chat' : 
                               (storeNames.includes('chats') ? 'chats' : null);
              const contactStoreName = storeNames.includes('contact') ? 'contact' : 
                                      (storeNames.includes('contacts') ? 'contacts' : null);

              if (!storeName) {
                db.close();
                resolve({ chats: [], dbs: dbNames, selectedDb: dbName, storeNames: storeNames, error: 'Store chat/chats not found', recordsCount: 0 });
                return;
              }

              try {
                const neededStores = [storeName];
                if (contactStoreName) neededStores.push(contactStoreName);
                const transaction = db.transaction(neededStores, 'readonly');
                const contactsMap = new Map();
                let contactSample = [];

                const chatStore = transaction.objectStore(storeName);
                const getAllChatsReq = chatStore.getAll();

                getAllChatsReq.onerror = (e) => {
                  const errCode = e.target?.error?.name || 'unknown';
                  db.close();
                  resolve({ chats: [], dbs: dbNames, selectedDb: dbName, storeNames: storeNames, error: `getAll chats error: ${errCode}`, recordsCount: 0 });
                };

                getAllChatsReq.onsuccess = () => {
                  try {
                    const records = getAllChatsReq.result || [];
                    const activeJids = [];

                    for (const r of records) {
                      if (!r) continue;
                      let idStr = '';
                      if (typeof r.id === 'string') {
                        idStr = r.id;
                      } else if (r.id && typeof r.id === 'object') {
                        idStr = r.id._serialized || (r.id.user ? r.id.user + (r.id.server ? '@' + r.id.server : '@c.us') : '');
                      }
                      if (idStr && (idStr.includes('@c.us') || idStr.includes('@s.whatsapp.net') || idStr.includes('@lid'))) {
                        activeJids.push(idStr);
                      }
                    }

                    const onContactsLoaded = () => {
                      try {
                        const extracted = [];
                        const rawSample = records.filter(r => r.id && String(r.id).includes('@lid')).slice(0, 5).map(r => {
                          let idValStr = 'none';
                          if (r.id) {
                            if (typeof r.id === 'string') {
                              idValStr = r.id;
                            } else if (typeof r.id === 'object') {
                              idValStr = `{_serialized:${r.id._serialized || 'none'},user:${r.id.user || 'none'},server:${r.id.server || 'none'}`;
                            }
                          }
                          const recordKeys = Object.keys(r).join(',');
                          const contactKeys = r.contact ? Object.keys(r.contact).join(',') : 'none';
                          const picKeys = (r.contact && r.contact.profilePicThumb) ? Object.keys(r.contact.profilePicThumb).join(',') : 'none';
                          return {
                            idType: typeof r.id,
                            idVal: idValStr,
                            contactKeys: contactKeys.substring(0, 100),
                            picKeys: picKeys.substring(0, 100),
                            recordKeys: recordKeys.substring(0, 120)
                          };
                        });

                        // Populate contactSample with first 3 matched contacts
                        const sampleJids = activeJids.slice(0, 15);
                        const sampleList = [];
                        for (const jid of sampleJids) {
                          const c = contactsMap.get(jid);
                          if (c) {
                            const keys = Object.keys(c).join(',');
                            let hasPic = 'no';
                            let picKeys = 'none';
                            if (c.profilePicThumb) {
                              hasPic = 'profilePicThumb';
                              picKeys = Object.keys(c.profilePicThumb).join(',');
                            }
                            sampleList.push({
                              id: jid,
                              keys: keys.substring(0, 100),
                              hasPic: hasPic,
                              picKeys: picKeys
                            });
                            if (sampleList.length >= 3) break;
                          }
                        }
                        contactSample = sampleList;

                        for (const r of records) {
                          if (!r) continue;

                          let idStr = '';
                          if (typeof r.id === 'string') {
                            idStr = r.id;
                          } else if (r.id && typeof r.id === 'object') {
                            idStr = r.id._serialized || (r.id.user ? r.id.user + (r.id.server ? '@' + r.id.server : '@c.us') : '');
                          }

                          if (!idStr && typeof r.key === 'string') {
                            idStr = r.key;
                          } else if (r.key && typeof r.key === 'object') {
                            idStr = r.key._serialized || '';
                          }

                          if (!idStr || (!idStr.includes('@c.us') && !idStr.includes('@s.whatsapp.net') && !idStr.includes('@lid'))) {
                            continue;
                          }

                          const phone = idStr.split('@')[0].replace(/\D/g, '');
                          if (!phone) continue;

                          const contactInfo = contactsMap.get(idStr) || {};

                          let name = '';
                          if (typeof contactInfo.name === 'string' && contactInfo.name.trim()) {
                            name = contactInfo.name.trim();
                          } else if (typeof contactInfo.formattedName === 'string' && contactInfo.formattedName.trim()) {
                            name = contactInfo.formattedName.trim();
                          } else if (typeof contactInfo.pushname === 'string' && contactInfo.pushname.trim()) {
                            name = contactInfo.pushname.trim();
                          } else if (typeof r.name === 'string' && r.name.trim()) {
                            name = r.name.trim();
                          } else if (r.contact && typeof r.contact.name === 'string' && r.contact.name.trim()) {
                            name = r.contact.name.trim();
                          } else if (r.contact && typeof r.contact.pushname === 'string' && r.contact.pushname.trim()) {
                            name = r.contact.pushname.trim();
                          } else if (r.contact && typeof r.contact.formattedName === 'string' && r.contact.formattedName.trim()) {
                            name = r.contact.formattedName.trim();
                          } else if (typeof r.formattedTitle === 'string' && r.formattedTitle.trim()) {
                            name = r.formattedTitle.trim();
                          } else if (typeof r.title === 'string' && r.title.trim()) {
                            name = r.title.trim();
                          } else if (typeof r.displayName === 'string' && r.displayName.trim()) {
                            name = r.displayName.trim();
                          } else if (typeof r.pushname === 'string' && r.pushname.trim()) {
                            name = r.pushname.trim();
                          } else {
                            name = phone;
                          }

                          let lastMessage = '';
                          if (typeof r.preview === 'string') {
                            lastMessage = r.preview;
                          } else if (r.lastMsg && typeof r.lastMsg.body === 'string') {
                            lastMessage = r.lastMsg.body;
                          } else if (r.lastMessage && typeof r.lastMessage.body === 'string') {
                            lastMessage = r.lastMessage.body;
                          } else if (typeof r.previewText === 'string') {
                            lastMessage = r.previewText;
                          }

                          let unreadCount = 0;
                          if (typeof r.unreadCount === 'number') {
                            unreadCount = r.unreadCount;
                          } else if (typeof r.unreadCount === 'string') {
                            unreadCount = parseInt(r.unreadCount, 10) || 0;
                          }

                          let photo = '';
                          if (contactInfo.profilePicThumb) {
                            const thumb = contactInfo.profilePicThumb;
                            if (typeof thumb.img === 'string' && thumb.img.trim()) {
                              photo = thumb.img.trim();
                            } else if (typeof thumb.imgFull === 'string' && thumb.imgFull.trim()) {
                              photo = thumb.imgFull.trim();
                            }
                          }
                          if (!photo && typeof r.avatar === 'string' && r.avatar.trim()) {
                            photo = r.avatar.trim();
                          } else if (!photo && typeof r.avatarUrl === 'string' && r.avatarUrl.trim()) {
                            photo = r.avatarUrl.trim();
                          }

                          if (!photo && r.contact && r.contact.profilePicThumb) {
                            const thumb = r.contact.profilePicThumb;
                            if (typeof thumb.img === 'string' && thumb.img.trim()) {
                              photo = thumb.img.trim();
                            } else if (typeof thumb.imgFull === 'string' && thumb.imgFull.trim()) {
                              photo = thumb.imgFull.trim();
                            }
                          }
                          if (!photo && r.profilePicThumb) {
                            const thumb = r.profilePicThumb;
                            if (typeof thumb.img === 'string' && thumb.img.trim()) {
                              photo = thumb.img.trim();
                            }
                          }

                          extracted.push({
                            phone,
                            name,
                            lastMessage,
                            unreadCount,
                            photo
                          });
                        }
                        db.close();
                        resolve({ chats: extracted, dbs: dbNames, selectedDb: dbName, storeNames: storeNames, error: null, recordsCount: records.length, rawSample, contactSample });
                      } catch (err) {
                        db.close();
                        resolve({ chats: [], dbs: dbNames, selectedDb: dbName, storeNames: storeNames, error: `parse error: ${err.message}`, recordsCount: 0 });
                      }
                    };

                    try {
                      if (contactStoreName && activeJids.length > 0) {
                        const contactStore = transaction.objectStore(contactStoreName);
                        let loadedCount = 0;
                        
                        activeJids.forEach(jid => {
                          try {
                            const req = contactStore.get(jid);
                            req.onsuccess = (e) => {
                              const c = e.target.result;
                              if (c) contactsMap.set(jid, c);
                              loadedCount++;
                              if (loadedCount === activeJids.length) {
                                onContactsLoaded();
                              }
                            };
                            req.onerror = () => {
                              loadedCount++;
                              if (loadedCount === activeJids.length) {
                                onContactsLoaded();
                              }
                            };
                          } catch (err) {
                            loadedCount++;
                            if (loadedCount === activeJids.length) {
                              onContactsLoaded();
                            }
                          }
                        });
                      } else {
                        onContactsLoaded();
                      }
                    } catch (err) {
                      onContactsLoaded();
                    }
                  } catch (err) {
                    db.close();
                    resolve({ chats: [], dbs: dbNames, selectedDb: dbName, storeNames: storeNames, error: `onsuccess error: ${err.message}`, recordsCount: 0 });
                  }
                };
              } catch (e) {
                db.close();
                resolve({ chats: [], dbs: dbNames, selectedDb: dbName, storeNames: storeNames, error: `transaction error: ${e.message}`, recordsCount: 0 });
              }
            };
          }).catch(e => {
            resolve({ chats: [], dbs: [], selectedDb: '', storeNames: [], error: `dbNames promise error: ${e.message}`, recordsCount: 0 });
          });
        });
      }
    }).then((results) => {
      const result = (results && results[0] && results[0].result) ? results[0].result : { chats: [], dbs: [], selectedDb: '', storeNames: [], error: 'executeScript no result', recordsCount: 0 };
      
      // Save debug statistics to crm_dom_debug in chrome.storage.local
      chrome.storage.local.get(['crm_dom_debug'], (stored) => {
        const debug = stored.crm_dom_debug || {};
        debug.indexed_db_debug = {
          dbs: result.dbs,
          selectedDb: result.selectedDb,
          storeNames: result.storeNames,
          error: result.error,
          recordsCount: result.recordsCount,
          extractedCount: result.chats ? result.chats.length : 0,
          rawSample: result.rawSample,
          contactSample: result.contactSample,
          timestamp: new Date().toISOString()
        };
        chrome.storage.local.set({ crm_dom_debug: debug });
      });

      sendResponse(result.chats || []);
    }).catch((err) => {
      console.error('[CRM Background] executeScript error:', err);
      chrome.storage.local.get(['crm_dom_debug'], (stored) => {
        const debug = stored.crm_dom_debug || {};
        debug.indexed_db_debug_error = err.message;
        chrome.storage.local.set({ crm_dom_debug: debug });
      });
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
