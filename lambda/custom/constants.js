/* CONSTANTS */

const skill = {
  appId: '',
  dynamoDBTableName: 'superSightWords',
};

const persistentAttributesAtStart = {
  newUser: true,
};

const logoUrl = 'https://s3.amazonaws.com/emmetts-game/icon_512_A2Z.png';

const hasScreen = {
  background:
    'https://s3.amazonaws.com/emmetts-game/chalkboard-517818_1920.jpg',
  defaultTitle: '',
  defaultSubTitle: '',
  defaultMessage: '',
  hintText: [
    'If you like this skill please rate it 🌟🌟🌟🌟🌟 on Amazon, Thanks!',
    'If you like this skill please share 💬 it with a friend',
    'Made with ❤️ by Jared Makes 💻 jaredmakes.com ',
    'Thanks for playing my game. - Jared - ',
    'Any feedback can be sent to 📧 jared@jaredmakes.com',
    "Please take a minute to write ✏️ a review on Amazon. It's a huge help to us developers!",
    '❤️ Ratings 🌟🌟🌟🌟🌟 and reviews 💻 are appreciated! ❤️',
    'Thanks for playing. I had a lot of fun making this. - Jared - 😄',
  ],
  noVideoSupport: 'Sorry this device does not support video',
  helloImages: [
    'https://s3.amazonaws.com/emmetts-game/hello/bear-150424_640.png',
    'https://s3.amazonaws.com/emmetts-game/hello/beaver-46221_640.png',
    'https://s3.amazonaws.com/emmetts-game/hello/bird-1771435_640.png',
    'https://s3.amazonaws.com/emmetts-game/hello/bird-1773616_640.png',
    'https://s3.amazonaws.com/emmetts-game/hello/skeleton-1456627_640.png',
  ],
  winnerImages: [
    'https://s3.amazonaws.com/emmetts-game/winner/cup-1010909_640.jpg',
    'https://s3.amazonaws.com/emmetts-game/winner/cup-1010916_640.jpg',
    'https://s3.amazonaws.com/emmetts-game/winner/cup-1614530_640.png',
    'https://s3.amazonaws.com/emmetts-game/winner/friends-1020035_1920.jpg',
    'https://s3.amazonaws.com/emmetts-game/winner/medal-1622523_640.png',
    'https://s3.amazonaws.com/emmetts-game/winner/trophy-153395_640.png',
  ],
  pointsImages: {
    1: 'https://s3.amazonaws.com/emmetts-game/numbers/counting-149951_640.png',
    2: 'https://s3.amazonaws.com/emmetts-game/numbers/counting-149952_640.png',
    3: 'https://s3.amazonaws.com/emmetts-game/numbers/counting-149953_640.png',
    4: 'https://s3.amazonaws.com/emmetts-game/numbers/counting-149954_640.png',
    5: 'https://s3.amazonaws.com/emmetts-game/numbers/counting-149955_640.png',
    6: 'https://s3.amazonaws.com/emmetts-game/numbers/counting-149956_640.png',
    7: 'https://s3.amazonaws.com/emmetts-game/numbers/counting-149957_640.png',
    8: 'https://s3.amazonaws.com/emmetts-game/numbers/counting-149958_640.png',
    9: 'https://s3.amazonaws.com/emmetts-game/numbers/counting-149959_640.png',
  },
};

