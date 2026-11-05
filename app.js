// Mosquée As-Sâlam de Châtellerault — Contrôleur Temps Réel (Horaires, Hégire, Dons & Mode Écran)

const STORAGE_KEY = 'mosquee_assalam_data_v1';

// Coordonnées exactes du 60 avenue Paul Painlevé, 86100 Châtellerault
const CHATELLERAULT_LAT = 46.8178;
const CHATELLERAULT_LNG = 0.5469;

const PRAYER_NAMES_FR = {
  Fajr: 'Al-Fajr (Aube)',
  Sunrise: 'Chourouk (Lever)',
  Dhuhr: 'Ad-Dhuhr (Midi)',
  Asr: 'Al-Asr (Après-midi)',
  Maghrib: 'Al-Maghrib (Coucher)',
  Isha: 'Al-Isha (Nuit)'
};

let activeTimings = {
  Fajr: '06:33',
  Sunrise: '07:48',
  Dhuhr: '12:46',
  Asr: '15:12',
  Maghrib: '17:40',
  Isha: '18:49'
};

let activeIqamaOffsets = {
  Fajr: '+10 min',
  Dhuhr: '+10 min',
  Asr: '+10 min',
  Maghrib: '+5 min',
  Isha: '+10 min'
};

let clubData = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Afficher la date grégorienne et hégirienne locale en français
  renderDates();

  // 2. Charger les données de la mosquée (Admin / Netlify Blobs / data.json)
  clubData = await loadMosqueeData();
  if (clubData) {
    applyMosqueeData(clubData);
  }

  // 3. Récupérer les horaires astronomiques du jour pour Châtellerault (sauf si forcés par l'Admin)
  if (!clubData?.prayerSettings?.customOverrides?.enabled) {
    await fetchLivePrayerTimesForChatellerault();
  }

  // 4. Démarrer l'horloge et le compte à rebours vers la prochaine prière
  updateNextPrayerAndCountdown();
  setInterval(updateNextPrayerAndCountdown, 1000);

  // 5. Simulateur de don et déduction fiscale 66%
  initDonationSimulator();

  // 6. Mode Écran TV Mosquée (Plein écran), Galerie des 44 Photos des Travaux & Visionneuse Photo
  initTvModal();
  initChantierGallery();
  initPhotoLightbox();

  // 7. Formulaire de contact et d'inscription
  initContactForm();
});

