var names = ["🇺🇸USD ↔ 🇯🇵JPY", "🇿🇦ZAR ↔ 🇯🇵JPY"];

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
        },
        didSelect: function(sender, indexPath) {
          var base = rates[symbols[selectedIndex]] || 1.0;
          var number = Number($("input").text);
          $clipboard.text = (
            (number * (rates[symbols[indexPath.row]] || 1.0)) /
            base
          ).toFixed(4);
          $ui.toast($l10n("copied"));
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
    }
  ];
  var lines = rates.split("\n");
  for (let line of lines) {
    var fields = line.split(",");
    if (fields[0] === "USDJPY") {
      ratesData[0]["value-label"].text = `${fields[1]},${fields[2]}`;
    } else if (fields[0] === "ZARJPY") {
      ratesData[1]["value-label"].text = `${fields[1]},${fields[2]}`;
    }
  }

  $("list").data = ratesData;
}

function fetch(pulled) {
  $ui.loading(!pulled);
  $http.get({
    url: "https://info.fcd.japannetbank.co.jp/csv//rate.php?" + Date.now(),
    handler: function(resp) {
      if (resp.response.statusCode >= 300) {
        return;
      }
      $ui.loading(false);
      $("list").endRefreshing();
      rates = resp.data;
      updateList();
    }
  });
}

fetch(false);
