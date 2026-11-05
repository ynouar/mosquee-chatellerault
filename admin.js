// Mosquée As-Sâlam de Châtellerault — Contrôleur d'Administration Sécurisé

const STORAGE_KEY = 'mosquee_assalam_data_v1';

const DEFAULT_DATA = {
  urgentBanner: {
    enabled: true,
    tag: 'MOSQUÉE VERTE (ACTE 2)',
    message:
      'Collecte en cours pour l’installation de panneaux solaires et batteries supplémentaires à la Mosquée de la Paix (60 rue Paul Painlevé).'
  },
  prayerSettings: {
    jumuaTime: '13:00',
    iqamaOffsets: {
      Fajr: 10,
      Dhuhr: 10,
      Asr: 10,
      Maghrib: 5,
      Isha: 10
    },
    customOverrides: {
      enabled: false,
      Fajr: '06:33',
      Sunrise: '07:48',
      Dhuhr: '12:46',
      Asr: '15:12',
      Maghrib: '17:40',
      Isha: '18:49'
    }
  },
  projectFund: {
    title: 'Mosquée Verte (Acte 2) & Entretien de la Mosquée de la Paix',
    description:
      'Financement des panneaux solaires et batteries supplémentaires pour l’autonomie énergétique du 60 rue Paul Painlevé, ainsi que l’entretien des salles de prière et de l’Institut.',
    raisedAmount: 18450,
    goalAmount: 35000
  },
  announcements: [
    {
      category: 'Projet Écologique • Mawaqit',
      date: 'Collecte en cours',
      title: 'MOSQUÉE VERTE (ACTE 2) : Panneaux solaires & batteries',
      body: 'Après une première étape réussie, la Mosquée de la Paix lance l’Acte 2 de son projet « Mosquée Verte » avec l’installation de panneaux solaires et de batteries supplémentaires.'
    },
    {
      category: 'Vie Associative • Mawaqit',
      date: 'Dimanche 19 Avril 2026',
      title: 'Assemblée Générale Ordinaire de la Mosquée',
      body: 'L’Association Islamique de Châtellerault convie les fidèles et adhérents à son Assemblée Générale Ordinaire : bilan moral, rapport financier et présentation des projets.',
      image: 'assets/affiche-ag-2026.png'
    },
    {
      category: 'Horaires & Prières • Mawaqit',
      date: 'Vendredi à 13h00',
      title: 'Salât Al-Jumu’a à 13h00 & Horaires Saisonniers',
      body: 'La prière du vendredi (Jumu’a) est célébrée à 13h00 précises au 60 rue Paul Painlevé. Les horaires quotidiens sont synchronisés avec Mawaqit.',
      image: 'assets/affiche-heure-hiver.png'
    }
  ]
};

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function showToast(msg) {
  const el = document.getElementById('toastMsg');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => {
    el.style.display = 'none';
  }, 3500);
}

document.addEventListener('DOMContentLoaded', async () => {
  const gate = document.getElementById('adminLoginGate');
  const dash = document.getElementById('adminDashboard');
  const form = document.getElementById('adminLoginForm');

  if (sessionStorage.getItem('mosquee_admin_ok') === '1') {
    gate.style.display = 'none';
    dash.style.display = 'block';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const pin = document.getElementById('adminPinInput').value.trim();
    if (!pin) {
      alert('Veuillez saisir le code responsable.');
      return;
    }
    sessionStorage.setItem('mosquee_admin_ok', '1');
    sessionStorage.setItem('mosquee_admin_pin', pin);
    gate.style.display = 'none';
    dash.style.display = 'block';
  });

  try {
    const res = await fetch('/api/mosquee-data');
    if (res.ok) {
      const json = await res.json();
      if (json && json.ok && json.data) {
        state = json.data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    }
  } catch (e) {}

  renderForm();

  document.getElementById('addAnnouncementBtn').addEventListener('click', () => {
    collectState();
    state.announcements.unshift({
      category: 'Annonce',
      date: "Aujourd'hui",
      title: 'Nouvelle communication aux fidèles',
      body: 'Détails de votre annonce...'
    });
    renderAnnouncements();
  });

  const saveAll = async () => {
    collectState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    const pin = sessionStorage.getItem('mosquee_admin_pin') || '';
    try {
      const res = await fetch('/api/mosquee-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, data: state })
      });
      if (res.ok) {
        showToast('✓ Enregistré en ligne ! Le site de la Mosquée As-Sâlam est mis à jour.');
        return;
      }
      if (res.status === 401) {
        showToast('⚠ Code PIN refusé par le serveur (sauvegardé uniquement en local).');
        return;
      }
    } catch (e) {}

    showToast('✓ Modifications enregistrées en local sur ce navigateur.');
  };

  document.getElementById('saveAdminBtn').addEventListener('click', saveAll);
  document.getElementById('saveAdminBtnBottom').addEventListener('click', saveAll);

  document.getElementById('resetAdminBtn').addEventListener('click', async () => {
    if (confirm('Restaurer les paramètres d’origine de la Mosquée As-Sâlam ?')) {
      state = JSON.parse(JSON.stringify(DEFAULT_DATA));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderForm();
      await saveAll();
    }
  });
});

