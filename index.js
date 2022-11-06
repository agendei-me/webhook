"use strict";

const projectId = "agendei-agent-gkig";
const whatsAppToken = "EAAIgs1ET8XsBALPJm9fHRhC311r9ERtsQ8L3hWq8mxqjhWXT0QL4JhmzXlrgeXLej8Psr8h5mO8S9aXuARKpELIVnC4iAL2vcBoKfzH80JTXoxmBMuZBAY2n3XzbuyX1a9SBe8mmKIpuu9u252Pmgi6tF7jRmKdBnSTPkpfbDraDMDMoykAnRW5za78p8YpWn0UdiwQZDZD";
const verifyToken = "5tvufQGq";
const dialogflowKeyFile = 'agendei-agent-gkig-041df50676a9.json'


const request = require("request");
const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios").default;
app = express().use(body_parser.json());

const { WebhookClient } = require('@google-cloud/dialogflow');
const dialogflow = require('@google-cloud/dialogflow');
const sessionClient = new dialogflow.SessionsClient({
    keyFilename: dialogflowKeyFile
});


const params = "";

app.post('/webhookDialogFlow', function(request, response) {
    const agent = new WebhookClient({
        request,
        response
    });

    let intentMap = new Map();
    intentMap.set('appointment', nomedafuncao)
    agent.handleRequest(intentMap);
    params = agent.parameters['date'];
});

function nomedafuncao(agent) {}


app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}


async function detectIntent(
    projectId,
    sessionId,
    query,
    contexts,
    languageCode
) {
    const sessionPath = sessionClient.projectAgentSessionPath(
        projectId,
        sessionId
    );



    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: query,
                languageCode: languageCode,
            },
        },
    };


    if (contexts && contexts.length > 0) {
        request.queryParams = {
            contexts: contexts,
        };
    }


    const responses = await sessionClient.detectIntent(request);
    return responses[0];
}

async function executeQueries(projectId, sessionId, queries, languageCode) {
    let context;
    let intentResponse;
    for (const query of queries) {
        try {
            //console.log(`Pergunta: ${query}`);
            intentResponse = await detectIntent(
                projectId,
                sessionId,
                query,
                context,
                languageCode
            );
            //console.log('Enviando Resposta');
            if (isBlank(intentResponse.queryResult.fulfillmentText)) {
                //console.log('Sem resposta definida no DialogFlow');
                return null;
            } else {
                //console.log('Resposta definida no DialogFlow');
                //console.log(intentResponse.queryResult.fulfillmentText);
                return `${intentResponse.queryResult.fulfillmentText}`
            }
        } catch (error) {
            console.log("erro:", error);
        }
    }
}


// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

app.post("/webhook", async (req, res) => {
    let h = req.body;
    console.log(JSON.stringify(req.body, null, 2));
    //let textoResposta = await executeQueries('zdg-9un9', msg.from, [msg.body], 'pt-br');
    if (req.body.object) {
        if (
            req.body.entry &&
            req.body.entry[0].changes &&
            req.body.entry[0].changes[0] &&
            req.body.entry[0].changes[0].value.messages &&
            req.body.entry[0].changes[0].value.messages[0]
        ) {
            let phone_number_id = req.body.entry[0].changes[0].value.metadata.phone_number_id;
            let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
            let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload

            let textoResposta = await executeQueries(projectId, from, [msg_body], 'pt-br');
            if (textoResposta !== null) {
                axios({
                    method: "POST", // Required, HTTP method, a string, e.g. POST, GET
                    url: "https://graph.facebook.com/v14.0/" +
                        phone_number_id +
                        "/messages?access_token=" +
                        whatsAppToken,
                    data: {
                        messaging_product: "whatsapp",
                        to: from,
                        text: {
                            body: textoResposta
                        },
                    },
                    headers: {
                        "Content-Type": "application/json"
                    },
                });
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});


app.get("/webhook/verifier", (req, res) => {
    const verify_token = verifyToken;
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"];
    //console.log("Recebendo request", mode, token);
    if (mode && token) {
        if (mode === "subscribe" && token === verify_token) {
            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});


app.get("/webhook/", (req, res) => {
    console.log("Receiving route request");
    res.status(200).send("server up!" + whatsAppToken)
})