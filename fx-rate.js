var names = ["🇺🇸USD ↔ 🇯🇵JPY", "🇿🇦ZAR ↔ 🇯🇵JPY", '🇯🇵JPY ↔ 🇨🇳CNY', '₿BTC ↔ 🇯🇵JPY'];
var rates = {};

$ui.render({
  props: { title: "" },
  views: [
    {
      type: "list",
      props: {
        bgcolor: $color("lightGray"),
        template: [
          {
            type: "label",
            props: {
              id: "name-label"
            },
            layout: function(make, view) {
              make.left.equalTo(15);
              make.centerY.equalTo(view.super);
            }
          },
          {
            type: "label",
            props: {
              id: "value-label",
              align: $align.center
            },
            layout: function(make, view) {
              make.centerY.equalTo(view.super);
              make.right.inset(15);
            }
          }
        ],
        data: names.map(function(item) {
          return { "name-label": { text: item } };
        })
      },
      layout: function(make) {
        make.top.equalTo(10).offset(10);
        make.left.bottom.right.equalTo(0);
      },
      events: {
        pulled: function() {
          fetch(true);
        }
      }
    }
  ]
});

function updateList() {
  var ratesData = [
    {
      "name-label": { text: names[0] },
      "value-label": {
        text: 0.1
      }
    },
    {
      "name-label": { text: names[1] },
      "value-label": {
        text: 0.1
      }
    },
    {
      "name-label": { text: names[2] },
      "value-label": {
        text: 0.1
      }
    },
    {
      "name-label": { text: names[3] },
      "value-label": {
        text: 0.1
      }
    },
  ];

  let symbols = ['USDJPY', 'ZARJPY', 'JPYCNY', 'BTCJPY'];

  for (let i = 0; i < symbols.length; i++) {
    if (rates[symbols[i]]) {
      let symbolData = rates[symbols[i]];
      ratesData[i]["value-label"].text = symbolData[0] + "," + symbolData[1];
    }
  }

  $("list").data = ratesData;
}

async function fetch(pulled) {
  $ui.loading(!pulled);
  var result = await Promise.all([
    $http.get({
      url: "https://info.fcd.paypay-bank.co.jp/csv/rate.php?" + Date.now()
    }),
    $http.get({
      url: 'https://srh.bankofchina.com/search/whpj/search_cn.jsp?erectDate=&nothing=&pjname=%E6%97%A5%E5%85%83&head=head_620.js&bottom=bottom_591.js&page=1'
    }),
    $http.get({
      url: 'https://api.bitflyer.com/v1/ticker'
    })
  ]);

  if (result[0].response.statusCode < 300) {
    console.log('got result from japannet', result[0].data);
    let fxRates = processCSV(result[0].data);
    rates = Object.assign({}, fxRates);
  }

  if (result[1].response.statusCode < 300) {
    console.log('got response from boc site', result[1].data.len)
    let jpyRates = processBocHTML(result[1].data)
    rates['JPYCNY'] = jpyRates;
  }

  if (result[2].response.statusCode < 300) {
    console.log('got response from bitflyer site', result[2].data.len)
    let btcPrice = result[2].data.ltp
    rates['BTCJPY'] = [btcPrice, ''];
  }

  function getKeyOrDefault(obj, key, defaultValue) {
    let keyComponents = key.split('.');
    let tempObj = obj;
    for (const c of keyComponents) {
      console.log(tempObj, c)
      if (tempObj[c] != undefined) {
        tempObj = tempObj[c];
      } else {
        console.log('key: [%s] not exist', c);
        return defaultValue;
      }
    }
    return tempObj;
  }

  $ui.loading(false);
  $("list").endRefreshing();
  updateList();
}

function processCSV(data) {
  let result = {};
  let lines = data.split("\n");
  for (let line of lines) {
    var fields = line.split(",");
    if (fields[0] === "USDJPY" || fields[0] === "ZARJPY") {
      result[fields[0]] = [fields[1], fields[2]];
    }
  }
  return result;
}

function processBocHTML(data) {
  let doc = $xml.parse({
    string: data,
    mode: 'html'
  });

  let buy = doc.rootElement.firstChild({
    xPath: '//div[@class="BOC_main publish"]/table/tr[2]/td[2]/text()'
  });
  
  let middle = doc.rootElement.firstChild({
    xPath: '//div[@class="BOC_main publish"]/table/tr[2]/td[6]/text()'
  });

  let result = [0, 0]

  if (buy && buy.string) {
    result[0] = buy.string.trim();
  }
  if (middle && middle.string) {
    result[1] = middle.string.trim();
  }

  return result;
}

fetch(false).then(
  () => console.log('done'),
  e => console.error(e)
);
