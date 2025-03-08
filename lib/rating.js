export class Rating {
    overall = -1;
    overallCount = 1;
    overallReview = '';
    integrityAndSecurity = -1;
    integrityAndSecurityCount = 1;
    integrityAndSecurityReview = '';
    performance = -1;
    performanceCount = 1;
    performanceReview = '';
    standards = -1;
    standardsCount = 1;
    standardsReview = '';
    a11y = -1;
    a11yCount = 1;
    a11yReview = '';
    reviewShowImprovementsOnly = false;
    translation = false;
    isSet = false;
  
    constructor(translation = null, reviewShowImprovementsOnly = false) {
      this.translation = translation;
      this.reviewShowImprovementsOnly = reviewShowImprovementsOnly;
    }
  
    getTranslationText(translationText) {
      if (this.translation === null || this.translation === false) {
        return translationText;
      }
      return this.translation(translationText);
    }
  
    ensureCorrectPointsRange(points) {
      if (points < 1.0) {
        points = 1.0;
      } else if (points > 5.0) {
        points = 5.0;
      }
      return points;
    }
  
    setOverall(points, review = '') {
      review = review.replace('GOV-IGNORE', '');
      this.overall = this.ensureCorrectPointsRange(points);
      this.isSet = true;
  
      if (review === '') {
        return;
      }
  
      if (this.reviewShowImprovementsOnly && points === 5.0) {
        return;
      }
  
      const transStr = 'TEXT_TEST_REVIEW_RATING_ITEM';
      this.overallReview = this.getTranslationText(transStr).replace('{review}', review).replace('{points}', points);
    }
  
    getOverall() {
      return this.transformValue(this.overall / this.overallCount);
    }
  
    setIntegrityAndSecurity(points, review = '') {
      review = review.replace('GOV-IGNORE', '');
      this.integrityAndSecurity = this.ensureCorrectPointsRange(points);
      this.isSet = true;
  
      if (review === '') {
        return;
      }
  
      if (this.reviewShowImprovementsOnly && points === 5.0) {
        return;
      }
  
      const transStr = 'TEXT_TEST_REVIEW_RATING_ITEM';
      this.integrityAndSecurityReview = this.getTranslationText(transStr).replace('{review}', review).replace('{points}', points);
    }
  
    getIntegrityAndSecurity() {
      return this.transformValue(this.integrityAndSecurity / this.integrityAndSecurityCount);
    }
  
    setPerformance(points, review = '') {
      review = review.replace('GOV-IGNORE', '');
      this.performance = this.ensureCorrectPointsRange(points);
      this.isSet = true;
  
      if (review === '') {
        return;
      }
  
      if (this.reviewShowImprovementsOnly && points === 5.0) {
        return;
      }
  
      const transStr = 'TEXT_TEST_REVIEW_RATING_ITEM';
      this.performanceReview = this.getTranslationText(transStr).replace('{review}', review).replace('{points}', points);
    }
  
    getPerformance() {
      return this.transformValue(this.performance / this.performanceCount);
    }
  
    setStandards(points, review = '') {
      review = review.replace('GOV-IGNORE', '');
      this.standards = this.ensureCorrectPointsRange(points);
      this.isSet = true;
  
      if (review === '') {
        return;
      }
  
      if (this.reviewShowImprovementsOnly && points === 5.0) {
        return;
      }
  
      const transStr = 'TEXT_TEST_REVIEW_RATING_ITEM';
      this.standardsReview = this.getTranslationText(transStr).replace('{review}', review).replace('{points}', points);
    }
  
    getStandards() {
      return this.transformValue(this.standards / this.standardsCount);
    }
  
    setA11y(points, review = '') {
      review = review.replace('GOV-IGNORE', '');
      this.a11y = this.ensureCorrectPointsRange(points);
      this.isSet = true;
  
      if (review === '') {
        return;
      }
  
      if (this.reviewShowImprovementsOnly && points === 5.0) {
        return;
      }
  
      const transStr = 'TEXT_TEST_REVIEW_RATING_ITEM';
      this.a11yReview = this.getTranslationText(transStr).replace('{review}', review).replace('{points}', points);
    }
  
    getA11y() {
      return this.transformValue(this.a11y / this.a11yCount);
    }
  
    isUsed() {
      return this.isSet;
    }
  
    transformValue(value) {
      return parseFloat(value.toFixed(2));
    }
  
    getReviews() {
      let text = this.getTranslationText('TEXT_TEST_REVIEW_OVERVIEW').replace('{overallReview}', this.overallReview);
      if (this.getIntegrityAndSecurity() !== -1 && this.integrityAndSecurityReview !== '') {
        text += this.getTranslationText('TEXT_TEST_REVIEW_INTEGRITY_SECURITY').replace('{integrityAndSecurityReview}', this.integrityAndSecurityReview);
      }
      if (this.getPerformance() !== -1 && this.performanceReview !== '') {
        text += this.getTranslationText('TEXT_TEST_REVIEW_PERFORMANCE').replace('{performanceReview}', this.performanceReview);
      }
      if (this.getA11y() !== -1 && this.a11yReview !== '') {
        text += this.getTranslationText('TEXT_TEST_REVIEW_ALLY').replace('{a11yReview}', this.a11yReview);
      }
      if (this.getStandards() !== -1 && this.standardsReview !== '') {
        text += this.getTranslationText('TEXT_TEST_REVIEW_STANDARDS').replace('{standardsReview}', this.standardsReview);
      }
      return text.replace('GOV-IGNORE', '');
    }
  
    toData() {
      return {
        rating_overall: this.getOverall(),
        rating_security: this.getIntegrityAndSecurity(),
        rating_performance: this.getPerformance(),
        rating_standards: this.getStandards(),
        rating_a11y: this.getA11y()
      };
    }
  
    static fieldNames() {
      return ['rating_overall', 'rating_integrity_and_security', 'rating_performance', 'rating_standards', 'rating_a11y'];
    }
  
    getCombinedValue(val1, val1Count, val2, val2Count) {
      const val1HasValue = val1 !== -1;
      const val2HasValue = val2 !== -1;
  
      if (val1HasValue && val2HasValue) {
        return [val1 + val2, val1Count + val2Count];
      }
  
      if (!val1HasValue && !val2HasValue) {
        return [-1, 1];
      }
  
      if (val1HasValue) {
        return [val1, val1Count];
      }
      return [val2, val2Count];
    }
  
    toString() {
      let text = this.getTranslationText('TEXT_TEST_RATING_OVERVIEW').replace('{overall}', this.getOverall());
      if (this.getIntegrityAndSecurity() !== -1) {
        text += this.getTranslationText('TEXT_TEST_RATING_INTEGRITY_SECURITY').replace('{integrityAndSecurity}', this.getIntegrityAndSecurity());
      }
      if (this.getPerformance() !== -1) {
        text += this.getTranslationText('TEXT_TEST_RATING_PERFORMANCE').replace('{performance}', this.getPerformance());
      }
      if (this.getA11y() !== -1) {
        text += this.getTranslationText('TEXT_TEST_RATING_ALLY').replace('{a11y}', this.getA11y());
      }
      if (this.getStandards() !== -1) {
        text += this.getTranslationText('TEXT_TEST_RATING_STANDARDS').replace('{standards}', this.getStandards());
      }
      return text;
    }
  }
  