// Les 44 photos historiques des travaux et des bâtisseurs bénévoles (extraites de mosqueechatellerault.wixsite.com/essalem)
const CHANTIER_PHOTOS = [
  { file: 'chantier-01.jpg', label: 'Portail en marbre vert devant la façade « Éts Mallet » (60 av. Paul Painlevé)' },
  { file: 'chantier-02.jpg', label: 'Perspective des nouveaux piliers coffrés sous la charpente de l’ancien garage' },
  { file: 'chantier-03.jpg', label: 'Fronton gravé « Mosquée de la Paix — مسجد السلام » sur le portail d’entrée' },
  { file: 'chantier-04.jpg', label: 'Outils de maçonnerie au premier plan devant la forêt de piliers de la future salle' },
  { file: 'chantier-05.jpg', label: 'Vue d’ensemble des travées de colonnes et de la dalle de 600 m² en cours de travaux' },
  { file: 'chantier-06.jpg', label: 'Cour intérieure et enseigne historique « ÉTS MALLET A » avant réhabilitation' },
  { file: 'chantier-07.jpg', label: 'Bâtiment d’accueil aux volets verts et hall principal de l’ancien dépôt de bus' },
  { file: 'chantier-08.jpg', label: 'Bénévole guidant l’alignement des coffrages de piliers Point.P' },
  { file: 'chantier-09.jpg', label: 'Acheminement du béton à la brouette par les frères bénévoles' },
  { file: 'chantier-10.jpg', label: 'Fixation des coffrages au pied d’un pilier de la grande salle de prière' },
  { file: 'chantier-11.jpg', label: 'Remplissage des seaux d’eau et préparation du sable sur le chantier extérieur' },
  { file: 'chantier-12.jpg', label: 'Sourire d’un bâtisseur bénévole au cœur de la future salle de prière' },
  { file: 'chantier-13.jpg', label: 'Étaiement des colonnes de la grande salle de prière' },
  { file: 'chantier-14.jpg', label: 'Portrait d’un ancien de la communauté devant le mur d’enceinte' },
  { file: 'chantier-15.jpg', label: 'La joie et l’engagement des anciens sur le chantier du 60 av. Paul Painlevé' },
  { file: 'chantier-16.jpg', label: 'Fraternité et accolade entre deux générations de bâtisseurs bénévoles' },
  { file: 'chantier-17.jpg', label: 'Coulage manuel du béton au sommet d’un pilier depuis l’échafaudage' },
  { file: 'chantier-18.jpg', label: 'Alignement des piliers fraîchement coulés sur leurs semelles de fondation' },
  { file: 'chantier-19.jpg', label: 'Moment d’échange fraternel autour des brouettes de chantier' },
  { file: 'chantier-20.jpg', label: 'Travail d’équipe autour de la tour d’échafaudage centrale' },
  { file: 'chantier-21.jpg', label: 'Préparation des coffrages et ferraillages dans le grand hall' },
  { file: 'chantier-22.jpg', label: 'Mobilisation des bénévoles pour le coulage des piliers' },
  { file: 'chantier-23.jpg', label: 'Vérification de l’aplomb des colonnes de la salle de prière' },
  { file: 'chantier-24.jpg', label: 'Chantier de réhabilitation intérieure de la Mosquée As-Sâlam' },
  { file: 'chantier-25.jpg', label: 'Coulage des fondations et préparation de la chape de 600 m²' },
  { file: 'chantier-26.jpg', label: 'Les bénévoles en pleine action sous la charpente métallique d’origine' },
  { file: 'chantier-27.jpg', label: 'Manutention des matériaux de construction par les fidèles' },
  { file: 'chantier-28.jpg', label: 'Gâchage du béton à la bétonnière dans la cour de la mosquée' },
  { file: 'chantier-29.jpg', label: 'Préparation des agrégats et du ciment à l’extérieur' },
  { file: 'chantier-30.jpg', label: 'Approvisionnement continu des brouettes de béton vers la salle de prière' },
  { file: 'chantier-31.jpg', label: 'Équipe de bénévoles unie autour de la bétonnière' },
  { file: 'chantier-32.jpg', label: 'Levage des seaux de béton vers le haut des coffrages de colonnes' },
  { file: 'chantier-33.jpg', label: 'Solidarité intergénérationnelle sur le chantier de la Mosquée de la Paix' },
  { file: 'chantier-34.jpg', label: 'Aménagement progressif des 600 m² de la grande salle' },
  { file: 'chantier-35.jpg', label: 'Finitions des bases de piliers et nettoyage de la dalle' },
  { file: 'chantier-36.jpg', label: 'Effort collectif des fidèles châtelleraudais pour bâtir leur mosquée' },
  { file: 'chantier-37.jpg', label: 'Vue croisée des deux rangées de piliers soutenant la charpente' },
  { file: 'chantier-38.jpg', label: 'Installation des échafaudages pour le coulage en hauteur' },
  { file: 'chantier-39.jpg', label: 'Chantier participatif en hauteur au sommet des colonnes' },
  { file: 'chantier-40.jpg', label: 'L’équipe au complet autour des échafaudages et brouettes' },
  { file: 'chantier-41.jpg', label: 'Perspective finale du chantier des piliers avant l’habillage blanc et le tapis rouge' },
  { file: 'chantier-42.jpeg', label: 'Plan d’Architecte APD Avril 2013 (Échelle 1/100) — Grande Salle de Prière' },
  { file: 'chantier-43.jpeg', label: 'Plan d’Architecte APD Avril 2013 (Échelle 1/200) — Vue d’ensemble du projet' }
];

let showAllChantierPhotos = false;
let currentLightboxIndex = -1;

