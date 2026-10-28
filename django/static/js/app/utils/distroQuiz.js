const QUIZ_QUESTIONS = [
  {
    id: "experience",
    question: "How much Linux experience do you have?",
    options: [
      { label: "I\u2019m completely new" },
      { label: "I\u2019ve dabbled a bit" },
      { label: "I use it as a daily driver" },
      { label: "I\u2019m a pro / sysadmin" }
    ]
  },
  {
    id: "use",
    question: "What will you mainly use it for?",
    options: [
      { label: "Everyday desktop (browsing, media, docs)" },
      { label: "Programming & development" },
      { label: "Gaming" },
      { label: "Servers, containers & cloud" },
      { label: "Security & penetration testing" },
      { label: "Reviving old or low-spec hardware" }
    ]
  },
  {
    id: "hardware",
    question: "How beefy is your machine?",
    options: [
      { label: "Modern \u2014 plenty of RAM and a fast SSD" },
      { label: "Mid-range \u2014 a few years old" },
      { label: "Old or low-spec (small RAM/disk)" }
    ]
  },
  {
    id: "updates",
    question: "How do you like your updates?",
    options: [
      { label: "Rock solid \u2014 rarely change anything" },
      { label: "Fresh, but still well tested" },
      { label: "The moment it ships, please" }
    ]
  },
  {
    id: "desktop",
    question: "What should the desktop feel like?",
    options: [
      { label: "Familiar \u2014 like Windows or macOS" },
      { label: "A clean default is fine" },
      { label: "I\u2019ll build my own setup" }
    ]
  },
  {
    id: "effort",
    question: "How much effort do you want to put in?",
    options: [
      { label: "It should just work" },
      { label: "Some tweaking is fine" },
      { label: "I enjoy building things from scratch" }
    ]
  },
  {
    id: "terminal",
    question: "How comfortable are you with the terminal?",
    options: [
      { label: "I avoid it \u2014 give me buttons for everything" },
      { label: "I can handle basic commands" },
      { label: "I live in the terminal" }
    ]
  },
  {
    id: "software",
    question: "How do you feel about proprietary drivers and codecs?",
    options: [
      { label: "Just include everything (drivers, codecs, Steam)" },
      { label: "Prefer open-source, pragmatic when needed" },
      { label: "Strictly free software only" }
    ]
  },
  {
    id: "support",
    question: "What kind of help do you want when you get stuck?",
    options: [
      { label: "Huge community + tutorials for everything" },
      { label: "Professional / enterprise backing" },
      { label: "I\u2019ll figure it out myself (docs + DIY)" }
    ]
  },
  {
    id: "priority",
    question: "What matters most to you?",
    options: [
      { label: "Speed & lightness above all" },
      { label: "A beautiful, polished look" },
      { label: "Total control & reproducibility" },
      { label: "Privacy & security hardening" }
    ]
  }
];
export {
  QUIZ_QUESTIONS
};
