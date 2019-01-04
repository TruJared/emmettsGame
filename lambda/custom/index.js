const Alexa = require('ask-sdk');

const constants = require('./constants');
const functions = require('./functions');
const intro = require('./intro.json');
const main = require('./main.json');

const { responses } = constants;
const words = require('./words');

const rounds = 10; // how many rounds in a game?

// default params for visual elements
const displayParams = {
  headerTitle: constants.hasScreen.defaultTitle,
  logoUrl: constants.logoUrl,
  name: '',
  word: '',
  round: '# Correct',
  imageUrl: functions.shuffle(constants.hasScreen.helloImages)[0],
  hintText: functions.shuffle(constants.hasScreen.hintText)[0],
};
// todo better ending screen and events //
// todo better help screen //
// todo check for words that cause issues (i.e. wood and would) //

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const persistentAttributes =
      (await attributesManager.getPersistentAttributes()) ||
      constants.persistentAttributesAtStart;
    const speechText = functions.shuffle(
      responses.launchResponse.speechText
    )[0];
    const salutation = !persistentAttributes.newUser
      ? functions.shuffle(constants.phrasePool.salutation)[0]
      : "Welcome to Let's Read! <audio src='soundbank://soundlibrary/musical/amzn_sfx_trumpet_bugle_03'/> I'm very excited to learn to read 1,000 new words with you. <prosody rate=\"fast\"> Let's get started!</prosody>";
    const repromptText = speechText;

    // set persistentAttributes to sessionAttributes //
    // reset from previous game to be safe //
    attributesManager.setSessionAttributes(persistentAttributes);
    const sessionAttributes = attributesManager.getSessionAttributes();
    sessionAttributes.hasScreen = !!functions.supportsDisplay(handlerInput);
    sessionAttributes.passTo = false;
    sessionAttributes.repeatText = speechText;
    sessionAttributes.inGame = false;
    sessionAttributes.currentTurn = 0;
    sessionAttributes.score = 0;
    sessionAttributes.wordsList = [];

    // reset display params too
    displayParams.headerTitle = constants.hasScreen.defaultTitle;
    displayParams.logoUrl = constants.logoUrl;
    displayParams.name = '';
    displayParams.word = '';
    displayParams.round = '# Correct';
    // eslint-disable-next-line prefer-destructuring
    displayParams.imageUrl = functions.shuffle(
      constants.hasScreen.helloImages
    )[0];
    // eslint-disable-next-line prefer-destructuring
    displayParams.hintText = functions.shuffle(constants.hasScreen.hintText)[0];

    if (sessionAttributes.hasScreen) {
      return responseBuilder
        .speak(`${salutation} ${speechText}`)
        .reprompt(repromptText)
        .addDirective(functions.getDisplayData(intro, displayParams))
        .getResponse();
    }

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
    const { responseBuilder, requestEnvelope } = handlerInput;
    const currentIntent = requestEnvelope.request.intent;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    sessionAttributes.passTo = false;

    return responseBuilder.addDelegateDirective(currentIntent).getResponse();
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
    const speechTextSalutation = functions.shuffle(
      responses.getplayerInfoCompletedResponse.speechTextSalutation
    )[0];
    const speechText = functions.shuffle(
      responses.getplayerInfoCompletedResponse.speechText
    )[0];
    const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
    const slotValues = functions.getSlotValues(filledSlots);
    const name = slotValues.name.resolved;
    sessionAttributes.playerInfo = {
      name,
      level: slotValues.number.resolved,
    };
    sessionAttributes.passTo = 'HelpIntentHandler';

    // if new, turn off new flag and pass to help menu //
    if (sessionAttributes.newUser) {
      sessionAttributes.newUser = false;
      return HelpIntentHandler.handle(handlerInput);
    }

    return responseBuilder
      .speak(`${speechTextSalutation}, ${name}. ${speechText}`)
      .reprompt(speechText)
      .getResponse();
  },
};

