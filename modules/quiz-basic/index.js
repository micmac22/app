// modules/quiz-basic/index.js

/* ==== DANE REGIONÓW (Twoje) ==== */
const DEFAULT_REGION1 = [
  {"name":"Białobrzegi","code":"BIB"},{"name":"Bór","code":"BOR"},{"name":"Browar Belgia","code":"KB1"},
  {"name":"Busko Wełecz","code":"BUS"},{"name":"Busko Zdrój","code":"BUZ"},{"name":"Cegielnia Olesnica","code":"CO1"},
  {"name":"Chemar","code":"KIA"},{"name":"Chmielnik","code":"CMI"},{"name":"Chronówek","code":"CHR"},
  {"name":"Dobieszyn","code":"DBN"},{"name":"Drzewica","code":"DRZ"},{"name":"Działoszyce","code":"DZI"},
  {"name":"Ferrero","code":"FER"},{"name":"Gołębiów","code":"RGO"},{"name":"Grójec","code":"GJC"},
  {"name":"Grójec 2","code":"GJ2"},{"name":"Grzybów","code":"CS2"},{"name":"Huta Ostrowiec","code":"HOS"},
  {"name":"Iłża","code":"IZA"},{"name":"Iłża 2","code":"IZ2"},{"name":"Jedlińsk","code":"JDS"},
  {"name":"Jędrzejów 1","code":"JDJ"},{"name":"Jędrzejów 2","code":"JDD"},{"name":"Karczówka","code":"KIK"},
  {"name":"Kazimierza Wielka","code":"KWL"},{"name":"Kielce EC","code":"KEC"},
  {"name":"Kielce Południe","code":"KPD"},{"name":"Kielce Północ","code":"KIP"},{"name":"Kielce Wschód","code":"KWS"},
  {"name":"Kije","code":"KJE"},{"name":"Końskie Polmo","code":"KSP"},{"name":"Końskie Stary Młyn","code":"KSE"},
  {"name":"Końskie Zachód","code":"KSZ"},{"name":"Kozienice","code":"KOZ"},{"name":"Kozienice Miasto","code":"KZM"},
  {"name":"Kunów","code":"KNW"},{"name":"KZWM","code":"KIZ"},{"name":"Lipsko","code":"LPS"},
  {"name":"Małogoszcz","code":"MLG"},{"name":"Michalczew","code":"MIC"},{"name":"Miechów","code":"MCH"},
  {"name":"Mogielnica","code":"MGL"},{"name":"Morawica","code":"MRW"},{"name":"Niewachlów","code":"KIN"},
  {"name":"Nowa Słupia","code":"NSP"},{"name":"Oleszno","code":"OLZ"},{"name":"Ostrowiec","code":"OSC"},
  {"name":"Ostrowiec 1","code":"OSW"},{"name":"Ostrowiec GPZ2","code":"OSG"},{"name":"Ostrowiec GPZ3","code":"OST"},
  {"name":"Piaski","code":"KPK"},{"name":"Pińczów","code":"PN2"},{"name":"Pińczów 1","code":"PIN"},
  {"name":"Pionki","code":"PIO"},{"name":"Podemłynek","code":"PDN"},{"name":"Potkanów","code":"RPK"},{"name":"Radom Potkanów","code":"RPK"},
  {"name":"Promnik","code":"PRM"},{"name":"Pronit","code":"PKI"},{"name":"Przysucha","code":"PSA"},
  {"name":"Radkowice","code":"RAD"},{"name":"Radom Centralna","code":"RAC"},{"name":"Radom PDN","code":"RPD"},
  {"name":"Radom Północ","code":"RPN"},{"name":"Radom Zamłynie","code":"RAZ"},{"name":"Radzice","code":"RDC"},
  {"name":"Rożki","code":"ROZ"},{"name":"Sędziszów","code":"SDS"},{"name":"Skarżysko Południe","code":"SPD"},
  {"name":"Skarżysko Północ","code":"SPL"},{"name":"Starachowice","code":"STC"},
  {"name":"Starachowice Północ","code":"STP"},{"name":"Stawiany","code":"SAW"},{"name":"Stąporków","code":"SPK"},
  {"name":"Stopnica","code":"STN"},{"name":"Suchedniów","code":"SUW"},{"name":"Swierże","code":"SRZ"},
  {"name":"Szerzawy","code":"SZE"},{"name":"Szydłowiec","code":"SDC"},{"name":"Warka","code":"WAR"},
  {"name":"Włoszczowa","code":"WSW"},{"name":"Wolica","code":"WLI"},{"name":"Występa","code":"WSP"},
  {"name":"ZM1","code":"ZM1"},{"name":"ZM2","code":"ZM2"},{"name":"Zwoleń","code":"ZWO"}
];
const DEFAULT_REGION2 = [
  {"name":"Abramowice","code":"ABR"},{"name":"Bełżyce","code":"BEZ"},
  {"name":"Biała Podlaska Sitnicka","code":"BPS"},{"name":"Biała Podlaska Wola","code":"BPW"},
  {"name":"Biskupice","code":"BCE"},{"name":"Bogdanka","code":"BGD"},{"name":"Bronowice","code":"BRO"},
  {"name":"Budzyń","code":"BUD"},{"name":"Bursaki","code":"BUR"},{"name":"Bychawa","code":"BYH"},
  {"name":"Chruślina","code":"CHL"},{"name":"Dęblin","code":"DBL"},{"name":"Garbów","code":"GRB"},
  {"name":"Hołowczyce","code":"HWC"},{"name":"Huszlew","code":"HSL"},{"name":"Janów Podlaski","code":"JPD"},
  {"name":"Kazimierz","code":"KAZ"},{"name":"Klementowice","code":"KMT"},{"name":"Kock","code":"KCK"},
  {"name":"Kraśnik Fabryka Łożysk 1","code":"KF1"},{"name":"Kraśnik Fabryka Łożysk 2","code":"KF2"},
  {"name":"Lubartów","code":"LBT"},{"name":"Lublin Czechów","code":"LUC"},{"name":"Lublin Czuby","code":"LCB"},
  {"name":"Lublin Dziesiąta","code":"LUX"},{"name":"Lublin Elektrownia","code":"LUE"},{"name":"Lublin EC2","code":"LEC"},
  {"name":"Lublin Felin","code":"LUF"},{"name":"Lublin FSC1","code":"LF1"},{"name":"Lublin FSC2","code":"LF2"},
  {"name":"Lublin Hajdów","code":"LHA"},{"name":"Lublin Odlewnia","code":"LUO"},{"name":"Lublin Północ","code":"LPN"},
  {"name":"Lublin Systemowa","code":"LSY"},{"name":"Lublin Śródmieście","code":"LUS"},{"name":"Lublin UMCS","code":"LUN"},
  {"name":"Lublin Wschód","code":"LWS"},{"name":"Lublin Wrotków","code":"WTW"},{"name":"Łęczna","code":"LCA"},
  {"name":"Łosice","code":"LSC"},{"name":"Międzyrzec","code":"MDC"},{"name":"Nadrybie","code":"NRB"},
  {"name":"Nałęczów","code":"NAL"},{"name":"Opole Lubelskie","code":"OLE"},{"name":"Ostrów Lubelski","code":"OSL"},
  {"name":"Parczew","code":"PAR"},{"name":"Piszczac","code":"PSC"},{"name":"Poniatowa","code":"PNT"},
  {"name":"Poniatowa EDA","code":"PNE"},{"name":"Puławy Kępa","code":"PLK"},{"name":"Puławy Rudy","code":"PLW"},
  {"name":"Radzyń","code":"RAN"},{"name":"Ryki","code":"RYK"},{"name":"Stefanow","code":"STE"},
  {"name":"Świdnik","code":"SDK"},{"name":"Świdnik WSK","code":"SD2"},{"name":"Wilkołaz","code":"WLK"},
  {"name":"Wisznice","code":"WCE"},{"name":"Wólka Dobryńska","code":"WDO"},
  {"name":"Podstacja Trakcyjna PKP Niedrzwica","code":"TND"},
  {"name":"Podstacja Trakcyjna PKP Pułankowice","code":"TPU"},
  {"name":"Podstacja Trakcyjna PKP Wólka Profecka","code":"TWP"},
  {"name":"Podstacja Trakcyjna PKP Motycz","code":"TMO"},
  {"name":"PKP Motycz","code":"TMO"},
  {"name":"Podstacja Trakcyjna PKP Małaszewice","code":"TMA"},
  {"name":"Farma Wiatrowa Lubartów (Rudzienko)","code":"RDZ"},
  {"name":"Farma Wiatrowa Wisznice","code":"FWC"},
  {"name":"Farma Wiatrowa Wólka Dobryńska","code":"FWD"},
  {"name":"Farma Wiatrowa Juniewicze","code":"FJN"},
  {"name":"Farma Wiatrowa Kraśnik","code":"FKR"}
];

