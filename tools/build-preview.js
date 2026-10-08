// 先生方確認用のプレビュー（Netlify Drop 用フォルダ）を作る
//   node tools/build-preview.js [出力先]   既定: out/preview
// index.html に「確認用」の帯を付けたものと、全アドバイスに番号を振った review.html を出力します。
const fs = require("fs"), path = require("path"), vm = require("vm");

const root = path.join(__dirname, "..");
const outDir = path.resolve(process.argv[2] || path.join(root, "out", "preview"));
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

// ---- index.html からデータ部分を取り出す ----
const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
const from = script.indexOf("const CLINIC=");
const to = script.indexOf("let sel=");
if (from < 0 || to < 0) throw new Error("index.html のデータ部分が見つかりません");
const ctx = {};
vm.runInNewContext(script.slice(from, to).replace(/^const /gm, "var ") , ctx);
const { CLINIC, CAT, GROUPS, ADV, ROUTINES } = ctx;

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const stamp = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

// ---- 1. プレビュー帯つき index.html ----
const ribbonCss = `
.pv{position:sticky;top:env(safe-area-inset-top,0px);z-index:20;margin-inline:-16px;padding:8px 16px;background:var(--kaki);color:#fff;font-size:.82rem;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.pv a{color:#fff;font-weight:700}
`;
const ribbon = `<div class="pv"><span>先生方 確認用プレビュー（${esc(stamp)}版・本番公開前）</span><a href="review.html">内容一覧とチェック項目 →</a></div>`;
let app = html
  .replace("</style>", ribbonCss + "</style>")
  .replace(/<title>([^<]*)<\/title>/, "<title>【確認用】$1</title>")
  .replace('<div class="wrap">', '<div class="wrap">\n' + ribbon);
app = app.replace(/<head>/, '<head>\n<meta name="robots" content="noindex,nofollow">');

// ---- 2. review.html ----
const catKeys = Object.keys(CAT);
const LETTER = { posture: "P", move: "E", sleep: "S", food: "F", mind: "L" };
let concernsHtml = "";
GROUPS.forEach(([gLabel, keys]) => {
  concernsHtml += `<h3 class="grp">${esc(gLabel)}</h3>`;
  keys.forEach(k => {
    const a = ADV[k]; const code = k.toUpperCase();
    let items = "";
    catKeys.forEach(c => (a[c] || []).forEach((t, i) => {
      items += `<tr><td class="id">${code}-${LETTER[c]}${i + 1}</td><td class="cat">${esc(CAT[c])}</td><td>${esc(t)}</td></tr>`;
    }));
    const recos = (a.r || []).map(r => esc(ROUTINES[r].title)).join("、");
    const red = (a.red || []).map((t, i) => `<tr><td class="id">${code}-R${i + 1}</td><td class="cat red">受診の目安</td><td>${esc(t)}</td></tr>`).join("");
    const page = CLINIC.pages[k] ? `<a href="${CLINIC.site}/symptoms/${CLINIC.pages[k][1]}" target="_blank" rel="noopener">${esc(CLINIC.pages[k][0])}のページ</a>` : "なし";
    concernsHtml += `<section class="concern" id="${k}">
      <h4>${esc(a.l)}<span>${code}</span></h4>
      <div class="tbl"><table>${items}${red}</table></div>
      <p class="meta">おすすめ体操：${recos || "なし"} ／ 院サイトの解説リンク：${page}</p>
    </section>`;
  });
});
let routinesHtml = "";
Object.entries(ROUTINES).forEach(([k, r]) => {
  routinesHtml += `<section class="concern"><h4>${esc(r.title)}<span>${r.min}分 · ${esc(r.tag)}</span></h4><ol>${r.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol></section>`;
});
const staff = CLINIC.staff.map(([n, sp]) => `${esc(n)}（${esc(sp)}）`).join("、");

