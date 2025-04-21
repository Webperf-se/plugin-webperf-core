export class Score {

  constructor() {
  }

  calculateScore(issues) {
    let categoryScores = {
      'overall': 100,
    };
    issues.forEach(issue => {
      if (!categoryScores[issue.category]) {
        categoryScores[issue.category] = 100;
      }
      if (issue.severity === 'critical') {
        categoryScores[issue.category] -= 25;
      } else if (issue.severity === 'error') {
        categoryScores[issue.category] -= 10;
      } else if (issue.severity === 'warning') {
        categoryScores[issue.category] -= 1;
      }
    });
    const Scores = Object.entries(categoryScores)
      .filter(([key]) => key !== 'overall') // Exclude 'overall' from the calculation
      .map(([, value]) => value);
    const total = Scores.reduce((sum, Score) => sum + Score, 0);
    categoryScores['overall'] = Scores.length > 0 ? total / Scores.length : 100; // Use average
    return categoryScores;
  }
}