/* ==== POMOCNICZE ==== */
const norm = s => s.toString().trim().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ');
const stripSpaces = s => norm(s).replace(/\s+/g,'');
const sortChars = s => stripSpaces(s).toUpperCase().split('').sort().join('');
const shuffle = arr => { const c=[...arr]; for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [c[i],c[j]]=[c[j],c[i]];} return c; };
const sample = (arr,k) => shuffle(arr).slice(0, Math.min(k, arr.length));
const unique = arr => Array.from(new Set(arr.filter(v=>v!==undefined && v!==null)));

const COMMON_WORDS = new Set(['podstacja','trakcyjna','pkp','kolej','trakcja','pt']);
const tokenize = s => norm(s).split(/[^a-z0-9]+/g).filter(Boolean);
const sigTokens = tokens => tokens.filter(t => !COMMON_WORDS.has(t) && t.length>1);

function damerauLevenshtein(a,b){
  a = norm(a); b=norm(b); const m=a.length,n=b.length;
  if(!m) return n; if(!n) return m;
  const dp = Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=0;i<=m;i++) dp[i][0]=i;
  for(let j=0;j<=n;j++) dp[0][j]=j;
  for(let i=1;i<=m;i++){
    for(let j=1;j<=n;j++){
      const cost = a[i-1]===b[j-1]?0:1;
      dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost);
      if(i>1 && j>1 && a[i-1]===b[j-2] && a[i-2]===b[j-1]){
        dp[i][j] = Math.min(dp[i][j], dp[i-2][j-2]+1);
      }
    }
  }
  return dp[m][n];
}
const dl = (a,b) => damerauLevenshtein(a,b);

function isCodeMatch(input, correct){
  const a = stripSpaces(input).toUpperCase();
  const b = stripSpaces(correct).toUpperCase();
  if(!a) return false;
  if(a===b) return true;
  if(a.length===b.length && sortChars(a)===sortChars(b)) return true;
  return damerauLevenshtein(a,b) <= 1;
}
function isNameMatch(input, correct){
  const A=norm(input), B=norm(correct);
  if(!A) return false;
  if(A===B) return true;
  const AT = sigTokens(tokenize(input));
  const BT = sigTokens(tokenize(correct));
  if(BT.length>0 && BT.every(t=>AT.includes(t))) return true;
  if(BT.length===1){
    const aTok=AT.join(' '), bTok=BT.join(' ');
