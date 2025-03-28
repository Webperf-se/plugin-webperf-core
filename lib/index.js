import { SitespeedioPlugin } from '@sitespeed.io/plugin';

export default class WebPerfPlugin extends SitespeedioPlugin {
  // Requires
  //  "@sitespeed.io/plugin-lighthouse": "12.1.0",
  //  "@sitespeed.io/plugin": "1.0.0",    
  //  "webperf-sitespeedio-plugin": "2025.1.0"
  // Command
  // node node_modules/sitespeed.io/bin/sitespeed.js --plugins.add ../../../@sitespeed.io/plugin-lighthouse/index.js --plugins.add ../../../webperf-sitespeedio-plugin/index.js -n 1 --mobile https://webperf.se/
  // node node_modules/sitespeed.io/bin/sitespeed.js --plugins.add ../../../webperf-sitespeedio-plugin/index.js -n 1 https://webperf.se/
  // node bin\sitespeed.js -n 1 --plugins.add ../../../plugin-pagenotfound/lib/index.js --plugins.add ../../../plugin-webperf-core/lib/index.js --browsertime.chrome.includeResponseBodies all https://webperf.se
  constructor(options, context, queue) {
    super({ name: 'plugin-webperf-core', options, context, queue });
  }
  // We only want to run one Lighthouse test at a time to make sure they
  // do not interfer with each other
  concurrency = 1;

  async open() {
    this.usingBrowsertime = false;
    this.urls = [];
    this.alias = {};
    this.data = {};

    this.storageManager = super.getStorageManager();
  }
  async processMessage(message) {
    // super.log(`processMessage type: ${message.type}`);
    switch (message.type) {
      case 'browsertime.setup': {
        // We know we will use Browsertime so we wanna keep track of Browseertime summaries
        this.usingBrowsertime = true;
        break;
      }
      case 'coach.run': {
        // super.log(`processMessage type: ${message.type}, storing coach.json`);
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
      case 'sustainable.run': {
        // super.log(`processMessage type: ${message.type}, storing sustainable.json`);
        const url = message.url;
        await this.storageManager.writeDataForUrl(
          JSON.stringify(message.data),
          'sustainable.json',
          url,
          undefined,
          this.alias[url]
        );
        break;
      }
      case 'browsertime.har': {
        const uuid = message.uuid;
        await this.storageManager.writeData(
          JSON.stringify(message.data),
          'browsertime-' + uuid + '.har'
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
        const uuid = message.uuid;
        await this.storageManager.writeData(
          JSON.stringify(message.data),
          'lighthouse-lhr-' + uuid + '.json'
        );
        break;
      }

      case 'webperf-plugin-pagenotfound.summary': {
        this.data['page-not-found'] = message.data;
        await this.storageManager.writeData(
          JSON.stringify(this.data),
          'webperf-core.json'
        );
        break;
      }
    }
  }
}