// * Players name is also a site word..
// * Or Alexa thinks it is a site word..
const PlayersNameIsWordHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    return (
      request.type === 'IntentRequest' &&
      (request.intent.name === 'GameLoopIntent' &&
        request.dialogState !== 'COMPLETED' &&
        !sessionAttributes.inGame)
    );
  },
  async handle(handlerInput) {
    const { responseBuilder, requestEnvelope } = handlerInput;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const speechText = `${
      functions.shuffle(constants.phrasePool.fallback)[0]
    }. Try introducing yourself by saying 'My name is', before telling me your name. What is your name?`;
    sessionAttributes.passTo = false;

    return responseBuilder
      .speak(speechText)
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
      (request.intent.name === 'StartGameIntent' && sessionAttributes.inGame)
    );
  },
  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const {
      name,
      confirmationStatus,
    } = handlerInput.requestEnvelope.request.intent;
    sessionAttributes.passTo = false;

    // ? did they figure out how to start without giving their name ? //
    if (name === 'GetPlayerInfoIntent' && confirmationStatus === 'DENIED') {
      sessionAttributes.playerInfo = {};
      return responseBuilder
        .speak("I'm sorry, I never asked you your name, What is your name?")
        .reprompt("I'm sorry, I never asked you your name, What is your name?")
        .getResponse();
    }

    // initialize  //
    const wordsList = functions
      .shuffle(words.wordsList[sessionAttributes.playerInfo.level])
      .slice(0, rounds);
    console.log(wordsList);
    sessionAttributes.currentTurn = 0;
    sessionAttributes.score = 0;
    sessionAttributes.wordsList = wordsList;

    // get word
    const { speechText, sayWord, spellWord } = functions.getWord(
      sessionAttributes.wordsList,
      sessionAttributes.currentTurn
    );
    const repromptText = spellWord;
    sessionAttributes.word = sayWord;
    sessionAttributes.repeatText = `${speechText} <break time="0.50s" /> ${spellWord}`;
    sessionAttributes.currentTurn += 1;

    // set up display params
    displayParams.round = '# Correct';
    displayParams.name = `Name: ${sessionAttributes.playerInfo.name.toUpperCase()}`;
    displayParams.word = sayWord.toUpperCase();
    displayParams.imageUrl =
      constants.hasScreen.correctImages[sessionAttributes.score];

    if (sessionAttributes.hasScreen) {
      return responseBuilder
        .speak(`${speechText} <break time="0.50s" /> ${spellWord}`)
        .reprompt(repromptText)
        .addDirective(functions.getDisplayData(main, displayParams))
        .getResponse();
    }

    return responseBuilder
      .speak(`${speechText} <break time="0.50s" /> ${spellWord}`)
      .reprompt(repromptText)
      .getResponse();
  },
};

const GameLoopHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    return (
      request.type === 'IntentRequest' &&
      (request.intent.name === 'GameLoopIntent' && sessionAttributes.inGame)
    );
  },
  async handle(handlerInput) {
    const { attributesManager, responseBuilder } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const filledSlots = handlerInput.requestEnvelope.request.intent.slots;
    const slotValues = functions.getSlotValues(filledSlots);
    const guess = slotValues.guess.resolved;
    // * truthy * //
    const isRight = sessionAttributes.word === guess;
    sessionAttributes.passTo = false;

    // check answer and load response
    const resultsText = isRight
      ? `${functions.shuffle(responses.correct.sound)[0]} ${
          functions.shuffle(responses.correct.phrase)[0]
        }`
      : `${functions.shuffle(responses.incorrect.sound)[0]} ${
          functions.shuffle(responses.incorrect.phrase)[0]
        }. The correct answer was ${sessionAttributes.word}`;

    // update score
    sessionAttributes.score += isRight ? 1 : 0;

    console.log(
      `word: ${
        sessionAttributes.word
      } >>> guess: ${guess} ???? are equal: ${sessionAttributes.word === guess}
      ::: slotValues ${JSON.stringify(slotValues.guess)} :::`
    );

    // is game over ? -> send to game over
    if (sessionAttributes.currentTurn === rounds) {
      return EndGameIntentHandler.handle(handlerInput, resultsText);
    }

    // else build next question //
    const { speechText, sayWord, spellWord } = functions.getWord(
      sessionAttributes.wordsList,
      sessionAttributes.currentTurn
    );
    const repromptText = spellWord;

    // get everything to session that needs to be there
    sessionAttributes.word = sayWord;
    sessionAttributes.repeatText = `${speechText} <break time="0.50s" /> ${spellWord}`;
    sessionAttributes.currentTurn += 1;

    // set up display parameters
    displayParams.round = '# Correct';
    displayParams.name = `Name: ${sessionAttributes.playerInfo.name.toUpperCase()}`;
    displayParams.word = sayWord.toUpperCase();
    displayParams.imageUrl =
      constants.hasScreen.correctImages[sessionAttributes.score];

    if (sessionAttributes.hasScreen) {
      return responseBuilder
        .speak(
          `${resultsText} <break time="0.50s" />
        ${speechText} <break time="0.25s" />
        ${spellWord}`
        )
        .reprompt(repromptText)
        .addDirective(functions.getDisplayData(main, displayParams))
        .getResponse();
    }

    return responseBuilder
      .speak(
        `${resultsText} <break time="0.50s" />
        ${speechText} <break time="0.25s" />
        ${spellWord}`
      )
      .reprompt(repromptText)
      .getResponse();
  },
};

