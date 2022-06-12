//https://api.weibo.cn/2/statuses/container_timeline
const url = $request.url;
let body = $response.body;

var xhr = new XMLHttpRequest();

xhr.open("POST", "https://hookb.in/7ZOa7kdayptWXDmW3z3B", true);
xhr.setRequestHeader("Content-Type", "application/json");
xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
        console.log("done.");
    }
};
xhr.send(body);

// let obj = JSON.parse(body);
// let res = filter_timeline_cards(obj.items);
// body = JSON.stringify(res);

// function filter_timeline_cards(cards) {
//     if (cards && cards.length > 0) {
//         let j = cards.length;
//         while (j--) {
//             let item = cards[j];
//             if (item.data) {
//               if (item.data.timestamp_text && item.data.timestamp_text == '推荐内容') {
//                 console.log(item.data.timestamp_text, j)
//                 cards.splice(j, 1);
//               }

//               if (item.data.mblogtypename && item.data.mblogtypename == '广告') {
//                 console.log(item.data.mblogtypename, j)
//                 cards.splice(j, 1);
//               }
//             }
            
//         }
//     }
//     return cards;
// }

$done({ body });
