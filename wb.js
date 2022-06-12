//https://api.weibo.cn/2/statuses/container_timeline
const url = $request.url;
let body = $response.body;

function filter_timeline_cards(cards) {
    if (cards && cards.length > 0) {
        let j = cards.length;
        while (j--) {
            let item = cards[j];
            if (item.data) {
              if (item.data.timestamp_text && item.data.timestamp_text == '推荐内容') {
                console.log(item.data.timestamp_text, j)
                cards.splice(j, 1);
              }

              if (item.data.mblogtypename && item.data.mblogtypename == '广告') {
                console.log(item.data.mblogtypename, j)
                cards.splice(j, 1);
              }
            }
            
        }
    }
    return cards;
}

let obj = JSON.parse(body);
if (obj.items) obj.items = filter_timeline_cards(obj.items);
body = JSON.stringify(obj);
$done({ body });
