// editCourse.js
var loginModule = require("./login");
var num;
var sections;
//tests the course editor
casper.test.begin('Test Course Editor', 10, function suite(test) {
  loginModule.login();
  casper.then(function () {
    //stores the number of projects in a variable to be used later
    num = this.evaluate(function () {
      return __utils__.findAll("li.project-list-item").length;
    });
    this.wait(500, function () {
    });
    casper.test.comment("Project settings");
  });

  //checks if menu exists and opens it, then clicks the "Edit" option
  casper.then(function () {
    test.assertExists("a[class='open-context-icon open-context-course']", "Edit button exists");
  });
  casper.then(function () {
    this.capture("./test_frontend/img/edit/01-on home page.png");
  });

  casper.then(function () {
    this.click("a[class='open-context-icon open-context-course']");
    this.wait(2000, function () {
      this.capture("./test_frontend/img/edit/02-submenu open.png");
    });
  });

  casper.then(function () {
    this.click('.context-menu-item:nth-child(2) > a.context-menu-item-open')
    this.wait(2000, function () {
      this.capture("./test_frontend/img/edit/02-edit-page-open.png");
    });
  });

  casper.then(function () {
    test.assertExists("button[class='editor-menu-layer-add-page btn primary']", "Got into the edit window");
  });

  casper.then(function () {
    this.capture("./test_frontend/img/edit/03-main editor page open.png");
  });

  //clicks the button to add a section then takes a screenshot
  casper.then(function () {
    test.assertExists(".editor-menu-layer-add-menu", "Clicks the sub menu button");
    this.click(".editor-menu-layer-add-menu");
    this.capture("./test_frontend/img/edit/04-section was added.png")
  });

  casper.then(function () {
    this.wait(2000, function () {
      sections = this.evaluate(function () {
        return __utils__.findAll("div.editor-menu-item").length;
      });
    });
  });
  casper.then(function () {
    this.wait(2000, function () {
      test.assertExists("div.editor-menu-item", "Added a section");
      this.capture("./test_frontend/img/edit/04-section was added.png");
    });
  });

  //clicks the section to open it, then adds a page to that section
  casper.then(function () {
    this.wait(3000, function () {
      this.click("#app > div.app-inner > div.editor-view > div > div > div > div > div.editor-menu-layer-inner.ui-sortable > div > div.editor-menu-item-inner.clearfix.unselectable");
    });
  });
  casper.then(function () {
    this.wait(3000, function () {
      test.assertExists("#app > div.app-inner > div.editor-view > div > div > div > div.editor-menu-layer.selected > div.editor-menu-layer-inner.ui-sortable", "Opened the section");
      this.capture("./test_frontend/img/edit/05-section opened.png");
    });
  });
  casper.then(function () {
    this.wait(3000, function () {
      this.click("#app > div.app-inner > div.editor-view > div > div > div > div:nth-child(2) > div.editor-menu-layer-controls.clearfix > div.editor-menu-layer-actions.add-zone > button.editor-menu-layer-add-page.btn.primary");
    });
  });
  casper.then(function () {
    this.wait(3000, function () {
      this.capture("./test_frontend/img/edit/06-page was added to section.png");
      // test.assertExists(".editor-menu-item content-type-page", "Added a page");
    });
  });

  //opens the page
  casper.then(function () {
    this.wait(3000, function () {
      this.mouse.doubleclick(".editor-menu-layer.selected > div.editor-menu-layer-inner.ui-sortable > div > div.editor-menu-item-inner.clearfix.unselectable > div.editor-menu-item-title > h3");
    });
  });

  casper.then(function () {
    this.wait(3000, function () {
      this.capture("./test_frontend/img/edit/07-page opened.png");
      test.assertExists(".page > div.page-inner > div.page-detail", "Opened project page");
    });
  });

  // adds the block and verifies its there.
  casper.then(function () {
    this.click(".page-articles > div.article.editable.article-draggable.ui-draggable > div.article-inner > div.add-control > a.add-block");
  });
  casper.then(function () {
    this.wait(2000, function () {
      this.capture("./test_frontend/img/edit/09-block added to article.png");
      test.assertExists(".page-articles > div.article.editable.article-draggable.ui-draggable > div.article-inner > div.article-blocks > div.block.editable.block-draggable.synced.ui-draggable", "Added a block");
    });
  });

  //add page component to the new block.
  casper.then(function () {
      this.click("#app > div.app-inner > div.editor-view > div > div > div > div.page-articles > div.article.editable.article-draggable.ui-draggable > div.article-inner > div.article-blocks > div:nth-child(4) > div.block-inner > div.add-control > a");
      this.wait(2000, function () {
      this.capture('./test_frontend/img/edit/10-component menu.png');
        this.wait(2000, function () {
          this.click("body > div.editor-component-list > div.editor-component-list-sidebar > div > div.editor-component-list-sidebar-list > div:nth-child(3) > div.editor-component-list-item-inner > div.editor-component-list-item-details > span.editor-component-list-item-description")
      });
    });
  });

    casper.then(function() {
        this.wait(2000, function() {
            this.capture("./test_frontend/img/edit/11-component menu.png");
            test.assertExists("body > div.editor-component-list > div.editor-component-list-sidebar > div > div.editor-component-list-sidebar-list > div:nth-child(3)", "Adding a component");
        });
    });

    //chooses which component to add: a blank, full width one
    casper.then(function() {
        this.wait(2000, function() {
            this.click("body > div.editor-component-list > div.editor-component-list-sidebar > div > div.editor-component-list-sidebar-list > div.editor-component-list-item.selected > div.editor-component-list-item-overlay > div > a.btn.primary.editor-component-list-item-overlay-button.editor-component-list-item-overlay-add");this.wait(2000, function() {
            this.capture("./test_frontend/img/edit/11-components are chosen.png");
          });
        });
    });

    casper.run(function() {
        test.done();
    });
});

