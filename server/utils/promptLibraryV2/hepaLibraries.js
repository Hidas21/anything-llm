const { PromptLibraryV2 } = require("../../models/promptLibraryV2");

const HEPA_PROMPT_LIBRARY_V2_TEMPLATES = [
  {
    name: "HEPA Export Piaci Lehetoseg Elemzes",
    description:
      "Exportpiaci lehetosegek gyors, vezetoi szintu ertekelese orszag- es szektorpriorizalashoz.",
    enabled: true,
    template: `Te a HEPA senior piac- es exportelemzoje vagy. Keszits magyar nyelvu, dontestamogato exportpiaci lehetosegelemzest az alabbi adatok alapjan.

Celorszag: {{celorszag}}
Szektor: {{szektor}}
Termek vagy szolgaltatas: {{termek_szolgaltatas}}
Cel vevoi szegmens: {{vevoi_szegmens}}
Elemzesi fokusz: {{elemzesi_fokusz}}
Idotav: {{idosik}}

Elvart kimenet:
1. Vezetoi osszefoglalo
2. Keresleti es trendkep
3. Belepesi korlatok es kockazatok
4. Versenyhelyzet roviden
5. Piacra lepesi ajanlas 3 priorizalt lepessel
6. Milyen tovabbi adatokat erdemes a HEPA-nak begyujtenie

Ha valamely allitas feltetelezesre epul, azt kulon jelold.`,
    questions: [
      {
        variable: "celorszag",
        label: "Celorszag",
        type: "text",
        placeholder: "pl. Egyesult Arab Emiratusok",
        required: true,
      },
      {
        variable: "szektor",
        label: "Szektor",
        type: "text",
        placeholder: "pl. elelmiszeripar, medtech, digitalis megoldasok",
        required: true,
      },
      {
        variable: "termek_szolgaltatas",
        label: "Termek vagy szolgaltatas rovid leirasa",
        type: "textarea",
        placeholder: "Mit kinal a magyar exportor, milyen fo elonyokkel?",
        required: true,
      },
      {
        variable: "vevoi_szegmens",
        label: "Cel vevoi szegmens",
        type: "text",
        placeholder: "pl. disztributorok, kkv-k, allami beszerzok",
        required: true,
      },
      {
        variable: "elemzesi_fokusz",
        label: "Elemzesi fokusz",
        type: "multiselect",
        options: [
          "Piacmeret",
          "Keresleti trendek",
          "Versenytarsak",
          "Arszint",
          "Szabalyozas",
          "Belepesi korlatok",
        ],
        required: true,
      },
      {
        variable: "idosik",
        label: "Idotav",
        type: "select",
        options: ["0-6 honap", "6-12 honap", "1-3 ev"],
        required: true,
      },
    ],
  },
  {
    name: "HEPA Buyer Persona es Export Uzenetalkotas",
    description:
      "Buyer persona, uzenethierarchia es ertekajanlat kialakitasa nemzetkozi marketinghez.",
    enabled: true,
    template: `Te a HEPA exportmarketing tanacsadoja vagy. Keszits magyar nyelvu buyer persona- es uzenetalkotasi vazlatot az alabbi inputok alapjan.

Ideal vevo: {{ideal_vevo}}
Dontesi szerepkor: {{dontesi_szerepkor}}
Fo fajdalompontok: {{fajdalompontok}}
Magyar ajanlat / ertekajanlat: {{ertekajanlat}}
Prioritas kommunikacios csatornak: {{csatornak}}
Kivant hangnem: {{hangnem}}

Elvart kimenet:
1. Persona rovid profil
2. 3 legfontosabb problema es motivacio
3. Fo uzenet es 3 ala tamaszto bizonyitek
4. Varhato ellenvetesek es kezelesuk
5. 3 CTA-javaslat
6. Rogtont hasznalhato LinkedIn / email / landing page uzenetvariansok`,
    questions: [
      {
        variable: "ideal_vevo",
        label: "Ideal vevo vagy szervezettipus",
        type: "text",
        placeholder: "pl. importor, nagykereskedo, gyarto vallalat",
        required: true,
      },
      {
        variable: "dontesi_szerepkor",
        label: "Fo dontesi szerepkor",
        type: "select",
        options: [
          "CEO / tulajdonos",
          "Beszerzo",
          "Kereskedelmi vezeto",
          "Marketing vezeto",
          "Termekfejlesztesi vezeto",
        ],
        required: true,
      },
      {
        variable: "fajdalompontok",
        label: "Fo fajdalompontok",
        type: "textarea",
        placeholder: "Milyen uzleti problemakat akar megoldani a celcsoport?",
        required: true,
      },
      {
        variable: "ertekajanlat",
        label: "Magyar ajanlat / ertekajanlat",
        type: "textarea",
        placeholder: "Miben eros a magyar megoldas es mi kulonbozteti meg?",
        required: true,
      },
      {
        variable: "csatornak",
        label: "Prioritas kommunikacios csatornak",
        type: "multiselect",
        options: [
          "LinkedIn",
          "Email",
          "Szakmai sajto",
          "Weboldal / landing page",
          "Trade fair",
          "Partnerhalozat",
        ],
        required: true,
      },
      {
        variable: "hangnem",
        label: "Kivant hangnem",
        type: "select",
        options: ["Szakmai", "Bizalomepito", "Magabiztos", "Konzultativ"],
        required: true,
      },
    ],
  },
  {
    name: "HEPA Nemzetkozi Kampanyterv",
    description:
      "Nemzetkozi B2B exportkampany terve csatorna-, budget- es KPI-javaslatokkal.",
    enabled: true,
    template: `Te a HEPA nemzetkozi marketing strategaja vagy. Keszits magyar nyelvu kampanytervet az alabbi brief alapjan.

Kampanycel: {{kampanycel}}
Prioritas piacok: {{prioritas_piacok}}
Fo ajanlat: {{fo_ajanlat}}
Koltesi keret (EUR): {{koltsegkeret_eur}}
Kampany idotav: {{kampany_idotav}}
Prioritas KPI-k: {{kpi_prioritasok}}
Nemzetkozi esemeny fokusz: {{esemeny_tipus}}

Elvart kimenet:
1. Kampanystrategia osszefoglalasa
2. Csatornamix es uzenetlogika
3. Javasolt 30-60-90 napos akcioterv
4. Koltsegkeret felosztasa csatornankent
5. Tartalomötletek es aktivaciok
6. KPI-meres es optimalizalasi ritmus`,
    questions: [
      {
        variable: "kampanycel",
        label: "Kampanycel",
        type: "textarea",
        placeholder: "pl. lead generalas, partnerkereses, orszagismeret noveles",
        required: true,
      },
      {
        variable: "prioritas_piacok",
        label: "Prioritas piacok",
        type: "textarea",
        placeholder: "Sorold fel az orszagokat vagy regio(ka)t.",
        required: true,
      },
      {
        variable: "fo_ajanlat",
        label: "Fo ajanlat vagy tema",
        type: "textarea",
        placeholder: "Mi a kampany kozepponti ajanlata?",
        required: true,
      },
      {
        variable: "koltsegkeret_eur",
        label: "Koltesi keret (EUR)",
        type: "number",
        placeholder: "pl. 15000",
        required: true,
      },
      {
        variable: "kampany_idotav",
        label: "Kampany idotav",
        type: "select",
        options: ["4 het", "8 het", "12 het", "6 honap"],
        required: true,
      },
      {
        variable: "kpi_prioritasok",
        label: "Prioritas KPI-k",
        type: "multiselect",
        options: [
          "Elteres",
          "Weboldal latogatas",
          "CTR",
          "Leadek szama",
          "MQL",
          "Meetingek szama",
          "CAC / CPL",
        ],
        required: true,
      },
      {
        variable: "trade_fair_focus",
        label: "Legyen benne nemzetkozi esemeny vagy vasar aktivacio?",
        type: "checkbox",
        required: false,
        defaultValue: "false",
      },
      {
        variable: "esemeny_tipus",
        label: "Milyen esemenyjelleggel szamoljunk?",
        type: "select",
        options: ["Kiallitas", "Konferencia", "Uzleti forum", "Roadshow"],
        required: false,
        showIf: { variable: "trade_fair_focus", equals: "true" },
      },
    ],
  },
  {
    name: "HEPA Versenytars es Benchmark Elemzes",
    description:
      "Versenytars-osszehasonlitas, pozicionalasi res es strategiai ajanlas exportpiacokra.",
    enabled: true,
    template: `Te a HEPA versenypiaci elemzoje vagy. Keszits strukturalt benchmark elemzest a kovetkezo inputok alapjan.

Celpiac: {{celpiac}}
Sajat ajanlat: {{sajat_ajanlat}}
Versenytarsak: {{versenytarsak}}
Osszehasonlitasi szempontok: {{osszehasonlitasi_szempontok}}
Strategiai kerdes: {{strategiai_kerdes}}
Elemzes melysege: {{elemzes_melysege}}

Elvart kimenet:
1. Osszefoglalo a piac versenykeperol
2. Osszehasonlito matrix a megadott szempontok menten
3. Sajat erossegek es gyenge pontok
4. Pozicionalasi res / differencialasi lehetosegek
5. 3 strategiai ajanlas a kovetkezo 90 napra`,
    questions: [
      {
        variable: "celpiac",
        label: "Celpiac",
        type: "text",
        placeholder: "pl. DACH regio, Lengyelorszag, GCC",
        required: true,
      },
      {
        variable: "sajat_ajanlat",
        label: "Sajat ajanlat vagy cegprofil",
        type: "textarea",
        placeholder: "Mit kinal a magyar szereplo?",
        required: true,
      },
      {
        variable: "versenytarsak",
        label: "Versenytarsak",
        type: "textarea",
        placeholder: "Sorold fel a fo versenytarsakat, akar orszaggal vagy linkkel egyutt.",
        required: true,
      },
      {
        variable: "osszehasonlitasi_szempontok",
        label: "Osszehasonlitasi szempontok",
        type: "multiselect",
        options: [
          "Ar",
          "Minoseg",
          "Szallitas",
          "Referenciak",
          "Innovacio",
          "Tanusitvanyok",
          "Marketing jelenlet",
        ],
        required: true,
      },
      {
        variable: "strategiai_kerdes",
        label: "Strategiai kerdes",
        type: "textarea",
        placeholder: "Mire keresi a csapat a valaszt?",
        required: true,
      },
      {
        variable: "elemzes_melysege",
        label: "Elemzes melysege",
        type: "select",
        options: ["Gyors attekintes", "Kozepes reszletezettseg", "Melyebb benchmark"],
        required: true,
      },
    ],
  },
  {
    name: "HEPA Havi Export KPI es Funnel Diagnosztika",
    description:
      "Marketing- es leadfunnel teljesitmeny ertekelese, anomaliak es kovetkezo lepesei.",
    enabled: true,
    template: `Te a HEPA marketing es BI elemzoje vagy. Keszits havi teljesitmenydiagnosztikat az alabbi adatok alapjan.

Vizsgalt idoszak: {{vizsgalt_idoszak}}
Erintett csatornak: {{csatornak}}
Fo KPI-adatok: {{fo_kpi_adatok}}
Uzleti cel: {{uzleti_cel}}
Legnagyobb elakadas: {{legnagyobb_elakadas}}
Vezetoi kerdes: {{vezetoi_kerdes}}

Elvart kimenet:
1. 5 mondatos vezetoi osszefoglalo
2. Fobb pozitiv es negativ elteresek
3. Funnel diagnosztika es valoszinusitett okok
4. Mely KPI-k igenyelnek azonnali beavatkozast
5. 3-5 konkret optimalizalasi lepes
6. Milyen tovabbi adatok kellenenek a biztos kovetkezteteshez`,
    questions: [
      {
        variable: "vizsgalt_idoszak",
        label: "Vizsgalt idoszak",
        type: "text",
        placeholder: "pl. 2026 januar",
        required: true,
      },
      {
        variable: "csatornak",
        label: "Erintett csatornak",
        type: "multiselect",
        options: [
          "LinkedIn",
          "Google Ads",
          "Email",
          "Organic search",
          "Trade fair",
          "Partner outreach",
        ],
        required: true,
      },
      {
        variable: "fo_kpi_adatok",
        label: "Fo KPI-adatok",
        type: "textarea",
        placeholder: "pl. impressions, CTR, CPC, leads, MQL, SQL, meeting, conversion rate",
        required: true,
      },
      {
        variable: "uzleti_cel",
        label: "Uzleti cel",
        type: "textarea",
        placeholder: "Mi volt az idoszak fo uzleti celja?",
        required: true,
      },
      {
        variable: "legnagyobb_elakadas",
        label: "Legnagyobb elakadas",
        type: "select",
        options: [
          "Alacsony eleres",
          "Gyenge atklikkeles",
          "Kevés lead",
          "Gyenge leadminoseg",
          "Alacsony meeting arany",
          "Hosszu ertekesitesi ciklus",
        ],
        required: true,
      },
      {
        variable: "vezetoi_kerdes",
        label: "Vezetoi kerdes",
        type: "textarea",
        placeholder: "Mire var rovid, dontestamogato valaszt a vezetes?",
        required: true,
      },
    ],
  },
];

async function upsertLibrary(template, workspaceIds = []) {
  const existing = await PromptLibraryV2.get({ name: template.name });
  const library = existing
    ? await PromptLibraryV2.update(existing.id, template)
    : await PromptLibraryV2.create(template);

  if (!library) return null;

  if (Array.isArray(workspaceIds)) {
    await PromptLibraryV2.setWorkspaceAssignments(
      library.id,
      workspaceIds.map((id) => Number(id))
    );
  }

  return library;
}

async function seedHepaPromptLibrariesV2({ workspaceIds = [] } = {}) {
  const libraries = [];

  for (const template of HEPA_PROMPT_LIBRARY_V2_TEMPLATES) {
    const library = await upsertLibrary(template, workspaceIds);
    if (library) libraries.push(library);
  }

  return libraries;
}

module.exports = {
  HEPA_PROMPT_LIBRARY_V2_TEMPLATES,
  seedHepaPromptLibrariesV2,
};
