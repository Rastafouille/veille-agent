import { readFile, writeFile } from 'node:fs/promises';

const SITE_URL = 'https://rastafouille.github.io/veille-agent/';
const INDEX_PATH = new URL('../index.html', import.meta.url);
const DRY_RUN = process.env.DRY_RUN === '1';

const tabsConfig = {
  humanoide: {
    sourceHints: ['arXiv cs.RO', 'IEEE', 'IROS', 'ICRA', 'Robot Report'],
    queries: [
      'humanoid robot loco manipulation whole body manipulation',
      'humanoid robot active perception manipulation locomotion',
      'humanoid robot navigation confined spaces manipulation',
      'Unitree G1 humanoid robot whole body manipulation',
    ],
    required: ['humanoid'],
    positive: ['loco', 'manipulation', 'whole-body', 'mobility', 'perception', 'navigation'],
    negative: [],
  },
  jerem: {
    sourceHints: ['arXiv', 'ScienceDirect', 'IEEE', 'MDPI', 'IAEA', 'UKAEA', 'RAICo', 'World Nuclear News'],
    queries: [
      'nuclear robot radiation mapping gamma source localization',
      'radiological mapping robot lidar slam decommissioning',
      'nuclear decommissioning robot inspection radiation',
      'autonomous robot radioactive source localization',
    ],
    required: ['radiation', 'nuclear', 'radioactive', 'radiological', 'gamma'],
    positive: ['robot', 'mapping', 'slam', 'lidar', 'decommissioning', 'source localization', 'inspection'],
    negative: ['reactor physics', 'fuel cycle'],
  },
  val: {
    sourceHints: ['arXiv', 'IEEE', 'ScienceDirect', 'Springer', 'MDPI', 'HAL'],
    queries: [
      'LiDAR SLAM benchmark motion capture ground truth',
      'LiDAR odometry benchmark mobile robot ATE RPE',
      'LiDAR only SLAM comparison robot ground truth',
      'FAST-LIO LIO-SAM LOAM benchmark motion capture',
    ],
    required: ['lidar', 'slam', 'odometry'],
    positive: ['benchmark', 'ground truth', 'motion capture', 'ATE', 'RPE', 'robot'],
    negative: ['visual', 'camera', 'rgb-d', 'vio'],
  },
  nathan: {
    sourceHints: ['arXiv', 'IEEE NSS/MIC', 'JINST', 'NIM A', 'ScienceDirect', 'MDPI', 'CERN Indico'],
    queries: [
      'SiPM readout ASIC front-end electronics',
      'silicon photomultiplier readout electronics timing temperature compensation',
      'SiPM dual gain configurable threshold readout',
      'Citiroc TOFPET SPIROC RADIOROC SiPM',
    ],
    required: ['sipm', 'silicon photomultiplier'],
    positive: ['readout', 'ASIC', 'front-end', 'electronics', 'timing', 'temperature', 'dual', 'threshold'],
    negative: [],
  },
  'pierre-louis': {
    sourceHints: ['arXiv', 'ScienceDirect', 'HAL', 'PubMed', 'IEEE', 'MDPI'],
    queries: [
      'gamma spectroscopy deep learning radioisotope identification',
      'gamma spectrometry denoising spectral unmixing bayesian',
      'nuclear measurement inverse problem spectrometry machine learning',
      'radiation contamination detection gamma spectra AI',
    ],
    required: ['gamma', 'spectrometry', 'spectroscopy', 'radioisotope', 'radiation'],
    positive: ['deep learning', 'bayesian', 'denoising', 'unmixing', 'identification', 'inverse'],
    negative: [],
  },
  lucas: {
    sourceHints: ['Unity', 'Unreal', 'Khronos OpenXR', 'NVIDIA', 'ACM SIGGRAPH', 'arXiv', 'ScienceDirect'],
    queries: [
      'Unity XR OpenXR digital twin Gaussian splatting',
      'Unreal Engine XR scientific visualization digital twin',
      'Gaussian splatting realtime simulation Unity',
      'spatial computing OpenXR industrial digital twin',
    ],
    required: ['unity', 'unreal', 'xr', 'openxr', 'digital twin', 'gaussian splatting', 'nerf'],
    positive: ['simulation', 'real-time', 'rendering', 'visualization', 'industrial', 'gpu'],
    negative: ['game review'],
  },
  'thibaud-d': {
    sourceHints: ['arXiv', 'IEEE RA-L', 'ScienceDirect', 'Springer', 'SoCG'],
    queries: [
      'polygonal SLAM path planning robot polyhedral map',
      'convex decomposition robot motion planning point cloud',
      'Voronoi diagram robot path planning SLAM',
      'navigation mesh robot path planning polygonal environment',
    ],
    required: ['polygon', 'polyhedral', 'convex', 'voronoi', 'navigation mesh'],
    positive: ['robot', 'slam', 'path planning', 'motion planning', 'point cloud', 'decomposition'],
    negative: [],
  },
};