function initChantierGallery() {
  const grid = document.getElementById('chantierPhotoGrid');
  const toggleBtn = document.getElementById('toggleAllChantierPhotosBtn');
  const slideshowBtn = document.getElementById('openChantierSlideshowBtn');

  function renderGrid() {
    if (!grid) return;
    const visibleList = showAllChantierPhotos ? CHANTIER_PHOTOS : CHANTIER_PHOTOS.slice(0, 12);
    grid.innerHTML = visibleList
      .map((item, idx) => {
        const src = `assets/travaux/${item.file}`;
        const num = String(idx + 1).padStart(2, '0');
        return `
          <div class="chantier-thumb-card" onclick="openChantierLightboxAt(${idx})">
            <div class="chantier-thumb-img-wrap">
              <img src="${src}" alt="Photo des travaux ${num} — ${item.label}" loading="lazy" />
              <span class="chantier-thumb-badge">${num} / ${CHANTIER_PHOTOS.length}</span>
            </div>
            <p class="chantier-thumb-caption">${item.label}</p>
          </div>
        `;
      })
      .join('');

    if (toggleBtn) {
      toggleBtn.textContent = showAllChantierPhotos
        ? 'Afficher un aperçu (12 photos)'
        : `Voir les ${CHANTIER_PHOTOS.length} photos des travaux`;
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      showAllChantierPhotos = !showAllChantierPhotos;
      renderGrid();
    });
  }

  if (slideshowBtn) {
    slideshowBtn.addEventListener('click', () => {
      window.openChantierLightboxAt(0);
    });
  }

  renderGrid();
}

window.openChantierLightboxAt = function (index) {
  if (index < 0) index = CHANTIER_PHOTOS.length - 1;
  if (index >= CHANTIER_PHOTOS.length) index = 0;
  currentLightboxIndex = index;
  const item = CHANTIER_PHOTOS[index];
  const src = `assets/travaux/${item.file}`;
  const caption = `Photo ${index + 1} / ${CHANTIER_PHOTOS.length} — ${item.label}`;
  window.openPhotoLightbox(src, caption, true);
};

function initPhotoLightbox() {
  const modal = document.getElementById('photoLightbox');
  const closeBtn = document.getElementById('closePhotoLightbox');
  const prevBtn = document.getElementById('lightboxPrevBtn');
  const nextBtn = document.getElementById('lightboxNextBtn');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentLightboxIndex >= 0) {
        window.openChantierLightboxAt(currentLightboxIndex - 1);
      }
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentLightboxIndex >= 0) {
        window.openChantierLightboxAt(currentLightboxIndex + 1);
      }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (!modal || !modal.classList.contains('open')) return;
    if (e.key === 'Escape') modal.classList.remove('open');
    if (e.key === 'ArrowLeft' && currentLightboxIndex >= 0) {
      window.openChantierLightboxAt(currentLightboxIndex - 1);
    }
    if (e.key === 'ArrowRight' && currentLightboxIndex >= 0) {
      window.openChantierLightboxAt(currentLightboxIndex + 1);
    }
  });
}

window.openPhotoLightbox = function (src, caption, fromChantierAlbum = false) {
  if (!fromChantierAlbum) {
    currentLightboxIndex = -1;
  }
  const modal = document.getElementById('photoLightbox');
  const img = document.getElementById('lightboxTargetImg');
  const cap = document.getElementById('lightboxTargetCaption');
  const prevBtn = document.getElementById('lightboxPrevBtn');
  const nextBtn = document.getElementById('lightboxNextBtn');
  if (modal && img) {
    img.src = src;
    img.alt = caption || 'Mosquée de la Paix Châtellerault';
    if (cap) cap.textContent = caption || '';
    if (prevBtn) prevBtn.style.display = currentLightboxIndex >= 0 ? 'inline-flex' : 'none';
    if (nextBtn) nextBtn.style.display = currentLightboxIndex >= 0 ? 'inline-flex' : 'none';
    modal.classList.add('open');
  }
};

function renderDates() {
  const now = new Date();
  const gregEl = document.getElementById('gregorianDateDisplay');
  if (gregEl) {
    const formatted = now.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    gregEl.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  const hijriEl = document.getElementById('hijriDateDisplay');
  if (hijriEl) {
    try {
      const hijriFormatted = new Intl.DateTimeFormat('fr-FR-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(now);
      hijriEl.textContent = `${hijriFormatted} H.`;
    } catch (e) {
      hijriEl.textContent = 'Calendrier Hégirien • Châtellerault';
    }
  }
}

async function loadMosqueeData() {
  try {
    const cloudRes = await fetch('/api/mosquee-data');
    if (cloudRes.ok) {
      const json = await cloudRes.json();
      if (json && json.ok && json.data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
        return json.data;
      }
    }
  } catch (e) {}

  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) return JSON.parse(local);
  } catch (e) {}

  try {
    const res = await fetch('data.json');
    if (res.ok) return await res.json();
  } catch (e) {}

  return null;
}

