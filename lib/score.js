export class Score {

  constructor() {
    // Regler som direkt sätter sin kategoripoäng till 0 ("showstoppers"),
    // i stället för att gå genom det vanliga severity-avdraget.
    //
    // Används när en specifik regel innebär att kategorin är de facto
    // underkänd — t.ex. när en lagstadgad tillgänglighetsredogörelse
    // helt saknas. Lista bara regler där frånvaron är ett underkänt
    // prov, inte saker som "delvis förenlig" eller liknande, för då
    // tappar man nyans i poängsättningen.
    //
    // Vill man lägga till fler i framtiden (t.ex. om HTTPS helt saknas)
    // är detta rätt ställe.
    this.showstopperRules = new Set([
      'no-a11y-statement'
    ]);
  }

  calculateScore(issues) {
    let categoryScores = {
      'overall': 100,
    };

    // Spåra vilka kategorier som ska nollas pga showstopper-regler
    const zeroedCategories = new Set();

    issues.forEach(issue => {
      if (!categoryScores[issue.category]) {
        categoryScores[issue.category] = 100;
      }

      // Showstopper-regler nollar kategorin direkt. Kolla att severity
      // inte är 'resolved' — då är regeln visserligen med i listan men
      // som godkänd, och ska inte trigga nollställning.
      if (this.showstopperRules.has(issue.rule) && issue.severity !== 'resolved') {
        zeroedCategories.add(issue.category);
        return; // Hoppa över vanlig poängdragning för detta issue
      }

      if (issue.severity === 'critical') {
        categoryScores[issue.category] -= 25;
      } else if (issue.severity === 'error') {
        categoryScores[issue.category] -= 10;
      } else if (issue.severity === 'warning') {
        categoryScores[issue.category] -= 1;
      }
    });

    // Tvinga showstopper-kategorier till 0
    zeroedCategories.forEach(category => {
      categoryScores[category] = 0;
    });

    const Scores = Object.entries(categoryScores)
      .filter(([key]) => key !== 'overall') // Exclude 'overall' from the calculation
      .map(([, value]) => value);
    const total = Scores.reduce((sum, Score) => sum + Score, 0);
    categoryScores['overall'] = Scores.length > 0 ? total / Scores.length : 100; // Use average
    return categoryScores;
  }
}