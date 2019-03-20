# firebaseChat
An OpenSource Sample Project for a Chat Application using Google Firebase and Vue.JS trying to collect best practices

This project was created with firebase-tools

## Prerequisites

To work with the project you need npm (Node.JS >= 8)

Install firebase Tools:

    npm install -g firebase-tools

Install node_modules for Google Cloud functions:

    cd functions
    npm install

Create a Google Firebase Project (free): [Firebase Console](https://console.firebase.google.com)

This App needs to use the following features: Hosting, Firestore, Cloud Functions
In the default configuration you need to allow Authentication with Google/E-Mail/GitHub

Create a WebPush Certificate for your Project and paste it into index.mjs

    https://console.firebase.google.com/project/<YourProjectName>/settings/cloudmessaging/

    Generate Web Push Certificates

    Copy value of "Key pair" into the variable webPushPublicKey inside index.mjs

## Run & Deploy

Save your login and the active Project in your Workspace

    firebase login
    firebase use -add

Now you can test the project locally (except firestore trigger functions, which are not supported
by Googles local function emulation)

    firebase serve

And you can deploy the project to your firebase url <YourProjectName>.firebaseapp.com

    firebase deploy

## IDE integration

This Project uses JavaScript Standard Style Linting, which is available via npm and provides
extensions for most IDEs: [Standard JS](https://standardjs.com/)

The Folder dev includes a TypeScript Definition File for JavaScript Service Workers, which
can provide IntelliSense/Autocompletion for the Service Worker File (optional)

The Folder dev includes a tasks.json which can be used for VS Code (just copy to the .vscode
Folder in the Project Directory - create the folder if not present) which provides convenient
CLI options to server and deploy the project.

## Author and Licence

This Project is released under the MIT Licence ("do what you want with it, but don't sue me")
and was originaly created by Github user: falco467 / falco467@gmail.com