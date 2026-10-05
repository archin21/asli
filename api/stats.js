// GET /api/stats  -> live numbers computed from the Supabase lookups table, shown on the page.
import { supabase } from './_lib.js';

export default async function handler(req, res) {
  try {
    const rows = await (await supabase('lookups?select=brand,claim_rating,known_brand&limit=5000')).json();
    const known = rows.filter((r) => r.known_brand);
    const weak = known.filter((r) => r.claim_rating === 'Vague' || r.claim_rating === 'Not enough evidence');

    const counts = {};
    for (const r of known) {
      const name = r.brand.trim().replace(/\s+/g, ' ');
      const key = name.toLowerCase();
      counts[key] = counts[key] || { name, n: 0 };
      counts[key].n += 1;
    }
    const topBrands = Object.values(counts).sort((a, b) => b.n - a.n).slice(0, 5);

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    return res.status(200).json({
      totalChecks: rows.length,
      brandsChecked: Object.keys(counts).length,
      weakClaimShare: known.length ? Math.round((weak.length / known.length) * 100) : null,
      topBrands,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Stats unavailable' });
  }
}
