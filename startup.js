var appRoot = require('app-root-path');
var User = require(appRoot + '/models/user.model');
// -----------------------------------------------------------------------------------------------------

module.exports.start = async function () {
  for (var user of getDefaultUsers()) {
    if (await User.findOne({ email: user.email })) continue;
    if (await User.create(user)) {
      console.log('user ' + user.email + ' created !');
    }
    else {
      console.log('create user ' + user.email + ' failed !');
    }
  }
}

function getDefaultUsers() {
  return [
    {
      username: 'Administrateur',
      firstName: 'Prenom',
      lastName: 'Nom',
      phoneNumber: '0033652912727',
      email: 'admin@webmaster.fr',
      password: 'password',
      roles: ['MEMBER', 'STAFF', 'ADMIN'],
      activated: true,
      collaborator: true,
      collaboratorAvailable: true,
      collaboratorSchedules: [
        [],
        [],
        ['09:00', '13:00', '14:00', '19:00'],
        ['09:00', '13:00', '14:00', '19:00'],
        ['09:00', '13:00', '14:00', '19:00'],
        ['09:00', '13:00', '14:00', '19:00'],
        ['09:00', '13:00']
      ]
    }
  ];
}