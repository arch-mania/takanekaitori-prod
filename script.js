import fs from 'fs';

// エクスポートされたJSONファイルのパスを指定
const filePath = './exports/contentful-export-c5ll46t87s6s-master-2024-10-25T15-16-28.json';

// JSONファイルの内容を読み込む
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// エントリからnameとidのペアを抽出
const entries = data.entries.map(entry => {
  const nameField = entry.fields.name && entry.fields.name.ja;
  const id = entry.sys.id;
  return { id, name: nameField || '' };
});

// CSV形式に変換
const csvContent = entries.map(entry => `${entry.id},${entry.name}`).join('\n');

// CSVファイルに書き出す
fs.writeFileSync('./exports/name-id-pairs.csv', csvContent);

console.log('CSVファイルが作成されました');