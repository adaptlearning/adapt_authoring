adapt-contrib-vanilla
=====================

Introduction
---
This is the 'Vanilla' theme, a core theme bundled with the Adapt framework.

As with any Adapt compatible theme, the structure of the theme is as follows:

| Folder        | Purpose|
| ------------- |:-------------|
| assets        | _Holds any static assets (for example: images, etc.)_|
| fonts         | _Any fonts which might be referenced in the associated .less files_      |   
| js            | _JavaScript/JQuery files on which the theme depends go here_      |
| less          | _Location for any [LESS](http://lesscss.org/) based CSS files_ |
| templates     | _Location for any snippets of pre-defined HTML templates (see below)_ |


Templates
---
Adapt themes support customisation for the rendering of various Adapt elements via the following [Handlebars](http://handlebarsjs.com/) templates.  Note that the filenames match the templates to which they refer:
* article.hbs
* block.hbs
* loading.hbs 
* navigation.hbs
* page.hbs
