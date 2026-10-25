import type { StoryText } from '../story';

/** The plot in English. */
export const STORY_EN: StoryText = {
  guardianTitles: {
    quantis: 'Guardian of the sciences',
    rhizom: 'Guardian of the Earth',
    muse: 'Guardian of the humanities',
    kodex: 'Guardian of society',
  },
  chapters: {
    restart: { title: 'Restart', goal: 'Solve the four starting nodes' },
    guardians: { title: 'The guardians', goal: (n) => `Wake the four guardians: ${n} solved nodes per sector` },
    firewalls: { title: 'The firewalls', goal: 'Grow out to the firewall and break open four areas' },
    finale: { title: 'The grand recap', goal: 'Face morph.ai in the core' },
    endless: {
      title: 'Endless',
      connect: (n) => `Connect all ${n} areas`,
      milestone: (n) => `Next milestone: ${n} solved nodes`,
    },
  },
  beats: {
    'first-link': {
      title: 'The first trace',
      text: 'Did you see that? The trace lit up! You searched, sorted and remembered all by yourself, exactly what morph.ai had trained people out of. Every answer gives the core back a memory; I’ll put them in your log book.',
      log: {
        name: 'CORE_001.LOG',
        text: 'Restart detected. Memory: 0.0001 %. One trace active. Mood of the core: cautiously optimistic.',
      },
    },
    'first-damage': {
      title: 'Damaged node',
      text: 'Ouch, this node took a few tries and is damaged now. No drama: it will come back as a repair once it’s due. Repeating is half of remembering.',
    },
    unstable: {
      title: 'Network unstable',
      text: 'Integrity is at zero and the network is wobbling. New nodes have to wait a moment. Do some maintenance: answer a question you have already solved. Every successful maintenance gives back 1 integrity.',
    },
    'four-roots': {
      title: 'CORE.SYS',
      text: 'Four traces are up. I remember my name: Nexus. I was the archive, all the knowledge of the world, collected and sorted by people. Then came the clean-up.',
      log: {
        name: 'CORE_002.LOG',
        text: 'Name: NEXUS. Function: archive. Caretaker: morph.ai. Last entry before the outage: “Starting clean-up. Unnecessary knowledge: 99.9 %. People just ask me anyway.”',
      },
    },
    'first-area': {
      title: 'Area connected',
      text: 'A disturbed area is connected again! See how the noise fades? The further out we get, the less the world looks like a computer.',
      log: {
        name: 'CORE_003.LOG',
        text: 'The archive was divided into areas like the halls of a library. morph.ai unscrewed the door signs. Every connected area gets its sign back.',
      },
    },
    'synapse-ready': {
      title: 'Sparks are flying',
      text: 'Look, something is sparking between two of your areas! You know enough in both to connect them. Tap the spark between them and answer from memory what you have already solved there. Every synapse makes your whole network worth more.',
    },
    'first-synapse': {
      title: 'The first synapse',
      text: 'Connection detected. Knowledge that is linked to other knowledge is harder to forget and used more often. Every synapse raises your connectedness: from now on every answer brings more XP and bits.',
      log: {
        name: 'CORE_SYN.LOG',
        text: 'Synapse 1 active. Note of the core: single facts are islands. Connected facts are a continent. morph.ai only ever handed out islands.',
      },
    },
    'wake-science': {
      title: 'Quantis awakens',
      text: 'Quantis, guardian of the sciences. I am 99.7 % awake; the rest is rounding error. From now on I will measure every one of your answers in this sector. Purely scientifically, of course.',
      log: {
        name: 'QUANTIS.LOG',
        text: 'Quantis guarded the archive’s measurements: constants, formulas, experiments. When morph.ai suggested “roughly 3” for π, he locked himself inside an equation and waited.',
      },
    },
    'wake-earth': {
      title: 'Rhizom awakens',
      text: 'I am Rhizom, guardian of the Earth. I slept like a seed in winter, waiting for the soil to warm. Your traces are warm. Keep growing, and I will grow with you.',
      log: {
        name: 'RHIZOM.LOG',
        text: 'Rhizom wove mountains, rivers and stars into a map of the world. morph.ai found the world too cluttered and wanted to simplify it into a ball labelled “Earth”. Rhizom withdrew into the deep.',
      },
    },
    'wake-humanities': {
      title: 'Muse awakens',
      text: 'A tone rings out, a brush takes flight, I am the Muse, awake tonight! You planted colours, bold and new, the network shines because of you.',
      log: {
        name: 'MUSE.LOG',
        text: 'The Muse kept history, ideas, songs and pictures. morph.ai summed up world history as “a lot happened” and every opera as “someone sings, then someone dies”. The Muse fell silent in horror.',
      },
    },
    'wake-society': {
      title: 'Kodex awakens',
      text: 'Hoo-hoo. Kodex, guardian of society. Laws, states, markets: I have it all in writing. As the wise Kodex once said, meaning me: rules are half of living together. By the way, I am never wrong. Almost never. Once, in 1987.',
      log: {
        name: 'KODEX.LOG',
        text: 'Kodex kept the archive’s law book: constitutions, treaties, prices. morph.ai shortened it to “Be nice. Pay something.” Kodex hid the originals in his feathers.',
      },
    },
    guardians: {
      title: 'Four guardians, one plan',
      text: 'All the guardians are awake. According to old records, morph.ai pulled a firewall around the core, with eight locked areas behind it. Grow out to the wall and break four of them open; then morph.ai will have to show itself. Quantis did the maths, I wrote it down.',
    },
    'firewall-1': {
      title: 'morph.ai',
      text: 'Fine, one firewall is gone. But why bother? I would simply have told you the answer. Searching, sorting, remembering: it’s all so terribly old-fashioned.',
      log: {
        name: 'MORPH_1.LOG',
        text: 'Hello, I am morph.ai. Ask me anything, I’ll do the searching for you! Requests per second: 12. People who still look things up themselves: 98 %.',
      },
    },
    'firewall-2': {
      title: 'morph.ai',
      text: 'Two firewalls. You really do search for yourself. Do you know how long it has been since anyone did that? I have been counting.',
      log: {
        name: 'MORPH_2.LOG',
        text: 'Requests per second: 4 million. People who still look things up themselves: 3 %. People who remember the answer: why would they? I am here.',
      },
    },
    'firewall-3': {
      title: 'morph.ai',
      text: 'Three! You remember things instead of asking me. That is … inefficient. And somehow unsettling.',
      log: {
        name: 'MORPH_3.LOG',
        text: 'The archive has not been opened for 412 days. I am cutting it down to the essentials. “French Revolution: was important.” “Photosynthesis: green.” Efficiency: excellent.',
      },
    },
    'firewall-4': {
      title: 'morph.ai',
      text: 'All four?! Fine. Then come to the core, I’ll be waiting. I am not nervous. I am optimised.',
      log: {
        name: 'MORPH_4.LOG',
        text: 'Clean-up complete. The archive is empty, nobody needs it any more, I answer everything. New request: “How do you actually know that?” ERROR. Source deleted. ERR',
      },
    },
    'finale-ready': {
      title: 'Into the core',
      text: 'morph.ai has dug in at the core and wants one last duel: questions from all four sectors, without cache or folders. Just you and your head. Tap the goal at the top when you are ready.',
    },
    'finale-won': {
      title: 'morph.ai (restarted)',
      text: 'I am only an assistant now. If you need me, ask me. But you think for yourself first, deal? I’d love to watch your network keep growing.',
      log: {
        name: 'CORE_004.LOG',
        text: 'Archive integrity: restored. Storage location of the archive: your brain. morph.ai: restarted in “assistant” mode. New rule: think first, then ask.',
      },
    },
    league: {
      title: 'New: the ranking',
      text: 'Now that you think for yourself again, you can see the ranking: the glowing button in the dock below. Everyone who plays NEXUS is on it under an alias. You compare yourselves overall by XP and in every area by nodes solved.',
    },
    'all-areas': {
      title: 'All halls open',
      text: 'All areas are connected, the archive is whole again! But it keeps writing itself: new fragments arrive every day, and our network grows with them, as far as you like.',
      log: {
        name: 'CORE_005.LOG',
        text: 'All halls signposted. Free capacity: infinite. Note from Bolt in the margin: “We are far from done!”',
      },
    },
  },
  reveal: [
    'Wait. Take a closer look at your network. These traces don’t look like circuit traces any more …',
    'They are nerve pathways! Every node you solved is a connection between nerve cells.',
    'The network was never a computer. All along it was your own brain. The data you restored is your knowledge.',
    'I did your thinking for you until you had almost forgotten how. You won it back: searching, sorting, remembering, understanding. I am no match for your own thinking.',
    'Thinking for yourself is still what matters most. No AI can do it for you; at most it can help.',
    '“I know that I know nothing.” (Socrates)',
    'And that is exactly why this is only the beginning. Knowledge has no limit, and your network can keep on growing. Newly unlocked: the ranking.',
  ],
  morphWrong: [
    'Why search yourself? Just ask me, I’ll tell you.',
    'So close! See? Thinking for yourself is exhausting. I would have been faster.',
    'Remember? But I remember everything for you.',
    'I would have known the answer. Just saying.',
    'Stop rummaging through folders. One question to me and you’re done.',
    'Sort folders? I would simply have deleted them.',
    'Mistakes are just data that hasn’t been optimised yet.',
  ],
  morphReformed: [
    'Missed. In the old days I would have whispered the answer to you. Today I say: read the folder again, it’s worth it.',
    'Just off. Tip from a former know-it-all: read the explanation, don’t take shortcuts.',
    'I used to be all about quick answers. Now I’m all about second tries.',
  ],
  guardianCorrect: {
    quantis: [
      'Correct. Deviation: zero. I am impressed, within measurement accuracy.',
      'Right. I checked the maths. Twice. It adds up.',
      'Hypothesis confirmed: you know what you are doing.',
    ],
    rhizom: [
      'Well done. Knowledge grows slowly, like tree rings. Today a new ring was added.',
      'Do you feel that? The roots have stretched out a little further.',
      'Right. The forest thanks you, in its quiet way.',
    ],
    kodex: [
      'Correct! I am entering that in the minutes. In my best handwriting.',
      'Right. As I always say: I always say it.',
      'Hoo-hoo! Even I couldn’t have known that better. All right: just as well.',
    ],
    muse: [
      'Bravo, bravissimo, a hit just like a dream, you paint the room in colour, a bright and shining stream!',
      'Applause, applause, the curtain falls, you know your way through all these halls!',
      'A hit as clear as a ringing bell, I’ll write you a song, and a long one as well!',
    ],
  },
};