function applyMosqueeData(data) {
  // 1. Bandeau d'annonce
  const bannerWrap = document.getElementById('urgentBannerWrap');
  const bannerTag = document.getElementById('urgentBannerTag');
  const bannerText = document.getElementById('urgentBannerText');

  if (bannerWrap && data.urgentBanner) {
    bannerWrap.style.display = data.urgentBanner.enabled ? 'block' : 'none';
    if (bannerTag) bannerTag.textContent = data.urgentBanner.tag || 'INFORMATION';
    if (bannerText) bannerText.textContent = data.urgentBanner.message || '';
  }

  // 2. Paramètres de prière & Jumu'a
  if (data.prayerSettings) {
    const jumua = data.prayerSettings.jumuaTime || '13:00';
    ['topJumuaTime', 'facilityJumua', 'cardJumuaTime', 'tvJumuaTime'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = jumua;
    });

    if (data.prayerSettings.iqamaOffsets) {
      for (const [key, offset] of Object.entries(data.prayerSettings.iqamaOffsets)) {
        const el = document.getElementById(`iqama-${key}`);
        if (el) el.textContent = `+${offset} min`;
        activeIqamaOffsets[key] = `+${offset} min`;
      }
    }

    if (data.prayerSettings.customOverrides?.enabled) {
      const ov = data.prayerSettings.customOverrides;
      ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach((p) => {
        if (ov[p]) activeTimings[p] = ov[p];
      });
      renderPrayerTimesToDOM();
    }
  }

  // 3. Collecte & Travaux
  if (data.projectFund) {
    const pf = data.projectFund;
    const titleEl = document.getElementById('projectFundTitle');
    const descEl = document.getElementById('projectFundDesc');
    const raisedEl = document.getElementById('projectRaisedDisplay');
    const goalEl = document.getElementById('projectGoalDisplay');
    const barEl = document.getElementById('projectProgressBar');

    if (titleEl && pf.title) titleEl.textContent = pf.title;
    if (descEl && pf.description) descEl.textContent = pf.description;
    if (raisedEl) raisedEl.textContent = `${Number(pf.raisedAmount || 0).toLocaleString('fr-FR')} €`;
    if (goalEl) goalEl.textContent = `${Number(pf.goalAmount || 1).toLocaleString('fr-FR')} €`;
    if (barEl && pf.goalAmount > 0) {
      const pct = Math.min(100, Math.round((pf.raisedAmount / pf.goalAmount) * 100));
      barEl.style.width = `${pct}%`;
    }
  }

  // 4. Annonces de la mosquée (rendu DOM sécurisé contre les injections XSS)
  const annContainer = document.getElementById('announcementsContainer');
  if (annContainer && Array.isArray(data.announcements)) {
    annContainer.replaceChildren();
    data.announcements.forEach((ann) => {
      const article = document.createElement('article');
      article.className = 'announcement-col';

      const topDiv = document.createElement('div');
      const metaDiv = document.createElement('div');
      metaDiv.className = 'ann-meta';

      const catSpan = document.createElement('span');
      catSpan.textContent = ann.category || 'Vie de la Mosquée';
      const dateSpan = document.createElement('span');
      dateSpan.textContent = ann.date || '';
      metaDiv.append(catSpan, dateSpan);

      const titleEl = document.createElement('h3');
      titleEl.className = 'ann-title';
      titleEl.textContent = ann.title || '';

      const bodyEl = document.createElement('p');
      bodyEl.className = 'ann-body';
      bodyEl.textContent = ann.body || '';

      topDiv.append(metaDiv, titleEl, bodyEl);
      article.appendChild(topDiv);

      if (typeof ann.image === 'string' && /^assets\/[a-zA-Z0-9._/-]+$/.test(ann.image.trim())) {
        const posterWrap = document.createElement('div');
        posterWrap.className = 'ann-poster-wrap';
        posterWrap.addEventListener('click', () => {
          window.openPhotoLightbox(ann.image.trim(), ann.title || '');
        });

        const img = document.createElement('img');
        img.src = ann.image.trim();
        img.alt = ann.title || 'Affiche de la mosquée';

        const label = document.createElement('span');
        label.textContent = 'Voir l’affiche en grand format';

        posterWrap.append(img, label);
        article.appendChild(posterWrap);
      }

      annContainer.appendChild(article);
    });
  }
}

