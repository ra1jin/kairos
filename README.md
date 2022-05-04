DEPLOIEMENT
===========

curl -sL https://rpm.nodesource.com/setup_14.x | sudo bash -
yum install -y nodejs
yum install git
touch /etc/yum.repos.d/mongodb-org-5.0.repo
nano /etc/yum.repos.d/mongodb-org-5.0.repo
 [mongodb-org-5.0]
 name=MongoDB Repository
 baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/5.0/x86_64/
 gpgcheck=1
 enabled=1
 gpgkey=https://www.mongodb.org/static/pgp/server-5.0.asc
yum install -y mongodb-org
systemctl start mongodb
yum install certbot
certbot certonly --standalone --agree-tos --no-eff-email -d mondomaine.com -d www.mondomaine.com --rsa-key-size 4096 // copy files in authority directory's project
npm install pm2 -g

export TZ='Europe/Paris'
pm2 start index.js -- --https


HOT-LIST
========
+ Ajouter une table "settings" composé de toutes les zones de textes du site,
  de toutes les zones images, les différents liens, les boutons d'activation des différents onglets du menu, email de l'administration, 
+ Ajouter CKEditor
+ Ajouter Google Street Map dans contact
+ Suppr des règles css spécifique pour une page (ex: Home); Remplacer par utilitaire ou composant css

+ Bonus 1: Ajouter sms de rappel
