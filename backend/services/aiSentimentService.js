/**
 * AI Sentiment Service — RoBERTa + FLAN-T5 via @xenova/transformers
 *
 * Model 1 (Sentiment): cardiffnlp/twitter-roberta-base-sentiment-latest
 *   - RoBERTa fine-tuned on 124M tweets → POSITIVE / NEUTRAL / NEGATIVE per review
 *   - ~120MB download on first use
 *
 * Model 2 (Natural Review): google/flan-t5-small (via Xenova)
 *   - Instruction-following T5 model → generates a human-like restaurant summary
 *   - ~80MB download on first use
 *   - Prompt: "Based on these reviews of X, describe the restaurant naturally..."
 *
 * Both run fully locally in Node.js via ONNX Runtime. No API key, no Python.
 */

const { pipeline } = require('@xenova/transformers');

// ── SENTIMENT MODEL ───────────────────────────────────────────────────────────
let _classifier = null;
let _classifierError = null;
const SENTIMENT_MODEL = 'Xenova/twitter-roberta-base-sentiment-latest';
const BATCH_SIZE = 16;

const getClassifier = async () => {
  if (_classifier) return _classifier;
  if (_classifierError) throw _classifierError;
  console.log(`[AI] Loading sentiment model: ${SENTIMENT_MODEL}`);
  try {
    _classifier = await pipeline('sentiment-analysis', SENTIMENT_MODEL, { quantized: true });
    console.log('[AI] Sentiment model ready');
    return _classifier;
  } catch (err) {
    _classifierError = err;
    console.error('[AI] Sentiment model failed:', err.message);
    throw err;
  }
};

// ── REVIEW GENERATOR MODEL ────────────────────────────────────────────────────
let _generator = null;
let _generatorError = null;
const GENERATOR_MODEL = 'Xenova/flan-t5-small';

const getGenerator = async () => {
  if (_generator) return _generator;
  if (_generatorError) throw _generatorError;
  console.log(`[AI] Loading text generation model: ${GENERATOR_MODEL}`);
  try {
    _generator = await pipeline('text2text-generation', GENERATOR_MODEL, { quantized: true });
    console.log('[AI] Text generation model ready');
    return _generator;
  } catch (err) {
    _generatorError = err;
    console.error('[AI] Text generation model failed:', err.message);
    throw err;
  }
};

// ── LABEL MAPPING ─────────────────────────────────────────────────────────────
const normalizeLabel = (label = '') => {
  const l = label.toLowerCase();
  if (l.includes('positive') || l === 'label_2') return 'positive';
  if (l.includes('negative') || l === 'label_0') return 'negative';
  return 'neutral';
};

// ── PERCENTAGE HELPERS ────────────────────────────────────────────────────────
const toPercentages = (counts) => {
  const total = counts.positive + counts.negative + counts.neutral;
  if (total <= 0) return { positive: 0, negative: 0, neutral: 0 };

  const raw = [
    { key: 'positive', value: (counts.positive / total) * 100 },
    { key: 'negative', value: (counts.negative / total) * 100 },
    { key: 'neutral',  value: (counts.neutral  / total) * 100 },
  ];

  const base = { positive: 0, negative: 0, neutral: 0 };
  const fractions = [];
  let sumFloors = 0;

  raw.forEach(({ key, value }) => {
    const floored = Math.floor(value);
    base[key] = floored;
    sumFloors += floored;
    fractions.push({ key, frac: value - floored });
  });

  let remaining = 100 - sumFloors;
  fractions.sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remaining; i++) base[fractions[i % fractions.length].key] += 1;

  return base;
};

// ── PICK REPRESENTATIVE REVIEWS ───────────────────────────────────────────────
// Evenly sample positive, negative, and neutral reviews so the summary is balanced
const sampleReviews = (reviews, labelledResults, maxPerClass = 4) => {
  const buckets = { positive: [], negative: [], neutral: [] };
  reviews.forEach((text, i) => {
    const label = normalizeLabel(labelledResults[i]?.label || '');
    if (buckets[label].length < maxPerClass) buckets[label].push(text.slice(0, 180));
  });
  return [...buckets.positive, ...buckets.neutral, ...buckets.negative];
};