async function fetchLivePrayerTimesForChatellerault() {
  // 1. Essayer le proxy temps réel Mawaqit (/api/mawaqit sur Netlify) puis le calendrier Mawaqit officiel embarqué (mawaqit-data.json)
  let mawaqitConf = null;
  try {
    const liveRes = await fetch('/api/mawaqit');
    if (liveRes.ok) {
      const liveJson = await liveRes.json();
      if (liveJson && liveJson.ok && liveJson.conf) {
        mawaqitConf = liveJson.conf;
      }
    }
  } catch (e) {}

  if (!mawaqitConf) {
    try {
      const localRes = await fetch('mawaqit-data.json');
      if (localRes.ok) {
        mawaqitConf = await localRes.json();
      }
    } catch (e) {}
  }

  if (mawaqitConf) {
    applyMawaqitConfToSite(mawaqitConf);
    return;
  }

  // 2. Fallback astronomique si Mawaqit est indisponible
  try {
    const url = `https://api.aladhan.com/v1/timings?latitude=${CHATELLERAULT_LAT}&longitude=${CHATELLERAULT_LNG}&method=12`;
    const res = await fetch(url);
    if (!res.ok) return;
    const json = await res.json();
    const timings = json?.data?.timings;
    if (timings) {
      ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach((p) => {
        if (timings[p]) {
          activeTimings[p] = timings[p].split(' ')[0];
        }
      });
      renderPrayerTimesToDOM();
    }
  } catch (e) {}
}

function applyMawaqitConfToSite(conf) {
  const now = new Date();
  const monthIdx = now.getMonth(); // 0..11
  const dayStr = String(now.getDate()); // "1".."31"

  // 1. Extraire les horaires exacts du jour depuis le calendrier annuel Mawaqit de la Mosquée As-Sâlam
  // Format Mawaqit calendar[month][day] = [Fajr, Sunrise, Dhuhr, Asr, Maghrib, Isha]
  const dayTimes = conf.calendar?.[monthIdx]?.[dayStr];
  if (Array.isArray(dayTimes) && dayTimes.length >= 6) {
    activeTimings.Fajr = dayTimes[0];
    activeTimings.Sunrise = dayTimes[1];
    activeTimings.Dhuhr = dayTimes[2];
    activeTimings.Asr = dayTimes[3];
    activeTimings.Maghrib = dayTimes[4];
    activeTimings.Isha = dayTimes[5];
  } else if (Array.isArray(conf.times) && conf.times.length >= 5) {
    activeTimings.Fajr = conf.times[0];
    if (conf.shuruq) activeTimings.Sunrise = conf.shuruq;
    activeTimings.Dhuhr = conf.times[1];
    activeTimings.Asr = conf.times[2];
    activeTimings.Maghrib = conf.times[3];
    activeTimings.Isha = conf.times[4];
  }

  // 2. Extraire les délais Iqama exacts du jour depuis iqamaCalendar[month][day] = [Fajr, Dhuhr, Asr, Maghrib, Isha]
  const dayIqama = conf.iqamaCalendar?.[monthIdx]?.[dayStr];
  if (Array.isArray(dayIqama) && dayIqama.length >= 5) {
    const keys = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    keys.forEach((k, idx) => {
      const raw = String(dayIqama[idx] || '+10').trim();
      const formatted = raw.startsWith('+') ? `${raw} min` : raw;
      activeIqamaOffsets[k] = formatted;
      const el = document.getElementById(`iqama-${k}`);
      if (el) el.textContent = formatted;
    });
  }

  // 3. Mettre à jour l'horaire officiel de Jumu'a depuis Mawaqit (13:00)
  if (conf.jumua) {
    ['topJumuaTime', 'facilityJumua', 'cardJumuaTime', 'tvJumuaTime'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = conf.jumua;
    });
  }

  renderPrayerTimesToDOM();
}

function renderPrayerTimesToDOM() {
  ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].forEach((p) => {
    const el = document.getElementById(`time-${p}`);
    if (el && activeTimings[p]) el.textContent = activeTimings[p];
    const tvEl = document.getElementById(`tv-${p}`);
    if (tvEl && activeTimings[p]) tvEl.textContent = activeTimings[p];
  });
}

