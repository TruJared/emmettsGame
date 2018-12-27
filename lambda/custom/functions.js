const mainDoc = require('./main.json');

const getWord = (wordsList, turn) => {
  const speechText = 'The word is ';
  const sayWord = wordsList[turn]; // cat
  const spellWord = sayWord.split('').join(', '); // c, a, t
  return {
    speechText,
    sayWord,
    spellWord,
  };
};

const getRandomInt = (min, max) => {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
};

const getDisplayData = displayParams => {
  const {
    logoUrl,
    background,
    smImgUrl,
    lgImgUrl = smImgUrl,
    title,
    subTitle,
    message,
    hintText,
  } = displayParams;
  const datasources = {
    bodyTemplate2Data: {
      type: 'object',
      objectId: 'bt2Sample',
      backgroundImage: {
        contentDescription: null,
        smallSourceUrl: null,
        largeSourceUrl: null,
        sources: [
          {
            url: background,
            size: 'small',
            widthPixels: 0,
            heightPixels: 0,
          },
          {
            url: background,
            size: 'large',
            widthPixels: 0,
            heightPixels: 0,
          },
        ],
      },
      title: "Let's Read",
      image: {
        contentDescription: null,
        smallSourceUrl: null,
        largeSourceUrl: null,
        sources: [
          {
            url: smImgUrl,
            size: 'small',
            widthPixels: 0,
            heightPixels: 0,
          },
          {
            url: lgImgUrl,
            size: 'large',
            widthPixels: 0,
            heightPixels: 0,
          },
        ],
      },
      textContent: {
        title: {
          type: 'PlainText',
          text: title,
        },
        subtitle: {
          type: 'PlainText',
          text: subTitle,
        },
        primaryText: {
          type: 'PlainText',
          text: message,
        },
      },
      logoUrl,
      hintText,
    },
  };

  return {
    type: 'Alexa.Presentation.APL.RenderDocument',
    version: '1.0',
    document: mainDoc,
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
