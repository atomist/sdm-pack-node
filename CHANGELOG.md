# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased](https://github.com/atomist/sdm-pack-node/compare/1.1.1...HEAD)

## [1.1.1](https://github.com/atomist/sdm-pack-node/compare/1.1.0...1.1.1) - 2019-07-10

## [1.1.0](https://github.com/atomist/sdm-pack-node/compare/1.0.3...1.1.0) - 2019-05-23

### Added

-   Add next dist tag on publish from default branch. [a94e785](https://github.com/atomist/sdm-pack-node/commit/a94e785122c69f857ed272ca613c988537e5950f)

### Changed

-   Check existence of compile script before trying goal preparation. [#38](https://github.com/atomist/sdm-pack-node/issues/38)

### Fixed

-   Fix accidential replace of tslint. [f2dfac0](https://github.com/atomist/sdm-pack-node/commit/f2dfac0a199d7cf7cab2fb7054685335fab23a71)

## [1.0.3](https://github.com/atomist/sdm-pack-node/compare/1.0.2...1.0.3) - 2019-03-20

### Added

-   Add name for NpmInstallProjectListener. [#32](https://github.com/atomist/sdm-pack-node/issues/32)
-   Add stack support. [#33](https://github.com/atomist/sdm-pack-node/issues/33)

## [1.0.2](https://github.com/atomist/sdm-pack-node/compare/1.0.1...1.0.2) - 2018-12-10

## [1.0.1](https://github.com/atomist/sdm-pack-node/compare/1.0.0-RC.2...1.0.1) - 2018-11-09

### Fixed

-   Replace \_ with - in versioner. [109c561](https://github.com/atomist/sdm-pack-node/commit/109c5618859142cbb2de411b9ecd77cd93b3fc7c)

## [1.0.0-RC.2](https://github.com/atomist/sdm-pack-node/compare/1.0.0-RC.1...1.0.0-RC.2) - 2018-10-30

### Fixed

-   If build pack is a devDependency, it also needs to be a peer. [#14](https://github.com/atomist/sdm-pack-node/issues/14)

## [1.0.0-RC.1](https://github.com/atomist/sdm-pack-node/compare/1.0.0-M.5...1.0.0-RC.1) - 2018-10-15

## [1.0.0-M.5](https://github.com/atomist/sdm-pack-node/compare/1.0.0-M.4...1.0.0-M.5) - 2018-09-26

## [1.0.0-M.4](https://github.com/atomist/sdm-pack-node/compare/1.0.0-M.3...1.0.0-M.4) - 2018-09-16

### Changed

-   Update from src to lib in dependencies. [#7](https://github.com/atomist/sdm-pack-node/issues/7)

## [1.0.0-M.3](https://github.com/atomist/sdm-pack-node/compare/1.0.0-M.1...1.0.0-M.3) - 2018-09-04

## [1.0.0-M.1](https://github.com/atomist/sdm-pack-node/compare/0.2.1...1.0.0-M.1) - 2018-08-27

### Changed

-   Updated dependencies.
-   Move types for dependencies from devDependencies to dependencies.

### Removed

-   Do not put TypeScript source in NPM package.

## [0.2.1](https://github.com/atomist/sdm-pack-node/compare/0.2.0...0.2.1) - 2018-08-03

### Fixed

-   Added missing exports to index.

## [0.2.0](https://github.com/atomist/sdm-pack-node/compare/0.1.0...0.2.0) - 2018-08-03

### Changed

-   **BREAKING** Reorganize package to have more standard Node.js

### Fixed

-   Fix automation client push test. [#2](https://github.com/atomist/sdm-pack-node/issues/2)

## [0.1.0](https://github.com/atomist/sdm-pack-node/tree/0.1.0) - 2018-07-31