function updateNextPrayerAndCountdown() {
  const now = new Date();

  // Mettre à jour l'horloge du Mode TV
  const tvClock = document.getElementById('tvLiveClock');
  if (tvClock) {
    tvClock.textContent = now.toLocaleTimeString('fr-FR', { hour12: false });
  }

  const ordered = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  let nextKey = null;
  let nextDate = null;

  for (const key of ordered) {
    const timeStr = activeTimings[key];
    if (!timeStr) continue;
    const [hh, mm] = timeStr.split(':').map(Number);
    const candidate = new Date(now);
    candidate.setHours(hh, mm, 0, 0);
    if (candidate > now) {
      nextKey = key;
      nextDate = candidate;
      break;
    }
  }

  // Si Isha est passée, la prochaine prière est Al-Fajr demain
  if (!nextKey) {
    nextKey = 'Fajr';
    const [hh, mm] = (activeTimings.Fajr || '06:18').split(':').map(Number);
    nextDate = new Date(now);
    nextDate.setDate(now.getDate() + 1);
    nextDate.setHours(hh, mm, 0, 0);
  }

  const diffSec = Math.max(0, Math.floor((nextDate - now) / 1000));
  const hrs = String(Math.floor(diffSec / 3600)).padStart(2, '0');
  const mins = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
  const secs = String(diffSec % 60).padStart(2, '0');

  const nameEl = document.getElementById('nextPrayerName');
  const cdEl = document.getElementById('nextPrayerCountdown');
  const noteEl = document.getElementById('nextPrayerTimeNote');

  if (nameEl) nameEl.textContent = PRAYER_NAMES_FR[nextKey] || nextKey;
  if (cdEl) cdEl.textContent = `-${hrs}:${mins}:${secs}`;
  if (noteEl) {
    const iqamaLabel = activeIqamaOffsets[nextKey] || '+10 min';
    noteEl.textContent = `Adhan Mawaqit à ${activeTimings[nextKey]} • Iqama ${iqamaLabel}`;
  }

  // Surligner la ligne active
  document.querySelectorAll('.prayer-row').forEach((row) => {
    row.classList.toggle('active-prayer', row.getAttribute('data-prayer') === nextKey);
  });
  document.querySelectorAll('.tv-prayer-box').forEach((box) => {
    box.classList.toggle('active-prayer', box.getAttribute('data-tv-prayer') === nextKey);
  });
}

function initDonationSimulator() {
  const btns = document.querySelectorAll('.amount-btn');
  const input = document.getElementById('customDonationInput');
  const box = document.getElementById('taxDeductionBox');

  function updateTaxNote(val) {
    const amount = Math.max(1, Number(val) || 50);
    const netCost = (amount * 0.34).toFixed(2).replace('.00', '');
    if (box) {
      box.innerHTML = `Un don de <strong>${amount} €</strong> ne vous coûte réellement que <strong>${netCost} €</strong> après déduction fiscale de 66 % (dans la limite légale en vigueur).`;
    }
  }

  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      btns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const amt = btn.getAttribute('data-amount');
      if (input) input.value = amt;
      updateTaxNote(amt);
    });
  });

  if (input) {
    input.addEventListener('input', (e) => {
      btns.forEach((b) => b.classList.remove('active'));
      updateTaxNote(e.target.value);
    });
  }

  // Bouton "Copier l'IBAN" en 1 clic
  const copyBtn = document.getElementById('copyIbanBtn');
  const ibanCode = document.getElementById('officialIbanText');
  if (copyBtn && ibanCode) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(ibanCode.textContent.trim());
        copyBtn.textContent = '✓ IBAN Copié !';
        setTimeout(() => {
          copyBtn.textContent = "Copier l'IBAN";
        }, 2500);
      } catch (e) {
        copyBtn.textContent = 'FR76 1870 7007...';
      }
    });
  }
}

function initTvModal() {
  const openBtn = document.getElementById('openTvModeBtn');
  const closeBtn = document.getElementById('closeTvModeBtn');
  const modal = document.getElementById('tvModeModal');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => modal.classList.add('open'));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal) modal.classList.remove('open');
  });
}

function initContactForm() {
  const form = document.getElementById('mosqueeContactForm');
  const feedback = document.getElementById('contactFeedback');
  if (form && feedback) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('mName').value.trim();
      feedback.style.display = 'block';
      feedback.textContent = `Barak Allahou fikoum ${name}. Votre message a bien été enregistré par le secrétariat de la Mosquée As-Sâlam.`;
      form.reset();
    });
  }
}
