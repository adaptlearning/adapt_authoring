# How to contribute

We heartily welcome contributions to the source code for the Adapt authoring project. This document outlines some contributor guidelines to help you get started.

## Before you begin

* Make sure you have a [GitHub account](https://github.com/signup/free), as all contributions are made through GitHub.
* Fork the [`adapt_authoring`](https://github.com/adaptlearning/adapt_authoring) repository to your GitHub account.
* Follow the [developer set-up guide](https://github.com/adaptlearning/adapt_authoring/wiki/Developer's-Install) to get a developer instance of the authoring tool installed.

## Finding work

* Pick an open issue from the list [here.](https://github.com/adaptlearning/adapt_authoring/issues)
* Create a new ticket for the issue you have noticed, following our guidelines on [submitting new bugs and features.](https://github.com/adaptlearning/adapt_framework/wiki/Bugs-and-features)
  * If submitting a new ticket, we recommend getting the go-ahead for the change from the core team before you start work.

### Use the labels

We add difficulty rating labels to issues to give developers an idea of the work involved (always prefixed with `D:`). Picking up a `D: beginner` or `D: easy` issue is a good place to start if you're new to the project, and have limited Node.js and Backbone.js experience. For more confident developers, `D: medium` issues should be no problem. Any `D: hard` and `D: insane` issues are likely to involve very complex solutions, and potentially collaboration, to solve. Due to the work involved, these should only be attempted by developers with an extensive knowledge of the codebase, and a good working relationship with the core team.

## Making Changes

* Create a new branch for the issue that you are fixing:
  * Make sure to base it on the correct parent branch; in most cases this will be develop. Getting this step wrong may cause you a lot of heartbreak when it comes to merging later on, so it's worth checking before starting work.
  * Name your branch according to the issue it addresses (i.e. `issue/1234`).
  * Create your branch (e.g. `git checkout -b issue/123 origin/develop`).
* Make your changes (please make sure that your commit messages stick to the [guidelines](http://www.git-scm.com/book/en/v2/Distributed-Git-Contributing-to-a-Project#Commit-Guidelines), and take advantage of GitHub's built in features to [close issues via commits.](https://help.github.com/articles/closing-issues-via-commit-messages/)
* Add unit tests to cover your new functionality, if appropriate.
* Run the existing unit tests using `npm test` (and ensure they pass!)

## Submitting Changes

* Push your changes to your personal fork of the `adapt_authoring` repository.
* Submit a pull request using the GitHub interface, and make sure to link to the issue you're addressing.
* The core team will be automatically notified of your changes, but you can also bring it to our attention via the [gitter.im channel](https://gitter.im/adaptlearning/adapt_authoring).

# Additional Resources

* [The Adapt Authoring wiki](https://github.com/adaptlearning/adapt_authoring/wiki)
* [Gitter channel](https://gitter.im/adaptlearning/adapt_authoring)
* [General GitHub Documentation](http://help.github.com/)
* [GitHub pull request documentation](http://help.github.com/send-pull-requests/)