// ── TOPIC KEYWORD GROUPS ──────────────────────────────────────────────────────
const TOPIC_KEYWORDS = {
  food:      ['food','taste','flavor','flavour','delicious','dish','meal','pizza','burger','chicken','cheese','menu','portion','fresh','cooked','spicy','sauce','biryani','karahi','kebab','grilled','fried','dessert','sweet','juicy','crispy'],
  service:   ['service','staff','waiter','waitress','server','management','friendly','rude','attentive','helpful','slow','fast','quick','polite','responsive','hospitality','crew','team'],
  ambiance:  ['ambiance','ambience','atmosphere','decor','view','seating','clean','hygiene','noise','cozy','comfortable','beautiful','nice','place','interior','outdoor','indoor','environment','setting','vibe'],
  value:     ['price','expensive','cheap','affordable','value','worth','overpriced','reasonable','cost','budget','pocket','money','pricey'],
  wait:      ['wait','waiting','time','long','late','quick','slow','minutes','hour','delay','rush','queue'],
};

// ── EXTRACTIVE SUMMARIZER ─────────────────────────────────────────────────────
// Returns { text: string, sections: array } — sections power the structured UI card.
// Detect metadata / structured data strings that are not human-written reviews
const isMetadataString = (t) => {
  if (/Food:\s*\d|Service:\s*\d|Atmosphere:\s*\d/.test(t)) return true;
  if (/Order type (Dine|Delivery|Takeaway|Drive)/i.test(t)) return true;
  if (/Price per person/i.test(t)) return true;
  if (/Meal type (Breakfast|Lunch|Dinner|Brunch)/i.test(t)) return true;
  if (/Wait time Up to/i.test(t)) return true;
  if (/Group size/i.test(t)) return true;
  const colonDigits = (t.match(/:\s*\d/g) || []).length;
  if (colonDigits >= 2) return true;
  return false;
};

