var _ = require('lodash');

//--------------------------------------------------------------------------------------------

module.exports = function (opts) {
  var options = Object.assign({
    translations: {
      'en': {}
    },
    defaultLanguage: 'en'
  }, opts);

  return async function (req, res, next) {
    req.isSupportedLanguage = function(language) {
      return (language && options.translations.hasOwnProperty(language));
    }

    req.setLanguage = function(language) {
      if (req.isSupportedLanguage(language)) {
        req.language = language;
      }
    }
  
    req.translate = function (path, args = []) {
      var lang = req.isSupportedLanguage(req.language) ? req.language : options.defaultLanguage;
      var translation = options.translations[lang];
      var translatedItem = _.get(translation, path);

      if (args && Array.isArray(args) && args.length > 0) {
        var index = 0;
        translatedItem = translatedItem.replace(/\%s/g, function(str) {
          return args[index++];
        });
      }

      return translatedItem;
    }

    res.locals.translate = req.translate;
    next();
  }
}