function normalize(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[\s\-_:/()[\]{}'"`.,;!?]+/g, ' ')
    .trim();
}

function escapeSqlLike(value) {
  return String(value || '').replaceAll("'", "''");
}

function extractSupabase(html) {
  const url = html.match(/const\s+SUPABASE_URL\s*=\s*\r?\n\s*'([^']+)'/)?.[1];
  const key = html.match(/const\s+SUPABASE_KEY\s*=\s*\r?\n\s*'([^']+)'/)?.[1];
  if (!url || !key) {
    throw new Error('SUPABASE_URL ou SUPABASE_KEY introuvable dans index.html');
  }
  return { url, key };
}

async function supabaseFetch({ url, key }, table, params = '', options = {}) {
  const endpoint = `${url}/rest/v1/${table}${params}`;
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`${table} ${res.status}: ${await res.text()}`);
  }
  return res.status === 204 ? null : res.json();
}

async function fetchArxiv(query, fromDate) {
  const encoded = encodeURIComponent(`all:${query}`);
  const url = `https://export.arxiv.org/api/query?search_query=${encoded}&start=0&max_results=8&sortBy=submittedDate&sortOrder=descending`;
  const xml = await fetch(url).then((res) => res.text());
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((entry) => {
    const block = entry[1];
    const title = decodeXml(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '').replace(/\s+/g, ' ').trim();
    const summary = decodeXml(block.match(/<summary>([\s\S]*?)<\/summary>/)?.[1] || '').replace(/\s+/g, ' ').trim();
    const link = block.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim();
    const published = block.match(/<published>([\s\S]*?)<\/published>/)?.[1]?.slice(0, 10);
    return { title, description: summary, link, published_at: published, source: 'arXiv', type: 'science' };
  }).filter((item) => item.title && item.link && item.published_at >= fromDate);
}

async function fetchCrossref(query, fromDate) {
  const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&filter=from-pub-date:${fromDate}&sort=published&order=desc&rows=6`;
  const data = await fetch(url).then((res) => res.json()).catch(() => null);
  return (data?.message?.items || []).map((item) => {
    const title = item.title?.[0];
    const dateParts = item.published?.['date-parts']?.[0] || item['published-print']?.['date-parts']?.[0] || [];
    const published = dateParts.length ? new Date(Date.UTC(dateParts[0], (dateParts[1] || 1) - 1, dateParts[2] || 1)).toISOString().slice(0, 10) : null;
    return {
      title,
      description: item.abstract ? item.abstract.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : `${item.publisher || 'Editeur'} - ${item['container-title']?.[0] || 'publication scientifique'}`,
      link: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : null),
      published_at: published,
      source: item.publisher || 'Crossref',
      type: 'science',
    };
  }).filter((item) => item.title && item.link && item.published_at >= fromDate);
}

async function fetchHal(query, fromDate) {
  const url = `https://api.archives-ouvertes.fr/search/?q=${encodeURIComponent(query)}&fq=submittedDateY_i:[${fromDate.slice(0, 4)} TO *]&rows=6&sort=submittedDate_tdate desc&fl=title_s,uri_s,abstract_s,submittedDate_s,producedDate_s`;
  const data = await fetch(url).then((res) => res.json()).catch(() => null);
  return (data?.response?.docs || []).map((item) => ({
    title: Array.isArray(item.title_s) ? item.title_s[0] : item.title_s,
    description: Array.isArray(item.abstract_s) ? item.abstract_s[0] : item.abstract_s || 'Depot HAL pertinent pour la veille.',
    link: item.uri_s,
    published_at: (item.producedDate_s || item.submittedDate_s || '').slice(0, 10),
    source: 'HAL',
    type: 'science',
  })).filter((item) => item.title && item.link && item.published_at >= fromDate);
}