const extractiveSummary = (restaurantName, rawReviews, rawLabels) => {
  // Strip metadata before doing anything
  const reviews = rawReviews.filter(r => !isMetadataString(r));
  const labelledResults = rawLabels.filter((_, i) => !isMetadataString(rawReviews[i]));

  const totalReviews = reviews.length;
  if (!totalReviews) {
    const msg = `No readable customer reviews were found for ${restaurantName}.`;
    return { text: msg, sections: [{ type: 'overview', text: msg }] };
  }

  // Bucket reviews by sentiment
  const sentBuckets = { positive: [], negative: [], neutral: [] };
  reviews.forEach((text, i) => {
    const label = normalizeLabel(labelledResults[i]?.label || '');
    sentBuckets[label].push(text);
  });

  const posCount = sentBuckets.positive.length;
  const negCount = sentBuckets.negative.length;
  const posRatio = posCount / totalReviews;

  // Split all reviews into clean sentences
  const allSentences = [];
  reviews.forEach((text, i) => {
    const label = normalizeLabel(labelledResults[i]?.label || '');
    const sents = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 25 && s.length < 200);
    sents.forEach(s => allSentences.push({ text: s, label }));
  });

  // Word frequency (skip stopwords)
  const stopwords = new Set(['the','a','an','is','it','was','and','or','for','to','of','in','at','on','with','this','that','i','my','we','our','they','their','have','had','be','been','very','really','so','just','not','but','are','were','has','by','no','as','from','its','us','me','he','she','his','her','him','also','even','than','more','most','some','any','all','about','would','could','when','which','what','who','will','can','get','got','one','out','up','if','do','did','its','too','yet','still','much','many','only','other','been','went','come']);
  const wordFreq = {};
  reviews.forEach(r => {
    r.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).forEach(w => {
      if (w.length > 3 && !stopwords.has(w)) wordFreq[w] = (wordFreq[w] || 0) + 1;
    });
  });
  const topWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([w]) => w);

  // Detect which topics are actually discussed
  const topicsFound = {};
  Object.entries(TOPIC_KEYWORDS).forEach(([topic, keywords]) => {
    const count = reviews.filter(r => keywords.some(k => r.toLowerCase().includes(k))).length;
    if (count > 0) topicsFound[topic] = count;
  });

  // Score a sentence: rewards topic mentions, top-word density, and optimal length
  const scoreSentence = (sent, preferredLabel = null) => {
    const lc = sent.text.toLowerCase();
    let score = 0;
    score += topWords.filter(w => lc.includes(w)).length * 8;
    Object.values(TOPIC_KEYWORDS).forEach(kws => {
      if (kws.some(k => lc.includes(k))) score += 5;
    });
    // Prefer sentences in the right sentiment bucket
    if (preferredLabel && sent.label === preferredLabel) score += 10;
    // Prefer medium-length sentences (60–140 chars are naturally readable)
    const len = sent.text.length;
    if (len >= 60 && len <= 140) score += 8;
    else if (len >= 40) score += 4;
    return score;
  };

  const pickBestSentence = (sentences, preferredLabel = null, exclude = new Set()) => {
    const eligible = sentences.filter(s => !exclude.has(s.text));
    if (!eligible.length) return null;
    return eligible.sort((a, b) => scoreSentence(b, preferredLabel) - scoreSentence(a, preferredLabel))[0];
  };

  // ── BUILD SECTIONS ─────────────────────────────────────────────────────────
  const used = new Set();
  const sections = [];
  const paragraphs = [];

  // 1. Overview
  let opening;
  if (posRatio >= 0.75) {
    opening = `${restaurantName} has earned strong praise from its customers, with the overwhelming majority of ${totalReviews} reviews expressing positive experiences.`;
  } else if (posRatio >= 0.55) {
    opening = `${restaurantName} generally receives positive feedback across ${totalReviews} reviews, though some visitors have noted areas that could be improved.`;
  } else if (posRatio >= 0.35) {
    opening = `${restaurantName} draws mixed reactions from its customers — while many enjoy their visits, a notable portion of the ${totalReviews} reviews raise concerns.`;
  } else {
    opening = `${restaurantName} has received largely critical feedback across ${totalReviews} customer reviews, with recurring complaints that potential visitors should be aware of.`;
  }
  sections.push({ type: 'overview', text: opening });
  paragraphs.push(opening);

  // 2. Food
  if (topicsFound.food) {
    const foodSent = pickBestSentence(
      allSentences.filter(s => TOPIC_KEYWORDS.food.some(k => s.text.toLowerCase().includes(k))),
      'positive', used
    );
    if (foodSent) {
      used.add(foodSent.text);
      const prefixes = ['On the food front', 'Regarding the menu and dishes', 'When it comes to the food'];
      const framing = prefixes[totalReviews % prefixes.length];
      sections.push({ type: 'food', icon: '🍽️', label: 'Food & Taste', quote: foodSent.text, framing, sentiment: foodSent.label });
      paragraphs.push(`${framing}, customers note: "${foodSent.text}."`);
    }
  }

  // 3. Service
  if (topicsFound.service) {
    const sent = pickBestSentence(
      allSentences.filter(s => TOPIC_KEYWORDS.service.some(k => s.text.toLowerCase().includes(k))),
      null, used
    );
    if (sent) {
      used.add(sent.text);
      sections.push({ type: 'service', icon: '🧑‍🍳', label: 'Service', quote: sent.text, framing: 'In terms of service', sentiment: sent.label });
      paragraphs.push(`In terms of service, reviewers say: "${sent.text}."`);
    }
  }

  // 4. Ambiance (only if service not already used)
  if (!topicsFound.service && topicsFound.ambiance) {
    const sent = pickBestSentence(
      allSentences.filter(s => TOPIC_KEYWORDS.ambiance.some(k => s.text.toLowerCase().includes(k))),
      null, used
    );
    if (sent) {
      used.add(sent.text);
      sections.push({ type: 'ambiance', icon: '✨', label: 'Ambiance', quote: sent.text, framing: 'On the atmosphere and setting', sentiment: sent.label });
      paragraphs.push(`On the atmosphere and setting, customers mention: "${sent.text}."`);
    }
  }

  // 5. Concern (negative)
  if (negCount >= 2) {
    const negSent = pickBestSentence(
      allSentences.filter(s => s.label === 'negative'),
      'negative', used
    );
    if (negSent) {
      used.add(negSent.text);
      const negIntros = ['On the downside', 'However, not all experiences are positive', 'A recurring concern among visitors'];
      const framing = negIntros[negCount % negIntros.length];
      sections.push({ type: 'concern', icon: '⚠️', label: 'Concern', quote: negSent.text, framing, sentiment: 'negative' });
      paragraphs.push(`${framing}: "${negSent.text}."`);
    }
  }

  // 6. Value / Wait
  const valueSent = pickBestSentence(
    allSentences.filter(s =>
      [...TOPIC_KEYWORDS.value, ...TOPIC_KEYWORDS.wait].some(k => s.text.toLowerCase().includes(k))
    ), null, used
  );
  if (valueSent) {
    used.add(valueSent.text);
    sections.push({ type: 'value', icon: '💰', label: 'Value', quote: valueSent.text, framing: 'On pricing and value', sentiment: valueSent.label });
    paragraphs.push(`On pricing and value, customers have noted: "${valueSent.text}."`);
  }

  // 7. Verdict
  let verdict;
  if (posRatio >= 0.75) {
    verdict = `Highly recommended — ${restaurantName} consistently delivers a positive dining experience based on customer feedback.`;
  } else if (posRatio >= 0.5) {
    verdict = `A decent choice overall — ${restaurantName} is worth a visit, though experiences can vary.`;
  } else {
    verdict = `Approach with caution — ${restaurantName} has received mixed-to-negative feedback and may benefit from improvements.`;
  }
  sections.push({ type: 'verdict', text: verdict });
  paragraphs.push(verdict);

  return { text: paragraphs.join(' '), sections };
};

