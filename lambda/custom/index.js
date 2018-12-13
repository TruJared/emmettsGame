const Alexa = require('ask-sdk');

const constants = require('./constants');
const functions = require('./functions');

const { responses } = constants;
// const words = require('./words');
const wordsList = ['cat', 'dog', 'cool', 'mom', 'you'];
const rounds = 5; // how many rounds in a game?

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const persistentAttributes =
      (await attributesManager.getPersistentAttributes()) ||
      constants.persistentAttributesAtStart;
    const { speechText } = responses.launchResponse;
    const salutation = !persistentAttributes.newUser
      ? functions.shuffle(constants.phrasePool.salutation)[0]
      : 'Welcome!';
    const repromptText = speechText;
    persistentAttributes.passTo = false;

    if (persistentAttributes.newUser) {
      persistentAttributes.newUser = false;
    }
    persistentAttributes.repeatText = speechText;

    // * set persistentAttributes to sessionAttributes * //
    // * reset inGame if it were left that way from previous session * //
    // todo turn inGame flag off at session end as well -> keep this ^ for redundancy //
    attributesManager.setSessionAttributes(persistentAttributes);
    const sessionAttributes = attributesManager.getSessionAttributes();
    sessionAttributes.inGame = false;

    return responseBuilder
      .speak(`${salutation} ${speechText}`)
      .reprompt(repromptText)
      .getResponse();
  },
};

const GetPlayerInfoInProgress = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return (
      request.type === 'IntentRequest' &&
      (request.intent.name === 'GetPlayerInfoIntent' &&
        request.dialogState !== 'COMPLETED' &&
        !sessionAttributes.inGame)
    );
  },
  async handle(handlerInput) {
    const { responseBuilder } = handlerInput;

    return responseBuilder.addDelegateDirective().getResponse();
  },
};

const GetPlayerInfoCompleted = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return (
      request.type === 'IntentRequest' &&
      (request.intent.name === 'GetPlayerInfoIntent' &&
        !sessionAttributes.inGame)
    );
  },
  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    sessionAttributes.passTo = 'StartGameIntentHandler';
    const { speechText } = responses.getplayerInfoCompletedResponse;
    const {
      name,
      confirmationStatus,
    } = handlerInput.requestEnvelope.request.intent;
    const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
    const slotValues = functions.getSlotValues(filledSlots);
    sessionAttributes.playerInfo = {
      name: slotValues.name.resolved,
      age: slotValues.age.resolved,
      color: slotValues.color.resolved,
    };

    if (name === 'GetPlayerInfoIntent' && confirmationStatus === 'DENIED') {
      return responseBuilder
        .speak("I'm sorry, What is your name?")
        .reprompt("I'm sorry, What is your name?")
        .getResponse();
    }

    return responseBuilder
      .speak(`Hello ${sessionAttributes.playerInfo.name}, ${speechText}`)
      .reprompt(speechText)
      .getResponse();
  },
};

const StartGameIntentHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    return (
      request.type === 'IntentRequest' &&
      (request.intent.name === 'StartGameIntent' && !sessionAttributes.inGame)
    );
  },
  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    let speechText = '';
    let repromptText = '';
    sessionAttributes.passTo = 'false';

    // ? did we collect player info yet ? //
    // if not -> trigger get name //
    if (
      !sessionAttributes.playerInfo ||
      Object.keys(sessionAttributes.playerInfo).length !== 3
    ) {
      return responseBuilder
        .speak('What is your name?')
        .reprompt('What is your name?')
        .getResponse();
    }

    // initialize currentTurn //
    sessionAttributes.currentTurn = 0;

    // turn inGame flag on
    sessionAttributes.inGame = true;

    // ask the first word -> game loop will take over from here
    speechText = 'The word is';
    const word = wordsList[sessionAttributes.currentTurn].split('').join(', '); // c, a, t
    repromptText = word;
    sessionAttributes.repeatText = speechText;
    console.log(word);

    return responseBuilder
      .speak(`${speechText} <break time="0.50s" /> ${word}`)
      .reprompt(repromptText)
      .withSimpleCard(
        `>> ${
          sessionAttributes.playerInfo.name
        } << \n Round: ${sessionAttributes.currentTurn + 1}`,
        word.split(', ').join('') // cat
      )
      .getResponse();
  },
};

const GameLoopHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return (
      request.type === 'IntentRequest' &&
      request.intent.name === 'GameLoopIntent'
    );
  },
  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const { speechText } = responses;
    const repromptText = speechText;
    sessionAttributes.repeatText = speechText;
    sessionAttributes.passTo = 'false';

    // // initialize game
    // if (sessionAttributes.currentTurn === rounds) {
    //   return GaveOverHandler.handle(handlerInput);
    // }

    //   return responseBuilder
    //     .speak(speechText)
    //     .reprompt(repromptText)
    //     .withSimpleCard(
    //       `>> ${sessionAttributes.playerInfo.name} << \n Round: ${
    //       sessionAttributes.currentTurn
    //       }`,
    //       speechText.split(', ').join('')
    //     )
    //     .getResponse();
    // },

    return (
      responseBuilder
        .speak(`you win ${sessionAttributes.playerInfo.name}!`)
        // .reprompt(repromptText)
        // .withSimpleCard(cardParams.cardTitle, cardParams.cardBody)
        .getResponse()
    );
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent'
    );
  },
  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const { speechText, cardParams } = responses.helpResponse;
    const repromptText = speechText;
    sessionAttributes.repeatText = speechText;
    sessionAttributes.passTo = false;

    return responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .withSimpleCard(cardParams.cardTitle, cardParams.cardBody)
      .getResponse();
  },
};

const YesIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'AMAZON.YesIntent'
    );
  },
  async handle(handlerInput) {
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.passTo) {
      switch (sessionAttributes.passTo) {
        case 'StartGameIntentHandler':
          return StartGameIntentHandler.handle(handlerInput);
        default:
          throw new Error(
            `In yes intent switch. Most likely this error is because of an invalid 'passTo' value >>> sessionAttributes.passTo = ${
              sessionAttributes.passTo
            } <<<`
          );
      }
    }

    // alexa didn't as a yes/no question --> fallback //
    return FallBackHandler.handle(handlerInput);
  },
};

const NoIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent'
    );
  },
  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.passTo) {
      switch (sessionAttributes.passTo) {
        case 'StartGameIntentHandler':
          return CancelAndStopIntentHandler.handle(handlerInput);
        default:
          throw new Error(
            `In no intent switch. Most likely this error is because of an invalid 'passTo' value >>> sessionAttributes.passTo = ${
              sessionAttributes.passTo
            } <<<`
          );
      }
    }

    // alexa didn't ask a yes/no question --> fallback //
    return FallBackHandler.handle(handlerInput);
  },
};

const RepeatIntentHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return (
      request.type === 'IntentRequest' &&
      request.intent.name === 'AMAZON.RepeatIntent'
    );
  },
  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const speechText = sessionAttributes.repeatText;
    const repromptText = speechText;

    return responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  },
};

const ResetIntentHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    return (
      request.type === 'IntentRequest' && request.intent.name === 'ResetIntent'
    );
  },
  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    sessionAttributes.testReset = true; // this line is just for running tests
    attributesManager.setSessionAttributes({});
    attributesManager.setPersistentAttributes(
      constants.persistentAttributesAtStart
    );
    await attributesManager.savePersistentAttributes();
    return responseBuilder.speak('Skill is reset. Good-bye').getResponse();
  },
};

const FallBackHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name ===
        'AMAZON.FallbackIntent'
    );
  },
  async handle(handlerInput) {
    const { responseBuilder } = handlerInput;
    const speechText = functions.shuffle(constants.phrasePool.fallback)[0];
    const repromptText = speechText;

    return responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      (handlerInput.requestEnvelope.request.intent.name ===
        'AMAZON.StopIntent' ||
        handlerInput.requestEnvelope.request.intent.name ===
          'AMAZON.CancelIntent')
    );
  },
  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    attributesManager.setPersistentAttributes(sessionAttributes);
    await attributesManager.savePersistentAttributes();

    console.log('user stopped, or canceled some request');
    return responseBuilder
      .speak(functions.shuffle(constants.phrasePool.valediction)[0])
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(
      `Session ended with reason >> ${
        handlerInput.requestEnvelope.request.reason
      } <<
      ${JSON.stringify(handlerInput.requestEnvelope)}`
    );
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  async handle(handlerInput, error) {
    const { attributesManager, responseBuilder } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    console.log(`Error handled: ${error}`);
    console.log(
      `Session ended with reason >> ${
        handlerInput.requestEnvelope.request.reason
      } <<
      ${JSON.stringify(handlerInput.requestEnvelope)}`
    );
    const speechText =
      'There appears to be something wrong. Please try again in a few moments';

    attributesManager.setPersistentAttributes(sessionAttributes);
    await attributesManager.savePersistentAttributes();
    return responseBuilder.speak(speechText).getResponse();
  },
};

const SystemExceptionHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type ===
      'System.ExceptionEncountered'
    );
  },
  handle(handlerInput) {
    console.log(
      `Session ended with reason >> ${
        handlerInput.requestEnvelope.request.reason
      } <<
      ${JSON.stringify(handlerInput.requestEnvelope)}`
    );
  },
};

const LogJsonRequestInterceptor = {
  async process(handlerInput) {
    console.log(
      `REQUEST ENVELOPE = ${JSON.stringify(handlerInput.requestEnvelope)}`
    );
  },
};

const skillBuilder = Alexa.SkillBuilders.standard();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    GetPlayerInfoInProgress,
    GetPlayerInfoCompleted,
    GameLoopHandler,
    HelpIntentHandler,
    YesIntentHandler,
    NoIntentHandler,
    RepeatIntentHandler,
    ResetIntentHandler,
    CancelAndStopIntentHandler,
    FallBackHandler,
    SystemExceptionHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withTableName(constants.skill.dynamoDBTableName)
  .withAutoCreateTable(true)
  .addRequestInterceptors(LogJsonRequestInterceptor)
  .lambda();
