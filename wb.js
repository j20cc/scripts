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
            if (item.close_button) {
              if (item.close_button.text == '广告') {
                cards.splice(j, 1);
              }
            }
            if (item.actionlog) {
              if (item.actionlog.source == 'ad') {
                cards.splice(j, 1);
              }
            }
        }
    }
    return cards;
}

function filter_profile_ads(items) {
    if (items.length > 0) {
        let j = items.length;
        while (j--) {
            let item = items[j];
            if (item.data && item.data.content_auth_info_dark) {
              if (item.data.content_auth_info_dark.content_auth_title == '广告') {
                items.splice(j, 1);
              }
            }
        }
    }
    return items;
}

function filter_comment_ads(items) {
    if (items.length > 0) {
        let j = items.length;
        while (j--) {
            let item = items[j];
            if (item.data && item.data.mblogtypename && item.data.mblogtypename == '广告') {
              items.splice(j, 1);
            }
        }
    }
    return items;
}

let obj = JSON.parse(body);
if (obj.items && url.includes('container_timeline')) obj.items = filter_timeline_cards(obj.items);
if (obj.head_cards && url.includes('extend')) obj.head_cards = filter_head_cards(obj.head_cards);
if (obj.items && url.includes('profile/container_timeline')) obj.items = filter_profile_ads(obj.items);
if (obj.datas && url.includes('comments')) obj.datas = filter_comment_ads(obj.datas);
body = JSON.stringify(obj);
$done({ body });
