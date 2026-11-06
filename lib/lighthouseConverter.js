// Lighthouse categories that are part of the score. Lighthouse 13.5 added
// 'agentic-browsing'; it is left out so the overall score stays comparable
// with earlier runs.
const SCORED_CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

// Audits without a score that are still a valid result. Every other audit
// without a score (scoreDisplayMode 'error') failed to run.
const UNSCORED_DISPLAY_MODES = ['notApplicable', 'manual', 'informative'];

// Informative audits outside the accessibility category that list problems
// in details.items (an empty list when nothing is wrong). Lighthouse gives
// every informative audit score 1, so without this they always show as
// resolved. Other informative audits, like network-requests, js-libraries
// or baseline, only list facts about the page and are left as they are.
// Every informative accessibility audit is an axe rule: it is
// notApplicable when axe found nothing and has items when it found
// violations, so those are handled without a list.
const INFORMATIVE_FINDING_AUDITS = [
    'csp-xss',
    'has-hsts',
    'origin-isolation',
    'clickjacking-mitigation',
    'trusted-types-xss',
    'non-composited-animations'
];

export class LighthouseConverter {

    constructor() {
    }

    getSeverityFromScore(score) {
        if (score >= 90) {
            return 'resolved';
        } else if (score >= 50) {
            return 'warning';
        } else {
            return 'error';
        }
    }

    // Returns why a Lighthouse result can not be used, or undefined if it can.
    // When Lighthouse fails (for example NO_FCP) it still returns a report,
    // but every audit and category has a null score.
    getFailureReason(lighthouseData) {
        if (!lighthouseData) {
            return 'no Lighthouse result';
        }

        if (lighthouseData['runtimeError']) {
            const error = lighthouseData['runtimeError'];
            return `runtimeError ${error.code}: ${error.message}`;
        }

        if (!lighthouseData['categories'] || !lighthouseData['audits']) {
            return 'Lighthouse result without categories or audits';
        }

        for (let categoryKey of SCORED_CATEGORIES) {
            const category = lighthouseData['categories'][categoryKey];
            if (category && (category.score === null || category.score === undefined)) {
                return `category ${categoryKey} has no score`;
            }
        }

        return undefined;
    }

    // True when an informative audit found problems on the page.
    hasInformativeFindings(categoryKey, auditId, audit) {
        if (audit.scoreDisplayMode !== 'informative') {
            return false;
        }
        if (categoryKey !== 'accessibility' && !INFORMATIVE_FINDING_AUDITS.includes(auditId)) {
            return false;
        }
        const items = audit.details && audit.details.items;
        return Array.isArray(items) && items.length > 0;
    }

    appendLighthouseAuditsAsIssuesToData(lighthouseData, group, url) {
        let entry = {
            url: url,
            group: group,
            issues: []
        };

        if (this.getFailureReason(lighthouseData)) {
            return;
        }

        for (let categoryKey of Object.keys(lighthouseData['categories'])) {
            if (!SCORED_CATEGORIES.includes(categoryKey)) {
                continue;
            }

            let category = categoryKey;
            if (category === 'accessibility') {
                category = 'a11y';
            }

            if (!lighthouseData['categories'][categoryKey]['auditRefs']) {
                continue;
            }

            lighthouseData['categories'][categoryKey]['auditRefs'].forEach(auditRef => {
                if (!lighthouseData['audits'][auditRef.id]) {
                    return;
                }

                const audit = lighthouseData['audits'][auditRef.id];

                // Lighthouse never checks manual audits, it only asks a
                // person to. Reporting them would claim a result we do not have.
                if (audit.scoreDisplayMode === 'manual') {
                    return;
                }

                if (!audit.score && audit.score !== 0) {
                    // An audit that failed to run says nothing about the site,
                    // so it must not count as resolved.
                    if (!UNSCORED_DISPLAY_MODES.includes(audit.scoreDisplayMode)) {
                        return;
                    }

                    entry.issues.push({
                        test: 'lighthouse',
                        rule: auditRef.id,
                        severity: 'resolved',
                        category: category,
                        subIssues: []
                    });
                    return;
                }

                try {
                    let score = parseFloat(audit.score) * 100;
                    let severity = this.getSeverityFromScore(score);
                    let text = audit.title;
                    if (audit.displayValue) {
                        text = audit.title + ', ' + audit.displayValue;
                    }

                    // If audit has warnings, make sure to show them as warning (if they are marked as resolved)
                    if (severity === 'resolved' && audit.warnings && audit.warnings.length > 0) {
                        severity = 'warning';
                    }

                    if (severity === 'resolved' && this.hasInformativeFindings(categoryKey, auditRef.id, audit)) {
                        severity = 'warning';
                    }

                    entry.issues.push({
                        test: 'lighthouse',
                        rule: auditRef.id,
                        severity: severity,
                        category: category,
                        subIssues: [{
                            url: url,
                            test: 'lighthouse',
                            rule: auditRef.id,
                            severity: severity,
                            category: category,
                            text: text
                        }]
                    })

                } catch (error) {
                    entry.issues.push({
                        text: error,
                        test: 'lighthouse',
                        rule: auditRef.id,
                        severity: 'critical',
                        category: category,
                        subIssues: []
                    });
                    return;
                }
            });
        }

        return entry;
    }
}
