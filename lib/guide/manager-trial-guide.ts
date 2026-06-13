export const copilotExamples = [
  "Hej! Vi är 10 personer som vill spela biljard på fredag kväll och kanske äta något också. Vad finns det för tider?",
  "Vi är ett företag på cirka 35 personer som vill boka en aktivitet med mat i december. Kan ni hjälpa oss?",
  "Kan jag boka biljard för två personer imorgon kl 19?"
];

export const guideSections = [
  {
    title: "Vad är VenuePilot?",
    body: [
      "VenuePilot är ett verktyg för restauranger, biljardhallar och eventlokaler som vill förstå bokningar bättre.",
      "Det hjälper dig att se trender, planera lugna och intensiva dagar, ta fram förslag till personalplanering och skriva utkast till svar på kundförfrågningar."
    ]
  },
  {
    title: "AI hjälper personalen",
    body: [
      "VenuePilot är en AI-assistent, inte en ersättning för personal.",
      "Alla svar till gäster är utkast. Personal ska läsa, ändra och godkänna innan något används mot kund.",
      "AI ska inte bekräfta en bokning själv. Kontrollera alltid tillgänglighet, tider, priser och regler innan du svarar en gäst."
    ]
  },
  {
    title: "1. Ladda upp bokningsdata",
    body: [
      "Gå till Data.",
      "Ladda upp en Caspeco-export för bokningar per datum eller bokningar per veckodag.",
      "Titta på förhandsvisningen. Om filen ser rätt ut, spara importen.",
      "Importerad data sparas i databasen och används sedan i dashboard, prognos och briefing."
    ]
  },
  {
    title: "2. Kontrollera dashboard",
    body: [
      "Gå till Dashboard efter importen.",
      "Titta på gäster, bokningar, tillväxt och genomsnittlig gruppstorlek.",
      "Jämför månader, veckodagar, de mest bokade dagarna och de lugnaste dagarna.",
      "Fundera på om siffrorna stämmer med din känsla från verksamheten."
    ]
  },
  {
    title: "3. Använd prognosen",
    body: [
      "Gå till Forecast.",
      "Välj 7, 14 eller 30 dagar.",
      "Titta efter dagar som är markerade som lugna, normala, busy eller peak.",
      "Använd rekommendationerna som stöd för bemanning, kampanjer och paket. De är beslutsstöd, inte automatiska beslut."
    ]
  },
  {
    title: "4. Generera en briefing",
    body: [
      "Gå till Briefing.",
      "Klicka på Generate weekly briefing.",
      "Läs sammanfattningen för kommande vecka.",
      "Briefingen ska hjälpa dig att se vilka dagar som behöver extra fokus, vilka dagar som kan passa för kampanj och vilka risker som bör följas upp."
    ]
  },
  {
    title: "5. Testa copilot",
    body: [
      "Gå till Copilot.",
      "Klistra in en kundförfrågan och klicka på Analyze and draft.",
      "Kontrollera vad VenuePilot hittar: datum, tid, antal personer, aktivitet, matintresse, risknivå och om mänsklig granskning krävs.",
      "Det föreslagna svaret är bara ett utkast. Personal måste granska och godkänna innan det används."
    ]
  },
  {
    title: "6. Granska AI-utkast",
    body: [
      "Gå till Approvals.",
      "Öppna ett väntande utkast.",
      "Läs intern sammanfattning och föreslaget kundsvar.",
      "Ändra texten vid behov och välj approve, reject, needs follow-up eller handled manually.",
      "I den här versionen skickas inga riktiga mejl, SMS eller meddelanden."
    ]
  },
  {
    title: "Feedback efter test",
    body: [
      "Berätta vilka siffror som känns mest användbara i dashboarden.",
      "Berätta om prognosen känns rimlig för era lugna och intensiva dagar.",
      "Säg om briefingens rekommendationer är praktiska för en manager.",
      "Testa copilot med riktiga typer av frågor ni brukar få och berätta om utkasten låter som er ton.",
      "Notera om något saknas: regler, paket, öppettider, deposition, större grupper eller event."
    ]
  }
];

export function buildGuideCopyText(): string {
  return [
    "VenuePilot Manager Trial Guide",
    "",
    ...guideSections.flatMap((section) => [
      section.title,
      ...section.body.map((item) => `- ${item}`),
      ""
    ]),
    "Exempel att testa i Copilot",
    ...copilotExamples.map((example, index) => `${index + 1}. ${example}`),
    ""
  ].join("\n");
}
