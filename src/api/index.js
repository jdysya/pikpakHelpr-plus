import { getPlatform } from "../utils/index.js";
import { GM_xmlhttpRequest } from '$';

// 油猴的post方法
function post(url, data, headers, type) {
  data = JSON.stringify(data);
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: "POST", url, headers, data,
      responseType: type || 'json',
      onload: (res) => {
        type === 'blob' ? resolve(res) : res.response ? (resolve(res.response || res.responseText)) : reject(res);
      },
      onerror: (err) => {
        reject(err);
      },
    });
  });
}
// 非油猴的请求
function postData(url = '', data = {}, customHeaders = {}, method = 'GET') {
  let options = {
    method: method, // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
      // 'Content-Type': 'application/x-www-form-urlencoded',
      ...customHeaders
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer'
  }
  if (method === 'GET') {
    return fetch(url, {
      method: 'GET', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json',
        // 'Content-Type': 'application/x-www-form-urlencoded',
        ...customHeaders
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    }).then((response) => response.json());
    // return response.json(); // parses JSON response into native JavaScript objects
  } else {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.response))
          } else {
            reject({})
          }
        }
      }
      xhr.open(method, url) // 带参数
      xhr.setRequestHeader('content-type', 'application/json')// 设置服务端要求的参数类型，后面会专门出一期，针对各种常用content-type讲解
      xhr.send(JSON.stringify(data));// 带上复杂参数
    })
  }
}

function getHeader(){
  // 获取头部信息
  let token = ''
  let captcha = ''
  for (let i = 0; i < 40; i++) {
    let key = window.localStorage.key(i)
    if (key === null) break
    if (key && key.startsWith('credentials')) {
      let tokenData = JSON.parse(window.localStorage.getItem(key))
      token = tokenData.token_type + ' ' + tokenData.access_token
      continue
    }
    if (key && key.startsWith('captcha')) {
      let tokenData = JSON.parse(window.localStorage.getItem(key))
      captcha = tokenData.captcha_token
    }
  }
  return {
    Authorization: token,
    'x-device-id': window.localStorage.getItem('deviceid'),
    'x-captcha-token': captcha
  }
}

export function getList(parent_id){
  let url = `https://api-drive.mypikpak.com/drive/v1/files?thumbnail_size=SIZE_MEDIUM&limit=500&parent_id=${parent_id}&with_audit=true&filters=%7B%22phase%22%3A%7B%22eq%22%3A%22PHASE_TYPE_COMPLETE%22%7D%2C%22trashed%22%3A%7B%22eq%22%3Afalse%7D%7D`
  return postData(url,{},getHeader())
}

// 获取下载地址
export function getDownload (id) {
  // 获取头部信息
  let token = ''
  let captcha = ''
  for (let i = 0; i < 40; i++) {
    let key = window.localStorage.key(i)
    if (key === null) break
    if (key && key.startsWith('credentials')) {
      let tokenData = JSON.parse(window.localStorage.getItem(key))
      token = tokenData.token_type + ' ' + tokenData.access_token
      continue
    }
    if (key && key.startsWith('captcha')) {
      let tokenData = JSON.parse(window.localStorage.getItem(key))
      captcha = tokenData.captcha_token
    }
  }
  let header = getHeader()
  return postData('https://api-drive.mypikpak.com/drive/v1/files/' + id + '?',{},header)
}



// 推送给aria2
export function pushToAria (url, data) {
  if (['Android','IOS'].includes(getPlatform()) && !GM_xmlhttpRequest) {
    return postData(url, data,{}, 'POST')
  } else {
    return post(url, data, {}, '')
  }
}


for (let i = 0; i < 999; i++) {
  let key = window.localStorage.key(i)
  console.log(key);
}