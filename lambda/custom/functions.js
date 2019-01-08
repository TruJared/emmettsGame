const getWord = (wordsList, turn) => {
  const speechText = [
    'The word is ',
    'What word is this? ',
    "Here's a new word for you ",
    'Tell me what this spells ',
    'O.K. hotshot, tell me what this word is.',
    "I'm having so much fun, can you tell me what this word spells?",
    'What do these letters spell?',
    'Can you tell me what this spells?',
    "Here's a word I think you'll know ",
    'I feel the need, the need to read. What does this spell?',
    'What do you think this word is?',
    'Can you get this one?',
    'How about this?',
    'Can you answer what this word is?',
    'O.K., now what is this word?',
    'The next word is ',
    'Can you answer what this word is?',
    "Here's the next one.",
  ];
  const sayWord = wordsList[turn]; // cat
  const spellWord = sayWord.split('').join(', '); // c, a, t
  return {
    speechText: shuffle(speechText)[0],
    sayWord,
    spellWord,
  };
};

const getRandomInt = (min, max) => {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
};

const getDisplayData = (template, displayParams) => {
  const {
    headerTitle,
    logoUrl,
    name,
    word,
    round,
    imageUrl,
    hintText,
  } = displayParams;

  const datasources = {
    main: {
      type: 'object',
      properties: {
        headerTitle,
        logoUrl,
        name,
        word,
        round,
        imageUrl,
        hintText,
      },
      transform: [
        {
          inputPath: word,
          outputName: 'synchronizedText',
          transformer: 'ssmlToText',
        },
        {
          inputPath: word,
          outputName: 'synchronizedSpeech',
          transformer: 'ssmlToSpeech',
        },
      ],
    },
  };

  return {
    type: 'Alexa.Presentation.APL.RenderDocument',
    version: '1.0',
    token: 'syncronizedTextToken',
    document: template,
    datasources,
  };
};

// >>> Start: Alexa Specific Functions <<< //
/* eslint-disable */
const getSlotValues = function(filledSlots) {
  const slotValues = {};

  Object.keys(filledSlots).forEach(item => {
    const { name } = filledSlots[item];
    slotValues[name] = {};

    // Extract the nested key 'code' from the ER resolutions in the request
    let erStatusCode;
    try {
      erStatusCode = (
        (
          ((filledSlots[item] || {}).resolutions || {})
            .resolutionsPerAuthority[0] || {}
        ).status || {}
      ).code;
    } catch (e) {
      console.log(`erStatusCode e: ${e}`);
    }

    switch (erStatusCode) {
      case 'ER_SUCCESS_MATCH':
        slotValues[name].synonym = filledSlots[item].value;
        slotValues[name].resolved =
          filledSlots[
            item
          ].resolutions.resolutionsPerAuthority[0].values[0].value.name;
        slotValues[name].isValidated =
          filledSlots[item].value ===
          filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0]
            .value.name;
        slotValues[name].statusCode = erStatusCode;
        break;

      default:
        // ER_SUCCESS_NO_MATCH, undefined
        slotValues[name].synonym = filledSlots[item].value;
        slotValues[name].resolved = filledSlots[item].value;
        slotValues[name].isValidated = false;
        slotValues[name].statusCode =
          erStatusCode === undefined ? 'undefined' : erStatusCode;
        break;
    }
  }, this);

  return slotValues;
};

const getSpokenValue = function(requestEnvelope, slotName) {
  if (
    requestEnvelope &&
    requestEnvelope.request &&
    requestEnvelope.request.intent &&
    requestEnvelope.request.intent.slots &&
    requestEnvelope.request.intent.slots[slotName] &&
    requestEnvelope.request.intent.slots[slotName].value
  ) {
    return requestEnvelope.request.intent.slots[slotName].value;
  }
  return undefined;
};

const getResolvedValue = function(requestEnvelope, slotName) {
  if (
    requestEnvelope &&
    requestEnvelope.request &&
    requestEnvelope.request.intent &&
    requestEnvelope.request.intent.slots &&
    requestEnvelope.request.intent.slots[slotName] &&
    requestEnvelope.request.intent.slots[slotName].resolutions &&
    requestEnvelope.request.intent.slots[slotName].resolutions
      .resolutionsPerAuthority &&
    requestEnvelope.request.intent.slots[slotName].resolutions
      .resolutionsPerAuthority[0] &&
    requestEnvelope.request.intent.slots[slotName].resolutions
      .resolutionsPerAuthority[0].values &&
    requestEnvelope.request.intent.slots[slotName].resolutions
      .resolutionsPerAuthority[0].values[0] &&
    requestEnvelope.request.intent.slots[slotName].resolutions
      .resolutionsPerAuthority[0].values[0].value &&
    requestEnvelope.request.intent.slots[slotName].resolutions
      .resolutionsPerAuthority[0].values[0].value.name
  ) {
    return requestEnvelope.request.intent.slots[slotName].resolutions
      .resolutionsPerAuthority[0].values[0].value.name;
  }
  return undefined;
};

const supportsDisplay = handlerInput => {
  const hasDisplay =
    handlerInput.requestEnvelope.context &&
    handlerInput.requestEnvelope.context.System &&
    handlerInput.requestEnvelope.context.System.device &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces.hasOwnProperty(
      'Alexa.Presentation.APL'
    );
  return hasDisplay;
};
// >>> End: Alexa Specific Functions <<< //

// super useful functions //
const shuffle = a => {
  let j;
  let x;
  let i;
  for (i = a.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
};

/* eslint-enable */

module.exports = {
  getWord,
  getDisplayData,
  getRandomInt,
  getSlotValues,
  supportsDisplay,
  shuffle,
  getSpokenValue,
  getResolvedValue,
};
