// For more information about this template visit http://aka.ms/azurebots-node-qnamaker

"use strict";
var builder = require("botbuilder");
//var botbuilder_azure = require("botbuilder-azure");
var builder_cognitiveservices = require("botbuilder-cognitiveservices");

var useEmulator = (process.env.NODE_ENV == 'development');

const luisUrl = 'westus.api.cognitive.microsoft.com/luis/v2.0/apps';
const luisModelUrl = `https://${luisUrl}/${process.env.LUIS_APP_ID}?subscription-key=${process.env.LUIS_API_KEY}&staging=true&verbose=true`;
//const luisModelUrl = `https://${luisUrl}/${process.env.LUIS_APP_ID}?subscription-key=${process.env.LUIS_API_KEY}`;


// var connector = useEmulator ? new builder.ChatConnector({
//   appId: process.env.MICROSOFT_APP_ID,
//   appPassword: process.env.MICROSOFT_APP_PASSWORD,
// }) : new botbuilder_azure.BotServiceConnector({
//     appId: process.env['MICROSOFT_APP_ID'],
//     appPassword: process.env['MICROSOFT_APP_PASSWORD'],
//     stateEndpoint: process.env['BotStateEndpoint'],
//     openIdMetadata: process.env['BotOpenIdMetadata']
// });

var connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD,
});

var bot = new builder.UniversalBot(connector);

var qnarecognizer = new builder_cognitiveservices.QnAMakerRecognizer({
                knowledgeBaseId: process.env.QnAKnowledgebaseId, 
    subscriptionKey: process.env.QnASubscriptionKey});


const recognizer = new builder.LuisRecognizer(luisModelUrl);

const intents = new builder.IntentDialog({ recognizers: [recognizer] });

//  a recognizer for use by the QnADialog
var basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
    recognizers: [qnarecognizer],
                defaultMessage: `I'm afraid, I don't understand your request`,
                qnaThreshold: 0.3}
);


bot.dialog('/', intents);

// now on to the matching
// If there's no match
intents.matches('Hello', [
  (session, args, next) => 
    session.send('Hi. Hello. I can (try to) answer your questions regarding Cloud in general and the use of Cloud within our company'),
])
.matches('Confirmation', [
    // Do nothing
])
// When LUIS.ai couldn't match a better intent, default to the QnADialog

//more importantly, the QnADialog needs to terminate and return to the parent dialog immediately
.matches('None', (session) => {
  session.beginDialog('qnaDialog').endDialog();
  //session.cancelDialog('qnaDialog');
  //session.endDialog('qnaDialog');
})

//register the QnADialog
bot.dialog('qnaDialog', basicQnAMakerDialog);


if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}
