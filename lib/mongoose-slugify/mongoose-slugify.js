var mongoose = require('mongoose');

module.exports = async function(modelName, fields = {}, id = null) {
  var model = mongoose.model(modelName);
  var values = [];

  for (var value of Object.values(fields)) {
    value = value.replace(/[!?#$*_-]/g, '');
    value = value.trim();
    value = value.replace(/\s+/g, '-');
    value = value.toLowerCase();
    values.push(value);
  }

  var slug = values.join('-');
  var matches = await model.find({ slug: new RegExp(slug) }, ['slug'], { sort: { slug: -1 } });

  if (matches.length === 0) {
    return slug;
  }

  if (id) {
    for (var match of matches) {
      if (id == match.id) return match['slug'];
    }
  }

  var lastMatch = matches[0];
  var inc = extractIncrementFromSlug(slug, lastMatch['slug']);
  return (inc) ? slug + '-' + (++inc) : slug + '-' + 1;
};

function extractIncrementFromSlug(baseSlug, slug) {
  var extrator = new RegExp(baseSlug + '-([0-9]+)$');
  var hasInc = extrator.exec(slug);

  if (hasInc && hasInc[1]) {
    return parseInt(hasInc[1]);
  }

  return null;
};
