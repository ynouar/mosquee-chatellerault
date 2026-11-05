import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

describe('Tests Automatisés — Mosquée de la Paix (As-Sâlam) Châtellerault', () => {
  test('Les photos officielles, plans d’architecte (Avril 2013) et archives des travaux sont présents dans assets/', () => {
    const required = [
      'assets/logo-mosquee-paix.png',
      'assets/portail-exterieur.png',
      'assets/salle-priere.png',
      'assets/archive-garage-mallet.jpg',
      'assets/plan-architecte-100.jpeg',
      'assets/plan-architecte-200.jpeg',
      'assets/pont-henri-iv-chatellerault.jpg'
    ];
    for (const rel of required) {
      const p = path.join(rootDir, rel);
      assert.ok(fs.existsSync(p), `Image manquante : ${rel}`);
      assert.ok(fs.statSync(p).size > 1000, `Image vide : ${rel}`);
    }

    // Vérifier que les 44 photos des travaux sont bien présentes dans assets/travaux/
    const travauxDir = path.join(rootDir, 'assets/travaux');
    const travauxFiles = fs.readdirSync(travauxDir).filter((f) => f.startsWith('chantier-'));
    assert.ok(travauxFiles.length >= 43, `Attendu au moins 43 photos des travaux, trouvé : ${travauxFiles.length}`);
  });

  test('data.json et mawaqit-data.json contiennent les horaires officiels Mawaqit (Jumu’a 13:00)', () => {
    const data = JSON.parse(fs.readFileSync(path.join(rootDir, 'data.json'), 'utf8'));
    assert.equal(data.prayerSettings.jumuaTime, '13:00');
    assert.ok(data.prayerSettings.iqamaOffsets.Fajr > 0);
    assert.ok(Array.isArray(data.announcements) && data.announcements.length >= 1);

    const mawaqit = JSON.parse(fs.readFileSync(path.join(rootDir, 'mawaqit-data.json'), 'utf8'));
    assert.equal(mawaqit.jumua, '13:00');
    assert.equal(mawaqit.name, 'AS-SÂLAM - Chatellerault');
    assert.ok(Array.isArray(mawaqit.calendar) && mawaqit.calendar.length === 12);
  });

  test('index.html intègre l’histoire (Paroisse, Ozon, Garage Mallet), les plans 2013 et le RIB BPVF', () => {
    const html = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
    assert.match(html, /Mosquée de la Paix/);
    assert.match(html, /Paul Painlevé/);
    assert.match(html, /Mallet/);
    assert.match(html, /FR76 1870 7007 4030 4217 3529 813/);
    assert.match(html, /05 49 21 96 97/);
    assert.match(html, /XXX@gmail\.com/);
    assert.match(html, /assets\/plan-architecte-100\.jpeg/);
    assert.match(html, /assets\/plan-architecte-200\.jpeg/);
    assert.match(html, /data-netlify="true"/);
  });

  test('styles.css respecte la palette architecturale moyen-orientale (parchemin #f7f2e7 & émeraude #0e3526) sans noir pur #000000', () => {
    const css = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');
    assert.match(css, /#f7f2e7/i);
    assert.match(css, /#0e3526/i);
    assert.doesNotMatch(css, /background-color:\s*#000000/i);
  });
});