const EndGameIntentHandler = {
  canHandle(handlerInput, resultsText) {
    const { request } = handlerInput.requestEnvelope;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return (
      request.type === 'IntentRequest' &&
      request.intent.name === 'EndGameIntent' &&
      sessionAttributes.inGame
    );
  },
  async handle(handlerInput, resultsText) {
    const { attributesManager, responseBuilder } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();
    const { name } = sessionAttributes.playerInfo;
    const randomModifier = functions.getRandomInt(0, 99);
    sessionAttributes.passTo = false;
    sessionAttributes.inGame = false;

    const finalScore =
      Math.round(
        (sessionAttributes.score / rounds) *
          (sessionAttributes.playerInfo.level / rounds) *
          1000
      ) + randomModifier;
    attributesManager.setPersistentAttributes(sessionAttributes);
    await attributesManager.savePersistentAttributes();

    // * not clean * 🚿 //
    const speechText =
      sessionAttributes.score < rounds
        ? `${resultsText} <break time="0.50s" /> Thanks for playing ${name}! You got ${
            sessionAttributes.score
          } correct. Your final score was ${finalScore}.
        And you played level ${sessionAttributes.playerInfo.level}`
        : `${resultsText} <break time="0.50s" /> Thanks for playing ${name}! You got them all correct!
        <audio src='soundbank://soundlibrary/impacts/amzn_sfx_fireworks_whistles_01'/> Your final score was ${finalScore}. And you played level ${
            sessionAttributes.playerInfo.level
          }`;

    // set up display parameters
    displayParams.name = `Final Score`;
    displayParams.word = finalScore;
    displayParams.round =
      sessionAttributes.score < rounds ? 'Thanks!' : 'Perfect!';
    displayParams.imageUrl =
      sessionAttributes.score < rounds
        ? functions.shuffle(constants.hasScreen.helloImages)[0]
        : functions.shuffle(constants.hasScreen.winnerImages)[0];

    if (sessionAttributes.hasScreen) {
      return responseBuilder
        .speak(speechText)
        .addDirective(functions.getDisplayData(main, displayParams))
        .getResponse();
    }

    return responseBuilder.speak(speechText).getResponse();
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
    const { speechText, repromptText } = responses.helpResponse;
    sessionAttributes.repeatText = repromptText;
    // this flag will force them them to route through the no intent and turn on inGame flag
    // or return to the help menu
    sessionAttributes.passTo = 'HelpIntentHandler';

    return responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
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
        case 'HelpIntentHandler':
          // user asks for instructions
          return HelpIntentHandler.handle(handlerInput);
        default:
          throw new Error(
            `In yes intent switch. Most likely this error is because of an invalid 'passTo' value >>> sessionAttributes.passTo = ${
              sessionAttributes.passTo
            } <<<`
          );
      }
    }

    // alexa didn't ask a yes/no question --> fallback //
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
    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.passTo) {
      switch (sessionAttributes.passTo) {
        case 'HelpIntentHandler':
          // user doesn't need instructions
          sessionAttributes.inGame = true;
          return StartGameIntentHandler.handle(handlerInput);
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
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    return (
      (handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
        handlerInput.requestEnvelope.request.intent.name ===
          'AMAZON.FallbackIntent') ||
      handlerInput.requestEnvelope.request.intent.name === 'GetPlayerInfoIntent'
    );
  },
  async handle(handlerInput) {
    const { responseBuilder } = handlerInput;
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const speechText = functions.shuffle(constants.phrasePool.fallback)[0];
    const hint = sessionAttributes.inGame
      ? `Next time, before giving me your answer, try saying, ${
          functions.shuffle(constants.guessHints)[0]
        }.`
      : '';

    return responseBuilder
      .speak(
        `${speechText} ${hint}<break time="0.20s" /> ${
          sessionAttributes.repeatText
        }`
      )
      .reprompt(sessionAttributes.repeatText || speechText)
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
    const speechText = `There appears to be something wrong. Please try again in a few moments`;

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
    PlayersNameIsWordHandler,
    EndGameIntentHandler,
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
