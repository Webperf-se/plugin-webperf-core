import { SitespeedioPlugin } from '@sitespeed.io/plugin';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const fsp = fs.promises;

const pluginname = 'plugin-webperf-core'

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
    super({ name: pluginname, options, context, queue });

    const libFolder = fileURLToPath(new URL('..', import.meta.url));
    this.pluginFolder = path.resolve(libFolder, '..');
    const packagePath = path.resolve(libFolder, 'package.json');
    this.package = JSON.parse(readFileSync(packagePath, 'utf8'));
    this.dependencies = this.package.dependencies;
    this.version = this.package.version;
  }
  // We only want to run one Lighthouse test at a time to make sure they
  // do not interfer with each other
  concurrency = 1;

  async open(context, options) {
    this.make = context.messageMaker(pluginname).make;
    this.usingBrowsertime = false;
    this.urls = [];
    this.alias = {};
    this.data = {
      'version': this.version,
      'dependencies': this.dependencies,
      'groups': {}
    };

    this.storageManager = super.getStorageManager();

    const libFolder = fileURLToPath(new URL('..', import.meta.url));
    this.pluginFolder = path.resolve(libFolder);
    this.options = options;

    this.pug = await fsp.readFile(
      path.resolve(this.pluginFolder, 'pug', 'index.pug'),
      'utf8'
    );
  }
  async processMessage(message, queue) {
    // super.log(`processMessage type: ${message.type}`);
    switch (message.type) {
      case 'sitespeedio.setup': {
        // Let other plugins know that the pagenotfound plugin is alive
        // queue.postMessage(this.make(pluginname + '.setup'));
        // Add the HTML pugs
        queue.postMessage(
          this.make('html.pug', {
            id: pluginname,
            name: 'Webperf Core',
            pug: this.pug,
            type: 'pageSummary'
          })
        );
        queue.postMessage(
          this.make('html.pug', {
            id: pluginname,
            name: 'Webperf Core',
            pug: this.pug,
            type: 'run'
          })
        );
        break;
      }
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
      case 'webperf-plugin-javascript.summary': {
        this.appendIssuesToData(message.data.knowledgeData);
        break;
      }
      case 'webperf-plugin-html.summary': {
        this.appendIssuesToData(message.data.knowledgeData);
        break;
      }
      case 'webperf-plugin-css.summary': {
        this.appendIssuesToData(message.data.knowledgeData);
        break;
      }
      case 'webperf-plugin-accessibility-statement.summary': {
        this.appendIssuesToData(message.data.knowledgeData);
        break;
      }
      case 'webperf-plugin-pagenotfound.summary': {
        this.appendIssuesToData(message.data.knowledgeData);
        break;
      }
      case 'sitespeedio.summarize': {

        for (let group of Object.keys(this.data.groups)) {
          for (let url of Object.keys(this.data.groups[group].pages)) {
            const page = this.data.groups[group].pages[url];
            super.sendMessage(
              // The HTML plugin will pickup every message names *.pageSummary
              // and publish the data under pageInfo.data.*.pageSummary
              // in this case pageInfo.data.gpsi.pageSummary
              pluginname + '.pageSummary',
              page,
              {
                url,
                group
              }
            );
          }

          super.sendMessage(pluginname + '.summary', this.data.groups[group], {
            group
          });
        }
        break;
      }
    }
  }
  async appendIssuesToData(knowledgeData) {
    for (const entry of knowledgeData) {
      const group = entry.group;

      if (!this.data.groups.hasOwnProperty(group)) {
        this.data.groups[group] = {
          issues: [],
          pages: {},
          totalIssues: 0
        };
      }


      let issues = Object.values(entry.issues);
      this.data.groups[group].issues.push(...issues);
      this.data.groups[group].totalIssues = this.data.groups[group].issues.length; // Update totalIssues

      if (!this.data.groups[group].pages.hasOwnProperty(entry.url)) {
        this.data.groups[group].pages[entry.url] = {
          'version': this.version,
          'dependencies': this.dependencies,
          url: entry.url,
          issues: []
        };
      }
      this.data.groups[group].pages[entry.url].issues.push(...issues);
    }

    await this.storageManager.writeData(
      JSON.stringify(this.data),
      'webperf-core.json'
    );
  }
}