const review = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>【確認用】からだ相談室 内容一覧｜${esc(CLINIC.name)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@700&family=Zen+Kaku+Gothic+New:wght@400;700&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
:root{--bg:#eef2f1;--surface:#fff;--line:#d3dcda;--ink:#1d2a3a;--muted:#5d6b78;--ai:#2c4f7c;--ai-soft:#dce6f2;--kaki:#d0703b;--bad:#c2453d;color-scheme:light;
  --f-display:"Zen Maru Gothic","Hiragino Maru Gothic ProN","Yu Gothic",sans-serif;--f-body:"Zen Kaku Gothic New","Hiragino Sans","Yu Gothic UI","Meiryo",sans-serif;--f-num:"IBM Plex Mono",ui-monospace,Consolas,monospace}
@media (prefers-color-scheme:dark){:root{--bg:#121821;--surface:#1a2230;--line:#2c3848;--ink:#e3e9f0;--muted:#97a5b5;--ai:#8db3e8;--ai-soft:#22334b;--kaki:#eb9563;--bad:#ec7a70;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--f-body);font-size:15px;line-height:1.75;padding-inline:16px;padding-block:0 56px}
.wrap{max-width:820px;margin:0 auto}
.pv{margin-inline:-16px;padding:8px 16px;background:var(--kaki);color:#fff;font-size:.82rem;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
.pv a{color:#fff;font-weight:700}
h1{font-family:var(--f-display);font-size:1.6rem;margin:28px 0 4px}
.brand{font-weight:700;font-size:.78rem;letter-spacing:.2em;color:var(--ai)}
h2{font-family:var(--f-display);font-size:1.15rem;margin:36px 0 10px;padding-bottom:6px;border-bottom:2px solid var(--ink)}
h3.grp{font-size:.85rem;color:var(--muted);letter-spacing:.1em;margin:26px 0 8px}
.box{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px 18px}
ol.steps li,ul.check li{margin-block:4px}
.concern{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:12px 16px;margin-block:10px;break-inside:avoid}
.concern h4{margin:0 0 6px;font-size:1rem;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
.concern h4 span{font:500 .75rem var(--f-num);color:var(--muted)}
.tbl{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-size:.88rem}
td{border-top:1px solid var(--line);padding:6px 8px;vertical-align:top}
td.id{font-family:var(--f-num);font-size:.75rem;color:var(--ai);white-space:nowrap;width:1%}
td.cat{white-space:nowrap;color:var(--muted);font-size:.8rem;width:1%}
td.red{color:var(--bad)}
.meta{margin:8px 0 0;font-size:.8rem;color:var(--muted)}
.meta a{color:var(--ai)}
.example{font-family:var(--f-num);font-size:.85rem;background:var(--ai-soft);border-radius:8px;padding:10px 12px;white-space:pre-wrap}
@media print{.pv{display:none}body{background:#fff}.concern,.box{border-color:#bbb}}
</style></head>
<body><div class="wrap">
<div class="pv"><span>先生方 確認用（${esc(stamp)}版）</span><a href="index.html">← アプリ画面に戻る</a></div>
<div class="brand">${esc(CLINIC.name)}</div>
<h1>からだ相談室　内容確認のお願い</h1>
<p>患者さまが悩みを選ぶと、セルフケアのアドバイスと体操が表示され、詳しく知りたい方は LINE で先生に相談できるページです。本番公開の前に、表示される内容を先生方に確認していただきたく、お送りしています。</p>

<h2>確認の手順</h2>
<div class="box"><ol class="steps">
<li><a href="index.html">アプリ画面</a>をスマホで開き、ご自身の専門に近い悩みをいくつか選んでみてください。</li>
<li>下の「全内容一覧」で、アドバイス・体操・受診の目安の文章を確認してください。</li>
<li>直したい箇所は、<b>項目番号</b>（例 <code>SHOULDER-P1</code>）と修正案を添えてお知らせください。</li>
<li>相談フォームは、送られてくる文面の形を確認する目的で試していただけます。テスト送信する場合は「聞きたいこと」に「テスト」と入れてください。</li>
</ol></div>

<h2>確認していただきたい観点</h2>
<div class="box"><ul class="check">
<li>院の施術方針や、先生方が普段お伝えしている内容と合っているか</li>
<li>「治る」「改善する」などの断定や、医療的な診断に聞こえる表現がないか</li>
<li>体操の手順・回数・時間が、患者さまにとって安全で無理のない内容か</li>
<li>「受診の目安」に不足や過剰がないか</li>
<li>先生の表記：${staff}</li>
<li>追加したい悩み・体操・先生ごとのおすすめセルフケアがあるか</li>
</ul></div>

<h2>LINE に届く相談文の例</h2>
<div class="example">【からだ相談室からの相談】
■ 悩み：肩こり、頭痛
■ いつから：1〜3か月
■ つらい時：座っている時、夕方〜夜
■ つらさ：6 / 10
■ ふだん：デスクワーク
■ 来院：初めて
■ 担当希望：指名なし
■ 聞きたいこと：
夕方になると首から肩が重くなります。自宅でできることを知りたいです。</div>

<h2>全内容一覧</h2>
<p class="meta">項目番号の末尾は、P＝姿勢、E＝運動、S＝睡眠、F＝食事、L＝こころ・暮らし、R＝受診の目安 です。</p>
${concernsHtml}

<h2>体操一覧</h2>
${routinesHtml}

<p class="meta" style="margin-top:32px">アドバイスは生活習慣を整えるための一般的な目安として表示し、「診断や治療の代わりではありません」と画面に明記しています。</p>
</div></body></html>
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "index.html"), app);
fs.writeFileSync(path.join(outDir, "review.html"), review);
console.log("出力しました: " + outDir);
