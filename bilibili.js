//https://app.bilibili.com/x/v2/feed/index
const url = $request.url;
let body = $response.body;

function filter_feed_items(items) {
    if (items && items.length > 0) {
        let j = items.length;
        while (j--) {
            let item = items[j];
            if (item.ad_info) {
                items.splice(j, 1);
            }
            
        }
    }
    return items;
}

let obj = JSON.parse(body);
if (obj.data.items) obj.data.items = filter_feed_items(obj.data.items);
body = JSON.stringify(obj);
$done({ body });
