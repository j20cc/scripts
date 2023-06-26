//https://api.weibo.cn/2/statuses/*
const url = $request.url;
let body = $response.body;

function filter_timeline_cards(cards) {
    const gg_words = ['推荐内容', '热推', '广告', '推荐'];
    if (cards && cards.length > 0) {
        let j = cards.length;
        while (j--) {
            let item = cards[j];
            if (item.data) {
              if (item.data.mblogtypename && gg_words.includes(item.data.mblogtypename)) {
                cards.splice(j, 1);
              }
            }
            
        }
    }
    return cards;
}

function filter_head_cards(cards) {
    if (cards.length > 0) {
        let j = cards.length;
        while (j--) {
            let item = cards[j];
            if (item.actionlog) {
              if (item.actionlog.source == 'ad') {
                cards.splice(j, 1);
              }
            }
        }
    }
    return cards;
}

let obj = JSON.parse(body);
if (obj.items && url.includes('container_timeline')) obj.items = filter_timeline_cards(obj.items);
if (obj.head_cards && url.includes('extend')) obj.head_cards = filter_head_cards(obj.head_cards);
body = JSON.stringify(obj);
$done({ body });
