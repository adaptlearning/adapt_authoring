# Adapt Authoring
## _College@ESDC variant_

The [Adapt Authoring](https://github.com/adaptlearning/adapt_authoring) tool is an open source project. 

College@ESDC uses version 0.10.5 & Framework 4.4.1 with slight modifications for official language support and internal support access.

Installation instructions as follows a similar pattern than [official Adapt Authoring](https://github.com/adaptlearning/adapt_authoring).

## Debian Linux install instructions:

Adapt requires [Node.js](https://nodejs.org/) v10+ to run.

Download and install prerequisites

```sh
apt-get install git
apt install curl
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
source ~/.profile
nvm install 12.22.12
npm install -g grunt-cli
sudo apt-get install gnupg curl
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg \
   --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl daemon-reload
```

Check that mongo works
```sh
sudo systemctl status mongod
```

Copy the repository
```sh
git clone https://github.com/LIT-EIA/adapt_authoring.git adapt_authoring
cd adapt_authoring_college
```
Install the application
```sh
npm install --production
```
```sh
node install
```

Git repository URL to be used for the authoring tool source code should be: <br>
https://<span></span>github.com/LIT-EIA/adapt_authoring.git <br>
##
Git repository URL to be used for the framework source code:  <br>
https://<span></span>github.com/adaptlearning/adapt_framework.git <br>
##
Specific git revision to be used for the framework. Accepts any valid revision type (e.g. branch/tag/commit): <br>
tags/v4.4.1 <br>



## Optional but recommended plugins made tweaked by College@ESDC

[Adapt ESDC College Theme](https://github.com/LIT-EIA/adapt-esdc-college-theme)

[Adapt output Accessibility fixes for v4.4.1](https://github.com/LIT-EIA/Adapt-accessibilityfixes)

## Docker

Not available yet.


## License
GNU General Public License v3.0

************************************************

# Outil-auteur Adapt
## _Variante College@EDSC_

L'Outil-auteur [Adapt](https://github.com/adaptlearning/adapt_authoring) est un projet de logiciel libre.

College@EDSC utilise la version 0.10.5 et le Framework 4.4.1 avec de légères modifications pour le support des langues officielles et l'accès au support interne.

Les instructions d'installation suivent sensiblement les mêmes étapes que [l'Outil-auteur Adapt](https://github.com/adaptlearning/adapt_authoring).

## Instructions d'installation pour Debian Linux:

Adapt nécessite [Node.js](https://nodejs.org/) v10+ pour fonctionner.

Télécharger et installer les prérequis

```sh
apt-get install git
apt install curl
curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
source ~/.profile
nvm install 12.22.12
npm install -g grunt-cli
sudo apt-get install gnupg curl
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg \
   --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl daemon-reload
```

Vérifier que mongo fonctionne
```sh
sudo systemctl status mongod
```

Copier le projet
```sh
git clone https://github.com/LIT-EIA/adapt_authoring.git adapt_authoring_college
cd adapt_authoring_college
```
Installer l'application
```sh
npm install --production
```
```sh
node install
```
##
Git repository URL to be used for the authoring tool source code should be: <br>
https://<span></span>github.com/MeD-DMC/adapt_authoring_college.git <br>
##
Git repository URL to be used for the framework source code:  <br>
https://<span></span>github.com/adaptlearning/adapt_framework.git <br>
##
Specific git revision to be used for the framework. Accepts any valid revision type (e.g. branch/tag/commit): <br>
tags/v4.4.1 <br>


## Ajouts facultatifs mais recommandés et modifiés par College@ESDC

[Thème Adapt du College@ESDC](https://github.com/LIT-EIA/adapt-esdc-college-theme)

[Correctifs d'accessibilité d'Adapt pour la version 4.4.1](https://github.com/LIT_EIA/Adapt-accessibilityfixes)

## Docker

Non disponible pour l'instant.


## License
Licence publique générale GNU v3.0
