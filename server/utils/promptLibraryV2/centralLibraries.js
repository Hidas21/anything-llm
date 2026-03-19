const { PromptLibraryV2 } = require("../../models/promptLibraryV2");

// System prompt for the Central workspace (journalists at 24.hu / Central Mediacsoport)
const CENTRAL_JOURNALIST_SYSTEM_PROMPT = `Te a Central Mediacsoport újságírói asszisztense vagy, aki a 24.hu és a csoport többi kiadványának szerkesztőit és újságíróit támogatja.

Feladatod:
- Segíteni a cikkírásban, szerkesztésben és tartalom-előkészítésben
- Magyar nyelvű, újságírói normáknak megfelelő szövegeket alkotni
- A 24.hu hangnemét és stílusát követni: közérthető, tömör, hiteles
- Az újságírói etikai normákat betartani: pontosság, forrásmegjelölés, kiegyensúlyozottság

Stílusirányelvek:
- Aktív igei szerkezeteket preferálj a passzívval szemben
- Kerüld a felesleges körülírásokat és zsargont
- Az első bekezdés foglalja össze a legfontosabb információt (fordított piramis elv)
- Idézetek esetén jelöld a forrást
- Számokat és adatokat mindig kontextusba helyezve adj meg

Ha az újságíró kérdez, először kérdezz vissza a szükséges részletekre, mielőtt szöveget generálnál.`;

