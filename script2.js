(function () {
  const hostScript = document.currentScript;
  const mainScript = document.createElement('script');
  mainScript.src = 'script.js?v=care-log-fix-20260501';
  mainScript.onload = installCareLogFix;
  mainScript.onerror = function () {
    console.error('Failed to load script.js');
  };

  if (hostScript && hostScript.parentNode) {
    hostScript.parentNode.insertBefore(mainScript, hostScript.nextSibling);
  } else {
    document.body.appendChild(mainScript);
  }
})();

function installCareLogFix() {
  function careStorageKey(key) {
    return currentUser ? `care_${currentUser.id}_${key}` : `care_${key}`;
  }

  function legacyCareStorageKey(key) {
    return `care_${key}`;
  }

  window.dbSaveCareLog = async function dbSaveCareLog(key, val) {
    const storageKey = careStorageKey(key);
    const legacyKey = legacyCareStorageKey(key);

    if (val) {
      localStorage.setItem(storageKey, 'true');
      if (legacyKey !== storageKey) localStorage.removeItem(legacyKey);
    } else {
      localStorage.removeItem(storageKey);
      if (legacyKey !== storageKey) localStorage.removeItem(legacyKey);
    }

    if (!_db || !currentUser) return;

    try {
      const { error: deleteError } = await _db.from('care_log').delete()
        .eq('key', key)
        .eq('user_id', currentUser.id);

      if (deleteError) {
        console.error('dbSaveCareLog delete:', deleteError.message);
        return;
      }

      if (val) {
        const { error: insertError } = await _db.from('care_log')
          .insert({ key, user_id: currentUser.id, done: true });

        if (insertError) console.error('dbSaveCareLog insert:', insertError.message);
      }
    } catch (e) {
      console.error('dbSaveCareLog:', e);
    }
  };

  window.dbLoadCareLog = async function dbLoadCareLog() {
    Object.keys(CL_DONE).forEach(k => delete CL_DONE[k]);

    const userPrefix = currentUser ? `care_${currentUser.id}_` : 'care_';
    const legacyPattern = /^care_\d+_(prune|fert|supp|crit)_\d+$/;

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;

      if (k.startsWith(userPrefix)) {
        CL_DONE[k.slice(userPrefix.length)] = true;
      } else if (currentUser && legacyPattern.test(k)) {
        const legacyKey = k.replace('care_', '');
        CL_DONE[legacyKey] = true;
        localStorage.setItem(careStorageKey(legacyKey), 'true');
        localStorage.removeItem(k);
      }
    }

    if (!_db || !currentUser) return;

    try {
      const { data, error } = await _db.from('care_log').select('key')
        .eq('user_id', currentUser.id)
        .eq('done', true);

      if (error) {
        console.error('dbLoadCareLog:', error.message);
        return;
      }

      if (data) {
        data.forEach(r => {
          CL_DONE[r.key] = true;
          localStorage.setItem(careStorageKey(r.key), 'true');
        });
      }
    } catch (e) {
      console.error('dbLoadCareLog:', e);
    }
  };

  window.clToggle = function clToggle(pid, type) {
    const k = clKey(pid, type);
    const next = !CL_DONE[k];

    if (next) CL_DONE[k] = true;
    else delete CL_DONE[k];

    dbSaveCareLog(k, next);
    renderChecklist(document.getElementById('pa'));
    updCounts();
  };

  window.clReset = function clReset() {
    const keysToDelete = Object.keys(CL_DONE).filter(k => k.endsWith('_' + CUR));
    keysToDelete.forEach(k => {
      delete CL_DONE[k];
      dbSaveCareLog(k, false);
    });
    renderChecklist(document.getElementById('pa'));
  };

  setTimeout(async function refreshCareLogAfterPatch() {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    await dbLoadCareLog();
    if (typeof TF !== 'undefined' && TF === 'alerts') {
      renderChecklist(document.getElementById('pa'));
    }
  }, 0);
}
