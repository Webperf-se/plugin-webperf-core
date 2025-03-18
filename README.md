# Plugin WebPerf Core

webperf-core plugin for sitespeed.io.

## Overview

The `plugin-webperf-core` is a plugin used by the [webperf_core](https://github.com/Webperf-se/webperf_core) repository. It is designed to collect data from other sitespeed.io plugins, such as [@sitespeedio/plugin-lighthouse](https://github.com/sitespeedio/plugin-lighthouse). The main goal of this plugin is to move sitespeed.io specific logic into sitespeed.io plugins instead of having them directly in `webperf_core`.

## Features

- Collects data from various sitespeed.io plugins like [@sitespeedio/plugin-lighthouse](https://github.com/sitespeedio/plugin-lighthouse).
- Centralizes sitespeed.io specific logic, keeping it separate from the `webperf_core` repository.
- Provides a streamlined integration with sitespeed.io for better maintainability and modularity.
- Enables easy configuration and use within sitespeed.io environments.

## Installation

To install the plugin, run the following command:

```sh
npm install plugin-webperf-core
```

## Usage

To use the plugin with sitespeed.io, add it to your sitespeed.io configuration file or command line options.

### Configuration

Add the plugin to your sitespeed.io configuration file:

```json
{
  "plugins": {
    "plugin-webperf-core": {
      "enabled": true
    }
  }
}
```

### Command Line

You can also enable the plugin via the command line:

```sh
sitespeed.io --plugins.add plugin-webperf-core
```

## Example

Here is an example of how to use the plugin with sitespeed.io:

```sh
sitespeed.io https://www.example.com --plugins.add plugin-webperf-core
```

## Development

### Running Tests

To run the tests, use the following command:

```sh
npm test
```

### Linting

To lint the code, use the following command:

```sh
npm run lint
```

To automatically fix linting issues, use the following command:

```sh
npm run lint:fix
```

### License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## Acknowledgements

- [sitespeed.io](https://www.sitespeed.io/)
- [webperf-sitespeedio-plugin](https://www.npmjs.com/package/webperf-sitespeedio-plugin)
- [webperf_core](https://github.com/Webperf-se/webperf_core)