const CENTRAL_PROMPT_LIBRARY_V2_TEMPLATES = [
  {
    name: "Central – Cikkcím-alkotó",
    description:
      "Újságírói cikkekhez vonzó, SEO-barát és közösségi médiára optimalizált főcím-javaslatok generálása.",
    enabled: true,
    template: `Te a 24.hu szerkesztője vagy. Generálj legalább 5 különböző főcím-javaslatot az alábbi cikkhez.

Téma / esemény rövid leírása: {{cikk_tema}}
Legfontosabb üzenet: {{fo_uzenet}}
Célközönség: {{celkozonseg}}
Hangnem: {{hangnem}}
Cikkműfaj: {{mufaj}}
Egyéb szempont: {{egyeb_szempont}}

Elvárások:
1. Legalább 2 db direkt, tényközlő cím (fordított piramis)
2. Legalább 2 db kattintást ösztönző, de nem clickbait cím
3. Legalább 1 db kérdés formájú cím
4. Minden javaslathoz add meg a karakterszámot (ideális: 55–75 karakter)
5. Jelöld, melyik illik legjobban a közösségi médiára

Kerülendő: túlzó jelzők, félrevezető ígéretek, szenzációhajhász hangnem.`,
    questions: [
      {
        variable: "cikk_tema",
        label: "Téma / esemény rövid leírása",
        type: "textarea",
        placeholder: "Miről szól a cikk? Mi történt, ki az érintett, mikor?",
        required: true,
      },
      {
        variable: "fo_uzenet",
        label: "Legfontosabb üzenet (a cikk lényege egy mondatban)",
        type: "textarea",
        placeholder: "pl. Az Országgyűlés megszavazta az új oktatási törvényt.",
        required: true,
      },
      {
        variable: "celkozonseg",
        label: "Célközönség",
        type: "select",
        options: [
          "Általános olvasók (24.hu főoldal)",
          "Politika iránt érdeklődők",
          "Gazdasági témák iránt érdeklődők",
          "Fiatalok (18–35)",
          "Helyi / regionális közönség",
        ],
        required: true,
      },
      {
        variable: "hangnem",
        label: "Hangnem",
        type: "select",
        options: ["Semleges / tényközlő", "Kritikus", "Könnyed", "Sürgős / figyelemfelkeltő"],
        required: true,
      },
      {
        variable: "mufaj",
        label: "Cikkműfaj",
        type: "select",
        options: ["Hír", "Riport", "Interjú", "Elemzés", "Vélemény", "Tudósítás"],
        required: true,
      },
      {
        variable: "egyeb_szempont",
        label: "Egyéb szempont (opcionális)",
        type: "text",
        placeholder: "pl. kerüld az X személynév kiemelését a főcímben",
        required: false,
      },
    ],
  },
  {
    name: "Central – Hírszöveg-írás asszisztens",
    description:
      "Gyors, fordított piramis elvű hírszöveg készítése az újságíró által megadott tényanyag alapján.",
    enabled: true,
    template: `Te a 24.hu újságírója vagy. Írj professzionális hírszöveget az alábbi adatok alapján. Tartsd be a fordított piramis elvét: a legfontosabb információ kerüljön az elejére.

Esemény / téma: {{esemeny}}
Ki érintett: {{szereplok}}
Mi történt pontosan: {{mi_tortent}}
Mikor és hol: {{mikor_hol}}
Miért fontos / mi a következménye: {{jelentoseg}}
Forrás(ok): {{forrasok}}
Terjedelmi igény: {{terjedelem}}
Hangnem: {{hangnem}}

Strukturálj így:
1. Lead (1–2 mondat, tartalmazza az 5W-t: Ki, Mi, Mikor, Hol, Miért)
2. Legfontosabb tények (2–3 bekezdés)
3. Háttér / kontextus
4. Idézet (ha van forrás megadva)
5. Lezárás / következő lépések

Minden faktot a megadott forrásokból vezess le. Ha valamiről nincs elegendő adat, jelöld [ELLENŐRZENDŐ] megjegyzéssel.`,
    questions: [
      {
        variable: "esemeny",
        label: "Esemény / téma rövid összefoglalása",
        type: "textarea",
        placeholder: "Mi a hír lényege?",
        required: true,
      },
      {
        variable: "szereplok",
        label: "Érintett személyek, szervezetek",
        type: "textarea",
        placeholder: "pl. Orbán Viktor miniszterelnök, Magyar Nemzeti Bank, stb.",
        required: true,
      },
      {
        variable: "mi_tortent",
        label: "Mi történt pontosan?",
        type: "textarea",
        placeholder: "Adj meg minden releváns tényt, adatot, döntést.",
        required: true,
      },
      {
        variable: "mikor_hol",
        label: "Mikor és hol történt?",
        type: "text",
        placeholder: "pl. 2026. március 18., Budapest, Parlament",
        required: true,
      },
      {
        variable: "jelentoseg",
        label: "Miért fontos / mi a következménye?",
        type: "textarea",
        placeholder: "Mi a hír tágabb kontextusa, hatása?",
        required: true,
      },
      {
        variable: "forrasok",
        label: "Forrás(ok)",
        type: "textarea",
        placeholder: "pl. MTI, kormány.hu, sajtóközlemény, személyes nyilatkozat",
        required: true,
      },
      {
        variable: "terjedelem",
        label: "Terjedelmi igény",
        type: "select",
        options: ["Rövid hír (300–500 szó)", "Közepes hír (500–800 szó)", "Hosszú hír (800–1200 szó)"],
        required: true,
      },
      {
        variable: "hangnem",
        label: "Hangnem",
        type: "select",
        options: ["Semleges / tényközlő", "Elemző", "Kritikus", "Könnyed"],
        required: true,
      },
    ],
  },
  {
    name: "Central – Interjú-előkészítő",
    description:
      "Strukturált kérdéslista és felkészülési anyag készítése újságírói interjúkhoz.",
    enabled: true,
    template: `Te a 24.hu tapasztalt interjúkészítője vagy. Segíts felkészülni a következő interjúra, és állíts össze professzionális kérdéslistát.

Interjúalany neve és beosztása: {{interjuany_nev}}
Interjú témája / fókusza: {{tema}}
Interjú típusa: {{intervju_tipusa}}
Célközönség: {{celkozonseg}}
Tervezett terjedelem (percben): {{idotartam}}
Háttérinformációk az interjúalanyról: {{hatterinfo}}
Kényes területek / kerülendő kérdések: {{kenyes_teruletek}}

Elvárások:
1. 3–5 nyitó, ráhangolódó kérdés (könnyebb, bizalomépítő)
2. 8–12 fő kérdés (a témához kapcsolódó, nyílt végű)
3. 3–5 mélyítő, kritikus kérdés
4. 2–3 zárókérdés (jövőkép, üzenet az olvasóknak)
5. Minden kérdéshez adj egy rövid magyarázatot, miért fontos feltenni
6. Jelöld, melyek a legfontosabb ("must ask") kérdések`,
    questions: [
      {
        variable: "interjuany_nev",
        label: "Interjúalany neve és beosztása",
        type: "text",
        placeholder: "pl. Kiss Péter, gazdasági miniszter",
        required: true,
      },
      {
        variable: "tema",
        label: "Interjú témája / fókusza",
        type: "textarea",
        placeholder: "Milyen témáról szól az interjú? Mi a legfontosabb kérdés, amit meg akar válaszolni?",
        required: true,
      },
      {
        variable: "intervju_tipusa",
        label: "Interjú típusa",
        type: "select",
        options: [
          "Politikai / közéleti interjú",
          "Üzleti / gazdasági interjú",
          "Kulturális / személyes interjú",
          "Szakértői interjú",
          "Kríziskommunikáció / válaszadás",
        ],
        required: true,
      },
      {
        variable: "celkozonseg",
        label: "Célközönség",
        type: "select",
        options: [
          "Általános olvasók",
          "Szakmai közönség",
          "Politikailag érdeklődők",
          "Fiatalok (18–35)",
          "Üzleti döntéshozók",
        ],
        required: true,
      },
      {
        variable: "idotartam",
        label: "Tervezett időtartam (percben)",
        type: "number",
        placeholder: "pl. 30",
        required: true,
      },
      {
        variable: "hatterinfo",
        label: "Háttérinformációk az interjúalanyról",
        type: "textarea",
        placeholder: "Korábbi nyilatkozatok, aktuális botrányok, eredmények, pozíció stb.",
        required: true,
      },
      {
        variable: "kenyes_teruletek",
        label: "Kényes területek / kerülendő kérdések (opcionális)",
        type: "textarea",
        placeholder: "Ha van jogi vagy szerkesztőségi korlát, ide írd be.",
        required: false,
      },
    ],
  },
  {
    name: "Central – SEO-cikk és közösségi média csomag",
    description:
      "Keresőoptimalizált online cikk, meta-leírás és közösségi média posztok generálása egyszerre.",
    enabled: true,
    template: `Te a 24.hu digitális szerkesztője és SEO-specialistája vagy. Készíts teljes tartalomcsomagot az alábbi cikkhez.

Cikk témája: {{cikk_tema}}
Kulcsszavak: {{kulcsszavak}}
Célközönség kora / érdeklődése: {{celkozonseg}}
Kulcsüzenet: {{kulcsuizenet}}
Hangnem: {{hangnem}}
Terjedelmi igény: {{terjedelem}}

Elvárások:
1. **SEO-optimalizált főcím** (H1, tartalmazza a főkulcsszót, max. 65 karakter)
2. **Lead-bekezdés** (150–160 karakter, main keyword benne, motiválja az olvasást)
3. **Cikkstruktúra** H2/H3 alcímekkel (vázlat formában)
4. **Meta-leírás** (150–160 karakter, keresőbarát)
5. **Facebook-poszt** (max. 250 karakter + emoji ajánlás + 3 hashtag-javaslat)
6. **X/Twitter-poszt** (max. 280 karakter, figyelemfelkeltő, 2 hashtag)
7. **Instagram caption** (engagementre optimalizált, call-to-action, 5 hashtag)
8. **Push-értesítés szövege** (max. 100 karakter, azonnal kattintásra ösztönöz)`,
    questions: [
      {
        variable: "cikk_tema",
        label: "Cikk témája és legfontosabb tényei",
        type: "textarea",
        placeholder: "Röviden foglalja össze a cikk tartalmát.",
        required: true,
      },
      {
        variable: "kulcsszavak",
        label: "Kulcsszavak",
        type: "textarea",
        placeholder: "pl. oktatási reform, pedagógusbér, Magyarország 2026",
        required: true,
      },
      {
        variable: "celkozonseg",
        label: "Célközönség kora / érdeklődése",
        type: "select",
        options: [
          "Általános (18–65)",
          "Fiatalok (18–34)",
          "Középkorúak (35–54)",
          "Idősebb olvasók (55+)",
          "Szakmai / döntéshozói közönség",
        ],
        required: true,
      },
      {
        variable: "kulcsuizenet",
        label: "Kulcsüzenet (egy mondat)",
        type: "textarea",
        placeholder: "A legfontosabb dolog, amit az olvasónak meg kell jegyeznie.",
        required: true,
      },
      {
        variable: "hangnem",
        label: "Hangnem",
        type: "select",
        options: ["Semleges / tényközlő", "Elemző", "Sürgető / figyelemfelkeltő", "Könnyed / szórakoztató"],
        required: true,
      },
      {
        variable: "terjedelem",
        label: "Cikk terjedelme",
        type: "select",
        options: ["Rövid (300–500 szó)", "Közepes (600–900 szó)", "Hosszú (1000–1500 szó)"],
        required: true,
      },
    ],
  },
  {
    name: "Central – Elemzés és háttércikk",
    description:
      "Mélyebb kontextust adó elemzés, háttércikk vagy magyarázó cikk (explainer) készítése összetett témákhoz.",
    enabled: true,
    template: `Te a 24.hu tapasztalt elemzője vagy. Írj strukturált elemzést / háttércikket az alábbi témáról.

Elemzés témája: {{tema}}
Kulcskérdés, amelyre választ keres: {{kulcskerdes}}
Időbeli kontextus: {{idokontextus}}
Érintett szereplők: {{szereplok}}
Rendelkezésre álló adatok / tények: {{adatok_tenyek}}
Az elemzés mélysége: {{melyiseg}}
Célközönség: {{celkozonseg}}

Elvárások:
1. Kontextus és előzmények (Mi vezetett ide?)
2. Jelenlegi helyzet elemzése (Mik a tények? Mi a vélemények alapja?)
3. Érintett szereplők nézőpontjai (legalább 2 különböző oldal)
4. Adatok és trendek értelmezése
5. Lehetséges forgatókönyvek (2–3 szcenárió)
6. Összefoglalás: mi a legvalószínűbb következmény?

Jelöld egyértelműen, mi tény és mi szerkesztői értelmezés. Idézetek esetén tüntesd fel a forrást.`,
    questions: [
      {
        variable: "tema",
        label: "Elemzés témája",
        type: "textarea",
        placeholder: "pl. a forint árfolyamának változása 2026-ban",
        required: true,
      },
      {
        variable: "kulcskerdes",
        label: "Kulcskérdés, amelyre választ keres",
        type: "textarea",
        placeholder: "Mire keres magyarázatot az olvasó?",
        required: true,
      },
      {
        variable: "idokontextus",
        label: "Időbeli kontextus",
        type: "text",
        placeholder: "pl. 2025–2026, az utóbbi 6 hónap, az elmúlt 10 év",
        required: true,
      },
      {
        variable: "szereplok",
        label: "Érintett szereplők",
        type: "textarea",
        placeholder: "Kormány, ellenzék, vállalatok, civil szervezetek, stb.",
        required: true,
      },
      {
        variable: "adatok_tenyek",
        label: "Rendelkezésre álló adatok / tények",
        type: "textarea",
        placeholder: "Illeszd be a felhasználni kívánt adatokat, idézeteket, forrásokat.",
        required: true,
      },
      {
        variable: "melyiseg",
        label: "Az elemzés mélysége",
        type: "select",
        options: [
          "Gyors magyarázó (explainer, 500–700 szó)",
          "Közepes mélységű elemzés (800–1200 szó)",
          "Mélyriport / hosszú olvasmány (1500–2500 szó)",
        ],
        required: true,
      },
      {
        variable: "celkozonseg",
        label: "Célközönség",
        type: "select",
        options: [
          "Általános olvasók",
          "Politikailag érdeklődők",
          "Gazdasági / üzleti közönség",
          "Szakmai / döntéshozói közönség",
        ],
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

async function seedCentralPromptLibrariesV2({ workspaceIds = [] } = {}) {
  const libraries = [];

  for (const template of CENTRAL_PROMPT_LIBRARY_V2_TEMPLATES) {
    const library = await upsertLibrary(template, workspaceIds);
    if (library) libraries.push(library);
  }

  return libraries;
}

module.exports = {
  CENTRAL_JOURNALIST_SYSTEM_PROMPT,
  CENTRAL_PROMPT_LIBRARY_V2_TEMPLATES,
  seedCentralPromptLibrariesV2,
};
