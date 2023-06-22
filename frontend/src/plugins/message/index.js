// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function (require) {
  var Origin = require('core/origin');
  var Helpers = require('core/helpers');

  var MessageManagementView = require('./views/messageManagementView');
  var MessageManagementGeneralRibbonView = require('./views/messageManagementGeneralRibbonView');
  var MessageManagementSidebarView = require('./views/messageManagementSidebarView');
  var MessageManagementModel = require('./models/messageManagementModel');

  var isReady = false;
  var dateTime = Date.now();
  var TEN_MINUTES = 10 * 60 * 1000;
  var data = {
    featurePermissions: ["{{tenantid}}/messages/*:create", "{{tenantid}}/messages/*:read", "{{tenantid}}/messages/*:update"]
  };

  function generateGeneralRibbonCSS(message) {
    var increment = 17;
    if (message.length >= (210)) {
      var generalRibbonHeight = 55;
      var sidebarTop = 61 + generalRibbonHeight;
      var generalRibbonPaddingTop = 5.5;
      var ribbonDisplay = 'inline-block';
      var breakpoints = {
        first: 1180,
        second: 1179,
        third: 830
      }
    } else {
      var generalRibbonHeight = 35;
      var sidebarTop = 61 + generalRibbonHeight;
      generalRibbonPaddingTop = 3.5;
      var breakp = Math.floor(message.length * 6.28) + 90;
      var ribbonDisplay = 'flex';
      var breakpoints = {
        first: breakp,
        second: breakp - 1,
        third: breakp < 610 ? '' : 610
      }
    }
    var generalRibbonCSS = `
    <style class="general-ribbon-css">
    @media only screen and (min-width: ${breakpoints.first}px) {
        .sidebar {
          top: ${sidebarTop}px;
        }
      
        .navigation {
            top: ${generalRibbonHeight}px;
        }

        .general-ribbon {
          height: ${generalRibbonHeight}px;
        }
    }

    @media only screen and (max-width: ${breakpoints.second}px) {
      .sidebar {
        top: ${sidebarTop + increment}px;
      }
    
      .navigation {
          top: ${generalRibbonHeight + increment}px;
      }

      .general-ribbon {
        height: ${generalRibbonHeight + increment}px;
      }
    }
    @media only screen and (max-width: ${breakpoints.third}px) {
      .sidebar {
        top: ${sidebarTop + increment * 2}px;
      }
    
      .navigation {
          top: ${generalRibbonHeight + increment * 2}px;
      }

      .general-ribbon {
        height: ${generalRibbonHeight + increment * 2}px;
      }
    }
    .ribbon-msg {
      padding-top: ${generalRibbonPaddingTop}px;
    }
    .ribbon-icon {
      display: ${ribbonDisplay};
    }
    </style>
    `;
    return generalRibbonCSS;
  }

  Origin.on('location:change', function(){
    console.log(((new Date) - dateTime) > TEN_MINUTES);
    if(((new Date) - dateTime) > TEN_MINUTES){
      dateTime = Date.now();
      var messages = new MessageManagementModel();
      messages.fetch({
        success: function () {
          if (messages.attributes.generalRibbonEnabled) {
            messages.attributes.generalRibbon = $('html').attr('lang') === 'en' ? messages.attributes.generalRibbonEN : messages.attributes.generalRibbonFR;
            var message = Helpers.removeHTMLTags(messages.attributes.generalRibbon).replace(/\&nbsp;/g, '');
            var generalRibbonCSS = generateGeneralRibbonCSS(message);
            if($('.general-ribbon').length !== 0){
              $('.general-ribbon').html(new MessageManagementGeneralRibbonView({ model: messages }).$el)
            } else {
              $('.navigation').before(new MessageManagementGeneralRibbonView({ model: messages }).$el);
            }
              $('.general-ribbon-css').remove();
              $('head').append(generalRibbonCSS);
          } else {
              $('.general-ribbon').remove();
              $('.general-ribbon-css').remove();
          }
        }
      });
    }
  })

  Origin.on('origin:dataReady login:changed messageManagementSidebar:views:saved', function () {
    var messages = new MessageManagementModel();
    messages.fetch({
      success: function () {
        if (messages.attributes.generalRibbonEnabled) {
          messages.attributes.generalRibbon = $('html').attr('lang') === 'en' ? messages.attributes.generalRibbonEN : messages.attributes.generalRibbonFR;
          var message = Helpers.removeHTMLTags(messages.attributes.generalRibbon).replace(/\&nbsp;/g, '');
          var generalRibbonCSS = generateGeneralRibbonCSS(message);
          if($('.general-ribbon').length !== 0){
            $('.general-ribbon').html(new MessageManagementGeneralRibbonView({ model: messages }).$el)
          } else {
            $('.navigation').before(new MessageManagementGeneralRibbonView({ model: messages }).$el);
          }
            $('.general-ribbon-css').remove();
            $('head').append(generalRibbonCSS);
        } else {
            $('.general-ribbon').remove();
            $('.general-ribbon-css').remove();
        }
      }
    });
  });

  Origin.on('origin:dataReady login:changed', function () {
    Origin.permissions.addRoute('messageManagement', data.featurePermissions);
    if (Origin.permissions.hasPermissions(data.featurePermissions)) {
      Origin.globalMenu.addItem({
        "location": "global",
        "text": Origin.l10n.t('app.messagemanagement'),
        "icon": "fa-comment",
        "sortOrder": 4,
        "callbackEvent": "messageManagement:open"
      });
    } else {
      isReady = true;
    }
  });

  Origin.on('globalMenu:messageManagement:open', function () {
    Origin.router.navigateTo('messageManagement');
  });

  Origin.on('router:messageManagement', function () {
    if (Origin.permissions.hasPermissions(data.featurePermissions)) {
      if (isReady) {
        return onRoute();
      } else {
        onRoute();
      }
    } else {
      console.log('no permission')
    }
  });

  var onRoute = function () {
    Origin.trigger('location:title:update', { title: Origin.l10n.t('app.message.title') });
    var messages = new MessageManagementModel();
    messages.fetch({
      success: function () {
        Origin.sidebar.addView(new MessageManagementSidebarView().$el);
        Origin.contentPane.setView(MessageManagementView, { model: messages });
      }
    });
    return
  };
})