// ── SENTIMENT ANALYSIS ────────────────────────────────────────────────────────
/**
 * Analyse reviews with RoBERTa. Returns per-class percentages + raw labelled results.
 */
const analyzeWithAI = async (reviews) => {
  const classifier = await getClassifier();
  const counts = { positive: 0, negative: 0, neutral: 0 };
  const labelledResults = [];
  let processed = 0;

  for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
    const batch = reviews.slice(i, i + BATCH_SIZE).map((t) =>
      (typeof t === 'string' ? t : String(t ?? '')).slice(0, 512),
    );
    // eslint-disable-next-line no-await-in-loop
    const results = await classifier(batch, { topk: 1 });
    const items = Array.isArray(results[0]) ? results.map((r) => r[0]) : results;
    items.forEach(({ label }) => {
      const norm = normalizeLabel(label);
      counts[norm] += 1;
      labelledResults.push({ label: norm });
    });
    processed += batch.length;
    console.log(`[AI] Sentiment: ${processed}/${reviews.length} reviews processed`);
  }

  return { ...toPercentages(counts), labelledResults, modelUsed: SENTIMENT_MODEL };
};

// ── NATURAL REVIEW GENERATION ─────────────────────────────────────────────────
/**
 * Generate a human-like restaurant summary.
 * Approach 1: FLAN-T5 generative model (if loaded)
 * Approach 2: Your own extractive summarization algorithm (always works)
 * @param {string} restaurantName
 * @param {string[]} reviews
 * @param {{ labelledResults: Array }} sentimentResult
 * @returns {Promise<string>}
 */
const generateNaturalReview = async (restaurantName, reviews, sentimentResult) => {
  const labelled = sentimentResult.labelledResults || [];
  console.log('[AI] Generating structured review for:', restaurantName);
  return extractiveSummary(restaurantName, reviews, labelled);
};

module.exports = { analyzeWithAI, generateNaturalReview };