const responses = {
  launchResponse: {
    speechText: [
      'Before we get started, I would really like to know your name. Could you tell it to me?',
      "We can't get started until you tell me your name. What is it?",
      'What is your name?',
      'I bet you have a really cool name, what is your name?',
      'Could you help me out and tell me your name?',
      'I would really like to know what your name is could you tell it to me?',
    ],
  },
  getplayerInfoCompletedResponse: {
    speechTextSalutation: [
      'Hello',
      'Nice to meet you',
      'Hi',
      'Sweet name',
      "That's a cool name",
      'I really like your name',
    ],
    speechText: [
      'You look like you are ready to get started. Before we begin would you like me to review the rules?',
      'I think you are going to do great! Before we begin would you like me to review the rules?',
      "Let's get to reading! Before we begin would you like me to review the rules?",
      "Let's get to reading! Before we begin should I explain the rules",
    ],
  },
  helpResponse: {
    speechText:
      "<audio src='soundbank://soundlibrary/magic/amzn_sfx_fairy_melodic_chimes_01'/> I am the happy-helpy-helper-help-and-hint-menu. You can say help at anytime to hear these rules again. <break time='0.25s' /> Once the game starts I will spell a word for you. I'll wait for you to tell me the word as fast as you can, but you only have a short amount of time, so don't wait too long. You should try to speak clearly. I'm still learning to listen, so sometimes I don't hear you very well; if that happens, I'll give you a hint to help me listen better.<break time='0.50s' /> Do you need to hear the instructions again?",
    repromptText: ' Do you need to hear the instructions again?',
  },
};

const phrasePool = {
  salutation: [
    '<say-as interpret-as="interjection">Aloha</say-as>, welcome back!',
    '<say-as interpret-as="interjection">Bazinga</say-as>, welcome back!',
    '<say-as interpret-as="interjection">Hip hip hooray</say-as> , Great to see you back!',
    '<say-as interpret-as="interjection">Howdy</say-as> , Good to see you!',
    '<say-as interpret-as="interjection">Spoiler alert</say-as> , this game is awesome!',
    'Want to see a magic trick? <break time="0.05s" /><say-as interpret-as="interjection">abracadabra</say-as>, I just pulled a fun new game out of my hat! Let\'s play!',
  ],
  valediction: [
    '<say-as interpret-as="interjection">Arrivederci</say-as>',
    '<say-as interpret-as="interjection">au revoir</say-as>',
    '<say-as interpret-as="interjection">bon voyage</say-as>',
    '<say-as interpret-as="interjection">cheerio</say-as>',
    'good-bye',
  ],
  fallback: [
    '<say-as interpret-as="interjection">Aw man</say-as>, I didn’t understand that request. Perhaps try phrasing it a different way.',
    '<say-as interpret-as="interjection">Blah</say-as> , I’m afraid I didn’t understand that. Can you try saying it differently?',
    '<say-as interpret-as="interjection">Blarg</say-as> , I didn’t quite catch that, say again?',
    '<say-as interpret-as="interjection">Blast</say-as> , I was totally spacing out and didn’t hear that. Can you repeat the request?',
    '<say-as interpret-as="interjection">Darn</say-as> , Totally missed that one. What did you say?',
    '<say-as interpret-as="interjection">D’oh</say-as> , Too busy dreaming about donuts, can you repeat that?',
    '<say-as interpret-as="interjection">Good grief</say-as> , I have no idea what you’re asking. Let’s try this again.',
    '<say-as interpret-as="interjection">Jeepers creepers</say-as> , You scared me! What did you say?',
    '<say-as interpret-as="interjection">ruh roh</say-as> , I didn’t really understand that. Maybe you can try saying that again? ',
  ],
};

const guessHints = [
  "that's ",
  'my guess is ',
  'the word i am going to guess is ',
  'the answer is ',
  'is the answer ',
  'I think the answer is ',
  'the word is ',
  "that's ",
  'I guess ',
  'my guess is ',
  'the word i am going to guess is ',
  'the answer is ',
  'is the answer ',
  'I think the answer is ',
  'The answer is ',
  'You spelled ',
  'The word is ',
  'i think it is ',
  'your word is ',
  "alexa's word is ",
  'I can read ',
  'I guess',
  "that's ",
  'I guess ',
  'my guess is ',
  'the word i am going to guess is ',
  'is the answer ',
  'I think the answer is ',
  'You spelled ',
  'The word is ',
  'i think it is ',
  'your word is ',
  "alexa's word is ",
  'I can read ',
];

module.exports = {
  logoUrl,
  hasScreen,
  skill,
  guessHints,
  responses,
  phrasePool,
  persistentAttributesAtStart,
};