function renderForm() {
  document.getElementById('ubTag').value = state.urgentBanner?.tag || 'MOSQUÉE VERTE (ACTE 2)';
  document.getElementById('ubEnabled').value = String(state.urgentBanner?.enabled !== false);
  document.getElementById('ubMessage').value = state.urgentBanner?.message || '';

  document.getElementById('psJumua').value = state.prayerSettings?.jumuaTime || '13:00';
  const iq = state.prayerSettings?.iqamaOffsets || {};
  document.getElementById('iqFajr').value = iq.Fajr ?? 10;
  document.getElementById('iqDhuhr').value = iq.Dhuhr ?? 10;
  document.getElementById('iqAsr').value = iq.Asr ?? 10;
  document.getElementById('iqMaghrib').value = iq.Maghrib ?? 5;
  document.getElementById('iqIsha').value = iq.Isha ?? 10;

  document.getElementById('pfTitle').value = state.projectFund?.title || '';
  document.getElementById('pfRaised').value = state.projectFund?.raisedAmount ?? 18450;
  document.getElementById('pfGoal').value = state.projectFund?.goalAmount ?? 35000;
  document.getElementById('pfDesc').value = state.projectFund?.description || '';

  renderAnnouncements();
}

function createFieldBlock(labelText, inputEl) {
  const wrap = document.createElement('div');
  const label = document.createElement('label');
  label.className = 'field-label';
  label.textContent = labelText;
  wrap.append(label, inputEl);
  return wrap;
}

function renderAnnouncements() {
  const list = document.getElementById('adminAnnouncementsList');
  list.replaceChildren();

  state.announcements.forEach((ann, idx) => {
    const box = document.createElement('div');
    box.className = 'ann-edit-row';

    const row2 = document.createElement('div');
    row2.className = 'form-row-2';

    const catInput = document.createElement('input');
    catInput.type = 'text';
    catInput.className = 'field-input ann-cat';
    catInput.value = ann.category || '';

    const dateInput = document.createElement('input');
    dateInput.type = 'text';
    dateInput.className = 'field-input ann-date';
    dateInput.value = ann.date || '';

    row2.append(createFieldBlock('Catégorie', catInput), createFieldBlock('Date / Fréquence', dateInput));

    const titleWrap = document.createElement('div');
    titleWrap.style.marginBottom = '10px';
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.className = 'field-input ann-title';
    titleInput.value = ann.title || '';
    titleWrap.appendChild(createFieldBlock("Titre de l'annonce", titleInput));

    const bodyWrap = document.createElement('div');
    bodyWrap.style.marginBottom = '10px';
    const bodyInput = document.createElement('textarea');
    bodyInput.rows = 2;
    bodyInput.className = 'field-input ann-body';
    bodyInput.value = ann.body || '';
    bodyWrap.appendChild(createFieldBlock('Contenu', bodyInput));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn btn-alabaster del-ann-btn';
    delBtn.style.padding = '6px 12px';
    delBtn.style.fontSize = '0.8rem';
    delBtn.textContent = 'Supprimer cette annonce';
    delBtn.addEventListener('click', () => {
      collectState();
      state.announcements.splice(idx, 1);
      renderAnnouncements();
    });

    box.append(row2, titleWrap, bodyWrap, delBtn);
    list.appendChild(box);
  });
}

function collectState() {
  state.urgentBanner = {
    enabled: document.getElementById('ubEnabled').value === 'true',
    tag: document.getElementById('ubTag').value.trim(),
    message: document.getElementById('ubMessage').value.trim()
  };

  state.prayerSettings = {
    ...state.prayerSettings,
    jumuaTime: document.getElementById('psJumua').value.trim() || '13:00',
    iqamaOffsets: {
      Fajr: Number(document.getElementById('iqFajr').value) || 10,
      Dhuhr: Number(document.getElementById('iqDhuhr').value) || 10,
      Asr: Number(document.getElementById('iqAsr').value) || 10,
      Maghrib: Number(document.getElementById('iqMaghrib').value) || 5,
      Isha: Number(document.getElementById('iqIsha').value) || 10
    }
  };

  state.projectFund = {
    title: document.getElementById('pfTitle').value.trim(),
    raisedAmount: Number(document.getElementById('pfRaised').value) || 0,
    goalAmount: Number(document.getElementById('pfGoal').value) || 1,
    description: document.getElementById('pfDesc').value.trim()
  };

  const rows = document.querySelectorAll('#adminAnnouncementsList .ann-edit-row');
  state.announcements = Array.from(rows).map((r, idx) => {
    const existingImg = state.announcements[idx]?.image;
    const item = {
      category: r.querySelector('.ann-cat').value.trim(),
      date: r.querySelector('.ann-date').value.trim(),
      title: r.querySelector('.ann-title').value.trim(),
      body: r.querySelector('.ann-body').value.trim()
    };
    if (existingImg) item.image = existingImg;
    return item;
  });
}
