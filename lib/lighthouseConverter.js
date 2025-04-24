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

    appendLighthouseAuditsAsIssuesToData(lighthouseData, group, url) {
        let entry = {
            url: url,
            group: group,
            issues: []
        };

        if (!lighthouseData) {
            return;
        }

        if (!lighthouseData['categories']) {
            return;
        }

        for (let categoryKey of Object.keys(lighthouseData['categories'])) {

            let category = categoryKey;
            if (category === 'accessibility') {
                category = 'a11y';
            }

            if (!lighthouseData['categories'][categoryKey]['auditRefs']) {
                entry.issues.push({
                    text: 'no auditRefs',
                    test: 'lighthouse',
                    rule: auditRef.id,
                    severity: severity,
                    category: category,
                    subIssues: []
                });
                continue;
            }

            lighthouseData['categories'][categoryKey]['auditRefs'].forEach(auditRef => {
                if (!lighthouseData['audits'][auditRef.id]) {
                    return;
                }

                const audit = lighthouseData['audits'][auditRef.id];
                if (!audit.score && audit.score !== 0) {
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
                    const severity = this.getSeverityFromScore(score);
                    let text = audit.title;
                    if (audit.displayValue) {
                        text = audit.title + ', ' + audit.displayValue;
                    }

                    // If audit has warnings, make sure to show them as warning (if they are marked as resolved)
                    if (severity === 'resolved' && audit.warnings && audit.warnings.length > 0) {
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