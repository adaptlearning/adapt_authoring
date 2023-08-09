define(function (require) {
  var passwordHelpers = {
    validatePassword: function(value) {
      var errors = []

      if (!/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(value)) errors = ['missingspecialchars', ...errors];

      if (!/\d/.test(value)) errors = ['missingnumber', ...errors];

      if (!/[A-Z]/.test(value)) errors = ['missinguppercase', ...errors];

      if (!value || value.length < 8) errors = ['tooshort', ...errors];

      return errors;
    }
  }
  return passwordHelpers;
});
