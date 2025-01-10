import { SitespeedioPlugin } from '@sitespeed.io/plugin';

export default class WebPerfPlugin extends SitespeedioPlugin {
  // Requires https://github.com/sitespeedio/plugin-lighthouse to be included also
  // node node_modules/sitespeed.io/bin/sitespeed.js --plugins.add ../../../@sitespeed.io/plugin-lighthouse/index.js --plugins.add ../../../@sitespeed.io/plugin-webperf/index.js https://webperf.se/ -n 1 --mobile
  constructor(options, context, queue) {
    super({ name: 'webperf-sitespeedio-plugin', options, context, queue });
  }
  // We only want to run one Lighthouse test at a time to make sure they
  // do not interfer with each other
  concurrency = 1;

  async open() {
    this.usingBrowsertime = false;
    this.urls = [];
    this.alias = {};

    this.storageManager = super.getStorageManager();
  }
  async processMessage(message) {
    switch (message.type) {
      case 'browsertime.setup': {
        // We know we will use Browsertime so we wanna keep track of Browseertime summaries
        this.usingBrowsertime = true;
        break;
      }
      case 'coach.run': {
        super.log(`processMessage type: ${message.type}, storing coach.json`);
        const url = message.url;
        await this.storageManager.writeDataForUrl(
          JSON.stringify(message.data),
          'coach.json',
          url,
          undefined,
          this.alias[url]
        );
        break;
      }

      // If we have an alias for an URL we browsertime will tell
      // us and we can use that alias for the URL
      case 'browsertime.alias': {
        this.alias[message.url] = message.data;
        break;
      }

      case 'browsertime.pageSummary': {
        // If all URLs been tested in Browsertime we can
        // move on with Lighthouse tests. Lighthouse uses
        // its own Chrome version so we do not want to run that at the
        // same time as we Browsertime since it will affeect our metrics
        if (this.usingBrowsertime) {
          this.summaries++;
          if (this.summaries === this.urls.length)
            for (let urlAndGroup of this.urls) {
              super.sendMessage('lighthouse.audit', urlAndGroup);
            }
        }
        break;
      }

      case 'url': {
        // If we run Browsertime, we used store the URLs we want to test
        // and run the tests when Browsertime is finisshed.
        if (this.usingBrowsertime) {
          this.urls.push({ url: message.url, group: message.group });
        } else {
          const url = message.url;
          const group = message.group;
          super.sendMessage('lighthouse.audit', {
            url,
            group
          });
        }
        break;
      }

      case 'lighthouse.pageSummary': {
        const url = message.url;
        await this.storageManager.writeDataForUrl(
          JSON.stringify(message.data),
          'lighthouse-lhr.json',
          url,
          undefined,
          this.alias[url]
        );
        break;
      }
    }
  }
}