// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require) {
	var _ = require('underscore');
	var Origin = require('core/origin');
	var SweetAlert = require('sweetalert');

	function getSettings(data) {
		var defaults = {
			title: '',
			animation: 'slide-from-bottom',
			confirmButtonColor: '',
			html: true
		};

		switch(data.type) {
			case 'confirm':
				data.type = null;
				defaults.title = Origin.l10n.t('app.confirmdefaulttitle');
				break;
			case 'warning':
				defaults.title = Origin.l10n.t('app.warningdefaulttitle');
				break;
			case 'input':
				break;
			case 'success':
				defaults.title = Origin.l10n.t('app.successdefaulttitle');
        break;
			case 'info':
				defaults.title = Origin.l10n.t('app.infodefaulttitle');
        break;
			case 'error':
				defaults.title = Origin.l10n.t('app.errordefaulttitle');
				break;
			default:
				if (data.type) {
					Origin.Notify.console({
						type: 'error',
						text: '"' + data.type + '" is not a valid alert type'
					});
				}
				data.type = null;
		}
		// combine settings, overwriting defaults with param
		return _.defaults(data, defaults);
	};

	function openPopup(data) {
		SweetAlert(getSettings(data), data.callback);
	}

	var Alert = function(data) {
		// allow for string input
		if(_.isString(data)) {
			data = {
				title: data
			};
		}
		openPopup(data);
	};

	/**
	* NOTE if callback isn't an annonymous function, it won't be called on cancel
	* See: https://github.com/t4t5/sweetalert/issues/431
	*/
	var DISABLE_TIME_SECS = 5;
	var interval;

	var Confirm = function(data) {
		// allow for string input
		if (_.isString(data)) {
      data = {
        text: data
			};
		}

		// some defaults, in the case of an additional type being passed
		var defaults = {
			type: data.type || 'confirm',
			showCancelButton: true,
			confirmButtonText: Origin.l10n.t('app.confirmdefaultyes'),
			cancelButtonText: Origin.l10n.t('app.no')
		};

		openPopup(_.extend(defaults, data));

		$('.sweet-alert > .sa-button-container button').blur();

		clearInterval(interval);

		// forces the user to wait before the confirm button can be clicked
		if(data.destructive === true) {
			var setWaitText = function(n) {
				$('.sweet-alert button.confirm').html(
					'<span class="wait-text">' +
					Origin.l10n.t('app.confirmwait') +
					'</span> ' +
					n
				);
			};

			var count = DISABLE_TIME_SECS;
			var oldLabel = $('.sweet-alert button.confirm').text();

			$('.sweet-alert').addClass('destructive');
			$('.sweet-alert button.confirm').attr('disabled', true);

			setWaitText(count);

			interval = setInterval(function() {
				if(--count > 0) {
					$('.sweet-alert button.confirm').html('<span class="wait-text">' + Origin.l10n.t('app.confirmwait') + '</span> ' + count);
				} else {
					clearInterval(interval);
					$('.sweet-alert button.confirm').text(oldLabel);
					$('.sweet-alert button.confirm').attr('disabled', false);
					$('.sweet-alert').removeClass('destructive');
				}
			}, 1000);
		}
	};

	var init = function() {
		Origin.Notify.register('alert', Alert);
		Origin.Notify.register('confirm', Confirm);
		// shortcuts to override window methods
		window.alert = alert = Alert;
		window.confirm = confirm = Confirm;
	};

	return init;
});
