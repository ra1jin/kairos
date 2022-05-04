//
// @param authorizeItems: [{ role: string, when?: function => Boolean }]
// @forbiddenView: String = 'forbidden'
// @dataView: Object: {}
//
module.exports = function (authorizeItems) {
  return async function (req, res, next) {
    var user = req.session.user;
    if (!user) {
      res.status(403);
      return res.render('forbidden');
    }

    if (!authorizeItems || authorizeItems.length == 0) {
      return next();
    }

    for (var item of authorizeItems) {
      if (user.roles && user.roles.indexOf(item.role) != -1) {
        if (item.when && typeof item.when === 'function') {
          if (item.when(req)) {
            return next();
          }
        }
        else {
          return next();
        }
      }
    }

    res.status(403);
    return res.render('forbidden');
  }
};