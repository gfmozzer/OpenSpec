function normalize(values) {
    if (!values)
        return [];
    return values.map((v) => v.trim().toLowerCase()).filter((v) => v.length > 0);
}
export function listBundles(catalog) {
    return catalog.bundles.slice().sort((a, b) => a.id.localeCompare(b.id));
}
export function suggestSkills(catalog, filters = {}) {
    const phase = filters.phase?.trim().toLowerCase();
    const domains = normalize(filters.domains);
    const bundles = normalize(filters.bundles);
    const max = Math.max(1, Math.min(filters.max ?? 5, 20));
    const ranked = catalog.skills.map((skill) => {
        let score = skill.priority;
        const reasons = [];
        if (phase && skill.phases.map((p) => p.toLowerCase()).includes(phase)) {
            score += 3;
            reasons.push(`fase=${phase}`);
        }
        if (domains.length > 0) {
            const skillDomains = skill.domains.map((d) => d.toLowerCase());
            const hits = domains.filter((domain) => skillDomains.includes(domain));
            if (hits.length > 0) {
                score += hits.length * 2;
                reasons.push(`dominios=${hits.join(',')}`);
            }
        }
        if (bundles.length > 0) {
            const skillBundles = skill.bundle_ids.map((b) => b.toLowerCase());
            const hits = bundles.filter((bundle) => skillBundles.includes(bundle));
            if (hits.length > 0) {
                score += 4;
                reasons.push(`bundle=${hits.join(',')}`);
            }
        }
        return { skill, score, reasons };
    });
    ranked.sort((a, b) => {
        if (b.score !== a.score)
            return b.score - a.score;
        return a.skill.id.localeCompare(b.skill.id);
    });
    return ranked.slice(0, max);
}
//# sourceMappingURL=skills.js.map