function decodeXml(value) {
  return String(value || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function scoreCandidate(candidate, tab, positiveTitles, negativeTitles) {
  const text = normalize(`${candidate.title} ${candidate.description}`);
  const requiredHit = tab.required.some((term) => text.includes(normalize(term)));
  if (!requiredHit) return -100;
  if (tab.negative.some((term) => text.includes(normalize(term)))) return -50;

  let score = 0;
  for (const term of tab.positive) {
    if (text.includes(normalize(term))) score += 3;
  }
  for (const title of positiveTitles) {
    for (const token of normalize(title).split(' ').filter((token) => token.length > 5)) {
      if (text.includes(token)) score += 0.15;
    }
  }
  for (const title of negativeTitles) {
    for (const token of normalize(title).split(' ').filter((token) => token.length > 5)) {
      if (text.includes(token)) score -= 0.15;
    }
  }
  if (candidate.source === 'arXiv') score += 1;
  return score;
}

function toFrenchDescription(item, tabName) {
  const desc = String(item.description || '').replace(/\s+/g, ' ').slice(0, 240);
  return `${tabName}: resultat recent retenu pour sa proximite avec le prompt de veille. ${desc}`;
}

function extractMeta(html) {
  const match = html.match(/<script id="watch-agent-meta" type="application\/json">([\s\S]*?)<\/script>/);
  return match ? JSON.parse(match[1]) : {};
}

function replaceMeta(html, meta) {
  const json = JSON.stringify(meta, null, 2);
  return html.replace(
    /<script id="watch-agent-meta" type="application\/json">[\s\S]*?<\/script>/,
    `<script id="watch-agent-meta" type="application/json">\n${json}\n</script>`,
  );
}

async function sendGmail(to, subject, content) {
  const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_FROM } = process.env;
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) return false;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  if (!tokenRes.ok) throw new Error(`Gmail token ${tokenRes.status}: ${await tokenRes.text()}`);
  const token = await tokenRes.json();
  const raw = Buffer.from([
    `From: ${GMAIL_FROM || 'me'}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    content,
  ].join('\r\n')).toString('base64url');

  const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });
  if (!sendRes.ok) throw new Error(`Gmail send ${sendRes.status}: ${await sendRes.text()}`);
  return true;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ''));
}

async function main() {
  const now = new Date();
  const from = new Date(now);
  from.setMonth(from.getMonth() - 6);
  const fromDate = from.toISOString().slice(0, 10);
  const runDate = now.toISOString().slice(0, 10);
  const html = await readFile(INDEX_PATH, 'utf8');
  const supabase = extractSupabase(html);

  const [tabs, configs, inputs, articles] = await Promise.all([
    supabaseFetch(supabase, 'tabs', '?select=*'),
    supabaseFetch(supabase, 'watch_configs', '?select=*&enabled=eq.true'),
    supabaseFetch(supabase, 'research_inputs', '?select=*'),
    supabaseFetch(supabase, 'articles', '?select=id,title,category,link,hidden,is_new,rating,published_at'),
  ]);

  const existingTitles = new Set(articles.map((article) => normalize(article.title)));
  const existingLinks = new Set(articles.map((article) => String(article.link || '').trim()).filter(Boolean));
  const bySlug = new Map(tabs.map((tab) => [tab.slug, tab]));
  const inputBySlug = Map.groupBy ? Map.groupBy(inputs, (item) => item.tab_slug) : groupBy(inputs, (item) => item.tab_slug);
  const newArticles = [];
  const runs = [];

  for (const config of configs) {
    const slug = config.tab_slug;
    const tab = bySlug.get(slug);
    const tabRules = tabsConfig[slug];
    if (!tab || !tabRules) {
      runs.push(emptyRun(slug, tab?.name || slug, config, articles));
      continue;
    }

    const rated = articles.filter((article) => article.category === slug);
    const positiveTitles = rated.filter((article) => Number(article.rating) >= 8).map((article) => article.title);
    const negativeTitles = rated.filter((article) => Number(article.rating) <= 3).map((article) => article.title);
    const userInputs = (inputBySlug.get(slug) || []).map((item) => item.input).filter(Boolean);
    const queries = [...new Set([...tabRules.queries, ...userInputs.filter((item) => item.length > 3)])];

    const batches = [];
    for (const query of queries.slice(0, 8)) {
      batches.push(fetchArxiv(query, fromDate));
      batches.push(fetchCrossref(query, fromDate));
      if (['jerem', 'val', 'pierre-louis', 'lucas'].includes(slug)) batches.push(fetchHal(query, fromDate));
    }

    const candidates = (await Promise.allSettled(batches))
      .flatMap((result) => result.status === 'fulfilled' ? result.value : [])
      .filter((item) => item.title && item.link && !existingTitles.has(normalize(item.title)) && !existingLinks.has(item.link));

    const unique = [];
    const seen = new Set();
    for (const candidate of candidates) {
      const key = `${normalize(candidate.title)}|${candidate.link}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(candidate);
      }
    }

    const selected = unique
      .map((item) => ({ ...item, score: scoreCandidate(item, tabRules, positiveTitles, negativeTitles) }))
      .filter((item) => item.score >= 4)
      .sort((a, b) => b.score - a.score || b.published_at.localeCompare(a.published_at))
      .slice(0, Math.min(Number(config.max_articles || 20), 4));

    const inserted = selected.map((item) => ({
      title: item.title,
      category: slug,
      type: item.type,
      description: toFrenchDescription(item, tab.name),
      link: item.link,
      hidden: false,
      published_at: item.published_at,
      is_new: true,
      rating: 5,
    }));

    for (const article of inserted) {
      existingTitles.add(normalize(article.title));
      existingLinks.add(article.link);
      newArticles.push(article);
    }

    runs.push({
      tab_slug: slug,
      tab_name: tab.name,
      watch_title: config.title || tab.name,
      articles_added: inserted.length,
      science_added: inserted.filter((item) => item.type === 'science').length,
      press_added: inserted.filter((item) => item.type === 'presse').length,
      unread_count: null,
      summary: inserted.length
        ? `${inserted.length} nouveau(x) resultat(s) retenu(s) apres recherche cloud et deduplication.`
        : 'Aucun nouvel article suffisamment pertinent apres recherche cloud et deduplication.',
      refined_context: `Prompt reformule autour de: ${tabRules.queries.slice(0, 2).join(' ; ')}.`,
      prompt_interpretation: `Requetes anglaises construites depuis le prompt utilisateur et les pistes: ${queries.slice(0, 4).join(' | ')}.`,
      rating_guidance: `Ratings utilises: ${positiveTitles.length} signaux positifs (8-10), ${negativeTitles.length} contre-exemples (0-3).`,
      scanned_sources: [
        { name: 'arXiv API', reason: 'Preprints recents sur 6 mois.' },
        { name: 'Crossref API', reason: 'Editeurs scientifiques et DOI recents.' },
        ...(slug === 'jerem' || slug === 'val' || slug === 'pierre-louis' || slug === 'lucas'
          ? [{ name: 'HAL API', reason: 'Depots institutionnels et labos.' }]
          : []),
        { name: tabRules.sourceHints.join(', '), reason: 'Bouquet de sources cible pour les recherches et termes.' },
      ],
      suggested_sources: tabRules.sourceHints,
      search_terms: queries,
      new_titles: inserted.map((item) => item.title),
    });
  }

  let insertedRows = [];
  if (newArticles.length && !DRY_RUN) {
    insertedRows = await supabaseFetch(supabase, 'articles', '', {
      method: 'POST',
      body: JSON.stringify(newArticles),
    });
  }

  const freshArticles = DRY_RUN
    ? [...articles, ...newArticles]
    : await supabaseFetch(supabase, 'articles', '?select=id,title,category,link,hidden,is_new,rating,published_at');
  const unreadBySlug = new Map();
  for (const article of freshArticles) {
    if (article.hidden === false && article.is_new === true) {
      unreadBySlug.set(article.category, (unreadBySlug.get(article.category) || 0) + 1);
    }
  }
  for (const run of runs) {
    run.unread_count = unreadBySlug.get(run.tab_slug) || 0;
  }

  const next = new Date(now);
  next.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7));
  next.setHours(8, 0, 0, 0);

  const meta = extractMeta(html);
  const nextMeta = {
    ...meta,
    last_watch: `${runDate}T08:00:00+02:00`,
    next_watch: `${next.toISOString().slice(0, 10)}T08:00:00+02:00`,
    updated_at: new Date().toISOString(),
    status: 'success',
    articles_added: newArticles.length,
    tabs_processed: runs.length,
    summary: `Run cloud GitHub Actions du ${runDate}: ${newArticles.length} nouvel article ajoute apres recherche 6 mois et deduplication stricte.`,
    runs,
  };

  const updatedHtml = replaceMeta(html, nextMeta);
  if (!DRY_RUN) {
    await writeFile(INDEX_PATH, updatedHtml, 'utf8');
  }

  const emailErrors = [];
  for (const run of runs) {
    const tab = bySlug.get(run.tab_slug);
    if (!isEmail(tab?.notification_email)) continue;
    const content = [
      `Bonjour,`,
      ``,
      `Run de veille pour ${run.tab_name}: ${run.articles_added} nouveau(x) article(s).`,
      `Non lus visibles: ${run.unread_count}`,
      ``,
      run.new_titles.length ? `Titres:\n- ${run.new_titles.join('\n- ')}` : 'Aucun nouveau titre sur ce run.',
      ``,
      `A consulter ici: ${SITE_URL}`,
    ].join('\n');
    if (!DRY_RUN) {
      try {
        await sendGmail(tab.notification_email, `Veille - ${run.tab_name} - ${runDate}`, content);
      } catch (error) {
        emailErrors.push(`${run.tab_slug}: ${error.message}`);
      }
    }
  }

  const globalReport = [
    `Statut: success`,
    `Run: ${runDate}`,
    `Fenetre: depuis ${fromDate}`,
    `Articles ajoutes: ${newArticles.length}`,
    `Insertions: ${insertedRows.map((item) => item.id).join(', ') || 'dry-run/aucune'}`,
    ``,
    ...runs.map((run) => `${run.tab_name}: ${run.articles_added} ajout(s), ${run.unread_count} non lus visibles\n${run.new_titles.map((title) => `- ${title}`).join('\n')}`),
    ``,
    emailErrors.length ? `Erreurs Gmail:\n${emailErrors.join('\n')}` : 'Erreurs Gmail: aucune ou Gmail non configure.',
  ].join('\n');

  if (!DRY_RUN) {
    try {
      await sendGmail('jeremy.seyssaud@gmail.com', `Veille hebdomadaire - rapport du ${runDate}`, globalReport);
    } catch (error) {
      console.warn(`Rapport Gmail non envoye: ${error.message}`);
    }
  }

  console.log(globalReport);
}

function groupBy(items, getKey) {
  const out = new Map();
  for (const item of items) {
    const key = getKey(item);
    out.set(key, [...(out.get(key) || []), item]);
  }
  return out;
}

function emptyRun(slug, name, config, articles) {
  const unread = articles.filter((article) => article.category === slug && article.hidden === false && article.is_new === true).length;
  return {
    tab_slug: slug,
    tab_name: name,
    watch_title: config.title || name,
    articles_added: 0,
    science_added: 0,
    press_added: 0,
    unread_count: unread,
    summary: 'Onglet ignore: configuration de recherche cloud absente.',
    refined_context: '',
    prompt_interpretation: '',
    rating_guidance: '',
    scanned_sources: [],
    suggested_sources: [],
    search_terms: [],
    new_titles: [],
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
